/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {COLOR, PIECE} from "../../Chessboard.js"
import {DomUtils, Svg} from "../../view/ChessboardView.js"

export class PromotionDialog extends Extension {

    constructor(chessboard, props) {
        super(chessboard, props)

        this.registerExtensionPoint(EXTENSION_POINT.redrawBoard, this.redrawDialog.bind(this))
        this.registerMethod("showPromotionDialog", this.showPromotionDialog)
        this.promotionDialogGroup = Svg.addElement(chessboard.view.markersTopLayer, "g", {class: "promotion-dialog-group"})
        DomUtils.delegate(this.promotionDialogGroup, "click", ".promotion-dialog-button",
            this.promotionDialogOnClickPiece.bind(this))
        this.state = {
            isShown: false,
            color: undefined,
            square: undefined,
            callback: undefined
        }

    }

    drawPieceButton(piece, point) {
        const squareWidth = this.chessboard.view.squareWidth
        const squareHeight = this.chessboard.view.squareHeight
        Svg.addElement(this.promotionDialogGroup,
            "rect", {
                x: point.x, y: point.y, width: squareWidth, height: squareHeight,
                class: "promotion-dialog-button",
                "data-piece": piece
            })
        this.chessboard.view.drawPiece(this.promotionDialogGroup, piece, point)
    }

    redrawDialog() {
        if (!this.state.square) {
            return
        }
        clearTimeout(this.redrawDialogDebounce)
        this.redrawDialogDebounce = setTimeout(() => {
            const squareWidth = this.chessboard.view.squareWidth
            const squareHeight = this.chessboard.view.squareHeight
            const squareCenterPoint = this.chessboard.view.squareToPoint(this.state.square)
            squareCenterPoint.x = squareCenterPoint.x + squareWidth / 2
            squareCenterPoint.y = squareCenterPoint.y + squareHeight / 2
            while (this.promotionDialogGroup.firstChild) {
                this.promotionDialogGroup.removeChild(this.promotionDialogGroup.firstChild)
            }
            if (this.state.isShown) {
                let turned = false
                const rank = parseInt(this.state.square.charAt(1), 10)
                if (this.chessboard.getOrientation() === COLOR.white && rank < 5 ||
                    this.chessboard.getOrientation() === COLOR.black && rank >= 5) {
                    turned = true
                }
                const offsetY = turned ? -4 * squareHeight : 0
                const offsetX = squareCenterPoint.x + squareWidth > this.chessboard.view.width ? -squareWidth : 0
                Svg.addElement(this.promotionDialogGroup,
                    "rect", {
                        x: squareCenterPoint.x + offsetX,
                        y: squareCenterPoint.y + offsetY,
                        width: squareWidth,
                        height: squareHeight * 4,
                        class: "promotion-dialog"
                    })
                if (turned) {
                    this.drawPieceButton(PIECE[this.state.color + "q"], {
                        x: squareCenterPoint.x + offsetX,
                        y: squareCenterPoint.y - squareHeight
                    })
                    this.drawPieceButton(PIECE[this.state.color + "r"], {
                        x: squareCenterPoint.x + offsetX,
                        y: squareCenterPoint.y - squareHeight * 2
                    })
                    this.drawPieceButton(PIECE[this.state.color + "b"], {
                        x: squareCenterPoint.x + offsetX,
                        y: squareCenterPoint.y - squareHeight * 3
                    })
                    this.drawPieceButton(PIECE[this.state.color + "n"], {
                        x: squareCenterPoint.x + offsetX,
                        y: squareCenterPoint.y - squareHeight * 4
                    })
                } else {
                    this.drawPieceButton(PIECE[this.state.color + "q"], {
                        x: squareCenterPoint.x + offsetX,
                        y: squareCenterPoint.y
                    })
                    this.drawPieceButton(PIECE[this.state.color + "r"], {
                        x: squareCenterPoint.x + offsetX,
                        y: squareCenterPoint.y + squareHeight
                    })
                    this.drawPieceButton(PIECE[this.state.color + "b"], {
                        x: squareCenterPoint.x + offsetX,
                        y: squareCenterPoint.y + squareHeight * 2
                    })
                    this.drawPieceButton(PIECE[this.state.color + "n"], {
                        x: squareCenterPoint.x + offsetX,
                        y: squareCenterPoint.y + squareHeight * 3
                    })
                }
            }
        }, 200)
    }

    promotionDialogOnClickPiece(event) {
        this.state.callback({square: this.state.square, piece: event.target.dataset.piece})
        this.state.isShown = false
        this.redrawDialog()
    }

    showPromotionDialog(square, color, callback) {
        this.state.isShown = true
        this.state.square = square
        this.state.color = color
        this.state.callback = callback
        this.redrawDialog()
    }

}
