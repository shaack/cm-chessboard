/**
 * Author: shaack
 * Date: 05.12.2017
 */

import {Svg} from "../../node_modules/svjs-svg/src/svjs/Svg.js";
import {MARKER_TYPE} from "./Chessboard.js";

const STATUS = {
    waitForInput: 0,
    modeThreshold: 1,
    clickMode: 2,
    dragMode: 3
};

const DRAG_THRESHOLD = 2;

export class ChessboardMoveInput {
    constructor(view, model, config, moveDoneCallback) {
        this._view = view;
        this._model = model;
        this._config = config;
        this._moveDoneCallback = moveDoneCallback;
        this._status = STATUS.waitForInput;
        this._figure = null;
        this._startX = null;
        this._startY = null;
        this.startSquare = null;
        this.endSquare = null;

    }

    moveDragableFigure(pointerX, pointerY) {
        this.dragable.setAttribute("style", "pointer-events: none; position: absolute; " +
            "left: " + (pointerX - (this._view.squareHeight / 2)) + "px; " +
            "top: " + (pointerY - (this._view.squareHeight / 2)) + "px");
    }

    onMousemove(e) {
        if(this._status === STATUS.modeThreshold) {
            if(Math.abs(this._startX - e.clientX) > DRAG_THRESHOLD || Math.abs(this._startY - e.clientY) > DRAG_THRESHOLD) {
                const square = e.path[1].getAttribute("data-square");
                const figureName = e.path[1].getAttribute("data-figure");
                this._status = STATUS.dragMode;
                // copy figure
                this.dragable = Svg.createSvg(document.body);
                this.dragable.setAttribute("width", this._view.squareWidth);
                this.dragable.setAttribute("height", this._view.squareHeight);
                this.dragable.setAttribute("style", "pointer-events: none");
                this.dragable.figureName = figureName;
                const figure = Svg.addElement(this.dragable, "use", {
                    "href": "#" + figureName
                });
                const scaling = this._view.squareHeight / this._config.sprite.grid;
                const transformScale = (this.dragable.createSVGTransform());
                transformScale.setScale(scaling, scaling);
                figure.transform.baseVal.appendItem(transformScale);
                this.moveDragableFigure(e.clientX, e.clientY);
                this._model.setSquare(square, "");
                this._view.setNeedsRedraw();
            }
        }
        if(this._status === STATUS.dragMode) {
            if(e.path[1].getAttribute) {
                const square = e.path[1].getAttribute("data-square");
                if (square !== this.startSquare && square !== this.endSquare) {
                    this.endSquare = square;
                    this.drawMarker();
                } else if (square === this.startSquare && this.endSquare !== null) {
                    this.endSquare = null;
                    this.drawMarker();
                }
            }
            this.moveDragableFigure(e.clientX, e.clientY);
        }
    }

    onMouseup(e) {
        const square = e.path[1].getAttribute("data-square");
        this.endSquare = square;
        if(this.endSquare === this.startSquare && this._status === STATUS.dragMode) {
            this.startSquare = null;
            this.endSquare = null;
            this.drawMarker();
        }
        window.removeEventListener("mousemove", this._mousemoveListener);
        window.removeEventListener("mouseup", this._mouseupListener);
        this._mousemoveListener = null;
        this._mouseupListener = null;

        this._model.setSquare(square, this.dragable.figureName);
        Svg.removeElement(this.dragable);
        this._model.removeMarker(null, MARKER_TYPE.newMove);
        this._view.setNeedsRedraw();
    }

    pointerDown(square, figure, e) {
        if(this._status === STATUS.waitForInput) {
            this._status = STATUS.modeThreshold;
            this.startSquare = square;
            this.drawMarker();
            if(e.type === "mousedown" && !this._mousemoveListener && !this._mouseupListener) {
                this._startX = e.clientX;
                this._startY = e.clientY;
                this._mousemoveListener = this.onMousemove.bind(this);
                window.addEventListener("mousemove", this._mousemoveListener);
                this._mouseupListener = this.onMouseup.bind(this);
                window.addEventListener("mouseup", this._mouseupListener);
            }
        }
        //
    }

    drawMarker() {
        this._model.removeMarker(null, MARKER_TYPE.newMove);
        if(this.startSquare) {
            this._model.addMarker(this.startSquare, MARKER_TYPE.newMove);
        }
        if(this.endSquare) {
            this._model.addMarker(this.endSquare, MARKER_TYPE.newMove);
        }
        this._view.setNeedsRedraw();
    }
}