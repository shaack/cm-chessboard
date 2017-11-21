/**
 * Author: shaack
 * Date: 21.11.2017
 */

import '../lib/jquery.svg-1.5.0/jquery.svg.min'

export class ChessmailBoardView {

    constructor($el, config) {
        this.$el = $el;
        this.config = config;
    }

    redraw() {
        this.$el.svg({
            onLoad: (svg) => {
                this.drawBoard(svg)
            },
            settings: {class: 'chessmail-board'}
        });

    }

    drawBoard(svg) {
        const width = this.$el.width();
        const height = this.$el.height();
        const innerWidth = width - 2 * this.config.borderWidth;
        const innerHeight = height - 2 * this.config.borderWidth;
        svg.rect(0, 0, width, height, {class: 'board-border'});
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
        let letIndex = 0;
        for (let letter = letFrom; letter !== letTo + letDiff; letter += letDiff) {
            for (let number = numFrom; number !== numTo + numDiff; number += numDiff) {
                const squareColor = (numIndex % 2 + letIndex % 2) % 2 ? 'black' : 'white';
                const fieldClass = "square " + squareColor;
                const fieldCoords = String.fromCharCode(letter) + number;
                const x = this.config.borderWidth + numIndex * innerWidth / 8;
                const y = this.config.borderWidth + letIndex * innerHeight / 8;
                const width = innerWidth / 8;
                const height = innerHeight / 8;
                svg.rect(x, y, width, height, {class: fieldClass, 'data-coords': fieldCoords});
                numIndex++;
            }
            letIndex++;
            numIndex = 0;
        }
    }
}