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
    lastMove: {slice: "marker1", opacity: 0.2},
    emphasize: {slice: "marker2", opacity: 0.6}
};
export const FIGURE = {
    whitePawn: "wp",
    whiteBishop: "wb",
    whiteKnight: "wn",
    whiteRook: "wr",
    whiteQueen: "wq",
    whiteKing: "wk",
    blackPawn: "bp",
    blackBishop: "bb",
    blackKnight: "bn",
    blackRook: "br",
    blackQueen: "bq",
    blackKing: "bk",
};
export const FEN_START_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
export const FEN_EMPTY_POSITION = "8/8/8/8/8/8/8/8";

export class Chessboard {

    constructor(containerElement, config = {}, createCallback) {
        const DEFAULT_SPRITE_GRID = 40;
        this._config = {
            position: null, // empty board
            orientation: COLOR.white, // white on bottom
            showCoordinates: true, // show ranks and files
            responsive: false, // detect window resize
            inputMode: INPUT_MODE.dragFigure, // type of interactive movement
            sprite: {
                file: "../assets/sprite.svg", // figures and markers
                grid: DEFAULT_SPRITE_GRID, // one figure every 40 px
            },
            events: {
                inputStart: null, // callback, before figure move input
                inputDone: null // callback after figure move input
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
    removeMarker(field = null, type = null) {
        this._model.removeMarker(field, type);
        this._view.setNeedsRedraw();
    }

    setSquare(square, figure) {
        this._model.setSquare(square, figure);
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

    destroy() {
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

}