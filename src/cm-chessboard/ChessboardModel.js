/**
 * Author: shaack
 * Date: 22.11.2017
 */

export const SQUARE_COORDINATES = [
    "a1", "b1", "c1", "d1", "e1", "f1", "g1", "h1",
    "a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2",
    "a3", "b3", "c3", "d3", "e3", "f3", "g3", "h3",
    "a4", "b4", "c4", "d4", "e4", "f4", "g4", "h4",
    "a5", "b5", "c5", "d5", "e5", "f5", "g5", "h5",
    "a6", "b6", "c6", "d6", "e6", "f6", "g6", "h6",
    "a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7",
    "a8", "b8", "c8", "d8", "e8", "f8", "g8", "h8"
];

export class ChessboardModel {

    constructor() {
        this.squares = new Array(64).fill("");
        this.orientation = null;
        this.markers = [];
    }

    setSquare(square, figure) {
        const file = square.substr(0, 1).charCodeAt(0) - 97;
        const rank = square.substr(1, 1) - 1;
        this.squares[8 * rank + file] = figure;
    }

    getSquare(square) {
        const file = square.substr(0, 1).charCodeAt(0) - 97;
        const rank = square.substr(1, 1) - 1;
        return this.squares[8 * rank + file];
    }

    addMarker(square, type) {
        this.markers.push({square: square, type: type});
    }

    removeMarker(square = null, type = null) {
        if (square === null && type === null) {
            this.markers = [];
        } else {
            this.markers = this.markers.filter((marker) => {
                if(marker.type === null) {
                    if(square === marker.square) {
                        return false;
                    }
                } else if(square === null) {
                    if(marker.type === type) {
                        return false;
                    }
                } else if(marker.type === type && square === marker.square) {
                    return false;
                }
                return true;
            });
        }
    }

    setPosition(fen) {
        if (fen) {
            const parts = fen.replace(/^\s*/, "").replace(/\s*$/, "").split(/\/|\s/);
            for (let part = 0; part < 8; part++) {
                const row = parts[7 - part].replace(/\d/g, (str) => {
                    const numSpaces = parseInt(str);
                    let ret = '';
                    for (let i = 0; i < numSpaces; i++) {
                        ret += '-';
                    }
                    return ret;
                });
                for (let c = 0; c < 8; c++) {
                    const char = row.substr(c, 1);
                    let figure = "";
                    if (char !== '-') {
                        if (char.toUpperCase() === char) {
                            figure = "w" + char.toLowerCase();
                        } else {
                            figure = "b" + char;
                        }
                    }
                    this.squares[part * 8 + c] = figure;
                }
            }
        }
    }

    getPosition() {
        let fen = "";
        let lastField = "";
        let parts = new Array(8).fill("");
        for (let part = 0; part < 8; part++) {
            let spaceCounter = 0;
            for (let i = 0; i < 8; i++) {
                let addChar = "?";
                const figure = this.squares[part * 8 + i];
                if (figure === "") {
                    spaceCounter++;
                } else {
                    if (spaceCounter > 0) {
                        parts[7 - part] += spaceCounter;
                        spaceCounter = 0;
                    }
                    const color = figure.substr(0, 1);
                    const name = figure.substr(1, 1);
                    if (color === "w") {
                        parts[7 - part] += name.toUpperCase();
                    } else {
                        parts[7 - part] += name;
                    }
                }
            }
            if (spaceCounter > 0) {
                parts[7 - part] += spaceCounter;
                spaceCounter = 0;
            }
        }
        return parts.join("/");
    }
}