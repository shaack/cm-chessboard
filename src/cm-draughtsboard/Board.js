/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {BoardView} from "./BoardView.js"
import {DraughtsboardState} from "./DraughtsboardState.js"

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
export const FEN_START_POSITION = "xxxxxxxxxxxxxxxxxxxx..........oooooooooooooooooooo"
export const FEN_EMPTY_POSITION = ".................................................."

export class Board {

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
                showCoordinates: false, // show ranks and files
                borderType: BORDER_TYPE.thin, // thin: thin border, frame: wide border with coordinates in it, none: no border
                aspectRatio: 1, // height/width. Set to `undefined`, if you want to define it only in the css.
                moveFromMarker: MARKER_TYPE.frame, // the marker used to mark the start square
                moveToMarker: MARKER_TYPE.frame, // the marker used to mark the square where the figure is moving to
            },
            responsive: true, // resizes the board based on element size
            animationDuration: 300, // pieces animation duration in milliseconds
            sprite: {
                url: "./assets/images/draughtsboard-sprite.svg", // pieces and markers are stored as svg sprite
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
        this.state = new DraughtsboardState()
        this.state.orientation = this.props.orientation

        this.view = new BoardView(this, (view) => {
            if (this.props.position === "start") {
                this.state.setPosition(FEN_START_POSITION)
            } else if (this.props.position === "empty" || this.props.position === undefined) {
                this.state.setPosition(FEN_EMPTY_POSITION)
            } else {
                this.state.setPosition(this.props.position)
            }
            view.redraw()
        })
    }

    // API //

    setPiece(square, piece) {
        this.state.setPiece(this.state.squareToIndex(square), piece)
        this.view.drawPieces(this.state.squares)
    }

    getPiece(square) {
        return this.state.squares[this.state.squareToIndex(square)]
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
                const prevSquares = this.state.squares.slice(0) // clone
                this.state.setPosition(fen)
                if (animated) {
                    this.view.animatePieces(prevSquares, this.state.squares.slice(0), () => {
                        resolve()
                    })
                } else {
                    this.view.drawPieces(this.state.squares)
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

    addMarker(index, type) {
        if (!type) {
            console.error("Error addMarker(), type is " + type)
        }
        this.state.addMarker(index, type)
        this.view.drawMarkers()
    }

    getMarkers(index = undefined, type = undefined) {
        const markersFound = []
        this.state.markers.forEach((marker) => {
            if (!index && (!type || type === marker.type) ||
                !type && index === marker.index ||
                type === marker.type && index === marker.index) {
                markersFound.push({index: marker.index, type: marker.type})
            }
        })
        return markersFound
    }

    removeMarkers(index = undefined, type = undefined) {
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
            this.element.removeEventListener("contextmenu", this.squareSelectListener)
            this.element.removeEventListener("mouseup", this.squareSelectListener)
            this.element.removeEventListener("touchend", this.squareSelectListener)
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
            const index = e.target.getAttribute("data-index")
            if (e.type === "contextmenu") {
                // disable context menu
                e.preventDefault()
                return
            }
            eventHandler({
                board: this,
                type: e.button === 2 ? SQUARE_SELECT_TYPE.secondary : SQUARE_SELECT_TYPE.primary,
                // square: SQUARE_COORDINATES[index]
                index: index
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
