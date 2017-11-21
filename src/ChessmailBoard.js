/**
 * Author: shaack
 * Date: 21.11.2017
 */
import 'jquery'
import Chess from 'chess.js'
import {ChessmailBoardView} from "./ChessmailBoardView";

export class ChessmailBoard {

    constructor($el, config) {
        this.config = {
            sprite: "assets/sprite.svg", // figures and markers
            initialPosition: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            borderWidth: 10,
            orientation: 'white'
        };
        Object.assign(this.config, config);
        this.view = new ChessmailBoardView($el, this.config);
        this.init();
    }

    /*
        reset board and draw initial position
     */
    init() {
        this.chess = new Chess(this.config.initialPosition);
        this.view.redraw();
    }
}