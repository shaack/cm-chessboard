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
    moveCanceled: "moveCanceled"
}
export const SQUARE_SELECT_TYPE = {
    primary: "primary",
    secondary: "secondary"
}
export const BORDER_TYPE = {
    none: "none", // no border
    thin: "thin", // thin border
    frame: "frame" // wide border with coordinates in it
}
export const MARKER_TYPE = {
    frame: {class: "markerFrame", slice: "markerFrame"},
    square: {class: "markerSquare", slice: "markerSquare"},
    dot: {class: "markerDot", slice: "markerDot"},
    circle: {class: "markerCircle", slice: "markerCircle"}
}
export const PIECE = {
    wp: "wp", wb: "wb", wn: "wn", wr: "wr", wq: "wq", wk: "wk",
    bp: "bp", bb: "bb", bn: "bn", br: "br", bq: "bq", bk: "bk",
}
export const FEN_START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
export const FEN_EMPTY_POSITION = "8/8/8/8/8/8/8/8"

export class Chessboard {

    constructor(element, props = {}) {
        if (!element) {
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
                aspectRatio: 1, // height/width. Set to `undefined`, if you want to define it only in the css.
                moveMarker: MARKER_TYPE.frame, // the marker used for moves
                hoverMarker: MARKER_TYPE.frame // the marker used for hovering, when moving
            },
            responsive: true, // resizes the board based on element size
            animationDuration: 300, // pieces animation duration in milliseconds
            sprite: {
                url: "./assets/images/chessboard-sprite-staunty.svg", // pieces and markers are stored as svg sprite
                size: 40, // the sprite size, defaults to 40x40px
                cache: true // cache the sprite inline, in the HTML
            }
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
            this.view = new ChessboardView(this, (view) => {
                if (this.props.position === "start") {
                    this.state.setPosition(FEN_START_POSITION)
                } else if (this.props.position === "empty" || this.props.position === undefined) {
                    this.state.setPosition(FEN_EMPTY_POSITION)
                } else {
                    this.state.setPosition(this.props.position)
                }
                view.redraw().then(() => {
                    resolve()
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
        const promise = new Promise((resolve) => {
            this.initialization.then(() => {
                if (fen === "start") {
                    fen = FEN_START_POSITION
                } else if (fen === "empty") {
                    fen = FEN_EMPTY_POSITION
                }
                const currentFen = this.state.getPosition()
                const fenParts = fen.split(" ")
                const fenNormalized = fenParts[0]
                if (fenNormalized !== currentFen) {
                    this.previousPromise = promise
                    const prevSquares = this.state.squares.slice(0) // clone
                    this.state.setPosition(fen)
                    if (animated) {
                        this.view.animatePieces(prevSquares, this.state.squares.slice(0), () => {
                            resolve()
                        })
                    } else {
                        this.view.drawPiecesDebounced(this.state.squares, () => {
                            resolve()
                        })
                    }
                } else {
                    if (this.previousPromise) {
                        this.previousPromise.then(() => {
                            resolve()
                        })
                    } else {
                        resolve()
                    }
                }
            })
        })
        return promise
    }

    getPosition() {
        return this.state.getPosition()
    }

    addMarker(square, type) {
        if (!type) {
            console.error("Error addMarker(), type is " + type)
        }
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
        return this.view.redraw()
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
                if (this.squareSelectListener) {
                    this.element.removeEventListener("contextmenu", this.squareSelectListener)
                    this.element.removeEventListener("mouseup", this.squareSelectListener)
                    this.element.removeEventListener("touchend", this.squareSelectListener)
                }
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

    // TODO remove deprecated function
    // noinspection JSUnusedGlobalSymbols
    enableContextInput(eventHandler) {
        console.warn("enableContextInput() is deprecated, use enableSquareSelect()")
        this.enableSquareSelect(function (event) {
            if (event.type === SQUARE_SELECT_TYPE.secondary) {
                eventHandler(event)
            }
        })
    }

    // TODO remove deprecated function
    // noinspection JSUnusedGlobalSymbols
    disableContextInput() {
        this.disableSquareSelect()
    }

    enableSquareSelect(eventHandler) {
        if (this.squareSelectListener) {
            console.warn("squareSelectListener already existing")
            return
        }
        this.squareSelectListener = function (e) {
            const index = e.target.getAttribute("data-index")
            if (e.type === "contextmenu") {
                // disable context menu
                e.preventDefault()
                return
            }
            eventHandler({
                chessboard: this,
                type: e.button === 2 ? SQUARE_SELECT_TYPE.secondary : SQUARE_SELECT_TYPE.primary,
                square: SQUARE_COORDINATES[index]
            })
        }
        this.element.addEventListener("contextmenu", this.squareSelectListener)
        this.element.addEventListener("mouseup", this.squareSelectListener)
        this.element.addEventListener("touchend", this.squareSelectListener)
        this.state.squareSelectEnabled = true
        this.view.setCursor()
    }

    disableSquareSelect() {
        this.element.removeEventListener("contextmenu", this.squareSelectListener)
        this.element.removeEventListener("mouseup", this.squareSelectListener)
        this.element.removeEventListener("touchend", this.squareSelectListener)
        this.squareSelectListener = undefined
        this.state.squareSelectEnabled = false
        this.view.setCursor()
    }

}