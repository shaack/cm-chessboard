/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {VisualMoveInput} from "./VisualMoveInput.js"
import {BORDER_TYPE, COLOR, INPUT_EVENT_TYPE} from "../Chessboard.js"
import {Position} from "../model/Position.js"
import {EXTENSION_POINT} from "../model/Extension.js"

export const piecesTranslations = {
    en: {
        colors: {
            w: "w", b: "b"
        },
        colors_long: {
            w: "White", b: "Black"
        },
        pieces: {
            p: "p", n: "n", b: "b", r: "r", q: "q", k: "k"
        },
        pieces_long: {
            p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King"
        }
    },
    de: {
        colors: {
            w: "w", b: "s"
        },
        colors_long: {
            w: "Weiß", b: "Schwarz"
        },
        pieces: {
            p: "b", n: "s", b: "l", r: "t", q: "d", k: "k"
        },
        pieces_long: {
            p: "Bauer", n: "Springer", b: "Läufer", r: "Turm", q: "Dame", k: "König"
        }
    }
}

export function renderPieceTitle(lang, name, color = undefined) {
    let title = piecesTranslations[lang].pieces_long[name]
    if (color) {
        title += " " + piecesTranslations[lang].colors_long[color]
    }
    return title
}

export class ChessboardView {

    constructor(chessboard) {
        this.chessboard = chessboard
        this.moveInput = new VisualMoveInput(this,
            this.moveInputStartedCallback.bind(this),
            this.validateMoveInputCallback.bind(this),
            this.moveInputCanceledCallback.bind(this)
        )
        if (chessboard.props.sprite.cache) {
            this.cacheSpriteToDiv("chessboardSpriteCache", this.chessboard.props.sprite.url)
        }
        this.context = document.createElement("div")
        this.chessboard.context.appendChild(this.context)
        if (chessboard.props.responsive) {
            if (typeof ResizeObserver !== "undefined") {
                this.resizeObserver = new ResizeObserver(() => {
                    this.handleResize()
                })
                this.resizeObserver.observe(this.chessboard.context)
            } else {
                this.resizeListener = this.handleResize.bind(this)
                window.addEventListener("resize", this.resizeListener)
            }
        }

        this.pointerDownListener = this.pointerDownHandler.bind(this)
        this.pointerDownListener = this.pointerDownHandler.bind(this)
        this.context.addEventListener("mousedown", this.pointerDownListener)
        this.context.addEventListener("touchstart", this.pointerDownListener)

        this.createSvgAndGroups()
        this.updateMetrics()
        this.handleResize()
        this.redrawBoard()
    }

    pointerDownHandler(e) {
        this.moveInput.onPointerDown(e)
    }

    destroy() {
        this.moveInput.destroy()
        if (this.resizeObserver) {
            this.resizeObserver.unobserve(this.chessboard.context)
        }
        if (this.resizeListener) {
            window.removeEventListener("resize", this.resizeListener)
        }
        this.chessboard.context.removeEventListener("mousedown", this.pointerDownListener)
        this.chessboard.context.removeEventListener("touchstart", this.pointerDownListener)
        this.animationQueue = []
        if (this.currentAnimation) {
            cancelAnimationFrame(this.currentAnimation.frameHandle)
        }
        Svg.removeElement(this.svg)
    }

    // Sprite //

    cacheSpriteToDiv(wrapperId, url) {
        if (!document.getElementById(wrapperId)) {
            const wrapper = document.createElement("div")
            wrapper.style.display = "none"
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
        this.svg = Svg.createSvg(this.context)
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
        this.coordinatesGroup = Svg.addElement(this.svg, "g", {class: "coordinates"})
        this.markersLayer = Svg.addElement(this.svg, "g", {class: "markers-layer"})
        this.piecesLayer = Svg.addElement(this.svg, "g", {class: "pieces-layer"})
        this.piecesGroup = Svg.addElement(this.piecesLayer, "g", {class: "pieces"})
        this.markersTopLayer = Svg.addElement(this.svg, "g", {class: "markers-top-layer"})
    }

    updateMetrics() {
        this.width = this.context.clientWidth
        this.height = this.context.clientWidth * (this.chessboard.props.style.aspectRatio || 1)
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
        this.scalingX = this.squareWidth / this.chessboard.props.sprite.size
        this.scalingY = this.squareHeight / this.chessboard.props.sprite.size
        this.pieceXTranslate = (this.squareWidth / 2 - this.chessboard.props.sprite.size * this.scalingY / 2)
    }

    handleResize() {
        this.context.style.width = this.chessboard.context.clientWidth + "px"
        this.context.style.height = (this.chessboard.context.clientWidth * this.chessboard.props.style.aspectRatio) + "px"
        if (this.context.clientWidth !== this.width ||
            this.context.clientHeight !== this.height) {
            this.updateMetrics()
            this.redrawBoard()
            this.redrawPieces()
        }
        this.svg.setAttribute("width", "100%") // safari bugfix
        this.svg.setAttribute("height", "100%")
    }

    redrawBoard() {
        this.redrawSquares()
        this.drawCoordinates()
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.redrawBoard)
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
                x: innerPos,
                y: innerPos,
                width: this.width - innerPos * 2,
                height: this.height - innerPos * 2
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
            let x = this.borderSize + (17 + this.chessboard.props.sprite.size * file) * this.scalingX
            let y = this.height - this.scalingY * 3.5
            let cssClass = "coordinate file"
            if (inline) {
                x = x + this.scalingX * 15.5
                cssClass += file % 2 ? " white" : " black"
            }
            const textElement = Svg.addElement(this.coordinatesGroup, "text", {
                class: cssClass,
                x: x,
                y: y,
                style: `font-size: ${this.scalingY * 10}px`
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
                class: cssClass,
                x: x,
                y: y,
                style: `font-size: ${this.scalingY * 10}px`
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
        for (let i = 0; i < 64; i++) {
            const pieceName = squares[i]
            if (pieceName) {
                this.drawPieceOnSquare(Position.indexToSquare(i), pieceName)
            }
        }
        for (const childNode of childNodes) {
            this.piecesGroup.removeChild(childNode)
        }
    }

    drawPiece(parentGroup, pieceName, point) {
        const pieceGroup = Svg.addElement(parentGroup, "g", {})
        pieceGroup.setAttribute("data-piece", pieceName)
        pieceGroup.setAttribute("class", "piece-group")
        const transform = (this.svg.createSVGTransform())
        transform.setTranslate(point.x, point.y)
        pieceGroup.transform.baseVal.appendItem(transform)
        const spriteUrl = this.chessboard.props.sprite.cache ? "" : this.chessboard.props.sprite.url
        const pieceUse = Svg.addElement(pieceGroup, "use", {
            href: `${spriteUrl}#${pieceName}`,
            class: "piece"
        })
        const transformScale = (this.svg.createSVGTransform())
        transformScale.setScale(this.scalingY, this.scalingY)
        pieceUse.transform.baseVal.appendItem(transformScale)
        const transformTranslate = (this.svg.createSVGTransform())
        transformTranslate.setTranslate(this.pieceXTranslate, 0)
        pieceUse.transform.baseVal.appendItem(transformTranslate)
        return pieceGroup
    }

    drawPieceOnSquare(square, pieceName) {
        const point = this.squareToPoint(square)
        const pieceGroup = this.drawPiece(this.piecesGroup, pieceName, point)
        pieceGroup.setAttribute("data-square", square)
        return pieceGroup

        /*
        const pieceGroup = Svg.addElement(this.piecesGroup, "g", {})
        pieceGroup.setAttribute("data-piece", pieceName)
        pieceGroup.setAttribute("data-square", square)
        const point = this.squareToPoint(square)
        const transform = (this.svg.createSVGTransform())
        transform.setTranslate(point.x, point.y)
        pieceGroup.transform.baseVal.appendItem(transform)
        const spriteUrl = this.chessboard.props.sprite.cache ? "" : this.chessboard.props.sprite.url
        const pieceUse = Svg.addElement(pieceGroup, "use", {
            href: `${spriteUrl}#${pieceName}`,
            class: "piece"
        })
        // center on square
        const transformTranslate = (this.svg.createSVGTransform())
        transformTranslate.setTranslate(this.pieceXTranslate, 0)
        pieceUse.transform.baseVal.appendItem(transformTranslate)

         */

        // return pieceGroup
    }

    setPieceVisibility(square, visible = true) {
        const piece = this.getPieceElement(square)
        if(piece) {
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
        if (square.length < 2) {
            throw new Error("980e03")
        }
        const piece = this.piecesGroup.querySelector(`g[data-square='${square}']`)
        if (!piece) {
            console.warn("no piece on", square)
        }
        return piece
    }

    // enable and disable move input //

    enableMoveInput(eventHandler, color = undefined) {
        if (color === COLOR.white) {
            this.chessboard.state.inputWhiteEnabled = true
        } else if (color === COLOR.black) {
            this.chessboard.state.inputBlackEnabled = true
        } else {
            this.chessboard.state.inputWhiteEnabled = true
            this.chessboard.state.inputBlackEnabled = true
        }
        this.chessboard.state.inputEnabled = true
        this.moveInputCallback = eventHandler
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInputToggled, {enabled: true, color: color})
        this.visualizeInputState()
    }

    disableMoveInput() {
        this.chessboard.state.inputWhiteEnabled = false
        this.chessboard.state.inputBlackEnabled = false
        this.chessboard.state.inputEnabled = false
        this.moveInputCallback = undefined
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInputToggled, {enabled: false})
        this.visualizeInputState()
    }

    // callbacks //

    moveInputStartedCallback(square) {
        const data = {
            chessboard: this.chessboard,
            type: INPUT_EVENT_TYPE.moveInputStarted,
            square: square,
            piece: this.chessboard.getPiece(square)
        }
        if (this.moveInputCallback) {
            // the "oldschool" move input validator
            data.moveInputCallbackResult =  this.moveInputCallback(data)
        }
        // the new extension points
        const extensionPointsResult = this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInput, data)
        // validates, when moveInputCallbackResult and extensionPointsResult are true
        return !(extensionPointsResult === false || !data.moveInputCallbackResult);
    }

    validateMoveInputCallback(squareFrom, squareTo) {
        const data = {
            chessboard: this.chessboard,
            type: INPUT_EVENT_TYPE.validateMoveInput,
            squareFrom: squareFrom,
            squareTo: squareTo,
            piece: this.chessboard.getPiece(squareFrom)
        }
        if (this.moveInputCallback) {
            // the "oldschool" move input validator
            data.moveInputCallbackResult = this.moveInputCallback(data)
        }
        // the new extension points
        const extensionPointsResult = this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInput, data)
        // validates, when moveInputCallbackResult and extensionPointsResult are true
        return !(extensionPointsResult === false || !data.moveInputCallbackResult);
    }

    moveInputCanceledCallback(reason, squareFrom, squareTo) {
        const data = {
            chessboard: this.chessboard,
            type: INPUT_EVENT_TYPE.moveInputCanceled,
            reason: reason,
            squareFrom: squareFrom,
            squareTo: squareTo
        }
        this.chessboard.state.invokeExtensionPoints(EXTENSION_POINT.moveInput, data)
        if (this.moveInputCallback) {
            this.moveInputCallback(data)
        }
    }

    // Helpers //

    visualizeInputState() {
        if (this.chessboard.state) { // fix https://github.com/shaack/cm-chessboard/issues/47
            if (this.chessboard.state.inputWhiteEnabled || this.chessboard.state.inputBlackEnabled || this.chessboard.state.squareSelectEnabled) {
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

}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg"

export class Svg {

    /**
     * create the Svg in the HTML DOM
     * @param containerElement
     * @returns {Element}
     */
    static createSvg(containerElement = undefined) {
        let svg = document.createElementNS(SVG_NAMESPACE, "svg")
        if (containerElement) {
            svg.setAttribute("width", "100%")
            svg.setAttribute("height", "100%")
            containerElement.appendChild(svg)
        }
        return svg
    }

    /**
     * Add an Element to a SVG DOM
     * @param parent
     * @param name
     * @param attributes
     * @param sibling
     * @returns {Element}
     */
    static addElement(parent, name, attributes, sibling = undefined) {
        let element = document.createElementNS(SVG_NAMESPACE, name)
        if (name === "use") {
            attributes["xlink:href"] = attributes["href"] // fix for safari
        }
        for (let attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
                if (attribute.indexOf(":") !== -1) {
                    const value = attribute.split(":")
                    element.setAttributeNS("http://www.w3.org/1999/" + value[0], value[1], attributes[attribute])
                } else {
                    element.setAttribute(attribute, attributes[attribute])
                }
            }
        }
        if (sibling === undefined) {
          parent.appendChild(element)
        } else {
          parent.insertBefore(element, sibling)
        }
        return element
    }

    /**
     * Remove an Element from a SVG DOM
     * @param element
     */
    static removeElement(element) {
        if(element.parentNode) {
            element.parentNode.removeChild(element)
        } else {
            console.warn(element, "without parentNode")
        }
    }

}

export class DomUtils {
    static delegate(element, eventName, selector, handler) {
        const eventListener = function (event) {
            let target = event.target
            while (target && target !== this) {
                if (target.matches(selector)) {
                    handler.call(target, event)
                }
                target = target.parentNode
            }
        }
        element.addEventListener(eventName, eventListener)
        return {
            remove: function () {
                element.removeEventListener(eventName, eventListener)
            }
        }
    }
}
