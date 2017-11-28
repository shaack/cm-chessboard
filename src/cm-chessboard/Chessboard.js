/**
 * Author: shaack
 * Date: 21.11.2017
 */
import {ChessboardView} from "./ChessboardView.js";
import {ChessboardModel} from "./ChessboardModel.js";

export class Chessboard {

    constructor(containerElement, config = {}) {
        this.config = {
            initialPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            initialOrientation: 'white', // white on bottom
            sprite: "../assets/sprite.svg", // figures and markers
            spriteGrid: 40, // one figure every 40 px
            responsive: false, // detect window resize
            interactiveMoveMode: MOVE_MODE_LIVE, // type of interactive movement with mouse or tap
            onBeforeMove: null, // callback, before interactive move, return true for ok
            onAfterMove: null // callback after interactive move
        };
        Object.assign(this.config, config);
        this.model = new ChessboardModel(this.config.initialPosition, this.config.initialOrientation);
        this.view = new ChessboardView(containerElement, this.model, this.config, () => {
            this.init();
        });
        this.interactiveMoveWhite = false;
        this.interactiveMoveBlack = false;
        this.interactiveMoveMode = config.interactiveMoveMode;
    }

    /**
     * reset board and draw initial position
     */
    init() {
        this.view.redraw(this.model);
    }

    /**
     * Enables move via user input
     * @param enableWhite
     * @param enableBlack
     */
    setInteractiveMove(enableWhite, enableBlack) {
        this.interactiveMoveWhite = enableWhite;
        this.interactiveMoveBlack = enableBlack;
    }

    /**
     * The move mode controls how the interaction is displayed
     * @param mode
     */
    setInteractiveMoveMode(mode) {
        this.interactiveMoveMode = mode;
    }
}

export const MOVE_MODE_LIVE = 1;
export const MOVE_MODE_PBM = 2;