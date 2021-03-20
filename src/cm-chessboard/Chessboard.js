/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {SQUARE_COORDINATES, ChessboardView} from "./ChessboardView.js"
import {ChessboardState} from "./ChessboardState.js"

export const COLOR = {
    white: "w",
    black: "b"
}
export const INPUT_EVENT_TYPE = {
    moveStart: "moveStart",
    moveDone: "moveDone",
    moveCanceled: "moveCanceled",
    context: "context",
    click: "click"
}
export const MOVE_INPUT_MODE = { // todo deprecated, not needed anymore
    viewOnly: 0,
    dragPiece: 1,
    dragMarker: 2
}
export const BORDER_TYPE = {
    none: "none", // no border
    thin: "thin", // thin border
    frame: "frame" // wide border with coordinates in it
}
export const MARKER_TYPE = {
    move: {class: "move", slice: "marker1"},
    emphasize: {class: "emphasize", slice: "marker2"}
}
export const PIECE = {
    wp: "wp", wb: "wb", wn: "wn", wr: "wr", wq: "wq", wk: "wk",
    bp: "bp", bb: "bb", bn: "bn", br: "br", bq: "bq", bk: "bk",
}
export const FEN_START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
export const FEN_EMPTY_POSITION = "8/8/8/8/8/8/8/8"

export class Chessboard {

    constructor(element, props = {}) {
        if(!element) {
            throw new Error("container element is " + element)
        }
        this.element = element
        let defaultProps = {
            position: "empty", // set as fen, "start" or "empty"
            orientation: COLOR.white, // white on bottom
            style: {
                cssClass: "default",
                showCoordinates: true, // show ranks and files
                borderType: BORDER_TYPE.thin, // thin: thin border, frame: wide border with coordinates in it, none: no border
                aspectRatio: 1 // height/width. Set to `undefined`, if you want to define it only in the css.
            },
            responsive: true, // resizes the board on window resize
            animationDuration: 300, // pieces animation duration in milliseconds
            sprite: {
                url: "./assets/images/chessboard-sprite-staunty.svg", // pieces and markers are stored as svg sprite
                size: 40, // the sprite size, defaults to 40x40px
                cache: true // cache the sprite inline, in the HTML
            }
        }
        // todo remove in a later version
        // noinspection JSUnresolvedVariable
        if(props.style && props.style.showBorder !== undefined) {
            console.warn("style.showBorder is deprecated, use style.borderType instead")
            // noinspection JSUnresolvedVariable
            if(props.style.showBorder) {
                props.style.borderType = BORDER_TYPE.frame
            } else {
                props.style.borderType = BORDER_TYPE.thin
            }
        }
        // todo remove in a later version
        // noinspection JSUnresolvedVariable
        if(props.moveInputMode) {
            console.warn("`props.moveInputMode` is deprecated, you don't need it anymore")
        }
        this.props = {}
        Object.assign(this.props, defaultProps)
        Object.assign(this.props, props)
        this.props.sprite = defaultProps.sprite
        this.props.style = defaultProps.style
        if (props.sprite) {
            Object.assign(this.props.sprite, props.sprite)
        }
        if (props.style) {
            Object.assign(this.props.style, props.style)
        }
        if (this.props.style.aspectRatio) {
            this.element.style.height = (this.element.offsetWidth * this.props.style.aspectRatio) + "px"
        }
        this.state = new ChessboardState()
        this.state.orientation = this.props.orientation
        this.initialization = new Promise((resolve) => {
            this.view = new ChessboardView(this, () => {
                if (this.props.position === "start") {
                    this.state.setPosition(FEN_START_POSITION)
                } else if (this.props.position === "empty" || this.props.position === undefined) {
                    this.state.setPosition(FEN_EMPTY_POSITION)
                } else {
                    this.state.setPosition(this.props.position)
                }
                setTimeout(() => {
                    this.view.redraw().then(() => {
                        resolve()
                    })
                })
            })
        })
    }

    // API //

    setPiece(square, piece) {
        return new Promise((resolve) => {
            this.initialization.then(() => {
                this.state.setPiece(this.state.squareToIndex(square), piece)
                this.view.drawPiecesDebounced(this.state.squares, () => {
                    resolve()
                })
            })
        })
    }

    getPiece(square) {
        return this.state.squares[this.state.squareToIndex(square)]
    }

    setPosition(fen, animated = true) {
        return new Promise((resolve) => {
            this.initialization.then(() => {
                const currentFen = this.state.getPosition()
                const fenParts = fen.split(" ")
                const fenNormalized = fenParts[0]
                if (fenNormalized !== currentFen) {
                    const prevSquares = this.state.squares.slice(0) // clone
                    if (fen === "start") {
                        this.state.setPosition(FEN_START_POSITION)
                    } else if (fen === "empty" || fen === undefined) {
                        this.state.setPosition(FEN_EMPTY_POSITION)
                    } else {
                        this.state.setPosition(fen)
                    }
                    if (animated) {
                        this.view.animatePieces(prevSquares, this.state.squares.slice(0), () => {
                            resolve()
                        })
                    } else {
                        this.view.drawPiecesDebounced()
                        resolve()
                    }
                } else {
                    resolve()
                }
            })
        })
    }

    getPosition() {
        return this.state.getPosition()
    }

    addMarker(square, type = MARKER_TYPE.emphasize) {
        this.state.addMarker(this.state.squareToIndex(square), type)
        this.view.drawMarkersDebounced()
    }

    getMarkers(square = undefined, type = undefined) {
        const markersFound = []
        this.state.markers.forEach((marker) => {
            const markerSquare = SQUARE_COORDINATES[marker.index]
            if (!square && (!type || type === marker.type) ||
                !type && square === markerSquare ||
                type === marker.type && square === markerSquare) {
                markersFound.push({square: SQUARE_COORDINATES[marker.index], type: marker.type})
            }
        })
        return markersFound
    }

    removeMarkers(square = undefined, type = undefined) {
        const index = square ? this.state.squareToIndex(square) : undefined
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
        return new Promise((resolve) => {
            this.initialization.then(() => {
                this.view.destroy()
                this.view = undefined
                this.state = undefined
                this.element.removeEventListener("contextmenu", this.contextMenuListener)
                resolve()
            })
        })
    }

    enableMoveInput(eventHandler, color = undefined) {
        this.view.enableMoveInput(eventHandler, color)
    }

    disableMoveInput() {
        this.view.disableMoveInput()
    }

    enableContextInput(eventHandler) {
        if (this.contextMenuListener) {
            console.warn("contextMenuListener already existing")
            return
        }
        this.contextMenuListener = function (e) {
            e.preventDefault()
            const index = e.target.getAttribute("data-index")
            eventHandler({
                chessboard: this,
                type: INPUT_EVENT_TYPE.context,
                square: SQUARE_COORDINATES[index]
            })
        }
        this.element.addEventListener("contextmenu", this.contextMenuListener)
    }

    disableContextInput() {
        this.element.removeEventListener("contextmenu", this.contextMenuListener)
        this.contextMenuListener = undefined
    }

    enableBoardClick(eventHandler) {
        if (this.boardClickListener) {
            console.warn("boardClickListener already existing")
            return
        }
        this.boardClickListener = function(e) {
            const index = e.target.getAttribute("data-index")
            eventHandler({
                chessboard: this,
                type: INPUT_EVENT_TYPE.click,
                square: SQUARE_COORDINATES[index]
            })
        }
        this.element.addEventListener("click", this.boardClickListener)
    }

    disableBoardClick() {
        this.element.removeEventListener("click", this.boardClickListener)
        this.boardClickListener = undefined
    }

}