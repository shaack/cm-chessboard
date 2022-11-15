/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {COLOR, INPUT_EVENT_TYPE, PIECE} from "../../Chessboard.js"
import {Svg} from "../../view/ChessboardView.js"

export class PromotionDialog extends Extension {

    constructor(chessboard, props) {
        super(chessboard, props)

        this.registerExtensionPoint(EXTENSION_POINT.redrawBoard, this.redrawDialog.bind(this))
        this.registerMethod("showPromotionDialog", this.showPromotionDialog)
        this.promotionDialogGroup = Svg.addElement(chessboard.view.markersTopLayer, "g", {class: "promotion-dialog-group"})
        this.state = {
            isShown: false,
            color: undefined,
            square: undefined,
            callback: undefined
        }

        this.showPromotionDialog("c8", COLOR.white, (event) => {
            console.log("showPromotionDialog.click", event)
        })
    }

    redrawDialog() {
        const squareWidth = this.chessboard.view.squareWidth
        const squareHeight = this.chessboard.view.squareHeight
        const view = this.chessboard.view
        const point = view.squareToPoint(this.state.square)
        while (this.promotionDialogGroup.firstChild) {
            this.promotionDialogGroup.removeChild(this.promotionDialogGroup.firstChild)
        }
        if(this.state.isShown) {
            this.promotionDialog = Svg.addElement(this.promotionDialogGroup,
                "rect", {
                    x: point.x + squareWidth / 2, y: point.y + squareHeight / 2, width: squareWidth, height: squareHeight * 4,
                    class: "promotion-dialog"
                })
            view.drawPiece(this.promotionDialogGroup, PIECE[this.state.color + "q"],
                {x: point.x + squareWidth / 2, y: point.y + squareHeight / 2}
            )
            view.drawPiece(this.promotionDialogGroup, PIECE[this.state.color + "r"],
                {x: point.x + squareWidth / 2, y: point.y + squareHeight / 2 + squareHeight}
            )
            view.drawPiece(this.promotionDialogGroup, PIECE[this.state.color + "b"],
                {x: point.x + squareWidth / 2, y: point.y + squareHeight / 2 + squareHeight * 2}
            )
            view.drawPiece(this.promotionDialogGroup, PIECE[this.state.color + "n"],
                {x: point.x + squareWidth / 2, y: point.y + squareHeight / 2 + squareHeight * 3}
            )
        }
    }

    showPromotionDialog(square, color, callback) {
        this.state.isShown = true
        this.state.square = square
        this.state.color = color
        this.state.callback = callback
        this.redrawDialog()
    }

}
