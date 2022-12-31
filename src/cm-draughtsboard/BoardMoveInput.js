/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {SQUARE_COORDINATES, Svg} from "./BoardView.js"

const STATE = {
    waitForInputStart: 0,
    pieceClickedThreshold: 1,
    clickTo: 2,
    secondClickThreshold: 3,
    dragTo: 4,
    clickDragTo: 5,
    moveDone: 6,
    reset: 7
}

export const MOVE_CANCELED_REASON = {
    secondClick: "secondClick",
    movedOutOfBoard: "movedOutOfBoard",
    draggedBack: "draggedBack",
    clickedAnother: "clickedAnother"
}

const DRAG_THRESHOLD = 4

export class BoardMoveInput {

    constructor(view, moveStartCallback, moveDoneCallback, moveCanceledCallback) {
        this.view = view
        this.board = view.board
        this.moveStartCallback = moveStartCallback
        this.moveDoneCallback = moveDoneCallback
        this.moveCanceledCallback = moveCanceledCallback
        this.setMoveInputState(STATE.waitForInputStart)
    }

    setMoveInputState(newState, params = undefined) {

        // console.log("setMoveInputState", Object.keys(STATE)[this.moveInputState], "=>", Object.keys(STATE)[newState]);

        const prevState = this.moveInputState
        this.moveInputState = newState

        switch (newState) {

            case STATE.waitForInputStart:
                break

            case STATE.pieceClickedThreshold:
                if (STATE.waitForInputStart !== prevState && STATE.clickTo !== prevState) {
                    throw new Error("moveInputState")
                }
                if (this.pointerMoveListener) {
                    removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener)
                    this.pointerMoveListener = undefined
                }
                if (this.pointerUpListener) {
                    removeEventListener(this.pointerUpListener.type, this.pointerUpListener)
                    this.pointerUpListener = undefined
                }
                this.startIndex = params.index
                this.endIndex = undefined
                this.movedPiece = params.piece
                this.updateStartEndMarkers()
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
                        throw Error("event type")
                    }
                } else {
                    throw Error("_pointerMoveListener or _pointerUpListener")
                }
                break

            case STATE.clickTo:
                if (this.draggablePiece) {
                    Svg.removeElement(this.draggablePiece)
                    this.draggablePiece = undefined
                }
                if (prevState === STATE.dragTo) {
                    this.view.setPieceVisibility(params.index)
                }
                break

            case STATE.secondClickThreshold:
                if (STATE.clickTo !== prevState) {
                    throw new Error("moveInputState")
                }
                this.startPoint = params.point
                break

            case STATE.dragTo:
                if (STATE.pieceClickedThreshold !== prevState) {
                    throw new Error("moveInputState")
                }
                if (this.view.board.state.inputEnabled) {
                    this.view.setPieceVisibility(params.index, false)
                    this.createDraggablePiece(params.piece)
                }
                break

            case STATE.clickDragTo:
                if (STATE.secondClickThreshold !== prevState) {
                    throw new Error("moveInputState")
                }
                if (this.view.board.state.inputEnabled) {
                    this.view.setPieceVisibility(params.index, false)
                    this.createDraggablePiece(params.piece)
                }
                break

            case STATE.moveDone:
                if ([STATE.dragTo, STATE.clickTo, STATE.clickDragTo].indexOf(prevState) === -1) {
                    throw new Error("moveInputState")
                }
                this.endIndex = params.index
                if (this.endIndex && this.moveDoneCallback(this.startIndex, this.endIndex)) {
                    const prevSquares = this.board.state.squares.slice(0)
                    this.board.state.setPiece(this.startIndex, undefined)
                    this.board.state.setPiece(this.endIndex, this.movedPiece)
                    if (prevState === STATE.clickTo) {
                        this.updateStartEndMarkers()
                        this.view.animatePieces(prevSquares, this.board.state.squares.slice(0), () => {
                            this.setMoveInputState(STATE.reset)
                        })
                    } else {
                        this.view.drawPieces(this.board.state.squares)
                        this.setMoveInputState(STATE.reset)
                    }
                } else {
                    this.view.drawPieces()
                    this.setMoveInputState(STATE.reset)
                }
                break

            case STATE.reset:
                if (this.startIndex && !this.endIndex && this.movedPiece) {
                    this.board.state.setPiece(this.startIndex, this.movedPiece)
                }
                this.startIndex = undefined
                this.endIndex = undefined
                this.movedPiece = undefined
                this.updateStartEndMarkers()
                if (this.draggablePiece) {
                    Svg.removeElement(this.draggablePiece)
                    this.draggablePiece = undefined
                }
                if (this.pointerMoveListener) {
                    removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener)
                    this.pointerMoveListener = undefined
                }
                if (this.pointerUpListener) {
                    removeEventListener(this.pointerUpListener.type, this.pointerUpListener)
                    this.pointerUpListener = undefined
                }
                this.setMoveInputState(STATE.waitForInputStart)
                break

            default:
                throw Error(`moveInputState ${newState}`)
        }
    }

    createDraggablePiece(pieceName) {
        if (this.draggablePiece) {
            throw Error("draggablePiece exists")
        }
        this.draggablePiece = Svg.createSvg(document.body)
        this.draggablePiece.classList.add("cm-chessboard-draggable-piece")
        this.draggablePiece.setAttribute("width", this.view.squareWidth)
        this.draggablePiece.setAttribute("height", this.view.squareHeight)
        this.draggablePiece.setAttribute("style", "pointer-events: none")
        this.draggablePiece.name = pieceName
        const spriteUrl = this.board.props.sprite.cache ? "" : this.board.props.sprite.url
        const piece = Svg.addElement(this.draggablePiece, "use", {
            href: `${spriteUrl}#${pieceName}`
        })
        const scaling = this.view.squareHeight / this.board.props.sprite.size
        const transformScale = (this.draggablePiece.createSVGTransform())
        transformScale.setScale(scaling, scaling)
        piece.transform.baseVal.appendItem(transformScale)
    }

    moveDraggablePiece(x, y) {
        this.draggablePiece.setAttribute("style",
            `pointer-events: none; position: absolute; left: ${x - (this.view.squareHeight / 2)}px; top: ${y - (this.view.squareHeight / 2)}px`)
    }

    onPointerDown(e) {
        if (e.type === "mousedown" && e.button === 0 || e.type === "touchstart") {
            const index = e.target.getAttribute("data-index")
            const pieceElement = this.view.getPiece(index)
            let pieceName, color
            if (pieceElement) {
                pieceName = pieceElement.getAttribute("data-piece")
                color = pieceName ? pieceName.substr(0, 1) : undefined
                // allow scrolling, if not pointed on draggable piece
                if (color === "w" && this.board.state.inputWhiteEnabled ||
                    color === "b" && this.board.state.inputBlackEnabled) {
                    e.preventDefault()
                }
            }
            if (index) { // pointer on square
                if (this.moveInputState !== STATE.waitForInputStart ||
                    this.board.state.inputWhiteEnabled && color === "w" ||
                    this.board.state.inputBlackEnabled && color === "b") {
                    let point
                    if (e.type === "mousedown") {
                        point = {x: e.clientX, y: e.clientY}
                    } else if (e.type === "touchstart") {
                        point = {x: e.touches[0].clientX, y: e.touches[0].clientY}
                    }
                    if (this.moveInputState === STATE.waitForInputStart && pieceName && this.moveStartCallback(index)) {
                        this.setMoveInputState(STATE.pieceClickedThreshold, {
                            index: index,
                            piece: pieceName,
                            point: point,
                            type: e.type
                        })
                    } else if (this.moveInputState === STATE.clickTo) {
                        if (index === this.startIndex) {
                            this.setMoveInputState(STATE.secondClickThreshold, {
                                index: index,
                                piece: pieceName,
                                point: point,
                                type: e.type
                            })
                        } else {
                            const pieceName = this.board.getPiece(SQUARE_COORDINATES[index])
                            const pieceColor = pieceName ? pieceName.substr(0, 1) : undefined
                            const startPieceName = this.board.getPiece(SQUARE_COORDINATES[this.startIndex])
                            const startPieceColor = startPieceName ? startPieceName.substr(0, 1) : undefined
                            if (color && startPieceColor === pieceColor) { // https://github.com/shaack/cm-chessboard/issues/40
                                this.moveCanceledCallback(MOVE_CANCELED_REASON.clickedAnother, index)
                                if (this.moveStartCallback(index)) {
                                    this.setMoveInputState(STATE.pieceClickedThreshold, {
                                        index: index,
                                        piece: pieceName,
                                        point: point,
                                        type: e.type
                                    })
                                } else {
                                    this.setMoveInputState(STATE.reset)
                                }
                            } else {
                                this.setMoveInputState(STATE.moveDone, {index: index})
                            }
                        }
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
        if (this.moveInputState === STATE.pieceClickedThreshold || this.moveInputState === STATE.secondClickThreshold) {
            if (Math.abs(this.startPoint.x - clientX) > DRAG_THRESHOLD || Math.abs(this.startPoint.y - clientY) > DRAG_THRESHOLD) {
                if (this.moveInputState === STATE.secondClickThreshold) {
                    this.setMoveInputState(STATE.clickDragTo, {index: this.startIndex, piece: this.movedPiece})
                } else {
                    this.setMoveInputState(STATE.dragTo, {index: this.startIndex, piece: this.movedPiece})
                }
                if (this.view.board.state.inputEnabled) {
                    this.moveDraggablePiece(pageX, pageY)
                }
            }
        } else if (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo || this.moveInputState === STATE.clickTo) {
            if (target && target.getAttribute && target.parentElement === this.view.boardGroup) {
                const index = target.getAttribute("data-index")
                if (index !== this.startIndex && index !== this.endIndex) {
                    this.endIndex = index
                    this.updateStartEndMarkers()
                } else if (index === this.startIndex && this.endIndex !== undefined) {
                    this.endIndex = undefined
                    this.updateStartEndMarkers()
                }
            } else {
                if (this.endIndex !== undefined) {
                    this.endIndex = undefined
                    this.updateStartEndMarkers()
                }
            }
            if (this.view.board.state.inputEnabled && (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo)) {
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
            const index = target.getAttribute("data-index")

            if (index) {
                if (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo) {
                    if (this.startIndex === index) {
                        if (this.moveInputState === STATE.clickDragTo) {
                            this.board.state.setPiece(this.startIndex, this.movedPiece)
                            this.view.setPieceVisibility(this.startIndex)
                            this.moveCanceledCallback(MOVE_CANCELED_REASON.draggedBack, index)
                            this.setMoveInputState(STATE.reset)
                        } else {
                            this.setMoveInputState(STATE.clickTo, {index: index})
                        }
                    } else {
                        this.setMoveInputState(STATE.moveDone, {index: index})
                    }
                } else if (this.moveInputState === STATE.pieceClickedThreshold) {
                    this.setMoveInputState(STATE.clickTo, {index: index})
                } else if (this.moveInputState === STATE.secondClickThreshold) {
                    this.setMoveInputState(STATE.reset)
                    this.moveCanceledCallback(MOVE_CANCELED_REASON.secondClick, index)
                }
            } else {
                this.view.drawPieces()
                this.setMoveInputState(STATE.reset)
                this.moveCanceledCallback(MOVE_CANCELED_REASON.movedOutOfBoard, undefined)
            }
        } else {
            this.view.drawPieces()
            this.setMoveInputState(STATE.reset)
        }
    }

    updateStartEndMarkers() {
        if(this.board.props.style.moveFromMarker) {
            this.board.state.removeMarkers(undefined, this.board.props.style.moveFromMarker)
        }
        if(this.board.props.style.moveToMarker) {
            this.board.state.removeMarkers(undefined, this.board.props.style.moveToMarker)
        }
        if (this.board.props.style.moveFromMarker) {
            if (this.startIndex) {
                this.board.state.addMarker(this.startIndex, this.board.props.style.moveFromMarker)
            }
        }
        if (this.board.props.style.moveToMarker) {
            if (this.endIndex) {
                this.board.state.addMarker(this.endIndex, this.board.props.style.moveToMarker)
            }
        }
        this.view.drawMarkers()
    }

    reset() {
        this.setMoveInputState(STATE.reset)
    }

    destroy() {
        this.reset()
    }

}
