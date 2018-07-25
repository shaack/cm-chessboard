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
        this.initialization = new Promise((resolve) => {
            this.view = new ChessboardView(this, () => {
                if (this.props.position === "start") {
                    this.state.setPosition(FEN_START_POSITION)
                } else if (this.props.position === "empty" || this.props.position === null) {
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
        }).then(() => {
            if (callback) {
                console.warn("warning: the constructor callback is deprecated and will be removed in future versions")
                callback(this)
            }

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
                    } else if (fen === "empty" || fen === null) {
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
        return new Promise((resolve) => {
            this.initialization.then(() => {
                this.view.destroy()
                this.view = null
                this.state = null
                this.element.removeEventListener("contextmenu", this.contextMenuListener)
                resolve()
            })
        })
    }

    enableMoveInput(eventHandler, color = null) {
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
        this.moveInputCallback = eventHandler
        this.view.setCursor()
    }

    disableMoveInput() {
        this.state.inputWhiteEnabled = false
        this.state.inputBlackEnabled = false
        this.moveInputCallback = null
        this.view.setCursor()
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

    // noinspection JSUnusedGlobalSymbols
    disableContextInput() {
        this.element.removeEventListener("contextmenu", this.contextMenuListener)
    }
}