/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {BoardMoveInput} from "./BoardMoveInput.js"
import {COLOR, INPUT_EVENT_TYPE, BORDER_TYPE} from "./Board.js"
import {BoardPiecesAnimation} from "./BoardPiecesAnimation.js"

export const SQUARE_COORDINATES = [
    "a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1",
    "a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2",
    "a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3",
    "a4", "b4", "c4", "d4", "e4", "f4", "g4", "h4",
    "a5", "b5", "c5", "d5", "e5", "f5", "g5", "h5",
    "a6", "b6", "c6", "d6", "e6", "f6", "g6", "h6",
    "a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7",
    "a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"
]

export class BoardView {

    constructor(board, callbackAfterCreation) {
        this.animationRunning = false
        this.currentAnimation = undefined
        this.board = board
        this.rows = board.state.rows
        this.columns = board.state.columns
        this.moveInput = new BoardMoveInput(this,
            this.moveStartCallback.bind(this),
            this.moveDoneCallback.bind(this),
            this.moveCanceledCallback.bind(this)
        )
        this.animationQueue = []
        this.loadSVGImages()
        if (board.props.responsive) {
            // noinspection JSUnresolvedVariable
            if (typeof ResizeObserver !== "undefined") {
                // noinspection JSUnresolvedFunction
                this.resizeObserver = new ResizeObserver(() => {
                    this.handleResize()
                })
                this.resizeObserver.observe(this.board.element)
            } else {
                this.resizeListener = this.handleResize.bind(this)
                window.addEventListener("resize", this.resizeListener)
            }
        }

        this.pointerDownListener = this.pointerDownHandler.bind(this)
        this.board.element.addEventListener("mousedown", this.pointerDownListener)
        this.board.element.addEventListener("touchstart", this.pointerDownListener)

        this.createSvgAndGroups()
        this.updateMetrics()
        callbackAfterCreation(this)
        if (board.props.responsive) {
            this.handleResize()
        }
    }

    pointerDownHandler(e) {
        this.moveInput.onPointerDown(e)
    }

    destroy() {
        this.moveInput.destroy()
        if (this.resizeObserver) {
            this.resizeObserver.unobserve(this.board.element);
        }
        if (this.resizeListener) {
            window.removeEventListener("resize", this.resizeListener)
        }
        this.board.element.removeEventListener("mousedown", this.pointerDownListener)
        this.board.element.removeEventListener("touchstart", this.pointerDownListener)
        Svg.removeElement(this.svg)
        this.animationQueue = []
        if (this.currentAnimation) {
            cancelAnimationFrame(this.currentAnimation.frameHandle)
        }
    }

    // Sprite //
    loadSVG(filename, id)
    {
        if (document.getElementById(id))
        {
            return;
        }
        let img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        img.id = id;
        img.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', filename);
        document.body.appendChild(img);
        console.log(id, img)
    }

    loadSVGImages() {
        const path = this.board.props.sprite.url
        this.loadSVG(path + '/wp.svg', 'wp')
        this.loadSVG(path + '/bp.svg', 'bp')
        this.loadSVG(path + '/wq.svg', 'wq')
        this.loadSVG(path + '/bq.svg', 'bq')
        this.loadSVG(path + '/circle.svg', 'markerCircle')
        this.loadSVG(path + '/dot.svg', 'markerDot')
        this.loadSVG(path + '/frame.svg', 'markerFrame')
        this.loadSVG(path + '/square.svg', 'markerSquare')
    }

    clearCache() {
        const wrapperId = "chessboardSpriteCache"
        document.getElementById(wrapperId).remove()
    }

    createSvgAndGroups() {
        if (this.svg) {
            Svg.removeElement(this.svg)
        }
        this.svg = Svg.createSvg(this.board.element)
        let cssClass = this.board.props.style.cssClass ? this.board.props.style.cssClass : "default"
        this.svg.setAttribute("class", "cm-chessboard border-type-" + this.board.props.style.borderType + " " + cssClass)
        this.updateMetrics()
        this.boardGroup = Svg.addElement(this.svg, "g", {class: "board"})
        this.coordinatesGroup = Svg.addElement(this.svg, "g", {class: "coordinates"})
        this.markersGroup = Svg.addElement(this.svg, "g", {class: "markers"})
        this.piecesGroup = Svg.addElement(this.svg, "g", {class: "pieces"})
    }

    updateMetrics() {
        this.width = this.board.element.clientWidth
        this.height = this.board.element.clientHeight
        if (this.board.props.style.borderType === BORDER_TYPE.frame) {
            this.borderSize = this.width / 25
        } else if (this.board.props.style.borderType === BORDER_TYPE.thin) {
            this.borderSize = this.width / 320
        } else {
            this.borderSize = 0
        }
        this.innerWidth = this.width - 2 * this.borderSize
        this.innerHeight = this.height - 2 * this.borderSize
        this.squareWidth = this.innerWidth / this.columns
        this.squareHeight = this.innerHeight / this.rows
        this.scalingX = this.squareWidth / this.board.props.sprite.size
        this.scalingY = this.squareHeight / this.board.props.sprite.size
        this.pieceXTranslate = (this.squareWidth / 2 - this.board.props.sprite.size * this.scalingY / 2)
    }

    handleResize() {
        if (this.board.props.style.aspectRatio) {
            this.board.element.style.height = (this.board.element.clientWidth * this.board.props.style.aspectRatio) + "px"
        }
        if (this.board.element.clientWidth !== this.width ||
            this.board.element.clientHeight !== this.height) {
            this.updateMetrics()
            this.redraw()
        }
        this.svg.setAttribute("width", "100%") // safari bugfix
        this.svg.setAttribute("height", "100%")
    }

    redraw() {
        this.drawBoard()
        this.drawCoordinatesDraughts()
        this.drawMarkers()
        this.setCursor()
        this.drawPieces(this.board.state.squares)
    }

    // Board //

    drawBoard() {
        while (this.boardGroup.firstChild) {
            this.boardGroup.removeChild(this.boardGroup.lastChild)
        }
        if (this.board.props.style.borderType !== BORDER_TYPE.none) {
            let boardBorder = Svg.addElement(this.boardGroup, "rect", {width: this.width, height: this.height})
            boardBorder.setAttribute("class", "border")
            if (this.board.props.style.borderType === BORDER_TYPE.frame) {
                const innerPos = this.borderSize
                let borderInner = Svg.addElement(this.boardGroup, "rect", {
                    x: innerPos,
                    y: innerPos,
                    width: this.width - innerPos * 2,
                    height: this.height - innerPos * 2
                })
                borderInner.setAttribute("class", "border-inner")
            }
        }
        let N = this.rows * this.columns
        for (let i = 0; i < N; i++) {
            const index = this.board.state.orientation === COLOR.white ? i : N - i - 1
            // const squareColor = ((9 * index) & 8) === 0 ? 'black' : 'white'
            const squareColor = (Math.floor(index / this.columns) % 2 === index % 2) ? 'black' : 'white'
            const fieldClass = `square ${squareColor}`
            const point = this.squareIndexToPoint(index)
            const squareRect = Svg.addElement(this.boardGroup, "rect", {
                x: point.x, y: point.y, width: this.squareWidth, height: this.squareHeight
            })
            squareRect.setAttribute("class", fieldClass)
            squareRect.setAttribute("data-index", "" + index)
        }
    }

    drawCoordinates() {
        if (!this.board.props.style.showCoordinates) {
            return
        }
        while (this.coordinatesGroup.firstChild) {
            this.coordinatesGroup.removeChild(this.coordinatesGroup.lastChild)
        }
        const inline = this.board.props.style.borderType !== BORDER_TYPE.frame
        for (let column = 0; column < this.columns; column++) {
            let x = this.borderSize + (17 + this.board.props.sprite.size * column) * this.scalingX
            let y = this.height - this.scalingY * 3.5
            let cssClass = "coordinate file"
            if (inline) {
                x = x + this.scalingX * 15.5
                cssClass += column % 2 ? " white" : " black"
            }
            const textElement = Svg.addElement(this.coordinatesGroup, "text", {
                class: cssClass,
                x: x,
                y: y,
                style: `font-size: ${this.scalingY * 10}px`
            })
            if (this.board.state.orientation === COLOR.white) {
                textElement.textContent = String.fromCharCode(97 + column)
            } else {
                textElement.textContent = String.fromCharCode(104 - column)
            }
        }
        for (let row = 0; row < this.rows; row++) {
            let x = (this.borderSize / 3.7)
            let y = this.borderSize + 25 * this.scalingY + row * this.squareHeight
            let cssClass = "coordinate rank"
            if (inline) {
                cssClass += row % 2 ? " black" : " white"
                if (this.board.props.style.borderType === BORDER_TYPE.frame) {
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
            if (this.board.state.orientation === COLOR.white) {
                textElement.textContent = "" + (this.rows - row)
            } else {
                textElement.textContent = "" + (1 + row)
            }
        }
    }

    drawCoordinate(row, column, f, color, inline, is_left, is_top) {
        let text = "" + f
        let x = is_left ?
            (this.borderSize / 3.7) + (this.board.props.sprite.size * column) * this.scalingX :
            this.borderSize + (25 + this.board.props.sprite.size * column) * this.scalingX

        if (!is_left && f < 10)
        {
            x = x + 6 * this.scalingX
        }

        let y = is_top ?
            this.borderSize + 25 * this.scalingY + row * this.squareHeight :
            this.borderSize + 52 * this.scalingY + row * this.squareHeight

        let cssClass = "coordinate rank"
        if (inline) {
            cssClass += color
            if (this.board.props.style.borderType === BORDER_TYPE.frame) {
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
        textElement.textContent = text
    }

    drawCoordinatesDraughts() {
        let color = " black"
        if (!this.board.props.style.showCoordinates) {
            color = " white"  // draw the coordinates in the background color; TODO: avoid the need to redraw like this
            // return
        }
        while (this.coordinatesGroup.firstChild) {
            this.coordinatesGroup.removeChild(this.coordinatesGroup.lastChild)
        }
        const inline = this.board.props.style.borderType !== BORDER_TYPE.frame
        let is_left = false
        let is_top = true
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                if (!this.board.state.is_non_playing_field(row, column))
                {
                    let f = this.board.state.rc2f(row, column)
                    this.drawCoordinate(row, column, f, color, inline, is_left, is_top)
                }
            }
        }
    }

    // Pieces //

    drawPieces(squares = this.board.state.squares) {
        const childNodes = Array.from(this.piecesGroup.childNodes)
        let N = this.rows * this.columns
        for (let i = 0; i < N; i++) {
            const pieceName = squares[i]
            if (pieceName) {
                this.drawPiece(i, pieceName)
            }
        }
        for (const childNode of childNodes) {
            this.piecesGroup.removeChild(childNode)
        }
    }

    drawPiece(index, pieceName) {
        const pieceGroup = Svg.addElement(this.piecesGroup, "g")
        pieceGroup.setAttribute("data-piece", pieceName)
        pieceGroup.setAttribute("data-index", index)
        const point = this.squareIndexToPoint(index)
        const transform = (this.svg.createSVGTransform())
        transform.setTranslate(point.x, point.y)
        pieceGroup.transform.baseVal.appendItem(transform)
        const spriteUrl = this.board.props.sprite.cache ? "" : this.board.props.sprite.url
        const pieceUse = Svg.addElement(pieceGroup, "use", {
            href: `${spriteUrl}#${pieceName}`,
            class: "piece"
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

    setPieceVisibility(index, visible = true) {
        const piece = this.getPiece(index)
        if (visible) {
            piece.setAttribute("visibility", "visible")
        } else {
            piece.setAttribute("visibility", "hidden")
        }

    }

    getPiece(index) {
        return this.piecesGroup.querySelector(`g[data-index='${index}']`)
    }

    // Markers //

    drawMarkers() {
        while (this.markersGroup.firstChild) {
            this.markersGroup.removeChild(this.markersGroup.firstChild)
        }
        this.board.state.markers.forEach((marker) => {
                this.drawMarker(marker)
            }
        )
    }

    drawMarker(marker) {
        const markerGroup = Svg.addElement(this.markersGroup, "g")
        markerGroup.setAttribute("data-index", marker.index)
        const point = this.squareIndexToPoint(marker.index)
        const transform = (this.svg.createSVGTransform())
        transform.setTranslate(point.x, point.y)
        markerGroup.transform.baseVal.appendItem(transform)
        const spriteUrl = this.board.props.sprite.cache ? "" : this.board.props.sprite.url
        const markerUse = Svg.addElement(markerGroup, "use",
            {href: `${spriteUrl}#${marker.type.slice}`, class: "marker " + marker.type.class})
        const transformScale = (this.svg.createSVGTransform())
        transformScale.setScale(this.scalingX, this.scalingY)
        markerUse.transform.baseVal.appendItem(transformScale)
        return markerGroup
    }

    // animation queue //

    animatePieces(fromSquares, toSquares, callback) {
        this.animationQueue.push({fromSquares: fromSquares, toSquares: toSquares, callback: callback})
        if (!this.animationRunning) {
            this.nextPieceAnimationInQueue()
        }
    }

    nextPieceAnimationInQueue() {
        const nextAnimation = this.animationQueue.shift()
        if (nextAnimation !== undefined) {
            this.animationRunning = true
            this.currentAnimation = new BoardPiecesAnimation(this, nextAnimation.fromSquares, nextAnimation.toSquares, this.board.props.animationDuration / (this.animationQueue.length + 1), () => {
                if (!this.moveInput.draggablePiece) {
                    this.drawPieces(nextAnimation.toSquares)
                    this.animationRunning = false
                    this.nextPieceAnimationInQueue()
                    if (nextAnimation.callback) {
                        nextAnimation.callback()
                    }
                } else {
                    this.animationRunning = false
                    this.nextPieceAnimationInQueue()
                    if (nextAnimation.callback) {
                        nextAnimation.callback()
                    }
                }
            })
        }
    }

    // enable and disable move input //

    enableMoveInput(eventHandler, color = undefined) {
        if (color === COLOR.white) {
            this.board.state.inputWhiteEnabled = true
        } else if (color === COLOR.black) {
            this.board.state.inputBlackEnabled = true
        } else {
            this.board.state.inputWhiteEnabled = true
            this.board.state.inputBlackEnabled = true
        }
        this.board.state.inputEnabled = true
        this.moveInputCallback = eventHandler
        this.setCursor()
    }

    disableMoveInput() {
        this.board.state.inputWhiteEnabled = false
        this.board.state.inputBlackEnabled = false
        this.board.state.inputEnabled = false
        this.moveInputCallback = undefined
        this.setCursor()
    }

    // callbacks //

    moveStartCallback(index) {
        if (this.moveInputCallback) {
            return this.moveInputCallback({
                board: this.board,
                type: INPUT_EVENT_TYPE.moveStart,
                square: SQUARE_COORDINATES[index]
            })
        } else {
            return true
        }
    }

    moveDoneCallback(fromIndex, toIndex) {
        if (this.moveInputCallback) {
            return this.moveInputCallback({
                board: this.board,
                type: INPUT_EVENT_TYPE.moveDone,
                squareFrom: SQUARE_COORDINATES[fromIndex],
                squareTo: SQUARE_COORDINATES[toIndex]
            })
        } else {
            return true
        }
    }

    moveCanceledCallback(reason, index) {
        if (this.moveInputCallback) {
            this.moveInputCallback({
                board: this.board,
                type: INPUT_EVENT_TYPE.moveCanceled,
                reason: reason,
                square: index ? SQUARE_COORDINATES[index] : undefined
            })
        }
    }

    // Helpers //

    setCursor() {
        if (this.board.state) { // fix https://github.com/shaack/cm-chessboard/issues/47
            if (this.board.state.inputWhiteEnabled || this.board.state.inputBlackEnabled || this.board.state.squareSelectEnabled) {
                this.boardGroup.setAttribute("class", "board input-enabled")
            } else {
                this.boardGroup.setAttribute("class", "board")
            }
        }
    }

    squareIndexToPoint(index) {
        let x, y
        if (this.board.state.orientation === COLOR.white) {
            x = this.borderSize + (index % this.columns) * this.squareWidth
            y = this.borderSize + (this.rows - 1 - Math.floor(index / this.columns)) * this.squareHeight
        } else {
            x = this.borderSize + (this.columns - 1 - index % this.columns) * this.squareWidth
            y = this.borderSize + (Math.floor(index / this.columns)) * this.squareHeight
        }
        return {x: x, y: y}
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
     * @returns {Element}
     */
    static addElement(parent, name, attributes) {
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
        parent.appendChild(element)
        return element
    }

    /**
     * Remove an Element from a SVG DOM
     * @param element
     */
    static removeElement(element) {
        element.parentNode.removeChild(element)
    }

}
