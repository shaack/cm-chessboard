/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"

export class AutoBorderNone extends Extension {
    constructor(chessboard, props = {}) {
        super(chessboard)
        this.props = {
            chessboardBorderType: chessboard.props.style.borderType,
            borderNoneBelow: 550 // pixels width of the board, where the border is set to none
        }
        Object.assign(this.props, props)
        this.registerExtensionPoint(EXTENSION_POINT.beforeRedrawBoard, this.extensionPointBeforeRedrawBoard.bind(this))
    }
    extensionPointBeforeRedrawBoard() {
        if(this.chessboard.view.width < this.props.borderNoneBelow){
            this.chessboard.props.style.borderType = "none"
        } else {
            this.chessboard.props.style.borderType = this.props.chessboardBorderType
        }
    }
}
