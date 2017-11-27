/**
 * Author: shaack
 * Date: 22.11.2017
 */
export class ChessboardModel {

    constructor(fen, orientation) {
        if (!fen) {
            console.error("no fen");
        }
        this.board = this.parseFen(fen);
        this.orientation = orientation;
    }

    /**
     * Get figure at position
     * @param position
     * @returns figureName
     */
    get(position) {
        const row = position.substr(0, 1);
        const col = position.substr(1, 1);
        return this.board[8 - col][row.charCodeAt(0) - 97];
    }

    /**
     * set board from fen
     * @param fen
     * @returns board as 2 dimensional array
     */
    parseFen(fen) {
        let board = [];
        const parts = fen.replace(/^\s*/, "").replace(/\s*$/, "").split(/\/|\s/);
        for (let r = 0; r < 8; r++) {
            board[r] = [];
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
                board[r][c] = figure;
            }
        }
        return board;
    }
}