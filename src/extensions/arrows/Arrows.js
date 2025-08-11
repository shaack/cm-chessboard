/**
 * Authors and copyright: Barak Michener (@barakmich) and Stefan Haack (@shaack)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {Svg} from "../../lib/Svg.js"
import {Utils} from "../../lib/Utils.js"

export const ARROW_TYPE = {
    default: {class: "arrow-default", slice: "arrowDefault", headSize: 7},
    danger: {class: "arrow-danger", slice: "arrowDefault", headSize: 7},
    pointy: {class: "arrow-pointy", slice: "arrowPointy", headSize: 7},
}

export class Arrows extends Extension {

    /** @constructor */
    constructor(chessboard, props = {}) {
        super(chessboard)
        this.registerExtensionPoint(EXTENSION_POINT.afterRedrawBoard, () => {
            this.onRedrawBoard()
        })
        this.props = {
            sprite: "extensions/arrows/arrows.svg",
            // offset factors relative to half the square size (0.0 .. 1.0)
            // 0.0 = start/end in the center; 1.0 = at the outer edge of the inscribed circle (half the square)
            // default chosen to preserve previous appearance where radius = 0.36 * min(squareWidth, squareHeight)
            // which corresponds to 0.72 of half the square size (0.36 / 0.5 = 0.72)
            offsetFrom: 0,
            offsetTo: 0.72
        }
        Object.assign(this.props, props)
        if (this.chessboard.props.assetsCache) {
            this.chessboard.view.cacheSpriteToDiv("cm-chessboard-arrows", this.getSpriteUrl())
        }
        chessboard.addArrow = this.addArrow.bind(this)
        chessboard.getArrows = this.getArrows.bind(this)
        chessboard.removeArrows = this.removeArrows.bind(this)
        this.arrowGroup = Svg.addElement(chessboard.view.markersTopLayer, "g", {class: "arrows"})
        this.arrows = []
    }

    onRedrawBoard() {
        while (this.arrowGroup.firstChild) {
            this.arrowGroup.removeChild(this.arrowGroup.firstChild)
        }
        this.arrows.forEach((arrow) => {
            this.drawArrow(arrow)
        })
    }

    drawArrow(arrow) {
        const view = this.chessboard.view
        const arrowsGroup = Svg.addElement(this.arrowGroup, "g")
        arrowsGroup.setAttribute("data-arrow", arrow.from + arrow.to)
        arrowsGroup.setAttribute("class", "arrow " + arrow.type.class)
        const ptFrom = view.squareToPoint(arrow.from)
        const ptTo = view.squareToPoint(arrow.to)
        const spriteUrl = this.chessboard.props.assetsCache ? "" : this.getSpriteUrl()
        const defs = Svg.addElement(arrowsGroup, "defs")
        const id = "arrow-" + arrow.from + arrow.to
        const marker = Svg.addElement(defs, "marker", {
            id: id,
            markerWidth: arrow.type.headSize,
            markerHeight: arrow.type.headSize,
            refX: 20,
            refY: 20,
            viewBox: "0 0 40 40",
            orient: "auto",
            class: "arrow-head",
        })

        Svg.addElement(marker, "use", {
            href: `${spriteUrl}#${arrow.type.slice}`,
        })

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
        // compute radii from props: factor relative to half of the square size
        const halfMin = Math.min(view.squareWidth, view.squareHeight) / 2
        const clamp01 = (v) => Math.max(0, Math.min(1, v))
        const rFrom = halfMin * clamp01(this.props.offsetFrom)
        const rTo = halfMin * clamp01(this.props.offsetTo)
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

    addArrow(type, from, to) {
        this.arrows.push(new Arrow(from, to, type))
        this.chessboard.view.redrawBoard()
    }

    getArrows(type = undefined, from = undefined, to = undefined) {
        let arrows = []
        this.arrows.forEach((arrow) => {
            if (arrow.matches(from, to, type)) {
                arrows.push(arrow)
            }
        })
        return arrows
    }

    removeArrows(type = undefined, from = undefined, to = undefined) {
        this.arrows = this.arrows.filter((arrow) => !arrow.matches(from, to, type))
        this.chessboard.view.redrawBoard()
    }

    getSpriteUrl() {
        if(Utils.isAbsoluteUrl(this.props.sprite)) {
            return this.props.sprite
        } else {
            return this.chessboard.props.assetsUrl + this.props.sprite
        }
    }
}

class Arrow {
    constructor(from, to, type) {
        this.from = from
        this.to = to
        this.type = type
    }

    matches(from = undefined, to = undefined, type = undefined) {
        if (from && from !== this.from) {
            return false
        }
        if (to && to !== this.to) {
            return false
        }
        return !(type && type !== this.type)
    }
}
