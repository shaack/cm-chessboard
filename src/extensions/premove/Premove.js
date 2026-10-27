/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 *
 * Premoves, modeled after lichess' chessground:
 * - While it is the opponent's turn, a move of the player is not executed but stored as premove.
 *   The piece stays on its square, the board only marks the premove. The board position never
 *   diverges from the game.
 * - Premove destinations are pseudo legal (piece geometry only, blockers ignored), because the
 *   position will change before the premove is played. Moves into own pieces (recaptures) and
 *   castling are allowed.
 * - Move or premove is decided on drop, not on pick-up. If the opponent moves while the player
 *   drags, the drop becomes a regular move.
 * - The app plays the premove with `playPremove(executor)` right after it applied the opponent's
 *   move. The executor validates it against the real rules (e.g. chess.js) and the premove is
 *   cleared in any case.
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {COLOR, INPUT_EVENT_TYPE} from "../../view/ChessboardView.js"
import {Position} from "../../model/Position.js"

export const PREMOVE_MARKER_TYPE = {
    square: {class: "marker-premove", slice: "markerSquare"}, // from and to square of the stored premove
    dest: {class: "marker-premove-dest", slice: "markerDot"}, // possible destination, empty square
    destOccupied: {class: "marker-premove-dest", slice: "markerBevel"} // possible destination, occupied square
}

export const PREMOVE_UNSET_REASON = {
    canceled: "canceled", // canceled via `cancelPremove()`
    clicked: "clicked", // the user clicked on the board
    rightClicked: "rightClicked", // the user right clicked on the board (if `cancelOnRightClick`)
    replaced: "replaced", // a new premove was set
    pieceChanged: "pieceChanged", // the premoved piece is no longer on its square, most likely captured
    played: "played", // played via `playPremove()`, the executor accepted it
    failed: "failed", // played via `playPremove()`, the executor rejected it (illegal in the new position)
    destroyed: "destroyed" // the board was destroyed
}

// mouse events within this time (ms) after a touch are treated as compatibility events of the touch
const COMPAT_MOUSE_EVENT_DELAY = 1000

export class Premove extends Extension {

    /** @constructor */
    constructor(chessboard, props = {}) {
        super(chessboard)
        this.props = {
            color: chessboard.getOrientation(), // the color of the player, who can premove
            markers: true, // mark the premove and its destinations, needs the Markers extension
            autoQueen: true, // promote premoves to a queen, else show the PromotionDialog (if added)
            castle: true, // allow castling premoves (king to c/g file or onto an own rook)
            dests: null, // optional `(square, piece, chessboard) => [squares]` for custom (variant) premove destinations
            cancelOnRightClick: false, // cancel the premove with a right click on the board
            onSet: null, // `(premove) => {}` called after a premove was set
            onUnset: null // `(premove, reason) => {}` called after a premove was unset, see PREMOVE_UNSET_REASON
        }
        Object.assign(this.props, props)
        this.turn = null // the color to move, set by the app with `setTurn()`, `null` disables premoves
        this.premove = null // {from, to, piece, promotion}
        this.intercepting = false // the current move input is handled as premove input
        this.pendingPromotion = false // waiting for the promotion piece of a premove
        this.destsShown = false

        if (chessboard.state.moveInputInterceptor) {
            throw Error("a move input interceptor is already set")
        }
        chessboard.state.moveInputInterceptor = this.interceptMoveInput.bind(this)
        this.registerExtensionPoint(EXTENSION_POINT.positionChanged, this.onPositionChanged.bind(this))
        this.registerExtensionPoint(EXTENSION_POINT.destroy, this.onDestroy.bind(this))

        // capture phase, so it runs before the VisualMoveInput sees the event and changes its state
        this.pointerDownListener = this.onPointerDown.bind(this)
        chessboard.view.container.addEventListener("mousedown", this.pointerDownListener, true)
        chessboard.view.container.addEventListener("touchstart", this.pointerDownListener, {capture: true, passive: true})

        chessboard.setTurn = this.setTurn.bind(this)
        chessboard.getTurn = this.getTurn.bind(this)
        chessboard.isPremoveTurn = this.isPremoveTurn.bind(this)
        chessboard.getPremove = this.getPremove.bind(this)
        chessboard.setPremove = this.setPremove.bind(this)
        chessboard.cancelPremove = this.cancelPremove.bind(this)
        chessboard.playPremove = this.playPremove.bind(this)
        chessboard.getPremoveDests = this.getPremoveDests.bind(this)
    }

    // API //

    /** Set the color to move. While it is not `props.color`, the moves of the player are stored as premove. */
    setTurn(color) {
        if (color !== COLOR.white && color !== COLOR.black && color !== null) {
            throw Error("invalid color " + color)
        }
        this.turn = color
    }

    getTurn() {
        return this.turn
    }

    /** `true`, if a move input of the player is currently stored as premove */
    isPremoveTurn() {
        return !!this.turn && this.turn !== this.props.color
    }

    /** @returns {{from, to, piece, promotion}|null} the stored premove (a copy) */
    getPremove() {
        return this.premove ? Object.assign({}, this.premove) : null
    }

    /** Set a premove programmatically (e.g. from keyboard input). No destination check. */
    setPremove(from, to, promotion = undefined) {
        const piece = this.chessboard.getPiece(from)
        if (!piece || piece.charAt(0) !== this.props.color || from === to) {
            return false
        }
        if (!promotion && this.isPromotion(piece, to)) {
            promotion = "q"
        }
        this.set({from: from, to: to, piece: piece, promotion: promotion})
        return true
    }

    cancelPremove() {
        this.cancelPendingPromotion()
        this.unset(PREMOVE_UNSET_REASON.canceled)
    }

    /**
     * Play the stored premove. Call it right after the opponent's move was applied to the board.
     * `executor({from, to, piece, promotion})` makes the move in the game (and updates the board),
     * it returns truthy, if the move was legal and played. The premove is cleared in any case.
     * Sets the turn to the player's color before it calls the executor.
     * @returns {boolean} `true`, if the premove was played
     */
    playPremove(executor) {
        this.turn = this.props.color
        const premove = this.premove
        if (!premove) {
            return false
        }
        this.clear()
        if (this.chessboard.getPiece(premove.from) !== premove.piece) { // safety net, should be unset already
            this.callUnset(premove, PREMOVE_UNSET_REASON.pieceChanged)
            return false
        }
        let played = false
        try {
            played = !!executor(Object.assign({}, premove))
        } finally {
            this.callUnset(premove, played ? PREMOVE_UNSET_REASON.played : PREMOVE_UNSET_REASON.failed)
        }
        return played
    }

    /** The pseudo legal premove destinations of the piece on `square` */
    getPremoveDests(square) {
        const piece = this.chessboard.getPiece(square)
        if (!piece) {
            return []
        }
        if (this.props.dests) {
            return this.props.dests(square, piece, this.chessboard) || []
        }
        return premoveDests(this.chessboard.state.position, square, this.props.castle)
    }

    // move input interception //

    interceptMoveInput(event) {
        switch (event.type) {
            case INPUT_EVENT_TYPE.moveInputStarted: {
                this.intercepting = false
                if (!this.isPremoveTurn() || !event.piece || event.piece.charAt(0) !== this.props.color) {
                    return false
                }
                const dests = this.getPremoveDests(event.squareFrom)
                if (dests.length > 0) {
                    this.intercepting = true
                    this.showDests(dests)
                }
                event.moveInputCallbackResult = dests.length > 0
                return true
            }
            case INPUT_EVENT_TYPE.movingOverSquare:
                return this.intercepting
            case INPUT_EVENT_TYPE.validateMoveInput: {
                if (!this.intercepting) {
                    return false
                }
                this.hideDests()
                if (!this.isPremoveTurn()) {
                    // the turn changed while the player was moving, it is a regular move now
                    this.intercepting = false
                    return false
                }
                event.moveInputCallbackResult = false // never execute a premove now
                if (event.squareTo && this.getPremoveDests(event.squareFrom).includes(event.squareTo)) {
                    event.premove = true
                    this.premoveInput(event.squareFrom, event.squareTo, event.piece)
                }
                return true
            }
            case INPUT_EVENT_TYPE.moveInputCanceled:
                if (!this.intercepting) {
                    return false
                }
                this.hideDests()
                return true // keep intercepting until moveInputFinished
            case INPUT_EVENT_TYPE.moveInputFinished:
                if (!this.intercepting) {
                    return false
                }
                this.intercepting = false
                return true
        }
        return false
    }

    premoveInput(from, to, piece) {
        if (!this.isPromotion(piece, to)) {
            this.set({from: from, to: to, piece: piece, promotion: undefined})
        } else if (this.props.autoQueen || !this.chessboard.showPromotionDialog) {
            this.set({from: from, to: to, piece: piece, promotion: "q"})
        } else {
            this.pendingPromotion = true
            this.chessboard.showPromotionDialog(to, this.props.color, (result) => {
                if (!this.pendingPromotion) {
                    return // canceled meanwhile
                }
                this.pendingPromotion = false
                if (result.type === "pieceSelected" && this.chessboard.getPiece(from) === piece) {
                    this.set({from: from, to: to, piece: piece, promotion: result.piece.charAt(1)})
                }
            })
        }
    }

    // state changes //

    set(premove) {
        this.unset(PREMOVE_UNSET_REASON.replaced)
        this.premove = premove
        this.showPremove()
        if (this.props.onSet) {
            this.props.onSet(Object.assign({}, premove))
        }
    }

    unset(reason) {
        const premove = this.premove
        if (premove) {
            this.clear()
            this.callUnset(premove, reason)
        }
    }

    clear() {
        this.premove = null
        this.hidePremove()
    }

    callUnset(premove, reason) {
        if (this.props.onUnset) {
            this.props.onUnset(Object.assign({}, premove), reason)
        }
    }

    cancelPendingPromotion() {
        this.pendingPromotion = false
    }

    // events //

    onPointerDown(e) {
        if (e.type === "touchstart") {
            this.lastTouchTime = Date.now()
        } else if (Date.now() - (this.lastTouchTime || 0) < COMPAT_MOUSE_EVENT_DELAY) {
            // a compatibility mouse event the browser fires after a tap, e.g. the tap on the
            // destination square, which just set the premove. Must not cancel it.
            return
        }
        if (!this.premove) {
            return
        }
        // only, if no move input is in progress, a click to the destination square completes the input
        if (this.chessboard.view.visualMoveInput.moveInputState !== "waitForInputStart") {
            return
        }
        if (e.type === "touchstart" || e.type === "mousedown" && e.button === 0) {
            this.unset(PREMOVE_UNSET_REASON.clicked)
        } else if (e.type === "mousedown" && e.button === 2 && this.props.cancelOnRightClick) {
            this.unset(PREMOVE_UNSET_REASON.rightClicked)
        }
    }

    onPositionChanged() {
        if (this.premove && this.chessboard.getPiece(this.premove.from) !== this.premove.piece) {
            this.unset(PREMOVE_UNSET_REASON.pieceChanged)
        }
    }

    onDestroy() {
        this.cancelPendingPromotion()
        this.unset(PREMOVE_UNSET_REASON.destroyed)
        const view = this.chessboard.view
        view.container.removeEventListener("mousedown", this.pointerDownListener, true)
        view.container.removeEventListener("touchstart", this.pointerDownListener, {capture: true})
        this.chessboard.state.moveInputInterceptor = null
        for (const method of ["setTurn", "getTurn", "isPremoveTurn", "getPremove", "setPremove",
            "cancelPremove", "playPremove", "getPremoveDests"]) {
            delete this.chessboard[method]
        }
    }

    // markers //

    canMark() {
        return this.props.markers && typeof this.chessboard.addMarker === "function"
    }

    showPremove() {
        if (this.canMark()) {
            this.chessboard.addMarker(PREMOVE_MARKER_TYPE.square, this.premove.from)
            this.chessboard.addMarker(PREMOVE_MARKER_TYPE.square, this.premove.to)
        }
    }

    hidePremove() {
        if (this.canMark()) {
            this.chessboard.removeMarkers(PREMOVE_MARKER_TYPE.square)
        }
    }

    showDests(dests) {
        if (!this.canMark()) {
            return
        }
        this.batchMarkers(() => {
            this.removeDestMarkers()
            for (const square of dests) {
                this.chessboard.addMarker(this.chessboard.getPiece(square) ?
                    PREMOVE_MARKER_TYPE.destOccupied : PREMOVE_MARKER_TYPE.dest, square)
            }
        })
        this.destsShown = true
    }

    hideDests() {
        if (this.destsShown && this.canMark()) {
            this.batchMarkers(() => this.removeDestMarkers())
        }
        this.destsShown = false
    }

    removeDestMarkers() {
        this.chessboard.removeMarkers(PREMOVE_MARKER_TYPE.dest)
        this.chessboard.removeMarkers(PREMOVE_MARKER_TYPE.destOccupied)
    }

    // redraw the markers once after `fn`, instead of on every single marker change
    batchMarkers(fn) {
        const markers = this.chessboard.extensions.find((extension) =>
            typeof extension.addMarker === "function" && typeof extension.onRedrawBoard === "function")
        if (!markers) {
            fn()
            return
        }
        markers.batchUpdate = true
        try {
            fn()
        } finally {
            markers.batchUpdate = false
            markers.onRedrawBoard()
        }
    }

    // helpers //

    isPromotion(piece, to) {
        return piece.charAt(1) === "p" && (to.charAt(1) === "8" || to.charAt(1) === "1")
    }

}

/**
 * Pseudo legal premove destinations, ported from chessground's premove.ts. Only the geometry of
 * the piece counts. Blockers, checks and the side to move are ignored, own pieces may be targeted
 * (recapture premoves).
 */
export function premoveDests(position, square, castle = true) {
    const piece = position.getPiece(square)
    if (!piece) {
        return []
    }
    const color = piece.charAt(0)
    const type = piece.charAt(1)
    const [x1, y1] = Position.squareToCoordinates(square)
    const backRank = color === COLOR.white ? 0 : 7
    let rookFiles = null
    if (type === "k" && castle) {
        rookFiles = []
        for (let x = 0; x < 8; x++) {
            if (position.getPiece(Position.coordinatesToSquare([x, backRank])) === color + "r") {
                rookFiles.push(x)
            }
        }
    }
    const dests = []
    for (let y2 = 0; y2 < 8; y2++) {
        for (let x2 = 0; x2 < 8; x2++) {
            if (x1 === x2 && y1 === y2) {
                continue
            }
            const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1)
            let valid
            switch (type) {
                case "p": {
                    const dir = color === COLOR.white ? 1 : -1
                    const startRank = color === COLOR.white ? 1 : 6
                    valid = dx === 1 && y2 - y1 === dir ||
                        dx === 0 && (y2 - y1 === dir || y1 === startRank && y2 - y1 === 2 * dir)
                    break
                }
                case "n":
                    valid = dx === 1 && dy === 2 || dx === 2 && dy === 1
                    break
                case "b":
                    valid = dx === dy
                    break
                case "r":
                    valid = dx === 0 || dy === 0
                    break
                case "q":
                    valid = dx === dy || dx === 0 || dy === 0
                    break
                case "k":
                    valid = dx <= 1 && dy <= 1 ||
                        rookFiles !== null && y1 === backRank && y2 === backRank && (
                            x1 === 4 && (x2 === 2 && rookFiles.includes(0) || x2 === 6 && rookFiles.includes(7)) ||
                            rookFiles.includes(x2))
                    break
                default:
                    valid = false
            }
            if (valid) {
                dests.push(Position.coordinatesToSquare([x2, y2]))
            }
        }
    }
    return dests
}
