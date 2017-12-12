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
        this.view = view;
        this.model = model;
        this.config = config;
        this.moveStartCallback = moveStartCallback;
        this.moveDoneCallback = moveDoneCallback;
        this.setStatus(STATUS.waitForInputStart);
    }

    setStatus(newStatus, params = null) {

        // console.log("setStatus",  Object.keys(STATUS)[this._status], "=>",  Object.keys(STATUS)[newStatus]);

        const prevStatus = this.status;
        this.status = newStatus;

        switch (newStatus) {

            case STATUS.waitForInputStart:
                break;

            case STATUS.figureClickedThreshold:
                if ([STATUS.waitForInputStart].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.startIndex = params.index;
                this.endIndex = null;
                this.movedFigure = params.figure;
                this.updateStartEndMarker();
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
                if (this.dragableFigure) {
                    Svg.removeElement(this.dragableFigure);
                    this.dragableFigure = null;
                }
                if (prevStatus === STATUS.dragTo) {
                    this.view.setFigureVisibility(params.index);
                }
                break;

            case STATUS.secondClickThreshold:
                if ([STATUS.clickTo].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.startPoint = params.point;
                break;

            case STATUS.dragTo:
                if ([STATUS.figureClickedThreshold].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.view.setFigureVisibility(params.index, false);
                this.createDragableFigure(params.figure);
                break;

            case STATUS.clickDragTo:
                if ([STATUS.secondClickThreshold].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.view.setFigureVisibility(params.index, false);
                this.createDragableFigure(params.figure);
                break;

            case STATUS.moveDone:
                if ([STATUS.dragTo, STATUS.clickTo, STATUS.clickDragTo].indexOf(prevStatus) === -1) {
                    throw new Error("status");
                }
                this.endIndex = params.index;
                if (this.endIndex && this.moveDoneCallback(this.startIndex, this.endIndex)) {
                    this.model.setSquare(this.endIndex, this.movedFigure);
                    this.model.setSquare(this.startIndex, "");
                    this.setStatus(STATUS.reset);
                } else {
                    this.setStatus(STATUS.reset);
                }
                break;

            case STATUS.reset:
                if (this.startIndex && !this.endIndex && this.movedFigure) {
                    this.model.setSquare(this.startIndex, this.movedFigure);
                }
                this.startIndex = null;
                this.endIndex = null;
                this.movedFigure = null;
                this.updateStartEndMarker();
                if (this.dragableFigure) {
                    Svg.removeElement(this.dragableFigure);
                    this.dragableFigure = null;
                }
                if (this.pointerMoveListener) {
                    window.removeEventListener(this.pointerMoveListener.type, this.pointerMoveListener);
                    this.pointerMoveListener = null;
                }
                if (this.pointerUpListener) {
                    window.removeEventListener(this.pointerUpListener.type, this.pointerUpListener);
                    this.pointerUpListener = null;
                }
                this.view.setNeedsRedraw();
                this.setStatus(STATUS.waitForInputStart);
                break;

            default:
                throw Error("status " + newStatus);
        }
    }

    createDragableFigure(figureName) {
        if (this.dragableFigure) {
            throw Error("dragableFigure exists");
        }
        this.dragableFigure = Svg.createSvg(document.body);
        this.dragableFigure.setAttribute("width", this.view.squareWidth);
        this.dragableFigure.setAttribute("height", this.view.squareHeight);
        this.dragableFigure.setAttribute("style", "pointer-events: none");
        const figure = Svg.addElement(this.dragableFigure, "use", {
            "href": "#" + figureName
        });
        const scaling = this.view.squareHeight / this.config.sprite.grid;
        const transformScale = (this.dragableFigure.createSVGTransform());
        transformScale.setScale(scaling, scaling);
        figure.transform.baseVal.appendItem(transformScale);
    }

    moveDragableFigure(x, y) {
        this.dragableFigure.setAttribute("style", "pointer-events: none; position: absolute; " +
            "left: " + (x - (this.view.squareHeight / 2)) + "px; " +
            "top: " + (y - (this.view.squareHeight / 2)) + "px");
    }

    onPointerDown(e) {
        // console.log("onPointerDown", e);
        const index = e.target.getAttribute("data-index");
        const figureElement = this.view.getFigure(index);
        const figureName = figureElement.getAttribute("data-figure");
        if (index !== undefined) {
            const color = figureName ? figureName.substr(0, 1) : null;
            if (this.status !== STATUS.waitForInputStart ||
                this.model.inputWhiteEnabled && color === "w" ||
                this.model.inputBlackEnabled && color === "b") {
                let point;
                if (e.type === "mousedown") {
                    point = {x: e.clientX, y: e.clientY};
                } else if (e.type === "touchstart") {
                    point = {x: e.touches[0].clientX, y: e.touches[0].clientY};
                }
                if (this.status === STATUS.waitForInputStart && figureName && this.moveStartCallback(index)) {
                    this.setStatus(STATUS.figureClickedThreshold, {
                        index: index,
                        figure: figureName,
                        point: point,
                        type: e.type
                    });
                } else if (this.status === STATUS.clickTo) {
                    if (index === this.startIndex) {
                        this.setStatus(STATUS.secondClickThreshold, {
                            index: index,
                            figure: figureName,
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

    onPointerMove(e) {
        let x, y, targetSquare;
        if (e.type === "mousemove") {
            x = e.pageX;
            y = e.pageY;
            targetSquare = e.target.parentElement;
        } else if (e.type === "touchmove") {
            x = e.touches[0].pageX;
            y = e.touches[0].pageY;
            const touchTarget = document.elementFromPoint(x, y);
            targetSquare = touchTarget.parentElement;
        }
        if (this.status === STATUS.figureClickedThreshold || this.status === STATUS.secondClickThreshold) {
            if (Math.abs(this.startPoint.x - x) > DRAG_THRESHOLD || Math.abs(this.startPoint.y - y) > DRAG_THRESHOLD) {
                if (this.status === STATUS.secondClickThreshold) {
                    this.setStatus(STATUS.clickDragTo, {index: this.startIndex, figure: this.movedFigure});
                } else {
                    this.setStatus(STATUS.dragTo, {index: this.startIndex, figure: this.movedFigure});
                }
                this.moveDragableFigure(x, y);
            }
        } else if (this.status === STATUS.dragTo || this.status === STATUS.clickDragTo || this.status === STATUS.clickTo) {
            if (targetSquare && targetSquare.getAttribute) {
                const index = targetSquare.getAttribute("data-index");
                if (index !== this.startIndex && index !== this.endIndex) {
                    this.endIndex = index;
                    this.updateStartEndMarker();
                } else if (index === this.startIndex && this.endIndex !== null) {
                    this.endIndex = null;
                    this.updateStartEndMarker();
                }
            } else {
                this.endIndex = null;
                this.updateStartEndMarker();
            }
            if (this.status === STATUS.dragTo || this.status === STATUS.clickDragTo) {
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
                if (this.status === STATUS.dragTo || this.status === STATUS.clickDragTo) {
                    if (this.startIndex === square) {
                        if (this.status === STATUS.clickDragTo) {
                            this.model.setSquare(this.startIndex, this.movedFigure);
                            this.setStatus(STATUS.reset);
                        } else {
                            this.setStatus(STATUS.clickTo, {square: square});
                        }
                    } else {
                        this.setStatus(STATUS.moveDone, {square: square});
                    }
                } else if (this.status === STATUS.figureClickedThreshold) {
                    this.setStatus(STATUS.clickTo, {square: square});
                } else if (this.status === STATUS.secondClickThreshold) {
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
        this.model.removeMarker(null, MARKER_TYPE.newMove);
        if (this.startIndex) {
            this.model.addMarker(this.startIndex, MARKER_TYPE.newMove);
        }
        if (this.endIndex) {
            this.model.addMarker(this.endIndex, MARKER_TYPE.newMove);
        }
        this.view.redrawMarkers();
    }
}