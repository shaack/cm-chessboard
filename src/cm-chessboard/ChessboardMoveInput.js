/**
 * Author: shaack
 * Date: 06.12.2017
 */

import {Svg} from "../../node_modules/svjs-svg/src/svjs/Svg.js";
import {MARKER_TYPE} from "./Chessboard.js";

const STATUS = {
    waitForInputStart: 0,
    figureClickedThreshold: 1,
    clickTo: 2,
    secondClickThreshold: 3,
    dragTo: 4,
    clickDragTo: 5,
    moveDone: 6,
    reset: 7
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

        // console.log("setStatus",  Object.keys(STATUS)[this._status], "=>",  Object.keys(STATUS)[newStatus]);

        const prevStatus = this._status;
        this._status = newStatus;

        switch (newStatus) {

            case STATUS.waitForInputStart:
                break;

            case STATUS.figureClickedThreshold:
                if ([STATUS.waitForInputStart].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.startSquare = params.square;
                this.endSquare = null;
                this.movedFigure = params.figure;
                this.updateStartEndMarker();
                this._startX = params.x;
                this._startY = params.y;
                if (!this._pointerMoveListener && !this._pointerUpListener) {
                    if (params.type === "mousedown") {

                        this._pointerMoveListener = this.onPointerMove.bind(this);
                        this._pointerMoveListener.type = "mousemove";
                        window.addEventListener("mousemove", this._pointerMoveListener);

                        this._pointerUpListener = this.onPointerUp.bind(this);
                        this._pointerUpListener.type = "mouseup";
                        window.addEventListener("mouseup", this._pointerUpListener);

                    } else if (params.type === "touchstart") {

                        this._pointerMoveListener = this.onPointerMove.bind(this);
                        this._pointerMoveListener.type = "touchmove";
                        window.addEventListener("touchmove", this._pointerMoveListener);

                        this._pointerUpListener = this.onPointerUp.bind(this);
                        this._pointerUpListener.type = "touchend";
                        window.addEventListener("touchend", this._pointerUpListener);

                    } else {
                        throw Error("event type");
                    }
                } else {
                    throw Error("_pointerMoveListener or _pointerUpListener");
                }
                break;

            case STATUS.clickTo:
                if (this.dragableFigure) {
                    Svg.removeElement(this.dragableFigure);
                    this.dragableFigure = null;
                }
                if (prevStatus === STATUS.dragTo) {
                    this._view.setFigureVisible(params.square);
                }
                /*
                if (this.movedFigure) {
                    this._model.setSquare(params.square, this.movedFigure);
                } else {
                    this.movedFigure = params.figure;
                }
                */
                // this._view.setNeedsRedraw();
                break;

            case STATUS.secondClickThreshold:
                if ([STATUS.clickTo].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this._startX = params.x;
                this._startY = params.y;
                break;

            case STATUS.dragTo:
                if ([STATUS.figureClickedThreshold].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this._view.setFigureVisible(params.square, false);
                this.createDragableFigure(params.figure);
                break;

            case STATUS.clickDragTo:
                if ([STATUS.secondClickThreshold].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this._view.setFigureVisible(params.square, false);
                this.createDragableFigure(params.figure);
                break;

            case STATUS.moveDone:
                if ([STATUS.dragTo, STATUS.clickTo, STATUS.clickDragTo].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.endSquare = params.square;
                if (this.endSquare && this._moveDoneCallback(this.startSquare, this.endSquare)) {
                    this._model.setSquare(this.endSquare, this.movedFigure);
                    this._model.setSquare(this.startSquare, "");
                    this.setStatus(STATUS.reset);
                } else {
                    this.setStatus(STATUS.reset);
                }
                break;

            case STATUS.reset:
                if (this.startSquare && !this.endSquare && this.movedFigure) {
                    this._model.setSquare(this.startSquare, this.movedFigure);
                }
                this.startSquare = null;
                this.endSquare = null;
                this.movedFigure = null;
                this.updateStartEndMarker();
                if (this.dragableFigure) {
                    Svg.removeElement(this.dragableFigure);
                    this.dragableFigure = null;
                }
                if (this._pointerMoveListener) {
                    window.removeEventListener(this._pointerMoveListener.type, this._pointerMoveListener);
                    this._pointerMoveListener = null;
                }
                if (this._pointerUpListener) {
                    window.removeEventListener(this._pointerUpListener.type, this._pointerUpListener);
                    this._pointerUpListener = null;
                }
                this._view.setNeedsRedraw();
                this.setStatus(STATUS.waitForInputStart);
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

    onPointerDown(e) {
        const square = e.target.parentElement.getAttribute("data-square");
        const figure = e.target.parentElement.getAttribute("data-figure");
        if (square) {
            const color = figure ? figure.substr(0, 1) : null;
            if (this._status !== STATUS.waitForInputStart ||
                this._model.inputWhiteEnabled && color === "w" ||
                this._model.inputBlackEnabled && color === "b") {
                let x, y;
                if (e.type === "mousedown") {
                    x = e.clientX;
                    y = e.clientY;
                } else if (e.type === "touchstart") {
                    x = e.touches[0].clientX;
                    y = e.touches[0].clientY;
                }
                if (this._status === STATUS.waitForInputStart && figure && this._moveStartCallback(square)) {
                    this.setStatus(STATUS.figureClickedThreshold, {
                        square: square,
                        figure: figure,
                        x: x,
                        y: y,
                        type: e.type
                    });
                } else if (this._status === STATUS.clickTo) {
                    if (square === this.startSquare) {
                        this.setStatus(STATUS.secondClickThreshold, {
                            square: square,
                            figure: figure,
                            x: x,
                            y: y,
                            type: e.type
                        });
                    } else {
                        this.setStatus(STATUS.moveDone, {square: square})
                    }
                }
            }
        }
    }

    onPointerMove(e) {
        let x, y, targetGroup;
        if (e.type === "mousemove") {
            x = e.clientX;
            y = e.clientY;
            targetGroup = e.target.parentElement;
        } else if (e.type === "touchmove") {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
            const touchTarget = document.elementFromPoint(x, y);
            targetGroup = touchTarget.parentElement;
        }
        if (this._status === STATUS.figureClickedThreshold || this._status === STATUS.secondClickThreshold) {
            if (Math.abs(this._startX - x) > DRAG_THRESHOLD || Math.abs(this._startY - y) > DRAG_THRESHOLD) {
                const square = targetGroup.getAttribute("data-square");
                const figureName = targetGroup.getAttribute("data-figure");
                if (this._status === STATUS.secondClickThreshold) {
                    this.setStatus(STATUS.clickDragTo, {square: square, figure: figureName});
                } else {
                    this.setStatus(STATUS.dragTo, {square: square, figure: figureName});
                }
                this.moveDragableFigure(x, y);
            }
        } else if (this._status === STATUS.dragTo || this._status === STATUS.clickDragTo || this._status === STATUS.clickTo) {
            if (targetGroup && targetGroup.getAttribute) {
                const square = targetGroup.getAttribute("data-square");
                if (square !== this.startSquare && square !== this.endSquare) {
                    this.endSquare = square;
                    this.updateStartEndMarker();
                } else if (square === this.startSquare && this.endSquare !== null) {
                    this.endSquare = null;
                    this.updateStartEndMarker();
                }
            } else {
                this.endSquare = null;
                this.updateStartEndMarker();
            }
            if (this._status === STATUS.dragTo || this._status === STATUS.clickDragTo) {
                this.moveDragableFigure(x, y);
            }
        }
    }

    onPointerUp(e) {
        let x, y, targetGroup;
        if (e.type === "mouseup") {
            targetGroup = e.target.parentElement;
        } else if (e.type === "touchend") {
            x = e.changedTouches[0].clientX;
            y = e.changedTouches[0].clientY;
            const touchTarget = document.elementFromPoint(x, y);
            targetGroup = touchTarget.parentElement;
        }
        if (targetGroup && targetGroup.getAttribute) {
            const square = targetGroup.getAttribute("data-square");

            if (square) {
                if (this._status === STATUS.dragTo || this._status === STATUS.clickDragTo) {
                    if (this.startSquare === square) {
                        if (this._status === STATUS.clickDragTo) {
                            this._model.setSquare(this.startSquare, this.movedFigure);
                            this.setStatus(STATUS.reset);
                        } else {
                            this.setStatus(STATUS.clickTo, {square: square});
                        }
                    } else {
                        this.setStatus(STATUS.moveDone, {square: square});
                    }
                } else if (this._status === STATUS.figureClickedThreshold) {
                    this.setStatus(STATUS.clickTo, {square: square});
                } else if (this._status === STATUS.secondClickThreshold) {
                    this.setStatus(STATUS.reset);
                }
            } else {
                this.setStatus(STATUS.reset);
            }
        } else {
            this.setStatus(STATUS.reset);
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
        this._view.drawMarkers();
    }
}