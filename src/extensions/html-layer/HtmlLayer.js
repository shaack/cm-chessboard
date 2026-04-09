/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"

export class HtmlLayer extends Extension {
    /** @constructor */
    constructor(chessboard, props = {}) {
        super(chessboard)
        this.props = props
        this.layers = []
        chessboard.addHtmlLayer = this.addHtmlLayer.bind(this)
        chessboard.removeHtmlLayer = this.removeHtmlLayer.bind(this)
        this.registerExtensionPoint(EXTENSION_POINT.destroy, () => {
            this.onDestroy()
        })
    }

    addHtmlLayer(html) {
        const layer = document.createElement("div")
        this.chessboard.context.appendChild(layer)
        this.chessboard.context.style.position = "relative"
        layer.classList.add("html-layer")
        layer.style.position = "absolute"
        layer.style.top = "0"
        layer.style.left = "0"
        layer.style.bottom = "0"
        layer.style.right = "0"
        layer.innerHTML = html
        this.layers.push(layer)
        return layer
    }

    removeHtmlLayer(layer) {
        const index = this.layers.indexOf(layer)
        if (index === -1) {
            console.warn("HtmlLayer: removeHtmlLayer called with unknown layer")
            return
        }
        this.layers.splice(index, 1)
        if (layer.parentNode === this.chessboard.context) {
            this.chessboard.context.removeChild(layer)
        }
    }

    onDestroy() {
        for (const layer of this.layers) {
            if (layer.parentNode) {
                layer.parentNode.removeChild(layer)
            }
        }
        this.layers.length = 0
        delete this.chessboard.addHtmlLayer
        delete this.chessboard.removeHtmlLayer
    }
}
