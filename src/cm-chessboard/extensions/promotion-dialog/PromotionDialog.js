/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {INPUT_EVENT_TYPE, PIECE} from "../../Chessboard.js"
import {Svg} from "../../view/ChessboardView.js"

export class PromotionDialog extends Extension {

    constructor(chessboard, props) {
        super(chessboard, props)

        this.registerExtensionPoint(EXTENSION_POINT.redrawBoard, this.drawDialog.bind(this))
        this.registerMethod("showPromotionDialog", this.showPromotionDialog)
        this.promotionDialogGroup = Svg.addElement(chessboard.view.markersTopLayer, "g", {class: "promotion-dialog-group"})

        this.drawDialog()
    }

    drawDialog() {
        const squareWidth = this.chessboard.view.squareWidth
        const squareHeight = this.chessboard.view.squareHeight * 4
        if(this.promotionDialog) {
            this.promotionDialogGroup.removeChild(this.promotionDialog)
        }
        this.promotionDialog = Svg.addElement(this.promotionDialogGroup,
            "rect", {
                x: "40", y: "40", width: squareWidth, height: squareHeight,
                class: "promotion-dialog"
            })

    }

    showPromotionDialog(square, color, callback) {
        return new Promise((resolve, reject) => {

        })
    }

}
