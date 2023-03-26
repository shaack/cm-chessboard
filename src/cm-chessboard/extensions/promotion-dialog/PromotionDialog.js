/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {COLOR, PIECE} from "../../Chessboard.js"
import {Svg} from "../../lib/Svg.js"
import {Utils} from "../../lib/Utils.js"
import {ANIMATION_EVENT_TYPE} from "../../view/PositionAnimationsQueue.js"

const DISPLAY_STATE = {
    hidden: "hidden",
    displayRequested: "displayRequested",
    shown: "shown"
}

export class PromotionDialog extends Extension {

    constructor(chessboard, props = {}) {
        super(chessboard, props)
        this.registerExtensionPoint(EXTENSION_POINT.redrawBoard, this.onRedrawBoard.bind(this))
        this.registerExtensionPoint(EXTENSION_POINT.animation, this.onAnimation.bind(this))
        this.registerMethod("showPromotionDialog", this.showPromotionDialog)
        this.promotionDialogGroup = Svg.addElement(chessboard.view.markersTopLayer, "g", {class: "promotion-dialog-group"})
        Utils.delegate(this.promotionDialogGroup, "click", ".promotion-dialog-button",
            this.promotionDialogOnClickPiece.bind(this))
        this.state = {
            displayState: DISPLAY_STATE.hidden,
            dialogParams: {
                square: undefined,
                color: undefined,
                callback: undefined
            }
        }
    }

    // public (registerMethod)
    showPromotionDialog(square, color, callback) {
        this.state.dialogParams.square = square
        this.state.dialogParams.color = color
        this.state.dialogParams.callback = callback
        this.setDisplayState(DISPLAY_STATE.displayRequested)
    }

    // private
    // on EXTENSION_POINT.redrawBoard
    onRedrawBoard() {
        this.redrawDialog()
    }

    // on EXTENSION_POINT.animation
    onAnimation(event) {
        if (event.type === ANIMATION_EVENT_TYPE.end) {
            if (this.state.displayState === DISPLAY_STATE.displayRequested) {
                this.setDisplayState(DISPLAY_STATE.shown)
            }
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
        while (this.promotionDialogGroup.firstChild) {
            this.promotionDialogGroup.removeChild(this.promotionDialogGroup.firstChild)
        }
        if (this.state.displayState === DISPLAY_STATE.shown) {
            const squareWidth = this.chessboard.view.squareWidth
            const squareHeight = this.chessboard.view.squareHeight
            const squareCenterPoint = this.chessboard.view.squareToPoint(this.state.dialogParams.square)
            squareCenterPoint.x = squareCenterPoint.x + squareWidth / 2
            squareCenterPoint.y = squareCenterPoint.y + squareHeight / 2
            let turned = false
            const rank = parseInt(this.state.dialogParams.square.charAt(1), 10)
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
            const dialogParams = this.state.dialogParams
            if (turned) {
                this.drawPieceButton(PIECE[dialogParams.color + "q"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y - squareHeight
                })
                this.drawPieceButton(PIECE[dialogParams.color + "r"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y - squareHeight * 2
                })
                this.drawPieceButton(PIECE[dialogParams.color + "b"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y - squareHeight * 3
                })
                this.drawPieceButton(PIECE[dialogParams.color + "n"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y - squareHeight * 4
                })
            } else {
                this.drawPieceButton(PIECE[dialogParams.color + "q"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y
                })
                this.drawPieceButton(PIECE[dialogParams.color + "r"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y + squareHeight
                })
                this.drawPieceButton(PIECE[dialogParams.color + "b"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y + squareHeight * 2
                })
                this.drawPieceButton(PIECE[dialogParams.color + "n"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y + squareHeight * 3
                })
            }
        }
    }

    promotionDialogOnClickPiece(event) {
        this.state.isShown = false
        this.chessboard.disableSquareSelect()
        this.state.callback({square: this.state.square, piece: event.target.dataset.piece})
    }

    setDisplayState(displayState) {
        console.log("displayState", displayState)
        this.state.displayState = displayState
        this.redrawDialog()
    }

}
