/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension} from "../../model/Extension.js"

export class HtmlLayer extends Extension {
    /** @constructor */
    constructor(chessboard) {
        super(chessboard)
        chessboard.addHtmlLayer = this.addHtmlLayer.bind(this)
        chessboard.removeHtmlLayer = this.removeHtmlLayer.bind(this)
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
        return layer
    }
    removeHtmlLayer(layer) {
        this.chessboard.context.removeChild(layer)
    }
}
