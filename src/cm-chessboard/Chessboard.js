/**
 * Author: shaack
 * Date: 21.11.2017
 */
import {ChessboardView} from "./ChessboardView.js";
import {ChessboardModel} from "./ChessboardModel.js";


export const COLOR = {
    white: "white",
    black: "black"
};
export const INPUT_MODE = {
    dragFigure: 1,
    dragMarker: 2
};
export const MARKER_TYPE = {
    newMove: {slice: "marker1", opacity: 0.6},
    lastMove: {slice: "marker1", opacity: 0.5},
    emphasize: {slice: "marker2", opacity: 0.5}
};
export const FEN_START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
export const FEN_EMPTY_POSITION = "8/8/8/8/8/8/8/8";
const DEFAULT_SPRITE_GRID = 40;

export class Chessboard {

    constructor(containerElement, config = {}, createCallback) {
        this._config = {
            position: null,
            orientation: COLOR.white, // white on bottom
            showCoordinates: true,
            responsive: false, // detect window resize
            inputMode: INPUT_MODE.dragFigure, // type of interactive movement with mouse or tap
            sprite: {
                file: "../assets/sprite.svg", // figures and markers
                grid: DEFAULT_SPRITE_GRID, // one figure every 40 px
            },
            events: {
                beforeInput: null, // callback, before figure move input
                afterInput: null // callback after figure move input
            }
        };
        Object.assign(this._config, config);
        if (!this._config.sprite.grid) {
            this._config.sprite.grid = DEFAULT_SPRITE_GRID;
        }
        this._model = new ChessboardModel();
        this._view = new ChessboardView(containerElement, this._model, this._config, () => {
            this.setPosition(this._config.position);
            this.setOrientation(this._config.orientation);
            this._model.inputMode = this._config.inputMode;
            this._view.setNeedsRedraw();
            createCallback ? createCallback() : null;
        }, this._inputCallback);
        this._view.setNeedsRedraw();
    }

    // API

    addMarker(square, type = MARKER_TYPE.emphasize) {
        this._model.addMarker(square, type);
        this._view.setNeedsRedraw();
    }

    /**
     * Set field to null to remove all marker from squares.
     * Set type to null, to remove all types.
     * @param field
     * @param type
     */
    removeMarker(field = null, type = MARKER_TYPE.emphasize) {
        this._model.removeMarker(field, type);
        this._view.setNeedsRedraw();
    }

    getSquare(square) {
        return this._model.getSquare(square);
    }

    setPosition(fen) {
        if (fen === "start") {
            this._model.setPosition(FEN_START_POSITION);
        } else if (fen === "empty") {
            this._model.setPosition(FEN_EMPTY_POSITION);
        } else {
            this._model.setPosition(fen);
        }
        this._view.setNeedsRedraw();
    }

    getPosition() {
        return this._model.getPosition();
    }

    setOrientation(color) {
        this._model.orientation = color;
        this._view.setNeedsRedraw();
    }

    getOrientation() {
        return this._model.orientation;
    }

    remove() {
        this._view.remove();
    }

    /**
     * Enables moves via user input, mouse or touch
     * @param color
     * @param enable
     */
    enableInput(color, enable) {
        if (color === COLOR.white) {
            this._model.inputWhiteEnabled = enable;
        } else if (color === COLOR.black) {
            this._model.inputBlackEnabled = enable;
        }
        this._view.setNeedsRedraw();
    }

    // Private
    _enablePointerEvents() {
        // find fields with figures
    }

    _inputCallback(name, e) {
        console.log("_inputCallback", name, e);
        if (name === "pointerdown") {

        }
    }

}