/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {VisualMoveInput} from "./VisualMoveInput.js"
import {Position} from "../model/Position.js"
import {EXTENSION_POINT} from "../model/Extension.js"
import {Svg} from "../lib/Svg.js"
import {Utils} from "../lib/Utils.js"

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
export const POINTER_EVENTS = {
    pointercancel: "pointercancel",
    pointerdown: "pointerdown",
    pointerenter: "pointerenter",
    pointerleave: "pointerleave",
    pointermove: "pointermove",
    pointerout: "pointerout",
    pointerover: "pointerover",
    pointerup: "pointerup"
}
export const BORDER_TYPE = {
    none: "none", // no border
    thin: "thin", // thin border
    frame: "frame" // wide border with coordinates in it
}

export class ChessboardView {
    constructor(chessboard) {
        this.chessboard = chessboard
        this.visualMoveInput = new VisualMoveInput(this)
        if (chessboard.props.assetsCache) {
            this.cacheSpriteToDiv("cm-chessboard-sprite", this.getSpriteUrl())
        }
        this.container = document.createElement("div")
        this.chessboard.context.appendChild(this.container)
        if (chessboard.props.responsive) {
            if (typeof ResizeObserver !== "undefined") {
                this.resizeObserver = new ResizeObserver(() => {
                    setTimeout(() => { // prevents "ResizeObserver loop completed with undelivered notifications."
                        this.handleResize()
                    })
                })
                this.resizeObserver.observe(this.chessboard.context)
            } else {
                this.resizeListener = this.handleResize.bind(this)
                window.addEventListener("resize", this.resizeListener)
            }
        }
        this.positionsAnimationTask = Promise.resolve()
        this.pointerDownListener = this.pointerDownHandler.bind(this)
        this.container.addEventListener("mousedown", this.pointerDownListener)
        this.container.addEventListener("touchstart", this.pointerDownListener, {passive: false})
        this.createSvgAndGroups()
        this.handleResize()
    }

    pointerDownHandler(e) {
        this.visualMoveInput.onPointerDown(e)
    }

    destroy() {
        this.visualMoveInput.destroy()
        if (this.resizeObserver) {
            this.resizeObserver.unobserve(this.chessboard.context)
        }
        if (this.resizeListener) {
            window.removeEventListener("resize", this.resizeListener)
        }
        this.chessboard.context.removeEventListener("mousedown", this.pointerDownListener)
        this.chessboard.context.removeEventListener("touchstart", this.pointerDownListener)
        Svg.removeElement(this.svg)
        this.container.remove()
    }

    // Sprite //

    cacheSpriteToDiv(wrapperId, url) {
        if (!document.getElementById(wrapperId)) {
            const wrapper = document.createElement("div")
            wrapper.style.transform = "scale(0)"
            wrapper.style.position = "absolute"
            wrapper.setAttribute("aria-hidden", "true")
            wrapper.id = wrapperId
            document.body.appendChild(wrapper)
            const xhr = new XMLHttpRequest()
            xhr.open("GET", url, true)
            xhr.onload = function () {
                wrapper.insertAdjacentHTML('afterbegin', xhr.response)
            }
            xhr.send()
        }
    }

    createSvgAndGroups() {
        this.svg = Svg.createSvg(this.container)
        // let description = document.createElement("description")
        // description.innerText = "Chessboard"
        // description.id = "svg-description"
        // this.svg.appendChild(description)
        let cssClass = this.chessboard.props.style.cssClass ? this.chessboard.props.style.cssClass : "default"
        this.svg.setAttribute("class", "cm-chessboard border-type-" + this.chessboard.props.style.borderType + " " + cssClass)
        // this.svg.setAttribute("aria-describedby", "svg-description")
        this.svg.setAttribute("role", "img")
        this.updateMetrics()
        this.boardGroup = Svg.addElement(this.svg, "g", {class: "board"})
        this.coordinatesGroup = Svg.addElement(this.svg, "g", {class: "coordinates", "aria-hidden": "true"})
        this.markersLayer = Svg.addElement(this.svg, "g", {class: "markers-layer"})
        this.piecesLayer = Svg.addElement(this.svg, "g", {class: "pieces-layer"})
        this.piecesGroup = Svg.addElement(this.piecesLayer, "g", {class: "pieces"})
        this.markersTopLayer = Svg.addElement(this.svg, "g", {class: "markers-top-layer"})
        this.interactiveTopLayer = Svg.addElement(this.svg, "g", {class: "interactive-top-layer"})
    }

    updateMetrics() {
        const piecesTileSize = this.chessboard.props.style.pieces.tileSize
        this.width = this.container.clientWidth
        this.height = this.container.clientWidth * (this.chessboard.props.style.aspectRatio || 1)
        if (this.chessboard.props.style.borderType === BORDER_TYPE.frame) {
            this.borderSize = this.width / 25
        } else if (this.chessboard.props.style.borderType === BORDER_TYPE.thin) {
            this.borderSize = this.width / 320
        } else {
            this.borderSize = 0
        }
        this.innerWidth = this.width - 2 * this.borderSize
        this.innerHeight = this.height - 2 * this.borderSize
        this.squareWidth = this.innerWidth / 8
        this.squareHeight = this.innerHeight / 8
        this.scalingX = this.squareWidth / piecesTileSize
        this.scalingY = this.squareHeight / piecesTileSize
        this.pieceXTranslate = (this.squareWidth / 2 - piecesTileSize * this.scalingY / 2)
    }

    handleResize() {
        this.container.style.width = (this.chessboard.context.clientWidth) + "px"
        this.container.style.height = (this.chessboard.context.clientWidth * this.chessboard.props.style.aspectRatio) + "px"
        if (this.container.clientWidth !== this.width || this.container.clientHeight !== this.height) {
            this.updateMetrics()
            this.redrawBoard()
            this.redrawPieces()
        }
        this.svg.setAttribute("width", "100%")
        this.svg.setAttribute("height", "100%")
    }

    redrawBoard() {
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.beforeRedrawBoard)
        this.redrawSquares()
        this.drawCoordinates()
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.afterRedrawBoard)
        this.visualizeInputState()
    }

    // Board //

    redrawSquares() {
        while (this.boardGroup.firstChild) {
            this.boardGroup.removeChild(this.boardGroup.lastChild)
        }

        let boardBorder = Svg.addElement(this.boardGroup, "rect", {width: this.width, height: this.height})
        boardBorder.setAttribute("class", "border")
        if (this.chessboard.props.style.borderType === BORDER_TYPE.frame) {
            const innerPos = this.borderSize
            let borderInner = Svg.addElement(this.boardGroup, "rect", {
                x: innerPos, y: innerPos, width: this.width - innerPos * 2, height: this.height - innerPos * 2
            })
            borderInner.setAttribute("class", "border-inner")
        }

        for (let i = 0; i < 64; i++) {
            const index = this.chessboard.state.orientation === COLOR.white ? i : 63 - i
            const squareColor = ((9 * index) & 8) === 0 ? 'black' : 'white'
            const fieldClass = `square ${squareColor}`
            const point = this.squareToPoint(Position.indexToSquare(index))
            const squareRect = Svg.addElement(this.boardGroup, "rect", {
                x: point.x, y: point.y, width: this.squareWidth, height: this.squareHeight
            })
            squareRect.setAttribute("class", fieldClass)
            squareRect.setAttribute("data-square", Position.indexToSquare(index))
        }
    }

    drawCoordinates() {
        if (!this.chessboard.props.style.showCoordinates) {
            return
        }
        while (this.coordinatesGroup.firstChild) {
            this.coordinatesGroup.removeChild(this.coordinatesGroup.lastChild)
        }
        const inline = this.chessboard.props.style.borderType !== BORDER_TYPE.frame
        for (let file = 0; file < 8; file++) {
            let x = this.borderSize + (17 + this.chessboard.props.style.pieces.tileSize * file) * this.scalingX
            let y = this.height - this.scalingY * 3.5
            let cssClass = "coordinate file"
            if (inline) {
                x = x + this.scalingX * 15.5
                cssClass += file % 2 ? " white" : " black"
            }
            const textElement = Svg.addElement(this.coordinatesGroup, "text", {
                class: cssClass, x: x, y: y, style: `font-size: ${this.scalingY * 10}px`
            })
            if (this.chessboard.state.orientation === COLOR.white) {
                textElement.textContent = String.fromCharCode(97 + file)
            } else {
                textElement.textContent = String.fromCharCode(104 - file)
            }
        }
        for (let rank = 0; rank < 8; rank++) {
            let x = (this.borderSize / 3.7)
            let y = this.borderSize + 25 * this.scalingY + rank * this.squareHeight
            let cssClass = "coordinate rank"
            if (inline) {
                cssClass += rank % 2 ? " black" : " white"
                if (this.chessboard.props.style.borderType === BORDER_TYPE.frame) {
                    x = x + this.scalingX * 10
                    y = y - this.scalingY * 15
                } else {
                    x = x + this.scalingX * 2
                    y = y - this.scalingY * 15
                }
            }
            const textElement = Svg.addElement(this.coordinatesGroup, "text", {
                class: cssClass, x: x, y: y, style: `font-size: ${this.scalingY * 10}px`
            })
            if (this.chessboard.state.orientation === COLOR.white) {
                textElement.textContent = "" + (8 - rank)
            } else {
                textElement.textContent = "" + (1 + rank)
            }
        }
    }

    // Pieces //

    redrawPieces(squares = this.chessboard.state.position.squares) {
        const childNodes = Array.from(this.piecesGroup.childNodes)
        const isDragging = this.visualMoveInput.isDragging()
        for (let i = 0; i < 64; i++) {
            const pieceName = squares[i]
            if (pieceName) {
                const square = Position.indexToSquare(i)
                this.drawPieceOnSquare(square, pieceName, isDragging && square === this.visualMoveInput.fromSquare)
            }
        }
        for (const childNode of childNodes) {
            this.piecesGroup.removeChild(childNode)
        }
    }

    drawPiece(parentGroup, pieceName, point) {
        const pieceGroup = Svg.addElement(parentGroup, "g", {})
        pieceGroup.setAttribute("data-piece", pieceName)
        const transform = (this.svg.createSVGTransform())
        transform.setTranslate(point.x, point.y)
        pieceGroup.transform.baseVal.appendItem(transform)
        const spriteUrl = this.chessboard.props.assetsCache ? "" : this.getSpriteUrl()
        const pieceUse = Svg.addElement(pieceGroup, "use", {
            href: `${spriteUrl}#${pieceName}`, class: "piece"
        })
        const transformScale = (this.svg.createSVGTransform())
        transformScale.setScale(this.scalingY, this.scalingY)
        pieceUse.transform.baseVal.appendItem(transformScale)
        return pieceGroup
    }

    drawPieceOnSquare(square, pieceName, hidden = false) {
        const pieceGroup = Svg.addElement(this.piecesGroup, "g", {})
        pieceGroup.setAttribute("data-piece", pieceName)
        pieceGroup.setAttribute("data-square", square)
        if (hidden) {
            pieceGroup.setAttribute("visibility", "hidden")
        }
        const point = this.squareToPoint(square)
        const transform = (this.svg.createSVGTransform())
        transform.setTranslate(point.x, point.y)
        pieceGroup.transform.baseVal.appendItem(transform)
        const spriteUrl = this.chessboard.props.assetsCache ? "" : this.getSpriteUrl()
        const pieceUse = Svg.addElement(pieceGroup, "use", {
            href: `${spriteUrl}#${pieceName}`, class: "piece"
        })
        // center on square
        const transformTranslate = (this.svg.createSVGTransform())
        transformTranslate.setTranslate(this.pieceXTranslate, 0)
        pieceUse.transform.baseVal.appendItem(transformTranslate)
        // scale
        const transformScale = (this.svg.createSVGTransform())
        transformScale.setScale(this.scalingY, this.scalingY)
        pieceUse.transform.baseVal.appendItem(transformScale)
        return pieceGroup
    }

    setPieceVisibility(square, visible = true) {
        const piece = this.getPieceElement(square)
        if (piece) {
            if (visible) {
                piece.setAttribute("visibility", "visible")
            } else {
                piece.setAttribute("visibility", "hidden")
            }
        } else {
            console.warn("no piece on", square)
        }
    }

    getPieceElement(square) {
        if (!square || square.length < 2) {
            console.warn("invalid square", square)
            return null
        }
        const piece = this.piecesGroup.querySelector(`g[data-square='${square}']`)
        if (!piece) {
            console.warn("no piece on", square)
            return null
        }
        return piece
    }

    // enable and disable move input //

    enableMoveInput(eventHandler, color = null) {
        if (this.chessboard.state.moveInputCallback) {
            throw Error("moveInput already enabled")
        }
        if (color === COLOR.white) {
            this.chessboard.state.inputWhiteEnabled = true
        } else if (color === COLOR.black) {
            this.chessboard.state.inputBlackEnabled = true
        } else {
            this.chessboard.state.inputWhiteEnabled = true
            this.chessboard.state.inputBlackEnabled = true
        }
        this.chessboard.state.moveInputCallback = eventHandler
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInputToggled, {enabled: true, color: color})
        this.visualizeInputState()
    }

    disableMoveInput() {
        this.chessboard.state.inputWhiteEnabled = false
        this.chessboard.state.inputBlackEnabled = false
        this.chessboard.state.moveInputCallback = null
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInputToggled, {enabled: false})
        this.visualizeInputState()
    }

    // callbacks //

    moveInputStartedCallback(square) {
        const data = {
            chessboard: this.chessboard,
            type: INPUT_EVENT_TYPE.moveInputStarted,
            square: square, /** square is deprecated, use squareFrom (2023-05-22) */
            squareFrom: square,
            piece: this.chessboard.getPiece(square)
        }
        if (this.chessboard.state.moveInputCallback) {
            data.moveInputCallbackResult = this.chessboard.state.moveInputCallback(data)
        }
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInput, data)
        return data.moveInputCallbackResult
    }

    movingOverSquareCallback(squareFrom, squareTo) {
        const data = {
            chessboard: this.chessboard,
            type: INPUT_EVENT_TYPE.movingOverSquare,
            squareFrom: squareFrom,
            squareTo: squareTo,
            piece: this.chessboard.getPiece(squareFrom)
        }
        if (this.chessboard.state.moveInputCallback) {
            data.moveInputCallbackResult = this.chessboard.state.moveInputCallback(data)
        }
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInput, data)
    }

    validateMoveInputCallback(squareFrom, squareTo) {
        const data = {
            chessboard: this.chessboard,
            type: INPUT_EVENT_TYPE.validateMoveInput,
            squareFrom: squareFrom,
            squareTo: squareTo,
            piece: this.chessboard.getPiece(squareFrom)
        }
        if (this.chessboard.state.moveInputCallback) {
            data.moveInputCallbackResult = this.chessboard.state.moveInputCallback(data)
        }
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInput, data)
        return data.moveInputCallbackResult
    }

    moveInputCanceledCallback(squareFrom, squareTo, reason) {
        const data = {
            chessboard: this.chessboard,
            type: INPUT_EVENT_TYPE.moveInputCanceled,
            reason: reason,
            squareFrom: squareFrom,
            squareTo: squareTo
        }
        if (this.chessboard.state.moveInputCallback) {
            this.chessboard.state.moveInputCallback(data)
        }
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInput, data)
    }

    moveInputFinishedCallback(squareFrom, squareTo, legalMove) {
        const data = {
            chessboard: this.chessboard,
            type: INPUT_EVENT_TYPE.moveInputFinished,
            squareFrom: squareFrom,
            squareTo: squareTo,
            legalMove: legalMove
        }
        if (this.chessboard.state.moveInputCallback) {
            this.chessboard.state.moveInputCallback(data)
        }
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInput, data)
    }

    // Helpers //

    visualizeInputState() {
        if (this.chessboard.state) { // fix https://github.com/shaack/cm-chessboard/issues/47
            if (this.chessboard.state.inputWhiteEnabled || this.chessboard.state.inputBlackEnabled) {
                this.boardGroup.setAttribute("class", "board input-enabled")
            } else {
                this.boardGroup.setAttribute("class", "board")
            }
        }
    }

    indexToPoint(index) {
        let x, y
        if (this.chessboard.state.orientation === COLOR.white) {
            x = this.borderSize + (index % 8) * this.squareWidth
            y = this.borderSize + (7 - Math.floor(index / 8)) * this.squareHeight
        } else {
            x = this.borderSize + (7 - index % 8) * this.squareWidth
            y = this.borderSize + (Math.floor(index / 8)) * this.squareHeight
        }
        return {x: x, y: y}
    }

    squareToPoint(square) {
        const index = Position.squareToIndex(square)
        return this.indexToPoint(index)
    }

    getSpriteUrl() {
        if (Utils.isAbsoluteUrl(this.chessboard.props.style.pieces.file)) {
            return this.chessboard.props.style.pieces.file
        } else {
            return this.chessboard.props.assetsUrl + this.chessboard.props.style.pieces.file
        }
    }
}
