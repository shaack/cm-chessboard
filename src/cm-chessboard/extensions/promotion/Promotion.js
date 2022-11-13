/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {INPUT_EVENT_TYPE, PIECE} from "../../Chessboard.js"
import {Svg} from "../../view/ChessboardView.js"

export class Promotion extends Extension {

    constructor(chessboard, props) {
        super(chessboard, props)
        // this.registerExtensionPoint(EXTENSION_POINT.moveInput, this.onMoveInput.bind(this))
        this.registerMethod("showPromotionDialog", this.showPromotionDialog)
        this.promotionDialogGroup = Svg.addElement(chessboard.view.markersTopLayer, "g", {class: "promotion-dialog-group"})
        this.drawDialog()
    }

    drawDialog() {
        this.promotionDialog = Svg.addElement(this.promotionDialogGroup,
            "rect", {
                x: "40", y: "40", width: "80", height: "80",
                class: "promotion-dialog"
            })
    }

    /*
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
    */
    showPromotionDialog(square) {
        return new Promise((resolve, reject) => {

        })
    }

}
