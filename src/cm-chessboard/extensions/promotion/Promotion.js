/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {INPUT_EVENT_TYPE} from "../../Chessboard.js"

export class Promotion extends Extension {

    constructor(chessboard, props) {
        super(chessboard, props)
        this.registerExtensionPoint(EXTENSION_POINT.moveInput, this.onMoveInput)
    }

    onMoveInput(event) {
        if(event.type === INPUT_EVENT_TYPE.validateMoveInput) {
            console.log("976000", event)
            return false // todo show flashing marker and return move
        }
    }
}
