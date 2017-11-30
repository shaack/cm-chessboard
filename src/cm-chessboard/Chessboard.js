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

export const MOVE_MODE = {
    live: "live",
    pbm: "pbm"
};

export const startPositionFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export class Chessboard {

    constructor(containerElement, config = {}) {
        this.config = {
            position: startPositionFen,
            orientation: COLOR.white, // white on bottom
            showNotation: false, // TODO
            sprite: "../assets/sprite.svg", // figures and markers
            spriteGrid: 40, // one figure every 40 px
            responsive: false, // detect window resize
            // moveInputMode: MOVE_MODE.pbm, // type of interactive movement with mouse or tap
            onBeforeMove: null, // callback, before interactive move, return true for ok
            onAfterMove: null // callback after interactive move
        };
        Object.assign(this.config, config);
        this.model = new ChessboardModel();
        this.view = new ChessboardView(containerElement, this.model, this.config, () => {
            this.position = this.config.position;
            this.orientation = this.config.orientation;
            // this.model.moveInputMode = this.config.moveInputMode;
            this.view.redraw(); // TODO remove and redraw on observer
        });
    }

    // API

    set position(fen) {
        this.model.parseFen(fen);
    }

    get position() {
        return this.model.createFen();
    }

    set orientation(color) {
        this.model.orientation = color;
    }

    get orientation() {
        return this.model.orientation;
    }

    /**
     * Enables moves via user input, mouse or touch
     * @param color
     * @param enable
     */
    /* TODO think about it again
    setEnableMoveFigures(color, enable) {
        if (color === COLOR.white) {
            this.model.moveInputWhiteEnabled = enable;
        } else if (color === COLOR.black) {
            this.model.moveInputBlackEnabled = enable;
        }
    }
    */

}