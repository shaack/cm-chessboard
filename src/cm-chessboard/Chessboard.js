/**
 * Author: shaack
 * Date: 21.11.2017
 */
import {ChessboardView} from "./ChessboardView.js";
import {ChessboardModel} from "./ChessboardModel.js";
import {ChessboardFigureAnimation} from "./ChessboardFigureAnimation.js";

export const COLOR = {
    white: "white",
    black: "black"
};
export const INPUT_MODE = {
    dragFigure: 1,
    dragMarker: 2 // TODO
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

    constructor(containerElement, config = {}, callback = null) {
        const DEFAULT_SPRITE_GRID = 40;
        this.config = {
            position: "empty", // empty board, set as fen or "start" or "empty"
            orientation: COLOR.white, // white on bottom
            showCoordinates: true, // show ranks and files
            responsive: false, // detect window resize, if true
            inputMode: INPUT_MODE.dragFigure, // type of interactive movement
            animationDuration: 1000, //
            sprite: {
                file: "../assets/sprite.svg", // figures and markers
                grid: DEFAULT_SPRITE_GRID, // one figure every 40 px
            },
            events: {
                inputStart: null, // callback, before figure move input
                inputDone: null // callback after figure move input
            }
        };
        Object.assign(this.config, config);
        if (!this.config.sprite.grid) {
            this.config.sprite.grid = DEFAULT_SPRITE_GRID;
        }
        this.model = new ChessboardModel();
        this.view = new ChessboardView(containerElement, this.model, this.config, () => {
            this.setPosition(this.config.position, false);
            this.setOrientation(this.config.orientation);
            this.model.inputMode = this.config.inputMode;
            this.view.setNeedsRedraw();
            callback ? callback() : null;
        });
        this.view.setNeedsRedraw();
    }

    // API //

    addMarker(square, type = MARKER_TYPE.emphasize) {
        this.model.addMarker(square, type);
        this.view.setNeedsRedraw();
    }

    removeMarker(field = null, type = null) {
        this.model.removeMarker(field, type);
        this.view.setNeedsRedraw();
    }

    setSquare(square, figure) {
        this.model.setSquare(square, figure);
    }

    getSquare(square) {
        return this.model.squares[this.model.squareToIndex(square)];
    }

    move(fromSquare, toSquare) { // TODO
    }

    setPosition(fen, animated = true, callback = null) {
        const prevBoard = this.model.squares.slice(0); // clone
        if (fen === "start") {
            this.model.setPosition(FEN_START_POSITION);
        } else if (fen === "empty" || fen === null) {
            this.model.setPosition(FEN_EMPTY_POSITION);
        } else {
            this.model.setPosition(fen);
        }
        if(animated) {
            new ChessboardFigureAnimation(this.view, prevBoard, this.model.squares, 300, () => {
                this.view.redrawFigures();
                if(callback) {
                    callback();
                }
            })
        } else {
            this.view.setNeedsRedraw();
        }
    }

    getPosition() {
        return this.model.getPosition();
    }

    setOrientation(color) {
        this.model.orientation = color;
        this.view.setNeedsRedraw();
    }

    getOrientation() {
        return this.model.orientation;
    }

    destroy() {
        this.view.remove();
    }

    enableInput(color, enable) {
        if (color === COLOR.white) {
            this.model.inputWhiteEnabled = enable;
        } else if (color === COLOR.black) {
            this.model.inputBlackEnabled = enable;
        }
        if(this.model.inputWhiteEnabled || this.model.inputBlackEnabled) {
            this.view.boardGroup.setAttribute("class", "board-group input-enabled");
        } else {
            this.view.boardGroup.setAttribute("class", "board-group");
        }
    }

}