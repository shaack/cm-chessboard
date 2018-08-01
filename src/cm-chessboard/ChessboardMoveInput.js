/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {Svg} from "../../lib/svjs-svg/Svg.js"
import {MOVE_INPUT_MODE, MARKER_TYPE} from "./Chessboard.js"

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

const DRAG_THRESHOLD = 2

export class ChessboardMoveInput {

    constructor(view, state, props, moveStartCallback, moveDoneCallback, moveCanceledCallback) {
        this.view = view
        this.state = state
        this.props = props
        this.moveStartCallback = moveStartCallback
        this.moveDoneCallback = moveDoneCallback
        this.moveCanceledCallback = moveCanceledCallback
        this.setMoveInputState(STATE.waitForInputStart)
    }

    setMoveInputState(newState, params = null) {

        // console.log("setMoveInputState", Object.keys(STATE)[this.moveInputState], "=>", Object.keys(STATE)[newState]);

        const prevState = this.moveInputState
        this.moveInputState = newState

        switch (newState) {

            case STATE.waitForInputStart:
                break

            case STATE.pieceClickedThreshold:
                if (STATE.waitForInputStart !== prevState) {
                    throw new Error("moveInputState")
                }
                this.startIndex = params.index
                this.endIndex = null
                this.movedPiece = params.piece
                this.updateStartEndMarkers()
                this.startPoint = params.point
                if (!this.pointerMoveListener && !this.pointerUpListener) {
                    if (params.type === "mousedown") {

                        this.pointerMoveListener = this.onPointerMove.bind(this)
                        this.pointerMoveListener.type = "mousemove"
                        window.addEventListener("mousemove", this.pointerMoveListener)

                        this.pointerUpListener = this.onPointerUp.bind(this)
                        this.pointerUpListener.type = "mouseup"
                        window.addEventListener("mouseup", this.pointerUpListener)

                    } else if (params.type === "touchstart") {

                        this.pointerMoveListener = this.onPointerMove.bind(this)
                        this.pointerMoveListener.type = "touchmove"
                        window.addEventListener("touchmove", this.pointerMoveListener)

                        this.pointerUpListener = this.onPointerUp.bind(this)
                        this.pointerUpListener.type = "touchend"
                        window.addEventListener("touchend", this.pointerUpListener)

                    } else {
                        throw Error("event type")
                    }
                } else {
                    throw Error("_pointerMoveListener or _pointerUpListener")
                }
                break

            case STATE.clickTo:
                if (this.dragablePiece) {
                    Svg.removeElement(this.dragablePiece)
                    this.dragablePiece = null
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
                if (this.props.moveInputMode === MOVE_INPUT_MODE.dragPiece) {
                    this.view.setPieceVisibility(params.index, false)
                    this.createDragablePiece(params.piece)
                }
                break

            case STATE.clickDragTo:
                if (STATE.secondClickThreshold !== prevState) {
                    throw new Error("moveInputState")
                }
                if (this.props.moveInputMode === MOVE_INPUT_MODE.dragPiece) {
                    this.view.setPieceVisibility(params.index, false)
                    this.createDragablePiece(params.piece)
                }
                break

            case STATE.moveDone:
                if ([STATE.dragTo, STATE.clickTo, STATE.clickDragTo].indexOf(prevState) === -1) {
                    throw new Error("moveInputState")
                }
                this.endIndex = params.index
                if (this.endIndex && this.moveDoneCallback(this.startIndex, this.endIndex)) {
                    const prevSquares = this.state.squares.slice(0)
                    this.state.setPiece(this.startIndex, null)
                    this.state.setPiece(this.endIndex, this.movedPiece)
                    if (prevState === STATE.clickTo) {
                        this.view.animatePieces(prevSquares, this.state.squares.slice(0), () => {
                            this.setMoveInputState(STATE.reset)
                        })
                    } else {
                        this.view.drawPieces(this.state.squares)
                        this.setMoveInputState(STATE.reset)
                    }
                } else {
                    this.view.drawPiecesDebounced()
                    this.setMoveInputState(STATE.reset)
                }
                break

            case STATE.reset:
                if (this.startIndex && !this.endIndex && this.movedPiece) {
                    this.state.setPiece(this.startIndex, this.movedPiece)
                }
                this.startIndex = null
                this.endIndex = null
                this.movedPiece = null
                this.updateStartEndMarkers()
                if (this.dragablePiece) {
                    Svg.removeElement(this.dragablePiece)
                    this.dragablePiece = null
                }
                if (this.pointerMoveListener) {
                    window.removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener)
                    this.pointerMoveListener = null
                }
                if (this.pointerUpListener) {
                    window.removeEventListener(this.pointerUpListener.type, this.pointerUpListener)
                    this.pointerUpListener = null
                }
                this.setMoveInputState(STATE.waitForInputStart)
                break

            default:
                throw Error(`moveInputState ${newState}`)
        }
    }

    createDragablePiece(pieceName) {
        if (this.dragablePiece) {
            throw Error("dragablePiece exists")
        }
        this.dragablePiece = Svg.createSvg(document.body)
        this.dragablePiece.setAttribute("width", this.view.squareWidth)
        this.dragablePiece.setAttribute("height", this.view.squareHeight)
        this.dragablePiece.setAttribute("style", "pointer-events: none")
        this.dragablePiece.name = pieceName
        const piece = Svg.addElement(this.dragablePiece, "use", {
            href: `#${pieceName}`
        })
        const scaling = this.view.squareHeight / this.props.sprite.grid
        const transformScale = (this.dragablePiece.createSVGTransform())
        transformScale.setScale(scaling, scaling)
        piece.transform.baseVal.appendItem(transformScale)
    }

    moveDragablePiece(x, y) {
        this.dragablePiece.setAttribute("style",
            `pointer-events: none; position: absolute; left: ${x - (this.view.squareHeight / 2)}px; top: ${y - (this.view.squareHeight / 2)}px`)
    }

    onPointerDown(e) {
        if (e.type === "mousedown" && e.button === 0 || e.type === "touchstart") {
            const index = e.target.getAttribute("data-index")
            const pieceElement = this.view.getPiece(index)
            if (index !== undefined) {
                let pieceName, color
                if (pieceElement) {
                    pieceName = pieceElement.getAttribute("data-piece")
                    color = pieceName ? pieceName.substr(0, 1) : null
                }
                if (this.moveInputState !== STATE.waitForInputStart ||
                    this.state.inputWhiteEnabled && color === "w" ||
                    this.state.inputBlackEnabled && color === "b") {
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
                            this.setMoveInputState(STATE.moveDone, {index: index})
                        }
                    }
                }
            }
        }
    }

    onPointerMove(e) {
        let x, y, target
        if (e.type === "mousemove") {
            x = e.pageX
            y = e.pageY
            target = e.target
        } else if (e.type === "touchmove") {
            x = e.touches[0].pageX
            y = e.touches[0].pageY
            target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)
        }
        if (this.moveInputState === STATE.pieceClickedThreshold || this.moveInputState === STATE.secondClickThreshold) {
            if (Math.abs(this.startPoint.x - x) > DRAG_THRESHOLD || Math.abs(this.startPoint.y - y) > DRAG_THRESHOLD) {
                if (this.moveInputState === STATE.secondClickThreshold) {
                    this.setMoveInputState(STATE.clickDragTo, {index: this.startIndex, piece: this.movedPiece})
                } else {
                    this.setMoveInputState(STATE.dragTo, {index: this.startIndex, piece: this.movedPiece})
                }
                if (this.props.moveInputMode === MOVE_INPUT_MODE.dragPiece) {
                    this.moveDragablePiece(x, y)
                }
            }
        } else if (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo || this.moveInputState === STATE.clickTo) {
            if (target && target.getAttribute && target.parentElement === this.view.boardGroup) {
                const index = target.getAttribute("data-index")
                if (index !== this.startIndex && index !== this.endIndex) {
                    this.endIndex = index
                    this.updateStartEndMarkers()
                } else if (index === this.startIndex && this.endIndex !== null) {
                    this.endIndex = null
                    this.updateStartEndMarkers()
                }
            } else {
                this.endIndex = null
                this.updateStartEndMarkers()
            }
            if (this.props.moveInputMode === MOVE_INPUT_MODE.dragPiece && (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo)) {
                this.moveDragablePiece(x, y)
            }
        }
    }

    onPointerUp(e) {
        let x, y, target
        if (e.type === "mouseup") {
            target = e.target
        } else if (e.type === "touchend") {
            x = e.changedTouches[0].clientX
            y = e.changedTouches[0].clientY
            target = document.elementFromPoint(x, y)
        }
        if (target && target.getAttribute) {
            const index = target.getAttribute("data-index")

            if (index) {
                if (this.moveInputState === STATE.dragTo || this.moveInputState === STATE.clickDragTo) {
                    if (this.startIndex === index) {
                        if (this.moveInputState === STATE.clickDragTo) {
                            this.state.setPiece(this.startIndex, this.movedPiece)
                            this.view.setPieceVisibility(this.startIndex)
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
                    this.moveCanceledCallback()
                }
            } else {
                this.view.drawPiecesDebounced()
                this.setMoveInputState(STATE.reset)
                this.moveCanceledCallback()
            }
        } else {
            this.view.drawPiecesDebounced()
            this.setMoveInputState(STATE.reset)
        }
    }

    updateStartEndMarkers() {
        this.state.removeMarkers(null, MARKER_TYPE.move)
        if (this.startIndex) {
            this.state.addMarker(this.startIndex, MARKER_TYPE.move)
        }
        if (this.endIndex) {
            this.state.addMarker(this.endIndex, MARKER_TYPE.move)
        }
        this.view.drawMarkersDebounced()
    }

    destroy() {
        this.setMoveInputState(STATE.reset)
    }
}