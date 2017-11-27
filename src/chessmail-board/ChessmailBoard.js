/**
 * Author: shaack
 * Date: 21.11.2017
 */
import {ChessmailBoardView} from "./ChessmailBoardView.js";
import {ChessmailBoardModel} from "./ChessmailBoardModel.js";

export class ChessmailBoard {

    constructor(containerElement, config) {
        this.config = {
            sprite: "./assets/sprite.svg", // figures and markers
            initialPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            initialOrientation: 'white',
            borderWidth: 10,
            spriteGrid: 40
        };
        Object.assign(this.config, config);
        this.model = new ChessmailBoardModel(this.config.initialPosition, this.config.initialOrientation);
        this.view = new ChessmailBoardView(containerElement, this.config, () => {
            this.init();
        });
    }

    /**
     * reset board and draw initial position
     */
    init() {
        this.view.redraw(this.model);
    }

}