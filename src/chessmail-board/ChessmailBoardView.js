/**
 * Author: shaack
 * Date: 21.11.2017
 */

import {Svg} from "../svjs/Svg"

export class ChessmailBoardView {

    static spriteLoadingStatus = "not_loaded";

    constructor(containerElement, config, callback) {
        this.containerElement = containerElement;
        this.config = config;
        this.loadWaitingTries = 0;
        this.loadSprite(config, callback);
    }

    loadSprite(config, callback) {
        if (ChessmailBoardView.spriteLoadingStatus === "not_loaded") {
            ChessmailBoardView.spriteLoadingStatus = "loading";
            Svg.loadSprite(config.sprite, [
                "wk", "wq", "wr", "wb", "wn", "wp",
                "bk", "bq", "br", "bb", "bn", "bp",
                "marker"], () => {
                ChessmailBoardView.spriteLoadingStatus = "loaded";
                callback();
            }, 40);
        } else if (ChessmailBoardView.spriteLoadingStatus === "loading") {
            setTimeout(() => {
                this.loadWaitingTries++;
                if (this.loadWaitingTries < 1000) {
                    this.loadSprite(config, callback);
                } else {
                    console.error("timeout loading sprite", config.sprite);
                }
            }, 10);
        } else if (ChessmailBoardView.spriteLoadingStatus === "loaded") {
            callback();
        } else {
            console.error("error ChessmailBoardView.spriteLoadingStatus", ChessmailBoardView.spriteLoadingStatus);
        }

    }

    updateMetrics() {
        this.width = this.containerElement.offsetWidth;
        this.height = this.containerElement.offsetHeight;
        this.innerWidth = this.width - 2 * this.config.borderWidth;
        this.innerHeight = this.height - 2 * this.config.borderWidth;
        this.squareWidth = this.innerWidth / 8;
        this.squareHeight = this.innerHeight / 8;
    }

    /**
     * Redraw the whole board and all figures
     */
    redraw(model) {
        this.svg = Svg.createSvg(this.containerElement);
        this.svg.setAttribute("class", "chessmail-board");
        this.updateMetrics();
        this.drawBoard(model);
        this.drawFigures(model);
    }

    /**
     * convert displayed field to chess position.
     * @param squareX
     * @param squareY
     * return position
     */
    static coordsToPosition(squareX, squareY) {
        return String.fromCharCode(97 + squareX) + (8 - squareY);
    }

    /**
     * Draw the checkered board
     */
    drawBoard(model) {
        let boardBorder = Svg.addElement(this.svg, "rect", {width: this.width, height: this.height});
        boardBorder.setAttribute("class", "board-border");
        for (let squareY = 0; squareY < 8; squareY++) {
            for (let squareX = 0; squareX < 8; squareX++) {
                const squareColor = (squareX % 2 + squareY % 2) % 2 ? 'black' : 'white';
                const fieldClass = "square " + squareColor;
                const fieldPosition = ChessmailBoardView.coordsToPosition(squareX, squareY);
                const x = this.config.borderWidth + squareX * this.innerWidth / 8;
                const y = this.config.borderWidth + squareY * this.innerHeight / 8;
                const squareGroup = Svg.addElement(this.svg, "g");
                let transform = (this.svg.createSVGTransform(x,y));
                transform.setTranslate(x,y);
                squareGroup.transform.baseVal.appendItem(transform);
                Svg.addElement(squareGroup, "rect", {
                    width: this.squareWidth, height: this.squareHeight
                });
                squareGroup.setAttribute("class", fieldClass);
                squareGroup.setAttribute("data-position", fieldPosition);
            }
        }
        if (model.orientation === "black") {
            this.svg.setAttribute("transform", "rotate(180)");
            this.svg.setAttribute("transform-origin", "" + this.width / 2 + " " + this.height / 2);
        }
    }

    drawFigures(model) {
        // bq as reference for calculation of scaling
        const bq = Svg.addElement(this.svg, "use", {"href": "#bq"});
        const bqHeight = bq.getBoundingClientRect().height;
        Svg.removeElement(bq);
        const scaling = this.squareHeight / 40;

        for (let squareY = 0; squareY < 8; squareY++) {
            for (let squareX = 0; squareX < 8; squareX++) {
                const figureName = model.board[squareY][squareX];
                if (figureName) {
                    const position = ChessmailBoardView.coordsToPosition(squareX, squareY);
                    const squareGroup = this.svg.querySelector("g[data-position='" + position + "']");
                    const figure = Svg.addElement(squareGroup, "use", {"href": "#" + figureName});
                    let transform = "scale(" + scaling + ")";
                    figure.setAttribute("transform", transform); // TODO replace with transform.baseVal.appendItem(transform);
                }
            }
        }
        console.log(model.board);
    }

}