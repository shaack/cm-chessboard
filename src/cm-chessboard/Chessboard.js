/**
 * Author: shaack
 * Date: 21.11.2017
 */
import {ChessboardView} from "./ChessboardView.js";
import {ChessboardModel} from "./ChessboardModel.js";
import {Svg} from "../../node_modules/svjs-svg/src/svjs/Svg.js";

export const COLOR = {
    white: "white",
    black: "black"
};
export const MOVE_INPUT_MODE = {
    viewOnly: 0,
    dragPiece: 1,
    dragMarker: 2
};
export const MARKER_TYPE = {
    newMove: {slice: "marker1", opacity: 0.8},
    lastMove: {slice: "marker1", opacity: 0.5},
    emphasize: {slice: "marker2", opacity: 0.6}
};
export const PIECE = {
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
            position: "empty", // set as fen or "start" or "empty"
            orientation: COLOR.white, // white on bottom
            showCoordinates: true, // show ranks and files
            responsive: false, // detects window resize, if true
            animationDuration: 300, // in milliseconds
            // contextInputEnabled: false, // allow context input on a square via right click or context touch
            moveInputMode: MOVE_INPUT_MODE.viewOnly, // set to MOVE_INPUT_MODE.dragPiece '1' or MOVE_INPUT_MODE.dragMarker '2' for interactive movement
            events: {
                moveInputStart: null, // callback(square), before piece move input, return false to cancel move
                moveInputDone: null, // callback(squareFrom, squareTo), after piece move input, return false to cancel move
                // contextInput: null // callback(square), on right click/context touch
            },
            sprite: {
                file: "../assets/sprite.svg", // pieces and markers
                grid: DEFAULT_SPRITE_GRID // one piece every 40px
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
            this.model.moveInputMode = this.config.moveInputMode;
            this.view.setNeedsRedraw();
            if(callback) {
                setTimeout(() => {
                    callback(this);
                });
            }
        });
        this.view.setNeedsRedraw();
    }

    // API //

    setPiece(square, piece) {
        this.model.setPiece(this.model.squareToIndex(square), piece);
        this.view.drawPieces();
    }

    getPiece(square) {
        return this.model.squares[this.model.squareToIndex(square)];
    }

    setPosition(fen, animated = true, callback = null) {
        const currentFen = this.model.getPosition();
        const fenParts = fen.split(" ");
        const fenNormalized = fenParts[0];
        if(fenNormalized !== currentFen) {
            const prevSquares = this.model.squares.slice(0); // clone
            if (fen === "start") {
                this.model.setPosition(FEN_START_POSITION);
            } else if (fen === "empty" || fen === null) {
                this.model.setPosition(FEN_EMPTY_POSITION);
            } else {
                this.model.setPosition(fen);
            }
            if (animated) {
                this.view.animatePieces(prevSquares, this.model.squares.slice(0), () => {
                    if (callback) {
                        callback();
                    }
                });
            } else {
                this.view.drawPieces();
                if (callback) {
                    callback();
                }
            }
        } else {
            if (callback) {
                callback();
            }
        }
    }

    getPosition() {
        return this.model.getPosition();
    }

    addMarker(square, type = MARKER_TYPE.emphasize) {
        this.model.addMarker(this.model.squareToIndex(square), type);
        this.view.drawMarkers();
    }

    removeMarkers(square = null, type = null) {
        const index = square !== null ? this.model.squareToIndex(square) : null;
        this.model.removeMarkers(index, type);
        this.view.drawMarkers();
    }

    setOrientation(color) {
        this.model.orientation = color;
        this.view.setNeedsRedraw();
    }

    getOrientation() {
        return this.model.orientation;
    }

    destroy() {
        Svg.removeElement(this.view.svg);
        this.view = null;
        this.model = null;
    }

    enableMoveInput(color, enable) {
        if(enable === true && this.config.moveInputMode === MOVE_INPUT_MODE.viewOnly) {
            throw Error("config.moveInputMode is MOVE_INPUT_MODE.viewOnly");
        }
        if (color === COLOR.white) {
            this.model.inputWhiteEnabled = enable;
        } else if (color === COLOR.black) {
            this.model.inputBlackEnabled = enable;
        }
        this.view.setCursor();
    }

}