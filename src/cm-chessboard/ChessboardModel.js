/**
 * Author: shaack
 * Date: 22.11.2017
 */
export class ChessboardModel {

    constructor() {
        this.board = [];
        for (let i = 0; i < 8; i++) {
            this.board[i] = [];
            for (let j = 0; j < 8; j++) {
                this.board[i][j] = "";
            }
        }
        this.orientation = null;
        this.moveInputWhiteEnabled = false;
        this.moveInputBlackEnabled = false;
        this.moveInputMode = null;
    }

    /**
     * Get figure on field
     * @param field
     * @returns figureName
     */
    getField(field) {
        const row = field.substr(0, 1);
        const col = field.substr(1, 1);
        return this.board[8 - col][row.charCodeAt(0) - 97];
    }

    /**
     * set board from fen
     * @param fen
     */
    setPosition(fen) {
        if(fen) {
            const parts = fen.replace(/^\s*/, "").replace(/\s*$/, "").split(/\/|\s/);
            for (let r = 0; r < 8; r++) {
                const row = parts[r].replace(/\d/g, (str) => {
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
                    this.board[r][c] = figure;
                }
            }
        }
    }

    getPosition() {
        // TODO
    }
}