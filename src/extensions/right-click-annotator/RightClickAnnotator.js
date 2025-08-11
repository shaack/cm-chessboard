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
import {Svg} from "../../lib/Svg.js"

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
        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseUp = this.onMouseUp.bind(this)

        this.dragStart = undefined // {square, modifiers}
        this.previewGroup = undefined
        this.previewActiveTo = undefined // cache last to-square for preview

        this.chessboard.context.addEventListener("contextmenu", this.onContextMenu)
        this.chessboard.context.addEventListener("mousedown", this.onMouseDown)
        this.chessboard.context.addEventListener("mousemove", this.onMouseMove)
        this.chessboard.context.addEventListener("mouseup", this.onMouseUp)
        this.chessboard.context.addEventListener("mouseleave", this.onMouseUp)

        // ensure preview group exists after redraws
        this.registerExtensionPoint(EXTENSION_POINT.afterRedrawBoard, () => {
            this.ensurePreviewGroup()
        })

        this.registerExtensionPoint(EXTENSION_POINT.destroy, () => {
            this.chessboard.context.removeEventListener("contextmenu", this.onContextMenu)
            this.chessboard.context.removeEventListener("mousedown", this.onMouseDown)
            this.chessboard.context.removeEventListener("mousemove", this.onMouseMove)
            this.chessboard.context.removeEventListener("mouseup", this.onMouseUp)
            this.chessboard.context.removeEventListener("mouseleave", this.onMouseUp)
        })
        // create preview group now
        this.ensurePreviewGroup()
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
        const start = this.dragStart
        this.dragStart = undefined
        this.clearPreview()
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

    ensurePreviewGroup() {
        // create or reset preview group used for transient arrow drawing
        if (!this.chessboard?.view?.markersTopLayer) {
            return
        }
        if (this.previewGroup && this.previewGroup.parentNode) {
            // keep and clear existing
            this.clearPreview()
            return
        }
        this.previewGroup = Svg.addElement(this.chessboard.view.markersTopLayer, "g", {class: "right-click-annotator-preview"})
    }

    clearPreview() {
        if (!this.previewGroup) return
        while (this.previewGroup.firstChild) {
            this.previewGroup.removeChild(this.previewGroup.firstChild)
        }
        this.previewActiveTo = undefined
    }

    onMouseMove(event) {
        if (!this.dragStart) {
            return
        }
        // Only show preview for right-button drag if still pressed (best-effort); some browsers may not keep buttons state reliably
        // We rely mainly on our dragStart flag and clear on mouseup/mouseleave
        const toSquare = this.findSquareFromEvent(event)
        if (!toSquare || toSquare === this.dragStart.square) {
            this.clearPreview()
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
        this.ensurePreviewGroup()
        this.clearPreview()
        const view = this.chessboard.view
        const arrowsGroup = Svg.addElement(this.previewGroup, "g", {class: "arrow " + type.class})
        const ptFrom = view.squareToPoint(from)
        const ptTo = view.squareToPoint(to)
        const defs = Svg.addElement(arrowsGroup, "defs")
        const id = "arrow-preview-" + from + to
        const marker = Svg.addElement(defs, "marker", {
            id: id,
            markerWidth: type.headSize,
            markerHeight: type.headSize,
            refX: 20,
            refY: 20,
            viewBox: "0 0 40 40",
            orient: "auto",
            class: "arrow-head",
        })
        const spriteUrl = this.chessboard.props.assetsCache ? "" : this.chessboard.getExtension(Arrows)?.getSpriteUrl?.() || this.chessboard.props.assetsUrl + "extensions/arrows/arrows.svg"
        Svg.addElement(marker, "use", {href: `${spriteUrl}#${type.slice}`})
        // Compute centers of start and end squares
        const cx1 = ptFrom.x + view.squareWidth / 2
        const cy1 = ptFrom.y + view.squareHeight / 2
        const cx2 = ptTo.x + view.squareWidth / 2
        const cy2 = ptTo.y + view.squareHeight / 2

        // Offset the line so it starts/ends at the edge of an invisible circle inside each square
        const dx = cx2 - cx1
        const dy = cy2 - cy1
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len
        const uy = dy / len
        // get offsets from Arrows extension props to match final arrow rendering
        const arrowsExt = this.chessboard.getExtension(Arrows)
        const offsetFrom = arrowsExt?.props?.offsetFrom ?? 0.72
        const offsetTo = arrowsExt?.props?.offsetTo ?? 0.72
        const halfMin = Math.min(view.squareWidth, view.squareHeight) / 2
        const clamp01 = (v) => Math.max(0, Math.min(1, v))
        const rFrom = halfMin * clamp01(offsetFrom)
        const rTo = halfMin * clamp01(offsetTo)
        const x1 = cx1 + ux * rFrom
        const y1 = cy1 + uy * rFrom
        const x2 = cx2 - ux * rTo
        const y2 = cy2 - uy * rTo

        const width = ((view.scalingX + view.scalingY) / 2) * 4
        let lineFill = Svg.addElement(arrowsGroup, "line")
        lineFill.setAttribute('x1', x1.toString())
        lineFill.setAttribute('x2', x2.toString())
        lineFill.setAttribute('y1', y1.toString())
        lineFill.setAttribute('y2', y2.toString())
        lineFill.setAttribute('class', 'arrow-line')
        lineFill.setAttribute("marker-end", "url(#" + id + ")")
        lineFill.setAttribute('stroke-width', width + "px")
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
