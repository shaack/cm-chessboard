/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

export class DraughtsboardState {

    constructor() {
        // PDN gametype attributes for international draughts
        this.type_number = 20
        this.rows = 10
        this.columns = 10
        this.notation_type = 'N'
        this.notation_start = 2
        this.invert_flag = 0
        this.flipped = false

        // The array this.squares contains strings that correspond to svg-images.
        // Possible values are 'wr', 'wn', 'wk', 'wb', 'wp', etc.
        this.squares = new Array(this.rows * this.columns).fill(undefined)
        this.orientation = undefined
        this.markers = []
        this.inputWhiteEnabled = false
        this.inputBlackEnabled = false
        this.inputEnabled = false
        this.squareSelectEnabled = false
    }

    setPiece(index, piece) {
        this.squares[index] = piece
    }

    addMarker(index, type) {
        this.markers.push({index: index, type: type})
    }

    removeMarkers(index = undefined, type = undefined) {
        if (!index && !type) {
            this.markers = []
        } else {
            this.markers = this.markers.filter((marker) => {
                if (!marker.type) {
                    if (index === marker.index) {
                        return false
                    }
                } else if (!index) {
                    if (marker.type === type) {
                        return false
                    }
                } else if (marker.type === type && index === marker.index) {
                    return false
                }
                return true
            })
        }
    }

    is_empty_field(r, c)
    {
        if (this.type_number === 30) // Turkish draughts
        {
            return false;
        }
        else
        {
            if (this.flipped)
            {
                return (this.invert_flag === 0) === (r % 2 === (this.columns - c) % 2);
            }
            else
            {
                return (this.invert_flag === 0) === ((this.rows - r) % 2 === c % 2);
            }
        }
    }

    is_non_playing_field(r, c)
    {
        if (this.type_number === 30) // Turkish draughts
        {
            return false;
        }
        else
        {
            if (this.flipped)
            {
                return (this.invert_flag === 0) === (r % 2 === (this.columns - c) % 2);
            }
            else
            {
                return (this.invert_flag === 0) === ((this.rows - r) % 2 === c % 2);
            }
        }
    }

    is_player_field(r, c)
    {
        if (this.is_empty_field(r, c))
        {
            return false;
        }
        let minrow = this.rows - ~~(this.rows / 2) + 1;
        let maxrow = this.rows;
        if (this.type_number === 31) // Thai
        {
            minrow++;
        }
        else if (this.type_number === 30) // Turkish
        {
            minrow = this.rows - 3;
            maxrow = this.rows - 2;
        }
        return minrow <= r && r <= maxrow;
    }

    is_opponent_field(r, c)
    {
        if (this.is_empty_field(r, c))
        {
            return false;
        }
        let minrow = 0;
        let maxrow = ~~(this.rows / 2) - 2;
        if (this.type_number === 31) // Thai
        {
            maxrow--;
        }
        else if (this.type_number === 30) // Turkish
        {
            minrow = 1;
            maxrow = 2;
        }
        return minrow <= r && r <= maxrow;
    }

    // Converts an index in a position string like 'xxxxx...ooo' to an index in the squares array
    index2pos(i) {
        const d = this.columns / 2;
        const row = Math.floor((2 * i) / this.columns);
        const column = 2 * (i % d) + (i % this.columns < d ? 1 : 0);
        return (this.rows - row - 1) * this.columns + column
    }

    rc2f(r, c)
    {
        if ((r < 0) || (c < 0) || (r >= this.rows) || (c >= this.columns))
        {
            return -1; // out of board
        }
        return 1 + (r * ~~(this.columns / 2)) + ~~(c / 2);
    }

    // 0 = Bottom left
    // 1 = Bottom right
    // 2 = Top left
    // 3 = Top right
    notation(r, c)
    {
        if (this.flipped)
        {
            r = this.rows - r - 1;
            c = this.columns - c - 1;
        }

        const left = this.notation_start === 0 || this.notation_start === 2;
        const bottom = this.notation_start === 0 || this.notation_start === 1;

        r = bottom ? this.rows - r - 1 : r;
        c = left ? c : this.columns - c - 1;

        if (this.notation_type === 'N')
        {
            const f = this.rc2f(r, c);
            return "" + f;
        }
        else
        {
            return 'abcdefghijklmnop'[c] + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16][r];
        }
    }

    setPosition(text) {
        if (text) {
            for (let i = 0; i < text.length; i++) {
                let piece = undefined
                switch(text[i]) {
                    case 'x': piece = 'bp'; break;
                    case 'X': piece = 'bq'; break;
                    case 'o': piece = 'wp'; break;
                    case 'O': piece = 'wq'; break;
                }
                this.squares[this.index2pos(i)] = piece
            }
        }
    }

    getPosition() {
        let N = (this.rows * this.columns) / 2
        let pieces = new Array(N)
        for (let i = 0; i < N; i++) {
            const pos = this.index2pos(i);
            let piece = '.';
            switch(this.squares[pos]) {
                case 'bp': piece = 'x'; break;
                case 'bq': piece = 'X'; break;
                case 'wp': piece = 'o'; break;
                case 'wq': piece = 'O'; break;
            }
            pieces[i] = piece
        }
        return pieces.join("")
    }

    // square is in alpha-numeric format, e.g. 'b3'
    squareToIndex(square) {
        const column = square.substr(0, 1).charCodeAt(0) - 97
        const row = square.substr(1, 1) - 1
        return this.columns * row + column
    }

}