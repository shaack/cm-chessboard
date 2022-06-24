/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {ChessboardState} from "./ChessboardState.js"
import {ChessboardViewAccessible} from "./view/ChessboardViewAccessible.js"
import {Position} from "./model/Position.js"
import {Observed} from "./utils/Observed.js"
import {ChessboardPositionsAnimation} from "./view/ChessboardPositionsAnimation.js"

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
export const FEN_START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" // todo 2022-06-24 deprecated, dont use
export const FEN_EMPTY_POSITION = "8/8/8/8/8/8/8/8" // todo 2022-06-24 deprecated, dont use

export class Chessboard {

    constructor(context, props = {}) {
        if (!context) {
            throw new Error("container element is " + context)
        }
        this.context = context
        this.id = (Math.random() + 1).toString(36).substring(2, 8)
        let defaultProps = {
            position: "empty", // set as fen, "start" or "empty"
            orientation: COLOR.white, // white on bottom
            animationDuration: 300, // pieces animation duration in milliseconds. Disable all animation with `0`.
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
                url: "./assets/images/chessboard-sprite.svg", // pieces and markers are stored in a sprite file
                size: 40, // the sprite tiles size, defaults to 40x40px
                cache: true // cache the sprite
            },
            accessibility: {
                brailleNotationInAlt: true, // show the braille notation of the game in the alt attribute of the svg
                movePieceForm: false, // display a form to move a piece (from, to, move)
                boardAsTable: false, // display the board additionally as HTML table
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

        this.state = new Observed(new ChessboardState())
        this.view = new ChessboardViewAccessible(this)
        this.chessboardPositionsAnimation = new ChessboardPositionsAnimation(this)
        this.state.orientation = this.props.orientation
        this.view.redraw()

        this.state.addObserver((a, b, c) => {
            console.log("OBSERVER CALLBACK", a, b, c)
            this.chessboardPositionsAnimation.renderPosition(this.state.position).then(() => {
                console.log("position rendering finished", this.state.position.getFen())
            })
        }, "position")

        this.setPosition(this.props.position)
    }

    // API //

    setPiece(square, piece, animated) {
        const position = this.state.position.clone()
        position.setPiece(square, piece)
        position.animated = animated
        this.state.position = position
    }

    getPiece(square) {
        return this.state.position.getPiece(square)
    }

    movePiece(squareFrom, squareTo, animated = false) {
        const position = this.state.position.clone()
        position.movePiece(squareFrom, squareTo)
        position.animated = animated
        this.state.position = position
    }

    setPosition(fen, animated = false) {
        console.log("Chessboard.setPosition", this.state.position, animated)
        this.state.position = new Position(fen, animated)
    }

    getPosition() {
        return this.state.position.getFen()
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

    async setOrientation(color, animated = false) {
        return new Promise((resolve) => {
            const position = this.state.position.clone()
            position.animated = animated
            this.chessboardPositionsAnimation.renderPosition(new Position(FEN_EMPTY_POSITION, animated)).then(() => {
                this.view.redraw()
                this.state.orientation = color
                this.chessboardPositionsAnimation.renderPosition(position, animated).then(() => {
                    resolve()
                })
            })
        })
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
