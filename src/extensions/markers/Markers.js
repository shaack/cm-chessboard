/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {Svg} from "../../lib/Svg.js"
import {INPUT_EVENT_TYPE} from "../../Chessboard.js"

export const MARKER_TYPE = {
    frame: {class: "marker-frame", slice: "markerFrame"},
    framePrimary: {class: "marker-frame-primary", slice: "markerFrame"},
    frameDanger: {class: "marker-frame-danger", slice: "markerFrame"},
    circle: {class: "marker-circle", slice: "markerCircle"},
    circlePrimary: {class: "marker-circle-primary", slice: "markerCircle"},
    circleDanger: {class: "marker-circle-danger", slice: "markerCircle"},
    circleDangerFilled: {class: "marker-circle-danger-filled", slice: "markerCircleFilled"},
    square: {class: "marker-square", slice: "markerSquare"},
    dot: {class: "marker-dot", slice: "markerDot", position: 'above'},
    bevel: {class: "marker-bevel", slice: "markerBevel"}
}

export class Markers extends Extension {

    /** @constructor */
    constructor(chessboard, props = {}) {
        super(chessboard)
        this.registerExtensionPoint(EXTENSION_POINT.afterRedrawBoard, () => {
            this.onRedrawBoard()
        })
        this.registerExtensionPoint(EXTENSION_POINT.destroy, () => {
            this.onDestroy()
        })
        this.props = {
            autoMarkers: MARKER_TYPE.frame, // set to `null` to disable autoMarkers
            sprite: "extensions/markers/markers.svg" // the sprite file of the markers
        }
        Object.assign(this.props, props)
        if (chessboard.props.assetsCache) {
            chessboard.view.cacheSpriteToDiv("cm-chessboard-markers", this.getSpriteUrl())
        }
        chessboard.addMarker = this.addMarker.bind(this)
        chessboard.getMarkers = this.getMarkers.bind(this)
        chessboard.removeMarkers = this.removeMarkers.bind(this)
        chessboard.addLegalMovesMarkers = this.addLegalMovesMarkers.bind(this)
        chessboard.removeLegalMovesMarkers = this.removeLegalMovesMarkers.bind(this)
        this.markerGroupDown = Svg.addElement(chessboard.view.markersLayer, "g", {class: "markers"})
        this.markerGroupUp = Svg.addElement(chessboard.view.markersTopLayer, "g", {class: "markers"})
        this.markers = []
        if (this.props.autoMarkers) {
            this.registerExtensionPoint(EXTENSION_POINT.moveInput, (event) => {
                this.drawAutoMarkers(event)
            })
        }
    }

    onDestroy() {
        this.markers.length = 0
        Svg.removeElement(this.markerGroupDown)
        Svg.removeElement(this.markerGroupUp)
        delete this.chessboard.addMarker
        delete this.chessboard.getMarkers
        delete this.chessboard.removeMarkers
        delete this.chessboard.addLegalMovesMarkers
        delete this.chessboard.removeLegalMovesMarkers
    }

    drawAutoMarkers(event) {
        if(event.type !== INPUT_EVENT_TYPE.moveInputFinished) {
            this.removeMarkers(this.props.autoMarkers)
        }
        if (event.type === INPUT_EVENT_TYPE.moveInputStarted &&
            !event.moveInputCallbackResult) {
            return
        }
        if (event.type === INPUT_EVENT_TYPE.moveInputStarted ||
            event.type === INPUT_EVENT_TYPE.movingOverSquare) {
            if (event.squareFrom) {
                this.addMarker(this.props.autoMarkers, event.squareFrom)
            }
            if (event.squareTo) {
                this.addMarker(this.props.autoMarkers, event.squareTo)
            }
        }
    }

    onRedrawBoard() {
        Svg.removeAllChildren(this.markerGroupUp)
        Svg.removeAllChildren(this.markerGroupDown)
        this.markers.forEach((marker) => {
            this.drawMarker(marker)
        })
    }

    addLegalMovesMarkers(moves) {
        this.batchUpdate = true
        try {
            for (const move of moves) {
                if (move.promotion && move.promotion !== "q") {
                    continue
                }
                if (this.chessboard.getPiece(move.to)) {
                    this.chessboard.addMarker(MARKER_TYPE.bevel, move.to)
                } else {
                    this.chessboard.addMarker(MARKER_TYPE.dot, move.to)
                }
            }
        } finally {
            this.batchUpdate = false
            this.onRedrawBoard()
        }
    }

    removeLegalMovesMarkers() {
        this.batchUpdate = true
        try {
            this.chessboard.removeMarkers(MARKER_TYPE.bevel)
            this.chessboard.removeMarkers(MARKER_TYPE.dot)
        } finally {
            this.batchUpdate = false
            this.onRedrawBoard()
        }
    }

    drawMarker(marker) {
        let markerGroup
        if (marker.type.position === 'above') {
            markerGroup = Svg.addElement(this.markerGroupUp, "g")
        } else {
            markerGroup = Svg.addElement(this.markerGroupDown, "g")
        }
        markerGroup.setAttribute("data-square", marker.square)
        const point = this.chessboard.view.squareToPoint(marker.square)
        const transform = (this.chessboard.view.svg.createSVGTransform())
        transform.setTranslate(point.x, point.y)
        markerGroup.transform.baseVal.appendItem(transform)
        const spriteUrl = this.chessboard.props.assetsCache ? "" : this.getSpriteUrl()
        const markerUse = Svg.addElement(markerGroup, "use",
            {href: `${spriteUrl}#${marker.type.slice}`, class: "marker " + marker.type.class})
        const transformScale = (this.chessboard.view.svg.createSVGTransform())
        transformScale.setScale(this.chessboard.view.scalingX, this.chessboard.view.scalingY)
        markerUse.transform.baseVal.appendItem(transformScale)
        return markerGroup
    }

    addMarker(type, square) {
        if (!type || typeof type !== "object" || !type.slice) {
            console.error("addMarker: invalid type", type)
            return
        }
        if (!square || typeof square !== "string") {
            console.error("addMarker: invalid square", square)
            return
        }
        this.markers.push(new Marker(square, type))
        if (!this.batchUpdate) {
            this.onRedrawBoard()
        }
    }

    getMarkers(type = undefined, square = undefined) {
        let markersFound = []
        this.markers.forEach((marker) => {
            if (marker.matches(square, type)) {
                markersFound.push(marker)
            }
        })
        return markersFound
    }

    removeMarkers(type = undefined, square = undefined) {
        this.markers = this.markers.filter((marker) => !marker.matches(square, type))
        if (!this.batchUpdate) {
            this.onRedrawBoard()
        }
    }

}

class Marker {
    constructor(square, type) {
        this.square = square
        this.type = type
    }

    matches(square = undefined, type = undefined) {
        if (!type && !square) {
            return true
        } else if (!type) {
            if (square === this.square) {
                return true
            }
        } else if (!square) {
            if (this.type === type) {
                return true
            }
        } else if (this.type === type && square === this.square) {
            return true
        }
        return false
    }
}
