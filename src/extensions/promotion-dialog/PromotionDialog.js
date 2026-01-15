/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {COLOR, PIECE} from "../../Chessboard.js"
import {Svg} from "../../lib/Svg.js"
import {Utils} from "../../lib/Utils.js"

const DISPLAY_STATE = {
    hidden: "hidden",
    displayRequested: "displayRequested",
    shown: "shown"
}

const translations = {
    de: {
        choosePromotion: "Bauernumwandlung wählen",
        promotionDialogTitle: "Bauernumwandlung",
        pieces: {q: "Dame", r: "Turm", b: "Läufer", n: "Springer"},
        promoteTo: "Umwandeln in"
    },
    en: {
        choosePromotion: "Choose promotion piece",
        promotionDialogTitle: "Pawn promotion",
        pieces: {q: "Queen", r: "Rook", b: "Bishop", n: "Knight"},
        promoteTo: "Promote to"
    }
}

export const PROMOTION_DIALOG_RESULT_TYPE = {
    pieceSelected: "pieceSelected",
    canceled: "canceled"
}

export class PromotionDialog extends Extension {

    /** @constructor */
    constructor(chessboard, props = {}) {
        super(chessboard)
        this.props = {
            language: navigator.language.substring(0, 2).toLowerCase()
        }
        Object.assign(this.props, props)
        if (this.props.language !== "de" && this.props.language !== "en") {
            this.props.language = "en"
        }
        this.t = translations[this.props.language]
        this.pieceOrder = ["q", "r", "b", "n"]
        this.focusedIndex = 0
        this.previouslyFocusedElement = null

        this.registerExtensionPoint(EXTENSION_POINT.afterRedrawBoard, this.extensionPointRedrawBoard.bind(this))
        this.registerExtensionPoint(EXTENSION_POINT.destroy, this.destroy.bind(this))
        chessboard.showPromotionDialog = this.showPromotionDialog.bind(this)
        chessboard.isPromotionDialogShown = this.isPromotionDialogShown.bind(this)
        this.promotionDialogGroup = Svg.addElement(chessboard.view.interactiveTopLayer, "g", {
            class: "promotion-dialog-group",
            role: "dialog",
            "aria-modal": "true",
            "aria-label": this.t.choosePromotion
        })

        // Create live region for announcements
        this.liveRegion = document.createElement("div")
        this.liveRegion.setAttribute("aria-live", "polite")
        this.liveRegion.setAttribute("aria-atomic", "true")
        this.liveRegion.className = "cm-chessboard-promotion-live-region visually-hidden"
        this.liveRegion.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;"
        chessboard.context.appendChild(this.liveRegion)

        this.state = {
            displayState: DISPLAY_STATE.hidden,
            callback: null,
            dialogParams: {
                square: null,
                color: null
            }
        }

        // Bind keyboard handler
        this.handleKeyDown = this.handleKeyDown.bind(this)
    }

    // public (chessboard.showPromotionDialog)
    showPromotionDialog(square, color, callback) {
        this.previouslyFocusedElement = document.activeElement
        this.focusedIndex = 0
        this.state.dialogParams.square = square
        this.state.dialogParams.color = color
        this.state.callback = callback
        this.setDisplayState(DISPLAY_STATE.displayRequested)
        setTimeout(() => {
                this.chessboard.view.positionsAnimationTask.then(() => {
                    this.setDisplayState(DISPLAY_STATE.shown)
                    this.announce(this.t.choosePromotion + ": " +
                        this.pieceOrder.map(p => this.t.pieces[p]).join(", "))
                })
            }
        )
    }

    // public (chessboard.isPromotionDialogShown)
    isPromotionDialogShown() {
        return this.state.displayState === DISPLAY_STATE.shown ||
            this.state.displayState === DISPLAY_STATE.displayRequested
    }

    // private
    extensionPointRedrawBoard() {
        this.redrawDialog()
    }

    drawPieceButton(piece, point, index) {
        const squareWidth = this.chessboard.view.squareWidth
        const squareHeight = this.chessboard.view.squareHeight
        const pieceType = piece.charAt(1)
        const pieceName = this.t.pieces[pieceType]
        const buttonGroup = Svg.addElement(this.promotionDialogGroup, "g", {
            class: "promotion-dialog-button-group",
            role: "button",
            tabindex: index === 0 ? "0" : "-1",
            "aria-label": pieceName,
            "data-piece": piece,
            "data-index": index
        })
        Svg.addElement(buttonGroup,
            "rect", {
                x: point.x, y: point.y, width: squareWidth, height: squareHeight,
                class: "promotion-dialog-button",
                "data-piece": piece
            })
        this.chessboard.view.drawPiece(buttonGroup, piece, point)
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
            this.turned = false
            const rank = parseInt(this.state.dialogParams.square.charAt(1), 10)
            if (this.chessboard.getOrientation() === COLOR.white && rank < 5 ||
                this.chessboard.getOrientation() === COLOR.black && rank >= 5) {
                this.turned = true
            }
            const turned = this.turned
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
                }, 0)
                this.drawPieceButton(PIECE[dialogParams.color + "r"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y - squareHeight * 2
                }, 1)
                this.drawPieceButton(PIECE[dialogParams.color + "b"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y - squareHeight * 3
                }, 2)
                this.drawPieceButton(PIECE[dialogParams.color + "n"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y - squareHeight * 4
                }, 3)
            } else {
                this.drawPieceButton(PIECE[dialogParams.color + "q"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y
                }, 0)
                this.drawPieceButton(PIECE[dialogParams.color + "r"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y + squareHeight
                }, 1)
                this.drawPieceButton(PIECE[dialogParams.color + "b"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y + squareHeight * 2
                }, 2)
                this.drawPieceButton(PIECE[dialogParams.color + "n"], {
                    x: squareCenterPoint.x + offsetX,
                    y: squareCenterPoint.y + squareHeight * 3
                }, 3)
            }
        }
    }

    promotionDialogOnClickPiece(event) {
        if (event.button !== 2) {
            // Find piece data from target or parent button group
            let piece = event.target.dataset.piece
            if (!piece && event.target.closest) {
                const buttonGroup = event.target.closest(".promotion-dialog-button-group")
                if (buttonGroup) {
                    piece = buttonGroup.dataset.piece
                }
            }
            if (piece) {
                this.selectPiece(piece)
            } else {
                this.promotionDialogOnCancel(event)
            }
        }
    }

    selectPiece(piece) {
        if (this.state.callback) {
            this.state.callback({
                type: PROMOTION_DIALOG_RESULT_TYPE.pieceSelected,
                square: this.state.dialogParams.square,
                piece: piece
            })
        }
        this.setDisplayState(DISPLAY_STATE.hidden)
    }

    promotionDialogOnCancel(event) {
        if (this.state.displayState === DISPLAY_STATE.shown) {
            event.preventDefault()
            this.setDisplayState(DISPLAY_STATE.hidden)
            if(this.state.callback) {
                this.state.callback({type: PROMOTION_DIALOG_RESULT_TYPE.canceled})
            }
        }
    }

    contextMenu(event) {
        event.preventDefault()
        this.setDisplayState(DISPLAY_STATE.hidden)
        if(this.state.callback) {
            this.state.callback({type: PROMOTION_DIALOG_RESULT_TYPE.canceled})
        }
    }

    setDisplayState(displayState) {
        this.state.displayState = displayState
        if (displayState === DISPLAY_STATE.shown) {
            this.clickDelegate = Utils.delegate(this.chessboard.view.svg,
                "pointerdown",
                "*",
                this.promotionDialogOnClickPiece.bind(this))
            this.contextMenuListener = this.contextMenu.bind(this)
            this.chessboard.view.svg.addEventListener("contextmenu", this.contextMenuListener)
            // Add keyboard listener
            document.addEventListener("keydown", this.handleKeyDown)
        } else if (displayState === DISPLAY_STATE.hidden) {
            this.clickDelegate.remove()
            this.chessboard.view.svg.removeEventListener("contextmenu", this.contextMenuListener)
            // Remove keyboard listener
            document.removeEventListener("keydown", this.handleKeyDown)
            // Restore focus
            if (this.previouslyFocusedElement && this.previouslyFocusedElement.focus) {
                this.previouslyFocusedElement.focus()
            }
        }
        this.redrawDialog()
        // Focus first button after redraw when shown
        if (displayState === DISPLAY_STATE.shown) {
            setTimeout(() => {
                this.focusButton(0)
            }, 0)
        }
    }

    handleKeyDown(event) {
        if (this.state.displayState !== DISPLAY_STATE.shown) {
            return
        }
        switch (event.key) {
            case "ArrowDown":
                event.preventDefault()
                if (this.turned) {
                    this.focusedIndex = (this.focusedIndex - 1 + 4) % 4
                } else {
                    this.focusedIndex = (this.focusedIndex + 1) % 4
                }
                this.focusButton(this.focusedIndex)
                break
            case "ArrowRight":
                event.preventDefault()
                this.focusedIndex = (this.focusedIndex + 1) % 4
                this.focusButton(this.focusedIndex)
                break
            case "ArrowUp":
                event.preventDefault()
                if (this.turned) {
                    this.focusedIndex = (this.focusedIndex + 1) % 4
                } else {
                    this.focusedIndex = (this.focusedIndex - 1 + 4) % 4
                }
                this.focusButton(this.focusedIndex)
                break
            case "ArrowLeft":
                event.preventDefault()
                this.focusedIndex = (this.focusedIndex - 1 + 4) % 4
                this.focusButton(this.focusedIndex)
                break
            case "Enter":
            case " ":
                event.preventDefault()
                const buttons = this.promotionDialogGroup.querySelectorAll(".promotion-dialog-button-group")
                if (buttons[this.focusedIndex]) {
                    const piece = buttons[this.focusedIndex].dataset.piece
                    this.selectPiece(piece)
                }
                break
            case "Escape":
                event.preventDefault()
                this.setDisplayState(DISPLAY_STATE.hidden)
                if (this.state.callback) {
                    this.state.callback({type: PROMOTION_DIALOG_RESULT_TYPE.canceled})
                }
                break
            case "Tab":
                // Trap focus within dialog
                event.preventDefault()
                if (event.shiftKey) {
                    this.focusedIndex = (this.focusedIndex - 1 + 4) % 4
                } else {
                    this.focusedIndex = (this.focusedIndex + 1) % 4
                }
                this.focusButton(this.focusedIndex)
                break
        }
    }

    focusButton(index) {
        const buttons = this.promotionDialogGroup.querySelectorAll(".promotion-dialog-button-group")
        buttons.forEach((btn, i) => {
            btn.setAttribute("tabindex", i === index ? "0" : "-1")
        })
        if (buttons[index]) {
            buttons[index].focus()
            const pieceType = this.pieceOrder[index]
            this.announce(this.t.pieces[pieceType])
        }
    }

    announce(message) {
        this.liveRegion.textContent = ""
        // Small delay to ensure screen readers pick up the change
        setTimeout(() => {
            this.liveRegion.textContent = message
        }, 50)
    }

    destroy() {
        document.removeEventListener("keydown", this.handleKeyDown)
        if (this.liveRegion && this.liveRegion.parentNode) {
            this.liveRegion.parentNode.removeChild(this.liveRegion)
        }
    }

}
