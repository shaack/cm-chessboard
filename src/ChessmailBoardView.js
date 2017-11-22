/**
 * Author: shaack
 * Date: 21.11.2017
 */

import 'svg.js'

export class ChessmailBoardView {

    constructor($el, config) {
        this.$el = $el;
        this.config = config;
    }
/*
    loadSprite() {
        this.spriteContainerId = this.config.sprite;
        this.$spriteContainer = $("#" + this.config.sprite);
        if(!$spriteContainer.length) {
            $("body").append($spriteContainer);

        }
    }
*/
    updateMetrics() {
        this.width = this.$el.width();
        this.height = this.$el.height();
        this.innerWidth = this.width - 2 * this.config.borderWidth;
        this.innerHeight = this.height - 2 * this.config.borderWidth;
        this.squareWidth = this.innerWidth / 8;
        this.squareHeight = this.innerHeight / 8;
    }

    /**
     * Redraw the whole board and all figures
     */
    redraw(model) {
        const svg = SVG(this.$el[0]).addClass("chessmail-board");
        this.updateMetrics();
        this.drawBoard(svg);
        this.drawFigures(svg, model);
    }

    /**
     * Draw the checkered board
     * @param svg
     */
    drawBoard(svg) {
        svg.rect(this.width, this.height).addClass("board-border");
        let letFrom = 104, letTo = 97, letDiff = -1, numFrom = 1, numTo = 8, numDiff = 1;
        if (this.config.orientation === 'black') {
            letFrom = 97;
            letTo = 104;
            letDiff = 1;
            numFrom = 8;
            numTo = 1;
            numDiff = -1;
        }
        let numIndex = 0;
        let chaIndex = 0;
        for (let char = letFrom; char !== letTo + letDiff; char += letDiff) {
            for (let number = numFrom; number !== numTo + numDiff; number += numDiff) {
                const squareColor = (numIndex % 2 + chaIndex % 2) % 2 ? 'black' : 'white';
                const fieldClass = "square " + squareColor;
                const fieldCoords = String.fromCharCode(char) + number;
                const x = this.config.borderWidth + numIndex * this.innerWidth / 8;
                const y = this.config.borderWidth + chaIndex * this.innerHeight / 8;
                svg.rect(this.squareWidth, this.squareHeight).move(x,y).addClass(fieldClass).data("coords", fieldCoords);
                numIndex++;
            }
            chaIndex++;
            numIndex = 0;
        }

    }

    drawFigures(svg, model) {
        let letFrom = 104, letTo = 97, letDiff = -1, numFrom = 1, numTo = 8, numDiff = 1;
        if (this.config.orientation === 'black') {
            letFrom = 97;
            letTo = 104;
            letDiff = 1;
            numFrom = 8;
            numTo = 1;
            numDiff = -1;
        }
        let numIndex = 0;
        let chaIndex = 0;
        for (let char = letFrom; char !== letTo + letDiff; char += letDiff) {
            for (let number = numFrom; number !== numTo + numDiff; number += numDiff) {
                const x = this.config.borderWidth + numIndex * this.innerWidth / 8;
                const y = this.config.borderWidth + chaIndex * this.innerHeight / 8;
                numIndex++;

            }
            chaIndex++;
            numIndex = 0;
        }
        console.log(model.board);
    }
}