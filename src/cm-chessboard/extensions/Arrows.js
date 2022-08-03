/**
 * Author and copyright: Barak Michener (@barakmich)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {Extension, EXTENSION_POINT} from "../model/Extension.js"
import {Svg} from "../view/ChessboardView.js"

export const ARROW_TYPE = {
    default: {class: "arrow-default", slice: "arrowDefault", headSize: 5 },
    pointy: {class: "arrow-pointy", slice: "arrowPointy", headSize: 5.5 },
}

export class Arrows extends Extension {
  constructor(chessboard, props) {
    super(chessboard, props)
    this.registerExtensionPoint(EXTENSION_POINT.redrawBoard, () => {
      this.onRedrawBoard()
    })
    let defaultProps = {
      sprite: {
        url: "./assets/images/chessboard-arrows.svg",
        size: 40,
        cache: true,
      },
      overPieces: true,
    }
    this.props = {}
    Object.assign(this.props, defaultProps)
    Object.assign(this.props, props)
    if (this.props.sprite.cache) {
      this.chessboard.view.cacheSpriteToDiv("chessboardArrowSpriteCache", this.props.sprite.url)
    }
    this.registerMethod("addArrow", this.addArrow)
    this.registerMethod("getArrows", this.getArrows)
    this.registerMethod("removeArrows", this.removeArrows)
    if (this.props.overPieces) {
      this.arrowGroup = Svg.addElement(chessboard.view.piecesLayer, "g", {class: "arrows"})
    } else {
      this.arrowGroup = Svg.addElement(chessboard.view.markersLayer, "g", {class: "arrows"})
    }
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
    const arrowsGroup = Svg.addElement(this.arrowGroup, "g")
    arrowsGroup.setAttribute("data-arrow", arrow.from + arrow.to)
    arrowsGroup.setAttribute("class", "arrow " + arrow.type.class)

    const sqfrom = document.querySelectorAll('[data-square="' + arrow.from + '"]')[0];
    const sqto = document.querySelectorAll('[data-square="' + arrow.to + '"]')[0];
    const spriteUrl = this.chessboard.props.sprite.cache ? "" : this.chessboard.props.sprite.url;
    const defs = Svg.addElement(arrowsGroup, "defs")
    const id = "arrow-" + arrow.from + arrow.to;
    const marker = Svg.addElement(defs, "marker", {
      id: id,
      markerWidth: arrow.type.headSize,
      markerHeight: arrow.type.headSize,
      //markerUnits: "userSpaceOnUse",
      refX: 20,
      refY: 20,
      viewBox: "0 0 40 40",
      orient: "auto",
      class: "arrow-head",
    })

    const use = Svg.addElement(marker, "use", {
      href: `${spriteUrl}#${arrow.type.slice}`,
    })

    const x1 = sqfrom.x.baseVal.value + (sqfrom.width.baseVal.value / 2);
    const x2 = sqto.x.baseVal.value  + (sqto.width.baseVal.value / 2);
    const y1 = sqfrom.y.baseVal.value + (sqfrom.height.baseVal.value / 2);
    const y2 = sqto.y.baseVal.value + (sqto.height.baseVal.value / 2);


    let lineFill = Svg.addElement(arrowsGroup, "line")
    lineFill.setAttribute('x1', x1);
    lineFill.setAttribute('x2', x2);
    lineFill.setAttribute('y1', y1);
    lineFill.setAttribute('y2', y2);
    lineFill.setAttribute('class', 'arrow-line');
    lineFill.setAttribute("marker-end", "url(#"+id+")");

  }

  addArrow(from, to, type) {
    console.log(this)
    this.arrows.push(new Arrow(from, to, type))
    this.chessboard.view.redrawBoard()
  }

  getArrows(from = undefined, to = undefined, type = undefined) {
    let arrows = []
    this.arrows.forEach((arrow) =>  {
      if (arrow.matches(from, to, type)) {
        arrows.push(arrow)
      }
    })
    return arrows
  }

  removeArrows(from = undefined, to = undefined, type = undefined) {
    this.arrows = this.arrows.filter((arrow) => !arrow.matches(from, to, type))
  }
}

class Arrow {
  constructor(from, to, type) {
    this.from = from
    this.to = to
    this.type = type
  }

  matches(from = undefined, to = undefined, type = undefined) {
      if (from && from != this.from) {
        return false
      }
      if (to && to != this.to) {
        return false
      }
      if (type && type != this.type) {
        return false
      }
      return true
  }
}
