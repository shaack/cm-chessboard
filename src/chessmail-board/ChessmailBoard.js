/**
 * Author: shaack
 * Date: 21.11.2017
 */
import {ChessmailBoardView} from "./ChessmailBoardView.js";
import {ChessmailBoardModel} from "./ChessmailBoardModel.js";

export class ChessmailBoard {

    constructor(containerElement, config = {}) {
        this.config = {
            sprite: "../assets/sprite.svg", // figures and markers
            initialPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            initialOrientation: 'white',
            responsive: false,
            spriteGrid: 40,
            interactiveMoveMode: MOVE_MODE_LIVE,
            onBeforeMove: null, // callback, before interactive move, return true for ok
            onAfterMove: null // callback after interactive move
        };
        Object.assign(this.config, config);
        this.model = new ChessmailBoardModel(this.config.initialPosition, this.config.initialOrientation);
        this.view = new ChessmailBoardView(containerElement, this.model, this.config, () => {
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