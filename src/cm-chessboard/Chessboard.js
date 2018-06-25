/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {ChessboardView} from "./ChessboardView.js"
import {SQUARE_COORDINATES, ChessboardState} from "./ChessboardState.js"

export const COLOR = {
    white: "w",
    black: "b"
}
export const MOVE_INPUT_MODE = {
    viewOnly: 0,
    dragPiece: 1,
    dragMarker: 2
}
export const INPUT_EVENT_TYPE = {
    moveStart: "moveStart",
    moveDone: "moveDone",
    moveCanceled: "moveCanceled",
    context: "context"
}
export const MARKER_TYPE = {
    move: {class: "move", slice: "marker1"},
    emphasize: {class: "emphasize", slice: "marker2"}
}
export const PIECE = {
    whitePawn: "wp",
    whiteBishop: "wb",
    whiteKnight: "wn",
    whiteRook: "wr",
    whiteQueen: "wq",
    whiteKing: "wk",
    blackPawn: "bp",
    blackBishop: "bb",
    blackKnight: "bn",
    blackRook: "br",
    blackQueen: "bq",
    blackKing: "bk",
}
export const FEN_START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
export const FEN_EMPTY_POSITION = "8/8/8/8/8/8/8/8"

const DEFAULT_SPRITE_GRID = 40

export class Chessboard {

    constructor(element, props = {}, callback = null) {
        this.element = element
        this.props = {
            position: "empty", // set as fen, "start" or "empty"
            orientation: COLOR.white, // white on bottom
            style: {
                cssClass: "default",
                showCoordinates: true, // show ranks and files
                showBorder: false, // display a border around the board
            },
            responsive: false, // resizes the board on window resize, if true
            animationDuration: 300, // pieces animation duration in milliseconds
            moveInputMode: MOVE_INPUT_MODE.viewOnly, // set to MOVE_INPUT_MODE.dragPiece or MOVE_INPUT_MODE.dragMarker for interactive movement
            sprite: {
                url: "./assets/images/chessboard-sprite.svg", // pieces and markers are stored es svg in the sprite
                grid: DEFAULT_SPRITE_GRID // the sprite is tiled with one piece every 40px
            }
        }
        Object.assign(this.props, props)
        if (!this.props.sprite.grid) {
            this.props.sprite.grid = DEFAULT_SPRITE_GRID
        }
        this.state = new ChessboardState()
        this.state.orientation = this.props.orientation
        this.view = new ChessboardView(this, () => {
            setTimeout(() => {
                this.setPosition(this.props.position, false)
                this.state.moveInputMode = this.props.moveInputMode
                this.view.redraw()
                if (callback) {
                    callback(this)
                }
            })

        })
    }

    // API //

    setPiece(square, piece) {
        this.state.setPiece(this.state.squareToIndex(square), piece)
        this.view.drawPiecesDebounced()
    }

    getPiece(square) {
        return this.state.squares[this.state.squareToIndex(square)]
    }

    setPosition(fen, animated = true, callback = null) {
        const currentFen = this.state.getPosition()
        const fenParts = fen.split(" ")
        const fenNormalized = fenParts[0]
        if (fenNormalized !== currentFen) {
            const prevSquares = this.state.squares.slice(0) // clone
            if (fen === "start") {
                this.state.setPosition(FEN_START_POSITION)
            } else if (fen === "empty" || fen === null) {
                this.state.setPosition(FEN_EMPTY_POSITION)
            } else {
                this.state.setPosition(fen)
            }
            if (animated) {
                this.view.animatePieces(prevSquares, this.state.squares.slice(0), () => {
                    if (callback) {
                        callback()
                    }
                })
            } else {
                if (!this.view) {
                    console.trace()
                }
                this.view.drawPiecesDebounced()
                if (callback) {
                    callback()
                }
            }
        } else {
            if (callback) {
                callback()
            }
        }
    }

    getPosition() {
        return this.state.getPosition()
    }

    addMarker(square, type = MARKER_TYPE.emphasize) {
        this.state.addMarker(this.state.squareToIndex(square), type)
        this.view.drawMarkersDebounced()
    }

    getMarkers(square = null, type = null) {
        const markersFound = []
        this.state.markers.forEach((marker) => {
            const markerSquare = SQUARE_COORDINATES[marker.index]
            if (square === null && (type === null || type === marker.type) ||
                type === null && square === markerSquare ||
                type === marker.type && square === markerSquare) {
                markersFound.push({square: SQUARE_COORDINATES[marker.index], type: marker.type})
            }
        })
        return markersFound
    }

    removeMarkers(square = null, type = null) {
        const index = square !== null ? this.state.squareToIndex(square) : null
        this.state.removeMarkers(index, type)
        this.view.drawMarkersDebounced()
    }

    setOrientation(color) {
        this.state.orientation = color
        this.view.redraw()
    }

    getOrientation() {
        return this.state.orientation
    }

    destroy() {
        this.view.destroy()
        this.view = null
        this.state = null
    }

    enableMoveInput(callback, color = null) {
        if (this.props.moveInputMode === MOVE_INPUT_MODE.viewOnly) {
            throw Error("props.moveInputMode is MOVE_INPUT_MODE.viewOnly")
        }
        if (color === COLOR.white) {
            this.state.inputWhiteEnabled = true
        } else if (color === COLOR.black) {
            this.state.inputBlackEnabled = true
        } else {
            this.state.inputWhiteEnabled = true
            this.state.inputBlackEnabled = true
        }
        this.moveInputCallback = callback
        this.view.setCursor()
    }

    disableMoveInput() {
        this.state.inputWhiteEnabled = false
        this.state.inputBlackEnabled = false
        this.moveInputCallback = null
        this.view.setCursor()
    }

    enableContextInput(callback) {
        this.contextInputCallback = callback
        this.element.addEventListener("contextmenu", (e) => {
            e.preventDefault()
            const index = e.target.getAttribute("data-index")
            callback({
                chessboard: this,
                type: INPUT_EVENT_TYPE.context,
                square: SQUARE_COORDINATES[index]
            })
        })
    }

    // noinspection JSUnusedGlobalSymbols
    disableContextInput() {
        this.element.removeEventListener("contextmenu", this.contextInputCallback)
    }
}