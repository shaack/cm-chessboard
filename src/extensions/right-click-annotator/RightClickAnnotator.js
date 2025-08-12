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
import {Arrows} from "../arrows/Arrows.js"
import {Markers} from "../markers/Markers.js"
import {Svg} from "../../lib/Svg.js"

export const ARROW_TYPE = {
    success: { class: "arrow-success"},
    warning: { class: "arrow-warning"},
    info: { class: "arrow-info"},
    danger: { class: "arrow-danger"}
}

export const MARKER_TYPE = {
    success: {class: "marker-circle-success", slice: "markerCircle"},
    warning: {class: "marker-circle-warning", slice: "markerCircle"},
    info: {class: "marker-circle-info", slice: "markerCircle"},
    danger: {class: "marker-circle-danger", slice: "markerCircle"},
}

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
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)

        this.dragStart = undefined // {square, modifiers}
        this.previewActiveTo = undefined // cache last to-square for preview

        this.chessboard.context.addEventListener("contextmenu", this.onContextMenu)
        this.chessboard.context.addEventListener("mousedown", this.onMouseDown)
        this.chessboard.context.addEventListener("mousemove", this.onMouseMove)
        this.chessboard.context.addEventListener("mouseup", this.onMouseUp)
        this.chessboard.context.addEventListener("mouseleave", this.onMouseUp)

        this.registerExtensionPoint(EXTENSION_POINT.destroy, () => {
            this.chessboard.context.removeEventListener("contextmenu", this.onContextMenu)
            this.chessboard.context.removeEventListener("mousedown", this.onMouseDown)
            this.chessboard.context.removeEventListener("mousemove", this.onMouseMove)
            this.chessboard.context.removeEventListener("mouseup", this.onMouseUp)
            this.chessboard.context.removeEventListener("mouseleave", this.onMouseUp)
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
        // clear preview regardless of button, but only act on right-button release
        this.removePreviewArrow()
        const start = this.dragStart
        this.dragStart = undefined
        if (!start || event.button !== 2) {
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
                this.chessboard.removeArrows(undefined, start.square, endSquare)
                this.chessboard.addArrow(arrowType, start.square, endSquare)
            }
        } else if (start.square) {
            // toggle marker on start square
            const existingMarkers = this.chessboard.getMarkers(circleType, start.square)
            if (existingMarkers && existingMarkers.length > 0) {
                this.chessboard.removeMarkers(circleType, start.square)
            } else {
                this.chessboard.removeMarkers(undefined, start.square)
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

    onMouseMove(event) {
        if (!this.dragStart) {
            return
        }
        // Only show preview for right-button drag if still pressed (best-effort); some browsers may not keep buttons state reliably
        // We rely mainly on our dragStart flag and clear on mouseup/mouseleave
        const toSquare = this.findSquareFromEvent(event)
        if (!toSquare || toSquare === this.dragStart.square) {
            return
        }
        if (this.previewActiveTo === toSquare) {
            return // no change
        }
        this.previewActiveTo = toSquare
        const colorKey = this.modifiersToColorKey(this.dragStart.modifiers)
        const {arrowType} = this.typesForColorKey(colorKey)
        this.drawPreviewArrow(this.dragStart.square, toSquare, arrowType)
    }

    drawPreviewArrow(from, to, type) {
        if(!this.previewArrowType) {
            this.previewArrowType = {...type}
        }
        this.chessboard.removeArrows(this.previewArrowType)
        this.chessboard.addArrow(this.previewArrowType, from, to)
    }

    removePreviewArrow() {
        if(this.previewArrowType) {
            this.chessboard.removeArrows(this.previewArrowType)
            this.previewArrowType = undefined
        }
    }

    modifiersToColorKey(modifiers) {
        if (modifiers.shift && modifiers.alt) return "warning"
        if (modifiers.shift) return "danger"
        if (modifiers.alt) return "info"
        return "success"
    }

    typesForColorKey(colorKey) {
        switch (colorKey) {
            case "info":
                return {arrowType: ARROW_TYPE.info, circleType: MARKER_TYPE.info}
            case "danger":
                return {arrowType: ARROW_TYPE.danger, circleType: MARKER_TYPE.danger}
            case "warning":
                return {arrowType: ARROW_TYPE.warning, circleType: MARKER_TYPE.warning}
            case "success":
            default:
                return {arrowType: ARROW_TYPE.success, circleType: MARKER_TYPE.success}
        }
    }
}
