/**
 * Author and copyright: Stefan Haack <shaack@gmail.com> (http://shaack.com)
 * License: MIT, see file 'LICENSE'
 */
import {ChessboardView} from "./ChessboardView.js";
import {SQUARE_COORDINATES, ChessboardModel} from "./ChessboardModel.js";
import {Svg} from "../svjs-svg/Svg.js";

export const COLOR = {
    white: "w",
    black: "b"
};
export const MOVE_INPUT_MODE = {
    viewOnly: 0,
    dragPiece: 1,
    dragMarker: 2
};
export const INPUT_EVENT_TYPE = {
    moveStart: "moveStart",
    moveDone: "moveDone",
    moveCanceled: "moveCanceled",
    context: "context"
};
export const MARKER_TYPE = {
    move: {class: "move", slice: "marker1"},
    emphasize: {class: "emphasize", slice: "marker2"}
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

const DEFAULT_SPRITE_GRID = 40;

export class Chessboard {

    constructor(element, config = {}, callback = null) {
        this.element = element;
        this.config = {
            position: "empty", // set as fen, "start" or "empty"
            orientation: COLOR.white, // white on bottom
            style: {
                cssClass: "default",
                showCoordinates: true, // show ranks and files
                showBorder: false, // display a border around the board
            },
            responsive: false, // resizes the board on window resize, if true
            animationDuration: 300, // pieces animation duration in milliseconds
            moveInputMode: MOVE_INPUT_MODE.viewOnly, // set to MOVE_INPUT_MODE.dragPiece or MOVE_INPUT_MODE.dragMarker for interactive movement
            sprite: {
                url: "./assets/images/chessboard-sprite.svg", // pieces and markers are stored es svg in the sprite
                grid: DEFAULT_SPRITE_GRID // the sprite is tiled with one piece every 40px
            }
        };
        Object.assign(this.config, config);
        if (!this.config.sprite.grid) {
            this.config.sprite.grid = DEFAULT_SPRITE_GRID;
        }
        this.model = new ChessboardModel();
        this.view = new ChessboardView(this, () => {
            setTimeout(() => {
                this.setPosition(this.config.position, false);
                this.setOrientation(this.config.orientation);
                this.model.moveInputMode = this.config.moveInputMode;
                this.view.redraw();
                if (callback) {
                    callback(this);
                }
            });

        });
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
        if (fenNormalized !== currentFen) {
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
                if (!this.view) {
                    console.trace();
                }
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

    getMarkers(square = null, type = null) {
        const markersFound = [];
        this.model.markers.forEach((marker) => {
            const markerSquare = SQUARE_COORDINATES[marker.index];
            if (square === null && (type === null || type === marker.type) ||
                type === null && square === markerSquare ||
                type === marker.type && square === markerSquare) {
                markersFound.push({square: SQUARE_COORDINATES[marker.index], type: marker.type});
            }
        });
        return markersFound;
    }

    removeMarkers(square = null, type = null) {
        const index = square !== null ? this.model.squareToIndex(square) : null;
        this.model.removeMarkers(index, type);
        this.view.drawMarkers();
    }

    setOrientation(color) {
        this.model.orientation = color;
        this.view.redraw();
    }

    getOrientation() {
        return this.model.orientation;
    }

    destroy() {
        Svg.removeElement(this.view.svg);
        this.view = null;
        this.model = null;
    }

    enableMoveInput(callback, color = null) {
        if (this.config.moveInputMode === MOVE_INPUT_MODE.viewOnly) {
            throw Error("config.moveInputMode is MOVE_INPUT_MODE.viewOnly");
        }
        if (color === COLOR.white) {
            this.model.inputWhiteEnabled = true;
        } else if (color === COLOR.black) {
            this.model.inputBlackEnabled = true;
        } else {
            this.model.inputWhiteEnabled = true;
            this.model.inputBlackEnabled = true;
        }
        this.moveInputCallback = callback;
        this.view.setCursor();
    }

    disableMoveInput() {
        this.model.inputWhiteEnabled = false;
        this.model.inputBlackEnabled = false;
        this.moveInputCallback = null;
        this.view.setCursor();
    }

    enableContextInput(callback) {
        this.contextInputCallback = callback;
        this.element.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            const index = e.target.getAttribute("data-index");
            callback({
                chessboard: this,
                type: INPUT_EVENT_TYPE.context,
                square: SQUARE_COORDINATES[index]
            });
        })
    }

    disableContextInput() {
        this.element.removeEventListener("contextmenu", this.contextInputCallback);
    }
}