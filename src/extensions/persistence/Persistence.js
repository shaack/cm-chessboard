/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js";

export class Persistence extends Extension {
    constructor(chessboard, props) {
        super(chessboard)
        console.warn("The Persistence extension is work in progress, don't use it in production.")
        this.props = props
        this.registerExtensionPoint(EXTENSION_POINT.positionChanged, this.savePosition.bind(this))
        this.loadPosition()
    }

    savePosition() {
        localStorage.setItem("chessboard", JSON.stringify(this.chessboard.getPosition()))
    }

    loadPosition() {
        const position = localStorage.getItem("chessboard")
        if (position) {
            this.chessboard.setPosition(JSON.parse(position))
        } else {
            this.chessboard.setPosition(this.props.initialPosition)
        }
    }
}
