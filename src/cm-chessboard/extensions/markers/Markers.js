
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {Svg} from "../../view/ChessboardView.js"

export const MARKER_TYPE = {
	square: {class: "marker-square", slice: "markerSquare", position: 'down'},
	frame: {class: "marker-frame", slice: "markerFrame", position: 'down'},
	dot: {class: "marker-dot", slice: "markerDot", position: 'up'},
	circle: {class: "marker-circle", slice: "markerCircle", position: 'down'}
}

export class Markers extends Extension {
	constructor(chessboard, props) {
		super(chessboard, props)
		this.registerExtensionPoint(EXTENSION_POINT.redrawBoard, () => {
			this.onRedrawBoard()
		})
		let defaultProps = {
			style: {
				moveFromMarker: MARKER_TYPE.frame, // the marker used to mark the start square
				moveToMarker: MARKER_TYPE.frame, // the marker used to mark the square where the figure is moving to
			},
			sprite: {
				url: "./assets/images/chessboard-sprite.svg", // pieces and markers are stored in a sprite file
				size: 40, // the sprite tiles size, defaults to 40x40px
				cache: true // cache the sprite
			},
		}
		this.props = {}
		Object.assign(this.props, defaultProps)
		Object.assign(this.props, props)
		this.props.sprite = defaultProps.sprite
		if (props.sprite) {
			Object.assign(this.props.sprite, props.sprite)
		}
		if (this.props.sprite.cache) {
			this.chessboard.view.cacheSpriteToDiv("chessboardMarkerSpriteCache", this.props.sprite.url)
		}
		this.registerMethod("addMarker", this.addMarker)
		this.registerMethod("getMarkers", this.getMarkers)
		this.registerMethod("removeMarkers", this.removeMarkers)
		this.markerGroupDown = Svg.addElement(chessboard.view.markersLayer, "g", {class: "markers"})
		this.markerGroupUp = Svg.addElement(chessboard.view.markersTopLayer, "g", {class: "markers"})
		this.markers = []
	}

	onRedrawBoard() {
		while (this.markerGroupUp.firstChild) {
			this.markerGroupUp.removeChild(this.markerGroupUp.firstChild)
		}
		while (this.markerGroupDown.firstChild) {
			this.markerGroupDown.removeChild(this.markerGroupDown.firstChild)
		}
		this.markers.forEach((marker) => {
				this.drawMarker(marker)
			}
		)
	}

	drawMarker(marker) {
		let markerGroup;
		if (marker.type.position === 'up') {
			markerGroup = Svg.addElement(this.markerGroupUp, "g")
		} else {
			markerGroup = Svg.addElement(this.markerGroupDown, "g")
		}
		markerGroup.setAttribute("data-square", marker.square)
		const point = this.chessboard.view.squareToPoint(marker.square)
		const transform = (this.chessboard.view.svg.createSVGTransform())
		transform.setTranslate(point.x, point.y)
		markerGroup.transform.baseVal.appendItem(transform)
		const spriteUrl = this.chessboard.props.sprite.cache ? "" : this.chessboard.props.sprite.url
		const markerUse = Svg.addElement(markerGroup, "use",
			{href: `${spriteUrl}#${marker.type.slice}`, class: "marker " + marker.type.class})
		const transformScale = (this.chessboard.view.svg.createSVGTransform())
		transformScale.setScale(this.chessboard.view.scalingX, this.chessboard.view.scalingY)
		markerUse.transform.baseVal.appendItem(transformScale)
		return markerGroup
	}

	addMarker(type, square) {
		if (typeof type === "string" || typeof square === "object") { // todo remove 2022-12-01
			console.error("changed the signature of `addMarker` to `(type, square)` with v5.1.x")
			return
		}
		this.markers.push(new Marker(square, type))
		this.onRedrawBoard()
	}

	getMarkers(type = undefined, square = undefined) {
		if (typeof type === "string" || typeof square === "object") { // todo remove 2022-12-01
			console.error("changed the signature of `getMarkers` to `(type, square)` with v5.1.x")
			return
		}
		let markersFound = []
		this.markers.forEach((marker) => {
			if (marker.matches(square, type)) {
				markersFound.push(marker)
			}
		})
		return markersFound
	}

	removeMarkers(type = undefined, square = undefined) {
		if (typeof type === "string" || typeof square === "object") { // todo remove 2022-12-01
			console.error("changed the signature of `removeMarkers` to `(type, square)` with v5.1.x")
			return
		}
		this.markers = this.markers.filter((marker) => !marker.matches(square, type))
		this.onRedrawBoard()
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