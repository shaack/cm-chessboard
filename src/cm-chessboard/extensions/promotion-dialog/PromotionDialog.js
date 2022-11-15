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

    drawPieceButton(piece, point, callback) {
        const squareWidth = this.chessboard.view.squareWidth
        const squareHeight = this.chessboard.view.squareHeight
        Svg.addElement(this.promotionDialogGroup,
            "rect", {
                x: point.x, y: point.y, width: squareWidth, height: squareHeight,
                class: "promotion-dialog-button"
            })
        this.chessboard.view.drawPiece(this.promotionDialogGroup, piece, point)
    }

    redrawDialog() {
        const squareWidth = this.chessboard.view.squareWidth
        const squareHeight = this.chessboard.view.squareHeight
        const squareCenterPoint = this.chessboard.view.squareToPoint(this.state.square)
        squareCenterPoint.x = squareCenterPoint.x + squareWidth / 2
        squareCenterPoint.y = squareCenterPoint.y + squareHeight / 2
        while (this.promotionDialogGroup.firstChild) {
            this.promotionDialogGroup.removeChild(this.promotionDialogGroup.firstChild)
        }
        if(this.state.isShown) {
            Svg.addElement(this.promotionDialogGroup,
                "rect", {
                    x: squareCenterPoint.x, y: squareCenterPoint.y, width: squareWidth, height: squareHeight * 4,
                    class: "promotion-dialog"
                })
            this.drawPieceButton(PIECE[this.state.color + "q"], {x: squareCenterPoint.x, y: squareCenterPoint.y})
            this.drawPieceButton(PIECE[this.state.color + "r"], {x: squareCenterPoint.x, y: squareCenterPoint.y + squareHeight})
            this.drawPieceButton(PIECE[this.state.color + "b"], {x: squareCenterPoint.x, y: squareCenterPoint.y + squareHeight * 2})
            this.drawPieceButton(PIECE[this.state.color + "n"], {x: squareCenterPoint.x, y: squareCenterPoint.y + squareHeight * 3})
        }
    }

    promotionDialogOnClickPiece(event) {

    }

    showPromotionDialog(square, color, callback) {
        this.state.isShown = true
        this.state.square = square
        this.state.color = color
        this.state.callback = callback
        this.redrawDialog()
    }

}
