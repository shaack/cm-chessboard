/**
 * Extension: RightClickAnnotator
 * Combines Arrows and Markers to draw/toggle arrows and circle markers with right-click + modifiers.
 * Colors:
 * - Green: Right-click
 * - Blue: Alt + Right-click
 * - Red: Shift + Right-click
 * - Orange: Shift + Alt + Right-click
 * Redrawing the same arrow or marker removes it.
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {Arrows, ARROW_TYPE} from "../arrows/Arrows.js"
import {Markers, MARKER_TYPE} from "../markers/Markers.js"

// Define persistent type objects for matching (strict equality used in core extensions)
const ARROW_GREEN = {class: "arrow-green", slice: "arrowDefault", headSize: 7}
const ARROW_ORANGE = {class: "arrow-orange", slice: "arrowDefault", headSize: 7}

const CIRCLE_GREEN = {class: "marker-circle-green", slice: "markerCircle"}
const CIRCLE_ORANGE = {class: "marker-circle-orange", slice: "markerCircle"}

export class RightClickAnnotator extends Extension {
    constructor(chessboard, props = {}) {
        super(chessboard)
        this.props = props || {}

        // Ensure Arrows and Markers extensions are available
        if (!this.chessboard.getExtension(Arrows)) {
            this.chessboard.addExtension(Arrows)
        }
        if (!this.chessboard.getExtension(Markers)) {
            this.chessboard.addExtension(Markers)
        }

        this.onContextMenu = this.onContextMenu.bind(this)
        this.onMouseDown = this.onMouseDown.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)

        this.dragStart = undefined // {square, modifiers}

        this.chessboard.context.addEventListener("contextmenu", this.onContextMenu)
        this.chessboard.context.addEventListener("mousedown", this.onMouseDown)
        this.chessboard.context.addEventListener("mouseup", this.onMouseUp)

        this.registerExtensionPoint(EXTENSION_POINT.destroy, () => {
            this.chessboard.context.removeEventListener("contextmenu", this.onContextMenu)
            this.chessboard.context.removeEventListener("mousedown", this.onMouseDown)
            this.chessboard.context.removeEventListener("mouseup", this.onMouseUp)
        })
    }

    onContextMenu(event) {
        // prevent default context menu on chessboard
        event.preventDefault()
    }

    onMouseDown(event) {
        // right button only
        if (event.button !== 2) {
            return
        }
        const square = this.findSquareFromEvent(event)
        if (!square) {
            return
        }
        this.dragStart = {
            square,
            modifiers: {
                alt: event.altKey,
                shift: event.shiftKey
            }
        }
    }

    onMouseUp(event) {
        if (event.button !== 2) {
            return
        }
        const start = this.dragStart
        this.dragStart = undefined
        if (!start) {
            return
        }
        const endSquare = this.findSquareFromEvent(event) || start.square
        const colorKey = this.modifiersToColorKey(start.modifiers)
        const {arrowType, circleType} = this.typesForColorKey(colorKey)

        if (start.square && endSquare && start.square !== endSquare) {
            // toggle arrow
            const existing = this.chessboard.getArrows(arrowType, start.square, endSquare)
            if (existing && existing.length > 0) {
                this.chessboard.removeArrows(arrowType, start.square, endSquare)
            } else {
                this.chessboard.addArrow(arrowType, start.square, endSquare)
            }
        } else if (start.square) {
            // toggle marker on start square
            const existingMarkers = this.chessboard.getMarkers(circleType, start.square)
            if (existingMarkers && existingMarkers.length > 0) {
                this.chessboard.removeMarkers(circleType, start.square)
            } else {
                this.chessboard.addMarker(circleType, start.square)
            }
        }
    }

    findSquareFromEvent(event) {
        const target = /** @type {HTMLElement} */(event.target)
        if (!target) return undefined
        if (target.getAttribute && target.getAttribute("data-square")) {
            return target.getAttribute("data-square")
        }
        const el = target.closest && target.closest("[data-square]")
        return el ? el.getAttribute("data-square") : undefined
    }

    modifiersToColorKey(modifiers) {
        if (modifiers.shift && modifiers.alt) return "orange"
        if (modifiers.shift) return "red"
        if (modifiers.alt) return "blue"
        return "green"
    }

    typesForColorKey(colorKey) {
        switch (colorKey) {
            case "blue":
                return {arrowType: ARROW_TYPE.default, circleType: MARKER_TYPE.circlePrimary}
            case "red":
                return {arrowType: ARROW_TYPE.danger, circleType: MARKER_TYPE.circleDanger}
            case "orange":
                return {arrowType: ARROW_ORANGE, circleType: CIRCLE_ORANGE}
            case "green":
            default:
                return {arrowType: ARROW_GREEN, circleType: CIRCLE_GREEN}
        }
    }
}
