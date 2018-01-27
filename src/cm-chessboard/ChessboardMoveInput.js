/**
 * Author: shaack
 * Date: 06.12.2017
 */

import {Svg} from "../svjs-svg/src/svjs/Svg.js";
import {MOVE_INPUT_MODE, MARKER_TYPE} from "./Chessboard.js";

const STATUS = {
    waitForInputStart: 0,
    pieceClickedThreshold: 1,
    clickTo: 2,
    secondClickThreshold: 3,
    dragTo: 4,
    clickDragTo: 5,
    moveDone: 6,
    reset: 7
};

const DRAG_THRESHOLD = 2;

export class ChessboardMoveInput {

    constructor(view, model, config, moveStartCallback, moveDoneCallback, moveCanceledCallback) {
        this.view = view;
        this.model = model;
        this.config = config;
        this.moveStartCallback = moveStartCallback;
        this.moveDoneCallback = moveDoneCallback;
        this.moveCanceledCallback = moveCanceledCallback;
        this.setStatus(STATUS.waitForInputStart);
    }

    setStatus(newStatus, params = null) {

        //console.log("setStatus", Object.keys(STATUS)[this.status], "=>", Object.keys(STATUS)[newStatus]);

        const prevStatus = this.status;
        this.status = newStatus;

        switch (newStatus) {

            case STATUS.waitForInputStart:
                break;

            case STATUS.pieceClickedThreshold:
                if ([STATUS.waitForInputStart].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.startIndex = params.index;
                this.endIndex = null;
                this.movedPiece = params.piece;
                this.updateStartEndMarkers();
                this.startPoint = params.point;
                if (!this.pointerMoveListener && !this.pointerUpListener) {
                    if (params.type === "mousedown") {

                        this.pointerMoveListener = this.onPointerMove.bind(this);
                        this.pointerMoveListener.type = "mousemove";
                        window.addEventListener("mousemove", this.pointerMoveListener);

                        this.pointerUpListener = this.onPointerUp.bind(this);
                        this.pointerUpListener.type = "mouseup";
                        window.addEventListener("mouseup", this.pointerUpListener);

                    } else if (params.type === "touchstart") {

                        this.pointerMoveListener = this.onPointerMove.bind(this);
                        this.pointerMoveListener.type = "touchmove";
                        window.addEventListener("touchmove", this.pointerMoveListener);

                        this.pointerUpListener = this.onPointerUp.bind(this);
                        this.pointerUpListener.type = "touchend";
                        window.addEventListener("touchend", this.pointerUpListener);

                    } else {
                        throw Error("event type");
                    }
                } else {
                    throw Error("_pointerMoveListener or _pointerUpListener");
                }
                break;

            case STATUS.clickTo:
                if (this.dragablePiece) {
                    Svg.removeElement(this.dragablePiece);
                    this.dragablePiece = null;
                }
                if (prevStatus === STATUS.dragTo) {
                    this.view.setPieceVisibility(params.index);
                }
                break;

            case STATUS.secondClickThreshold:
                if ([STATUS.clickTo].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.startPoint = params.point;
                break;

            case STATUS.dragTo:
                if ([STATUS.pieceClickedThreshold].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                if (this.config.moveInputMode === MOVE_INPUT_MODE.dragPiece) {
                    this.view.setPieceVisibility(params.index, false);
                    this.createDragablePiece(params.piece);
                }
                break;

            case STATUS.clickDragTo:
                if ([STATUS.secondClickThreshold].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                if (this.config.moveInputMode === MOVE_INPUT_MODE.dragPiece) {
                    this.view.setPieceVisibility(params.index, false);
                    this.createDragablePiece(params.piece);
                }
                break;

            case STATUS.moveDone:
                if ([STATUS.dragTo, STATUS.clickTo, STATUS.clickDragTo].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.endIndex = params.index;
                if (this.endIndex && this.moveDoneCallback(this.startIndex, this.endIndex)) {
                    const prevSquares = this.model.squares.slice(0);
                    this.model.setPiece(this.startIndex, null);
                    this.model.setPiece(this.endIndex, this.movedPiece);
                    if (prevStatus === STATUS.clickTo) {
                        this.view.animatePieces(prevSquares, this.model.squares.slice(0), () => {
                            this.setStatus(STATUS.reset);
                        });
                    } else {
                        this.view.drawPiecesNow(this.model.squares);
                        this.setStatus(STATUS.reset);
                    }
                } else {
                    this.view.drawPieces();
                    this.setStatus(STATUS.reset);
                }
                break;

            case STATUS.reset:
                if (this.startIndex && !this.endIndex && this.movedPiece) {
                    this.model.setPiece(this.startIndex, this.movedPiece);
                }
                this.startIndex = null;
                this.endIndex = null;
                this.movedPiece = null;
                this.updateStartEndMarkers();
                if (this.dragablePiece) {
                    Svg.removeElement(this.dragablePiece);
                    this.dragablePiece = null;
                }
                if (this.pointerMoveListener) {
                    window.removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener);
                    this.pointerMoveListener = null;
                }
                if (this.pointerUpListener) {
                    window.removeEventListener(this.pointerUpListener.type, this.pointerUpListener);
                    this.pointerUpListener = null;
                }
                this.setStatus(STATUS.waitForInputStart);
                break;

            default:
                throw Error(`status ${newStatus}`);
        }
    }

    createDragablePiece(pieceName) {
        if (this.dragablePiece) {
            throw Error("dragablePiece exists");
        }
        this.dragablePiece = Svg.createSvg(document.body);
        this.dragablePiece.setAttribute("width", this.view.squareWidth);
        this.dragablePiece.setAttribute("height", this.view.squareHeight);
        this.dragablePiece.setAttribute("style", "pointer-events: none");
        this.dragablePiece.name = pieceName;
        const piece = Svg.addElement(this.dragablePiece, "use", {
            href: `#${pieceName}`
        });
        const scaling = this.view.squareHeight / this.config.sprite.grid;
        const transformScale = (this.dragablePiece.createSVGTransform());
        transformScale.setScale(scaling, scaling);
        piece.transform.baseVal.appendItem(transformScale);
    }

    moveDragablePiece(x, y) {
        this.dragablePiece.setAttribute("style",
            `pointer-events: none; position: absolute; left: ${x - (this.view.squareHeight / 2)}px; top: ${y - (this.view.squareHeight / 2)}px`);
    }

    onPointerDown(e) {
        if(e.type === "mousedown" && e.button === 0 || e.type === "touchstart") {
            const index = e.target.getAttribute("data-index");
            const pieceElement = this.view.getPiece(index);
            if (index !== undefined) {
                let pieceName, color;
                if (pieceElement) {
                    pieceName = pieceElement.getAttribute("data-piece");
                    color = pieceName ? pieceName.substr(0, 1) : null;
                }
                if (this.status !== STATUS.waitForInputStart ||
                    this.model.inputWhiteEnabled && color === "w" ||
                    this.model.inputBlackEnabled && color === "b") {
                    let point;
                    if (e.type === "mousedown") {
                        point = {x: e.clientX, y: e.clientY};
                    } else if (e.type === "touchstart") {
                        point = {x: e.touches[0].clientX, y: e.touches[0].clientY};
                    }
                    if (this.status === STATUS.waitForInputStart && pieceName && this.moveStartCallback(index)) {
                        this.setStatus(STATUS.pieceClickedThreshold, {
                            index: index,
                            piece: pieceName,
                            point: point,
                            type: e.type
                        });
                    } else if (this.status === STATUS.clickTo) {
                        if (index === this.startIndex) {
                            this.setStatus(STATUS.secondClickThreshold, {
                                index: index,
                                piece: pieceName,
                                point: point,
                                type: e.type
                            });
                        } else {
                            this.setStatus(STATUS.moveDone, {index: index})
                        }
                    }
                }
            }
        }
    }

    onPointerMove(e) {
        let x, y, target;
        if (e.type === "mousemove") {
            x = e.pageX;
            y = e.pageY;
            target = e.target;
        } else if (e.type === "touchmove") {
            x = e.touches[0].pageX;
            y = e.touches[0].pageY;
            target = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
        }
        if (this.status === STATUS.pieceClickedThreshold || this.status === STATUS.secondClickThreshold) {
            if (Math.abs(this.startPoint.x - x) > DRAG_THRESHOLD || Math.abs(this.startPoint.y - y) > DRAG_THRESHOLD) {
                if (this.status === STATUS.secondClickThreshold) {
                    this.setStatus(STATUS.clickDragTo, {index: this.startIndex, piece: this.movedPiece});
                } else {
                    this.setStatus(STATUS.dragTo, {index: this.startIndex, piece: this.movedPiece});
                }
                if (this.config.moveInputMode === MOVE_INPUT_MODE.dragPiece) {
                    this.moveDragablePiece(x, y);
                }
            }
        } else if (this.status === STATUS.dragTo || this.status === STATUS.clickDragTo || this.status === STATUS.clickTo) {
            if (target && target.getAttribute && target.parentElement === this.view.boardGroup) {
                const index = target.getAttribute("data-index");
                if (index !== this.startIndex && index !== this.endIndex) {
                    this.endIndex = index;
                    this.updateStartEndMarkers();
                } else if (index === this.startIndex && this.endIndex !== null) {
                    this.endIndex = null;
                    this.updateStartEndMarkers();
                }
            } else {
                this.endIndex = null;
                this.updateStartEndMarkers();
            }
            if (this.config.moveInputMode === MOVE_INPUT_MODE.dragPiece && (this.status === STATUS.dragTo || this.status === STATUS.clickDragTo)) {
                this.moveDragablePiece(x, y);
            }
        }
    }

    onPointerUp(e) {
        let x, y, target;
        if (e.type === "mouseup") {
            target = e.target;
        } else if (e.type === "touchend") {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
            target = document.elementFromPoint(x, y);
        }
        if (target && target.getAttribute) {
            const index = target.getAttribute("data-index");

            if (index) {
                if (this.status === STATUS.dragTo || this.status === STATUS.clickDragTo) {
                    if (this.startIndex === index) {
                        if (this.status === STATUS.clickDragTo) {
                            this.model.setPiece(this.startIndex, this.movedPiece);
                            this.setStatus(STATUS.reset);
                        } else {
                            this.setStatus(STATUS.clickTo, {index: index});
                        }
                    } else {
                        this.setStatus(STATUS.moveDone, {index: index});
                    }
                } else if (this.status === STATUS.pieceClickedThreshold) {
                    this.setStatus(STATUS.clickTo, {index: index});
                } else if (this.status === STATUS.secondClickThreshold) {
                    this.setStatus(STATUS.reset);
                    this.moveCanceledCallback();
                }
            } else {
                this.view.drawPieces();
                this.setStatus(STATUS.reset);
                this.moveCanceledCallback();
            }
        } else {
            this.view.drawPieces();
            this.setStatus(STATUS.reset);
        }
    }

    updateStartEndMarkers() {
        this.model.removeMarkers(null, MARKER_TYPE.move);
        if (this.startIndex) {
            this.model.addMarker(this.startIndex, MARKER_TYPE.move);
        }
        if (this.endIndex) {
            this.model.addMarker(this.endIndex, MARKER_TYPE.move);
        }
        this.view.drawMarkers();
    }
}