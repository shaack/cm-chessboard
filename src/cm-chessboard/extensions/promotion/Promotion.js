/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {INPUT_EVENT_TYPE, PIECE} from "../../Chessboard.js"

export class Promotion extends Extension {

    constructor(chessboard, props) {
        super(chessboard, props)
        this.registerExtensionPoint(EXTENSION_POINT.moveInput, this.onMoveInput.bind(this))
    }

    onMoveInput(event) {
        if(event.type === INPUT_EVENT_TYPE.validateMoveInput) {
            console.log(this)
            console.log("976000", event,
                this.chessboard.getPiece(event.squareFrom),
                this.chessboard.getPiece(event.squareTo))
            if(event.piece === PIECE.wp && event.squareTo.charAt(1) === "8") {
                return false
            }
        }
    }

    showPromotionDialog(event) {
        this.promotionDialog = document.createElement("div")
        this.promotionDialog.style.width = "50px"
        this.promotionDialog.style.height = "50px"
        this.promotionDialog.style.backgroundColor = "white"
        // this.chessboard.view.
    }

}
