/**
 * Author: shaack
 * Date: 06.12.2017
 */

import {Svg} from "../../node_modules/svjs-svg/src/svjs/Svg.js";
import {MARKER_TYPE} from "./Chessboard.js";

const STATUS = {
    waitForInputStart: 0,
    threshold: 1,
    secondClick: 2,
    dragTo: 3,
    moveDone: 4,
    reset: 5
};

const POINTER_TYPE = {
    mouse: 1,
    touch: 2
};

const DRAG_THRESHOLD = 2;

export class ChessboardMoveInput {

    constructor(view, model, config, moveStartCallback, moveDoneCallback) {
        this._view = view;
        this._model = model;
        this._config = config;
        this._moveStartCallback = moveStartCallback;
        this._moveDoneCallback = moveDoneCallback;
        this.setStatus(STATUS.waitForInputStart);
    }

    setStatus(newStatus, params = null) {

        console.log("setStatus", this._status, newStatus);

        const prevStatus = this._status;
        this._status = newStatus;

        switch (newStatus) {

            case STATUS.reset:
                this.startSquare = null;
                this.endSquare = null;
                this.movedFigure = null;
                this.updateStartEndMarker();
                if (this.dragableFigure) {
                    Svg.removeElement(this.dragableFigure);
                    this.dragableFigure = null;
                }
                if (this._mousemoveListener) {
                    window.removeEventListener("mousemove", this._mousemoveListener);
                    this._mousemoveListener = null;
                }
                if (!this._mouseupListener) {
                    window.removeEventListener("mouseup", this._mouseupListener);
                    this._mouseupListener = null;
                }
                this.setStatus(STATUS.waitForInputStart);
                break;

            case STATUS.waitForInputStart:
                break;

            case STATUS.threshold:
                if ([STATUS.waitForInputStart].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.startSquare = params.square;
                this.endSquare = null;
                this.movedFigure = params.figure;
                this.updateStartEndMarker();
                if (params.e.type === "mousedown" && !this._mousemoveListener && !this._mouseupListener) {
                    this._startX = params.e.clientX;
                    this._startY = params.e.clientY;
                    this._pointerMoveListener = this.onPointerMove.bind(this);
                    window.addEventListener("mousemove", this._pointerMoveListener);
                    this._pointerUpListener = this.onPointerUp.bind(this);
                    window.addEventListener("mouseup", this._pointerUpListener);
                }
                break;

            case STATUS.secondClick:
                if (this.dragableFigure) {
                    Svg.removeElement(this.dragableFigure);
                    this.dragableFigure = null;
                }
                if(this.movedFigure) {
                    this._model.setSquare(params.square, this.movedFigure);
                } else {
                    this.movedFigure = params.figure;
                }
                this._view.setNeedsRedraw();
                break;

            case STATUS.dragTo:
                if ([STATUS.threshold].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this._model.setSquare(params.square, "");
                this.createDragableFigure(params.figure);
                this._view.setNeedsRedraw();
                break;

            case STATUS.moveDone:
                if ([STATUS.dragTo, STATUS.secondClick].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.endSquare = params.square;
                if (this._moveDoneCallback(this.startSquare, this.endSquare)) {
                    this._model.setSquare(this.endSquare, this.movedFigure);
                    this._model.setSquare(this.startSquare, "");
                    this.setStatus(STATUS.reset);
                } else {
                    this._model.setSquare(this.startSquare, this.movedFigure);
                    this.setStatus(STATUS.reset);
                }
                break;

            default:
                throw Error("status " + newStatus);
        }
    }

    createDragableFigure(figureName) {
        if (this.dragableFigure) {
            throw Error("dragableFigure");
        }
        this.dragableFigure = Svg.createSvg(document.body);
        this.dragableFigure.setAttribute("width", this._view.squareWidth);
        this.dragableFigure.setAttribute("height", this._view.squareHeight);
        this.dragableFigure.setAttribute("style", "pointer-events: none");
        this.figureName = figureName;
        const figure = Svg.addElement(this.dragableFigure, "use", {
            "href": "#" + figureName
        });
        const scaling = this._view.squareHeight / this._config.sprite.grid;
        const transformScale = (this.dragableFigure.createSVGTransform());
        transformScale.setScale(scaling, scaling);
        figure.transform.baseVal.appendItem(transformScale);
    }

    moveDragableFigure(x, y) {
        this.dragableFigure.setAttribute("style", "pointer-events: none; position: absolute; " +
            "left: " + (x - (this._view.squareHeight / 2)) + "px; " +
            "top: " + (y - (this._view.squareHeight / 2)) + "px");
    }

    /**
     * called from view, click on `mainGroup`
     */
    onPointerDown(e) {
        const square = e.path[1].getAttribute("data-square");
        const figure = e.path[1].getAttribute("data-figure");

        if (square) {
            if (this._status === STATUS.waitForInputStart && figure && this._moveStartCallback(square)) {
                this.setStatus(STATUS.threshold, {square: square, figure: figure, e: e});

            } else if (this._status === STATUS.secondClick) {
                if (square === this.startSquare) {
                    this.setStatus(STATUS.waitForInputStart);
                } else {
                    this.setStatus(STATUS.moveDone, {square: square})
                }
            }
        }
    }

    onPointerMove(e) {
        if (this._status === STATUS.threshold) {
            if (Math.abs(this._startX - e.clientX) > DRAG_THRESHOLD || Math.abs(this._startY - e.clientY) > DRAG_THRESHOLD) {
                const square = e.path[1].getAttribute("data-square");
                const figureName = e.path[1].getAttribute("data-figure");
                this.setStatus(STATUS.dragTo, {square: square, figure: figureName});
                this.moveDragableFigure(e.clientX, e.clientY);
            }
        } else if (this._status === STATUS.dragTo || this._status === STATUS.secondClick) {
            if (e.path[1].getAttribute) {
                const square = e.path[1].getAttribute("data-square");
                if (square !== this.startSquare && square !== this.endSquare) {
                    this.endSquare = square;
                    this.updateStartEndMarker();
                } else if (square === this.startSquare && this.endSquare !== null) {
                    this.endSquare = null;
                    this.updateStartEndMarker();
                }
            }
            if(this._status === STATUS.dragTo) {
                this.moveDragableFigure(e.clientX, e.clientY);
            }
        }
    }

    onPointerUp(e) {
        const square = e.path[1].getAttribute("data-square");
        if (this._status === STATUS.dragTo) {
            if(this.startSquare === square) {
                this.setStatus(STATUS.secondClick, {square: square});
            } else {
                this.setStatus(STATUS.moveDone, {square: square});
            }
        } else if (this._status === STATUS.threshold) {
            this.setStatus(STATUS.secondClick, {square: square});
        }
    }

    updateStartEndMarker() {
        this._model.removeMarker(null, MARKER_TYPE.newMove);
        if (this.startSquare) {
            this._model.addMarker(this.startSquare, MARKER_TYPE.newMove);
        }
        if (this.endSquare) {
            this._model.addMarker(this.endSquare, MARKER_TYPE.newMove);
        }
        this._view.setNeedsRedraw();
    }
}