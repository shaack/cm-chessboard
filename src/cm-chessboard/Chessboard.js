/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {ChessboardState} from "./ChessboardState.js"
import {ChessboardViewAccessible} from "./ChessboardViewAccessible.js"

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
    frame: {class: "marker-frame", slice: "markerFrame"},
    square: {class: "marker-square", slice: "markerSquare"},
    dot: {class: "marker-dot", slice: "markerDot"},
    circle: {class: "marker-circle", slice: "markerCircle"}
}
export const PIECE = {
    wp: "wp", wb: "wb", wn: "wn", wr: "wr", wq: "wq", wk: "wk",
    bp: "bp", bb: "bb", bn: "bn", br: "br", bq: "bq", bk: "bk",
}
export const FEN_START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
export const FEN_EMPTY_POSITION = "8/8/8/8/8/8/8/8"

export class Chessboard {

    constructor(context, props = {}) {
        if (!context) {
            throw new Error("container element is " + context)
        }
        this.context = context
        this.id = (Math.random() + 1).toString(36).substr(2, 6)
        let defaultProps = {
            position: "empty", // set as fen, "start" or "empty"
            orientation: COLOR.white, // white on bottom
            animationDuration: 300, // pieces animation duration in milliseconds
            responsive: true, // resizes the board based on element size
            style: {
                cssClass: "default",
                showCoordinates: true, // show ranks and files
                borderType: BORDER_TYPE.none, // thin: thin border, frame: wide border with coordinates in it, none: no border
                aspectRatio: 1, // height/width of the board
                moveFromMarker: MARKER_TYPE.frame, // the marker used to mark the start square
                moveToMarker: MARKER_TYPE.frame, // the marker used to mark the square where the figure is moving to
            },
            sprite: {
                url: "./assets/images/chessboard-sprite.svg", // pieces and markers are stored as svg sprite
                size: 40, // the sprite size, defaults to 40x40px
                cache: true // cache the sprite
            },
            accessibility: {
                brailleNotationInAlt: true, // show the braille notation of the game in the alt attribute of the svg
                boardAsTable: false, // display the board additionally as HTML table
                movePieceForm: false, // display a form to move a piece (from, to, move)
                piecesAsList: false, // display the pieces additionally as List
                visuallyHidden: true // hide all those extra outputs visually but keep them accessible for screen readers and braille displays
            }
        }
        this.props = {}
        Object.assign(this.props, defaultProps)
        Object.assign(this.props, props)
        this.props.sprite = defaultProps.sprite
        this.props.style = defaultProps.style
        this.props.accessibility = defaultProps.accessibility
        if (props.sprite) {
            Object.assign(this.props.sprite, props.sprite)
        }
        if (props.style) {
            Object.assign(this.props.style, props.style)
        }
        if (props.accessibility) {
            Object.assign(this.props.accessibility, props.accessibility)
        }

        this.state = new ChessboardState()
        this.view = new ChessboardViewAccessible(this)
        /*
        this.state.addObserver(() => {
            if(this.view) {
                this.view.drawPieces()
            }
        })
        */
        if (this.props.position === "start") {
            this.state.setPosition(FEN_START_POSITION)
        } else if (this.props.position === "empty" || this.props.position === undefined) {
            this.state.setPosition(FEN_EMPTY_POSITION)
        } else {
            this.state.setPosition(this.props.position)
        }
        this.state.orientation = this.props.orientation
        this.view.redraw()
    }

    // API //

    setPiece(square, piece) {
        this.state.position.setPiece(square, piece)
        this.view.drawPieces(this.state.position.squares)
    }

    getPiece(square) {
        return this.state.position.getPiece(square)
    }

    movePiece(squareFrom, squareTo, animated = true) {
        return new Promise((resolve, reject) => {
            const prevSquares = this.state.position.clone().squares
            const pieceFrom = this.getPiece(squareFrom)
            if(!pieceFrom) {
                reject("no piece on square " + squareFrom)
            } else {
                this.state.position.setPiece(squareFrom, null)
                this.state.position.setPiece(squareTo, pieceFrom)
                if (animated) {
                    this.view.animatePieces(prevSquares, this.state.position.squares, () => {
                        resolve()
                    })
                } else {
                    this.view.drawPieces(this.state.position.squares)
                    resolve()
                }
            }
        })
    }

    setPosition(fen, animated = true) {
        return new Promise((resolve) => {
            if (fen === "start") {
                fen = FEN_START_POSITION
            } else if (fen === "empty") {
                fen = FEN_EMPTY_POSITION
            }
            const currentFen = this.state.getPosition()
            const fenParts = fen.split(" ")
            const fenNormalized = fenParts[0]

            if (fenNormalized !== currentFen) {
                const prevSquares = this.state.position.squares.slice(0) // clone
                this.state.setPosition(fen)
                if (animated) {
                    this.view.animatePieces(prevSquares, this.state.position.squares.slice(0), () => {
                        resolve()
                    })
                } else {
                    this.view.drawPieces(this.state.position.squares)
                    resolve()
                }
            } else {
                resolve()
            }
        })
    }

    getPosition() {
        return this.state.getPosition()
    }

    addMarker(square, type) {
        if (!type) {
            console.error("Error addMarker(), type is " + type)
        }
        this.state.addMarker(square, type)
        this.view.drawMarkers()
    }

    getMarkers(square = undefined, type = undefined) {
        const markersFound = []
        this.state.markers.forEach((marker) => {
            const markerSquare = marker.square
            if (!square && (!type || type === marker.type) ||
                !type && square === markerSquare ||
                type === marker.type && square === markerSquare) {
                markersFound.push({square: marker.square, type: marker.type})
            }
        })
        return markersFound
    }

    removeMarkers(square = undefined, type = undefined) {
        const index = square ? this.state.squareToIndex(square) : undefined
        this.state.removeMarkers(index, type)
        this.view.drawMarkers()
    }

    setOrientation(color) {
        this.state.orientation = color
        return this.view.redraw()
    }

    getOrientation() {
        return this.state.orientation
    }

    destroy() {
        this.view.destroy()
        this.view = undefined
        this.state = undefined
        if (this.squareSelectListener) {
            this.context.removeEventListener("contextmenu", this.squareSelectListener)
            this.context.removeEventListener("mouseup", this.squareSelectListener)
            this.context.removeEventListener("touchend", this.squareSelectListener)
        }
    }

    enableMoveInput(eventHandler, color = undefined) {
        this.view.enableMoveInput(eventHandler, color)
    }

    disableMoveInput() {
        this.view.disableMoveInput()
    }

    enableSquareSelect(eventHandler) {
        if (this.squareSelectListener) {
            console.warn("squareSelectListener already existing")
            return
        }
        this.squareSelectListener = function (e) {
            const square = e.target.getAttribute("data-square")
            if (e.type === "contextmenu") {
                // disable context menu
                e.preventDefault()
                return
            }
            eventHandler({
                chessboard: this,
                type: e.button === 2 ? SQUARE_SELECT_TYPE.secondary : SQUARE_SELECT_TYPE.primary,
                square: square
            })
        }
        this.context.addEventListener("contextmenu", this.squareSelectListener)
        this.context.addEventListener("mouseup", this.squareSelectListener)
        this.context.addEventListener("touchend", this.squareSelectListener)
        this.state.squareSelectEnabled = true
        this.view.visualizeInputState()
    }

    disableSquareSelect() {
        this.context.removeEventListener("contextmenu", this.squareSelectListener)
        this.context.removeEventListener("mouseup", this.squareSelectListener)
        this.context.removeEventListener("touchend", this.squareSelectListener)
        this.squareSelectListener = undefined
        this.state.squareSelectEnabled = false
        this.view.visualizeInputState()
    }

}
