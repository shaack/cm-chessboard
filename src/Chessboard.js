/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {ChessboardState} from "./model/ChessboardState.js"
import {FEN, Position} from "./model/Position.js"
import {PositionAnimationsQueue} from "./view/PositionAnimationsQueue.js"
import {EXTENSION_POINT} from "./model/Extension.js"
import {ChessboardView} from "./view/ChessboardView.js"
import {Utils} from "./lib/Utils.js"

export const COLOR = {
    white: "w",
    black: "b"
}
export const INPUT_EVENT_TYPE = {
    moveInputStarted: "moveInputStarted",
    movingOverSquare: "movingOverSquare", // while dragging or hover after click
    validateMoveInput: "validateMoveInput",
    moveInputCanceled: "moveInputCanceled",
    moveInputFinished: "moveInputFinished"
}
/** @deprecated */
export const SQUARE_SELECT_TYPE = {
    primary: "primary",
    secondary: "secondary"
}
export const BORDER_TYPE = {
    none: "none", // no border
    thin: "thin", // thin border
    frame: "frame" // wide border with coordinates in it
}
export const PIECE = {
    wp: "wp", wb: "wb", wn: "wn", wr: "wr", wq: "wq", wk: "wk",
    bp: "bp", bb: "bb", bn: "bn", br: "br", bq: "bq", bk: "bk"
}

export const PIECES_FILE_TYPE = {
    svgSprite: "svgSprite"
}

export {FEN}

export class Chessboard {

    constructor(context, props = {}) {
        this.initialized = Promise.resolve()
        if (!context) {
            throw new Error("container element is " + context)
        }
        this.context = context
        this.id = (Math.random() + 1).toString(36).substring(2, 8)
        this.extensions = []
        this.props = {
            position: FEN.empty, // set position as fen, use FEN.start or FEN.empty as shortcuts
            orientation: COLOR.white, // white on bottom
            responsive: true, // resize the board automatically to the size of the context element
            language: navigator.language.substring(0, 2).toLowerCase(), // supports "de" and "en" for now, used for pieces naming
            assetsUrl: "./assets/", // put all css and sprites in this folder, will be ignored for absolute urls of assets files
            assetsCache: true, // cache sprites
            style: {
                cssClass: "default", // set the css theme of the board, try "green", "blue" or "chess-club"
                showCoordinates: true, // show ranks and files
                borderType: BORDER_TYPE.none, // "thin" thin border, "frame" wide border with coordinates in it, "none" no border
                aspectRatio: 1, // height/width of the board
                pieces: {
                    type: PIECES_FILE_TYPE.svgSprite, // pieces are in an SVG sprite, no other type supported for now
                    file: "pieces/standard.svg", // the filename of the sprite in `assets/pieces/` or an absolute url like `https://…` or `/…`
                    tileSize: 40 // the tile size in the sprite
                },
                // pieces animation duration in milliseconds. Disable all animations with `0`. Respects the operating system settings for reduced motion.
                animationDuration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300
            },
            extensions: [ /* {class: ExtensionClass, props: { ... }} */] // add extensions here
        }
        Utils.mergeObjects(this.props, props)
        if (this.props.language !== "de" && this.props.language !== "en") {
            this.props.language = "en"
        }
        this.state = new ChessboardState()
        this.view = new ChessboardView(this)
        this.positionAnimationsQueue = new PositionAnimationsQueue(this)
        this.state.orientation = this.props.orientation
        // instantiate extensions
        for (const extensionData of this.props.extensions) {
            this.addExtension(extensionData.class, extensionData.props)
        }
        this.view.redrawBoard()
        this.state.position = new Position(this.props.position)
        this.view.redrawPieces()
        this.state.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
        this.initialized = Promise.resolve()
    }

    // API //

    async setPiece(square, piece, animated = false) {
        const positionFrom = this.state.position.clone()
        this.state.position.setPiece(square, piece)
        this.state.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
        return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.state.position.clone(), animated)
    }

    async movePiece(squareFrom, squareTo, animated = false) {
        const positionFrom = this.state.position.clone()
        this.state.position.movePiece(squareFrom, squareTo)
        this.state.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
        return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.state.position.clone(), animated)
    }

    async setPosition(fen, animated = false) {
        const positionFrom = this.state.position.clone()
        const positionTo = new Position(fen)
        if (positionFrom.getFen() !== positionTo.getFen()) {
            this.state.position.setFen(fen)
            this.state.invokeExtensionPoints(EXTENSION_POINT.positionChanged)
        }
        return this.positionAnimationsQueue.enqueuePositionChange(positionFrom, this.state.position.clone(), animated)
    }

    async setOrientation(color, animated = false) {
        const position = this.state.position.clone()
        if (this.boardTurning) {
            console.warn("setOrientation is only once in queue allowed")
            return
        }
        this.boardTurning = true
        return this.positionAnimationsQueue.enqueueTurnBoard(position, color, animated).then(() => {
            this.boardTurning = false
            this.state.invokeExtensionPoints(EXTENSION_POINT.boardChanged)
        })
    }

    getPiece(square) {
        return this.state.position.getPiece(square)
    }

    getPosition() {
        return this.state.position.getFen()
    }

    getOrientation() {
        return this.state.orientation
    }

    enableMoveInput(eventHandler, color = undefined) {
        this.view.enableMoveInput(eventHandler, color)
    }

    disableMoveInput() {
        this.view.disableMoveInput()
    }

    /**
     * This will be removed in the future, because you can directly assign events
     * to the `chessboard.context` and then read the square from the `event.target`
     * @deprecated
     */
    enableSquareSelect(eventHandler) {
        console.warn("chessboard.enableSquareSelect() is deprecated will be removed in future versions");
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
                mouseEvent: e,
                chessboard: this,
                type: e.button === 2 ? SQUARE_SELECT_TYPE.secondary : SQUARE_SELECT_TYPE.primary,
                square: square
            })
        }
        this.context.addEventListener("contextmenu", this.squareSelectListener)
        this.context.addEventListener("mousedown", this.squareSelectListener)
        this.context.addEventListener("mouseup", this.squareSelectListener)
        this.context.addEventListener("touchstart", this.squareSelectListener, {passive: false})
        this.context.addEventListener("touchend", this.squareSelectListener)
        this.state.squareSelectEnabled = true
        this.view.visualizeInputState()
    }

    /**
     * @deprecated
     */
    disableSquareSelect() {
        this.context.removeEventListener("contextmenu", this.squareSelectListener)
        this.context.removeEventListener("mousedown", this.squareSelectListener)
        this.context.removeEventListener("mouseup", this.squareSelectListener)
        this.context.removeEventListener("touchstart", this.squareSelectListener)
        this.context.removeEventListener("touchend", this.squareSelectListener)
        this.squareSelectListener = undefined
        this.state.squareSelectEnabled = false
        this.view.visualizeInputState()
    }

    addExtension(extensionClass, props) {
        if(this.getExtension(extensionClass)) {
            throw Error("extension \"" + extensionClass.name + "\" already added")
        }
        this.extensions.push(new extensionClass(this, props))
    }

    getExtension(extensionClass) {
        for (const extension of this.extensions) {
            if (extension instanceof extensionClass) {
                return extension
            }
        }
        return null
    }

    destroy() {
        this.state.invokeExtensionPoints(EXTENSION_POINT.destroy)
        if (this.state.squareSelectEnabled) {
            this.disableSquareSelect()
        }
        this.positionAnimationsQueue.destroy()
        this.view.destroy()
        this.view = undefined
        this.state = undefined
    }

}
