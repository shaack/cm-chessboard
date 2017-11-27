/**
 * Author: shaack
 * Date: 21.11.2017
 */

import {Svg} from "../../node_modules/svjs-svg/src/svjs/Svg.js";

export class ChessmailBoardView {

    constructor(containerElement, model, config, callback) {
        this.containerElement = containerElement;
        this.config = config;
        this.loadWaitingTries = 0;
        this.model = model;
        this.loadSprite(config, callback);
        if (config.responsive) {
            window.addEventListener('resize', () => {
                if (this.containerElement.offsetWidth !== this.width ||
                    this.containerElement.offsetHeight !== this.height) {
                    this.updateMetrics();
                    this.redraw();
                }
            });
        }
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
            }, config.spriteGrid);
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
        this.borderWidth = this.width / 35;
        this.innerWidth = this.width - 2 * this.borderWidth;
        this.innerHeight = this.height - 2 * this.borderWidth;
        this.squareWidth = this.innerWidth / 8;
        this.squareHeight = this.innerHeight / 8;
    }

    /**
     * Redraw the whole board and all figures
     */
    redraw() {
        if(this.svg) {
            Svg.removeElement(this.svg);
        }
        this.svg = Svg.createSvg(this.containerElement);
        this.svg.setAttribute("class", "chessmail-board");
        this.updateMetrics();
        this.mainGroup = Svg.addElement(this.svg, "g");
        this.drawBoard(this.model);
        this.drawFigures(this.model);
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
    drawBoard() {
        let boardBorder = Svg.addElement(this.mainGroup, "rect", {width: this.width, height: this.height});
        boardBorder.setAttribute("class", "board-border");
        for (let squareY = 0; squareY < 8; squareY++) {
            for (let squareX = 0; squareX < 8; squareX++) {
                const squareColor = (squareX % 2 + squareY % 2) % 2 ? 'black' : 'white';
                const fieldClass = "square " + squareColor;
                const x = this.borderWidth + squareX * this.innerWidth / 8;
                const y = this.borderWidth + squareY * this.innerHeight / 8;
                const squareGroup = Svg.addElement(this.mainGroup, "g");
                const transform = (this.svg.createSVGTransform());
                transform.setTranslate(x, y);
                squareGroup.transform.baseVal.appendItem(transform);
                Svg.addElement(squareGroup, "rect", {
                    width: this.squareWidth, height: this.squareHeight
                });
                squareGroup.setAttribute("class", fieldClass);
                squareGroup.setAttribute("data-position", ChessmailBoardView.coordsToPosition(squareX, squareY));
                if (this.model.orientation === "black") {
                    const transform = (this.svg.createSVGTransform());
                    transform.setRotate(180, this.squareWidth / 2, this.squareHeight / 2);
                    squareGroup.transform.baseVal.appendItem(transform);
                }
            }
        }
        if (this.model.orientation === "black") {
            const transform = (this.svg.createSVGTransform());
            transform.setRotate(180, this.width / 2, this.height / 2);
            this.mainGroup.transform.baseVal.appendItem(transform);
        }
    }

    drawFigures() {
        const scaling = this.squareHeight / this.config.spriteGrid;
        for (let squareY = 0; squareY < 8; squareY++) {
            for (let squareX = 0; squareX < 8; squareX++) {
                const figureName = this.model.board[squareY][squareX];
                if (figureName) {
                    const position = ChessmailBoardView.coordsToPosition(squareX, squareY);
                    const squareGroup = this.svg.querySelector("g[data-position='" + position + "']");
                    const figure = Svg.addElement(squareGroup, "use", {"href": "#" + figureName});
                    // center on square
                    const transformTranslate = (this.svg.createSVGTransform());
                    transformTranslate.setTranslate((this.squareWidth / 2 - this.config.spriteGrid * scaling / 2), 0);
                    figure.transform.baseVal.appendItem(transformTranslate);
                    // scale
                    const transformScale = (this.svg.createSVGTransform());
                    transformScale.setScale(scaling, scaling);
                    figure.transform.baseVal.appendItem(transformScale);
                }
            }
        }
    }

}

// static
ChessmailBoardView.spriteLoadingStatus = "not_loaded";