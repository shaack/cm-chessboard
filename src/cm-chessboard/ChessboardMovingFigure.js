/**
 * Author: shaack
 * Date: 05.12.2017
 */

import {MARKER_TYPE} from "./Chessboard.js";

const STATUS = {
    waitForInput: 0,
    testForMode: 1,
    clickMode: 2,
    dragMode: 3
};

export class ChessboardMovingFigure {
    constructor(view, model, config) {
        this._view = view;
        this._model = model;
        this._config = config;
        this._status = STATUS.waitForInput;
    }
    pointerDown(square, e) {
        if(this._status = STATUS.waitForInput) {
            this._status = STATUS.testForMode;
        }
        this._model.addMarker(square, MARKER_TYPE.newMove);
        this._view.setNeedsRedraw();
    }
}