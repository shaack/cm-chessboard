/**
 * Author: shaack
 * Date: 22.11.2017
 */
export class ChessboardModel {

    constructor() {
        this.squares = new Array(64).fill("");
        this.orientation = null;
        // this.moveInputWhiteEnabled = false;
        // this.moveInputBlackEnabled = false;
        // this.moveInputMode = null;
    }

    /**
     * Get figure on square
     * @param square
     * @returns figureName
     */
    getSquare(square) {
        const file = square.substr(0, 1).charCodeAt(0) - 97;
        const rank = square.substr(1, 1) - 1;
        return this.squares[8 * rank + file];
    }

    /**
     * set squares from fen
     * @param fen
     */
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
                if(figure === "") {
                    spaceCounter++;
                } else {
                    if(spaceCounter > 0) {
                        parts[7-part] += spaceCounter;
                        spaceCounter = 0;
                    }
                    const color = figure.substr(0,1);
                    const name = figure.substr(1,1);
                    if(color === "w") {
                        parts[7-part] += name.toUpperCase();
                    } else {
                        parts[7-part] += name;
                    }
                }
            }
            if(spaceCounter > 0) {
                parts[7-part] += spaceCounter;
                spaceCounter = 0;
            }
        }
        return parts.join("/");
    }
}