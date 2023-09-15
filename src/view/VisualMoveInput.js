/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {Svg} from "../lib/Svg.js"
import {Utils} from "../lib/Utils.js"

const MOVE_INPUT_STATE = {
    waitForInputStart: "waitForInputStart",
    pieceClickedThreshold: "pieceClickedThreshold",
    clickTo: "clickTo",
    secondClickThreshold: "secondClickThreshold",
    dragTo: "dragTo",
    clickDragTo: "clickDragTo",
    moveDone: "moveDone",
    reset: "reset"
}

export const MOVE_CANCELED_REASON = {
    secondClick: "secondClick", // clicked the same piece
    secondaryClick: "secondaryClick", // right click while moving
    movedOutOfBoard: "movedOutOfBoard",
    draggedBack: "draggedBack", // dragged to the start square
    clickedAnotherPiece: "clickedAnotherPiece" // of the same color
}

const DRAG_THRESHOLD = 4

export class VisualMoveInput {

    constructor(view) {
        this.view = view
        this.chessboard = view.chessboard
        this.moveInputState = null
        this.fromSquare = null
        this.toSquare = null

        this.setMoveInputState(MOVE_INPUT_STATE.waitForInputStart)
    }

    moveInputStartedCallback(square) {
        const result = this.view.moveInputStartedCallback(square)
        if (result) {
            this.chessboard.state.moveInputProcess = Utils.createTask()
            this.chessboard.state.moveInputProcess.then((result) => {
                if (this.moveInputState === MOVE_INPUT_STATE.waitForInputStart ||
                    this.moveInputState === MOVE_INPUT_STATE.moveDone) {
                    this.view.moveInputFinishedCallback(this.fromSquare, this.toSquare, result)
                }
            })
        }
        return result
    }

    movingOverSquareCallback(fromSquare, toSquare) {
        this.view.movingOverSquareCallback(fromSquare, toSquare)
    }

    validateMoveInputCallback(fromSquare, toSquare) {
        const result = this.view.validateMoveInputCallback(fromSquare, toSquare)
        this.chessboard.state.moveInputProcess.resolve(result)
        return result
    }

    moveInputCanceledCallback(fromSquare, toSquare, reason) {
        this.view.moveInputCanceledCallback(fromSquare, toSquare, reason)
        this.chessboard.state.moveInputProcess.resolve()
    }

    setMoveInputState(newState, params = undefined) {
        const prevState = this.moveInputState
        this.moveInputState = newState

        switch (newState) {

            case MOVE_INPUT_STATE.waitForInputStart:
                break

            case MOVE_INPUT_STATE.pieceClickedThreshold:
                if (MOVE_INPUT_STATE.waitForInputStart !== prevState && MOVE_INPUT_STATE.clickTo !== prevState) {
                    throw new Error("moveInputState")
                }
                if (this.pointerMoveListener) {
                    removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener)
                    this.pointerMoveListener = null
                }
                if (this.pointerUpListener) {
                    removeEventListener(this.pointerUpListener.type, this.pointerUpListener)
                    this.pointerUpListener = null
                }
                this.fromSquare = params.square
                this.toSquare = null
                this.movedPiece = params.piece
                this.startPoint = params.point
                if (!this.pointerMoveListener && !this.pointerUpListener) {
                    if (params.type === "mousedown") {
                        this.pointerMoveListener = this.onPointerMove.bind(this)
                        this.pointerMoveListener.type = "mousemove"
                        addEventListener("mousemove", this.pointerMoveListener)
                        this.pointerUpListener = this.onPointerUp.bind(this)
                        this.pointerUpListener.type = "mouseup"
                        addEventListener("mouseup", this.pointerUpListener)
                    } else if (params.type === "touchstart") {
                        this.pointerMoveListener = this.onPointerMove.bind(this)
                        this.pointerMoveListener.type = "touchmove"
                        addEventListener("touchmove", this.pointerMoveListener)
                        this.pointerUpListener = this.onPointerUp.bind(this)
                        this.pointerUpListener.type = "touchend"
                        addEventListener("touchend", this.pointerUpListener)
                    } else {
                        throw Error("4b74af")
                    }
                    if (!this.contextMenuListener) {
                        this.contextMenuListener = this.onContextMenu.bind(this)
                        this.chessboard.view.svg.addEventListener("contextmenu", this.contextMenuListener)
                    }
                } else {
                    throw Error("94ad0c")
                }
                break

            case MOVE_INPUT_STATE.clickTo:
                if (this.draggablePiece) {
                    Svg.removeElement(this.draggablePiece)
                    this.draggablePiece = null
                }
                if (prevState === MOVE_INPUT_STATE.dragTo) {
                    this.view.setPieceVisibility(params.square, true)
                }
                break

            case MOVE_INPUT_STATE.secondClickThreshold:
                if (MOVE_INPUT_STATE.clickTo !== prevState) {
                    throw new Error("moveInputState")
                }
                this.startPoint = params.point
                break

            case MOVE_INPUT_STATE.dragTo:
                if (MOVE_INPUT_STATE.pieceClickedThreshold !== prevState) {
                    throw new Error("moveInputState")
                }
                if (this.view.chessboard.state.inputEnabled()) {
                    this.view.setPieceVisibility(params.square, false)
                    this.createDraggablePiece(params.piece)
                }
                break

            case MOVE_INPUT_STATE.clickDragTo:
                if (MOVE_INPUT_STATE.secondClickThreshold !== prevState) {
                    throw new Error("moveInputState")
                }
                if (this.view.chessboard.state.inputEnabled()) {
                    this.view.setPieceVisibility(params.square, false)
                    this.createDraggablePiece(params.piece)
                }
                break

            case MOVE_INPUT_STATE.moveDone:
                if ([MOVE_INPUT_STATE.dragTo, MOVE_INPUT_STATE.clickTo, MOVE_INPUT_STATE.clickDragTo].indexOf(prevState) === -1) {
                    throw new Error("moveInputState")
                }
                this.toSquare = params.square
                if (this.toSquare && this.validateMoveInputCallback(this.fromSquare, this.toSquare)) {
                    this.chessboard.movePiece(this.fromSquare, this.toSquare, prevState === MOVE_INPUT_STATE.clickTo).then(() => {
                        if (prevState === MOVE_INPUT_STATE.clickTo) {
                            this.view.setPieceVisibility(this.toSquare, true)
                        }
                        this.setMoveInputState(MOVE_INPUT_STATE.reset)
                    })
                } else {
                    this.view.setPieceVisibility(this.fromSquare, true)
                    this.setMoveInputState(MOVE_INPUT_STATE.reset)
                }
                break

            case MOVE_INPUT_STATE.reset:
                if (this.fromSquare && !this.toSquare && this.movedPiece) {
                    this.chessboard.state.position.setPiece(this.fromSquare, this.movedPiece)
                }
                this.fromSquare = null
                this.toSquare = null
                this.movedPiece = null
                if (this.draggablePiece) {
                    Svg.removeElement(this.draggablePiece)
                    this.draggablePiece = null
                }
                if (this.pointerMoveListener) {
                    removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener)
                    this.pointerMoveListener = null
                }
                if (this.pointerUpListener) {
                    removeEventListener(this.pointerUpListener.type, this.pointerUpListener)
                    this.pointerUpListener = null
                }
                if (this.contextMenuListener) {
                    removeEventListener("contextmenu", this.contextMenuListener)
                    this.contextMenuListener = null
                }
                this.setMoveInputState(MOVE_INPUT_STATE.waitForInputStart)
                // set temporarily hidden pieces visible again
                const hiddenPieces = this.view.piecesGroup.querySelectorAll("[visibility=hidden]")
                for (let i = 0; i < hiddenPieces.length; i++) {
                    hiddenPieces[i].removeAttribute("visibility")
                }
                break

            default:
                throw Error(`260b09: moveInputState ${newState}`)
        }
    }

    createDraggablePiece(pieceName) {
        // maybe I should use the existing piece from the board and don't create a new one
        if (this.draggablePiece) {
            throw Error("draggablePiece already exists")
        }
        this.draggablePiece = Svg.createSvg(document.body)
        this.draggablePiece.classList.add("cm-chessboard-draggable-piece")
        this.draggablePiece.setAttribute("width", this.view.squareWidth)
        this.draggablePiece.setAttribute("height", this.view.squareHeight)
        this.draggablePiece.setAttribute("style", "pointer-events: none")
        this.draggablePiece.name = pieceName
        const spriteUrl = this.chessboard.props.assetsCache ? "" : this.view.getSpriteUrl()
        const piece = Svg.addElement(this.draggablePiece, "use", {
            href: `${spriteUrl}#${pieceName}`
        })
        const scaling = this.view.squareHeight / this.chessboard.props.style.pieces.tileSize
        const transformScale = (this.draggablePiece.createSVGTransform())
        transformScale.setScale(scaling, scaling)
        piece.transform.baseVal.appendItem(transformScale)
    }

    moveDraggablePiece(x, y) {
        this.draggablePiece.setAttribute("style",
            `pointer-events: none; position: absolute; left: ${x - (this.view.squareHeight / 2)}px; top: ${y - (this.view.squareHeight / 2)}px`)
    }

    onPointerDown(e) {
        if (!(e.type === "mousedown" && e.button === 0 || e.type === "touchstart")) {
            return
        }
        const square = e.target.getAttribute("data-square")
        if (!square) { // pointer on square
            return
        }
        const pieceName = this.chessboard.getPiece(square)
        let color
        if (pieceName) {
            color = pieceName ? pieceName.substring(0, 1) : null
            // allow scrolling, if not pointed on draggable piece
            if (color === "w" && this.chessboard.state.inputWhiteEnabled ||
                color === "b" && this.chessboard.state.inputBlackEnabled) {
                e.preventDefault()
            }
        }
        if (this.moveInputState !== MOVE_INPUT_STATE.waitForInputStart ||
            this.chessboard.state.inputWhiteEnabled && color === "w" ||
            this.chessboard.state.inputBlackEnabled && color === "b") {
            let point
            if (e.type === "mousedown") {
                point = {x: e.clientX, y: e.clientY}
            } else if (e.type === "touchstart") {
                point = {x: e.touches[0].clientX, y: e.touches[0].clientY}
            }
            if (this.moveInputState === MOVE_INPUT_STATE.waitForInputStart && pieceName && this.moveInputStartedCallback(square)) {
                this.setMoveInputState(MOVE_INPUT_STATE.pieceClickedThreshold, {
                    square: square,
                    piece: pieceName,
                    point: point,
                    type: e.type
                })
            } else if (this.moveInputState === MOVE_INPUT_STATE.clickTo) {
                if (square === this.fromSquare) {
                    this.setMoveInputState(MOVE_INPUT_STATE.secondClickThreshold, {
                        square: square,
                        piece: pieceName,
                        point: point,
                        type: e.type
                    })
                } else {
                    const pieceName = this.chessboard.getPiece(square)
                    const pieceColor = pieceName ? pieceName.substring(0, 1) : null
                    const startPieceName = this.chessboard.getPiece(this.fromSquare)
                    const startPieceColor = startPieceName ? startPieceName.substring(0, 1) : null
                    if (color && startPieceColor === pieceColor) {
                        this.moveInputCanceledCallback(this.fromSquare, square, MOVE_CANCELED_REASON.clickedAnotherPiece)
                        if (this.moveInputStartedCallback(square)) {
                            this.setMoveInputState(MOVE_INPUT_STATE.pieceClickedThreshold, {
                                square: square,
                                piece: pieceName,
                                point: point,
                                type: e.type
                            })
                        } else {
                            this.setMoveInputState(MOVE_INPUT_STATE.reset)
                        }
                    } else {
                        this.setMoveInputState(MOVE_INPUT_STATE.moveDone, {square: square})
                    }
                }
            }
        }
    }

    onPointerMove(e) {
        let pageX, pageY, clientX, clientY, target
        if (e.type === "mousemove") {
            clientX = e.clientX
            clientY = e.clientY
            pageX = e.pageX
            pageY = e.pageY
            target = e.target
        } else if (e.type === "touchmove") {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
            pageX = e.touches[0].pageX
            pageY = e.touches[0].pageY
            target = document.elementFromPoint(clientX, clientY)
        }
        if (this.moveInputState === MOVE_INPUT_STATE.pieceClickedThreshold || this.moveInputState === MOVE_INPUT_STATE.secondClickThreshold) {
            if (Math.abs(this.startPoint.x - clientX) > DRAG_THRESHOLD || Math.abs(this.startPoint.y - clientY) > DRAG_THRESHOLD) {
                if (this.moveInputState === MOVE_INPUT_STATE.secondClickThreshold) {
                    this.setMoveInputState(MOVE_INPUT_STATE.clickDragTo, {
                        square: this.fromSquare,
                        piece: this.movedPiece
                    })
                } else {
                    this.setMoveInputState(MOVE_INPUT_STATE.dragTo, {square: this.fromSquare, piece: this.movedPiece})
                }
                if (this.view.chessboard.state.inputEnabled()) {
                    this.moveDraggablePiece(pageX, pageY)
                }
            }
        } else if (this.moveInputState === MOVE_INPUT_STATE.dragTo || this.moveInputState === MOVE_INPUT_STATE.clickDragTo || this.moveInputState === MOVE_INPUT_STATE.clickTo) {
            if (target && target.getAttribute && target.parentElement === this.view.boardGroup) {
                const square = target.getAttribute("data-square")
                if (square !== this.fromSquare && square !== this.toSquare) {
                    this.toSquare = square
                    this.movingOverSquareCallback(this.fromSquare, this.toSquare)
                } else if (square === this.fromSquare && this.toSquare !== null) {
                    this.toSquare = null
                    this.movingOverSquareCallback(this.fromSquare, null)
                }
            } else if (this.toSquare !== null) {
                this.toSquare = null
                this.movingOverSquareCallback(this.fromSquare, null)
            }

            if (this.view.chessboard.state.inputEnabled() && (this.moveInputState === MOVE_INPUT_STATE.dragTo || this.moveInputState === MOVE_INPUT_STATE.clickDragTo)) {
                this.moveDraggablePiece(pageX, pageY)
            }
        }
    }

    onPointerUp(e) {
        let target
        if (e.type === "mouseup") {
            target = e.target
        } else if (e.type === "touchend") {
            target = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY)
        }
        if (target && target.getAttribute) {
            const square = target.getAttribute("data-square")

            if (square) {
                if (this.moveInputState === MOVE_INPUT_STATE.dragTo || this.moveInputState === MOVE_INPUT_STATE.clickDragTo) {
                    if (this.fromSquare === square) {
                        if (this.moveInputState === MOVE_INPUT_STATE.clickDragTo) {
                            this.chessboard.state.position.setPiece(this.fromSquare, this.movedPiece)
                            this.view.setPieceVisibility(this.fromSquare)
                            this.moveInputCanceledCallback(square, null, MOVE_CANCELED_REASON.draggedBack)
                            this.setMoveInputState(MOVE_INPUT_STATE.reset)
                        } else {
                            this.setMoveInputState(MOVE_INPUT_STATE.clickTo, {square: square})
                        }
                    } else {
                        this.setMoveInputState(MOVE_INPUT_STATE.moveDone, {square: square})
                    }
                } else if (this.moveInputState === MOVE_INPUT_STATE.pieceClickedThreshold) {
                    this.setMoveInputState(MOVE_INPUT_STATE.clickTo, {square: square})
                } else if (this.moveInputState === MOVE_INPUT_STATE.secondClickThreshold) {
                    this.setMoveInputState(MOVE_INPUT_STATE.reset)
                    this.moveInputCanceledCallback(square, null, MOVE_CANCELED_REASON.secondClick)
                }
            } else {
                this.view.redrawPieces()
                const moveStartSquare = this.fromSquare
                this.setMoveInputState(MOVE_INPUT_STATE.reset)
                this.moveInputCanceledCallback(moveStartSquare, null, MOVE_CANCELED_REASON.movedOutOfBoard)
            }
        } else {
            this.view.redrawPieces()
            this.setMoveInputState(MOVE_INPUT_STATE.reset)
        }
    }

    onContextMenu(e) { // while moving
        e.preventDefault()
        this.view.redrawPieces()
        this.setMoveInputState(MOVE_INPUT_STATE.reset)
        this.moveInputCanceledCallback(this.fromSquare, null, MOVE_CANCELED_REASON.secondaryClick)
    }

    isDragging() {
        return this.moveInputState === MOVE_INPUT_STATE.dragTo || this.moveInputState === MOVE_INPUT_STATE.clickDragTo
    }

    destroy() {
        this.setMoveInputState(MOVE_INPUT_STATE.reset)
    }

}
