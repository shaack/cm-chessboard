/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
export const FEN = {
    start: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    empty: "8/8/8/8/8/8/8/8"
}

export class Position {

    constructor(fen = FEN.empty) {
        this.squares = new Array(64).fill(null)
        this.setFen(fen)
    }

    setFen(fen = FEN.empty) {
        const parts = fen.replace(/^\s*/, "").replace(/\s*$/, "").split(/\/|\s/)
        for (let part = 0; part < 8; part++) {
            const row = parts[7 - part].replace(/\d/g, (str) => {
                const numSpaces = parseInt(str)
                let ret = ''
                for (let i = 0; i < numSpaces; i++) {
                    ret += '-'
                }
                return ret
            })
            for (let c = 0; c < 8; c++) {
                const char = row.substring(c, c + 1)
                let piece = null
                if (char !== '-') {
                    if (char.toUpperCase() === char) {
                        piece = `w${char.toLowerCase()}`
                    } else {
                        piece = `b${char}`
                    }
                }
                this.squares[part * 8 + c] = piece
            }
        }
    }

    getFen() {
        let parts = new Array(8).fill("")
        for (let part = 0; part < 8; part++) {
            let spaceCounter = 0
            for (let i = 0; i < 8; i++) {
                const piece = this.squares[part * 8 + i]
                if (!piece) {
                    spaceCounter++
                } else {
                    if (spaceCounter > 0) {
                        parts[7 - part] += spaceCounter
                        spaceCounter = 0
                    }
                    const color = piece.substring(0, 1)
                    const name = piece.substring(1, 2)
                    if (color === "w") {
                        parts[7 - part] += name.toUpperCase()
                    } else {
                        parts[7 - part] += name
                    }
                }
            }
            if (spaceCounter > 0) {
                parts[7 - part] += spaceCounter
                spaceCounter = 0
            }
        }
        return parts.join("/")
    }

    getPieces(sortBy = ['k', 'q', 'r', 'b', 'n', 'p']) {
        const pieces = []
        const sort = (a, b) => {
            return sortBy.indexOf(a.name) - sortBy.indexOf(b.name)
        }
        for (let i = 0; i < 64; i++) {
            const piece = this.squares[i]
            if (piece) {
                pieces.push({
                    name: piece.charAt(1),
                    color: piece.charAt(0),
                    position: Position.indexToSquare(i)
                })
            }
        }
        if (sortBy) {
            pieces.sort(sort)
        }
        return pieces
    }

    movePiece(squareFrom, squareTo) {
        if (!this.squares[Position.squareToIndex(squareFrom)]) {
            console.warn("no piece on", squareFrom)
            return
        }
        this.squares[Position.squareToIndex(squareTo)] = this.squares[Position.squareToIndex(squareFrom)]
        this.squares[Position.squareToIndex(squareFrom)] = null
    }

    setPiece(square, piece) {
        this.squares[Position.squareToIndex(square)] = piece
    }

    getPiece(square) {
        return this.squares[Position.squareToIndex(square)]
    }

    static squareToIndex(square) {
        const coordinates = Position.squareToCoordinates(square)
        return coordinates[0] + coordinates[1] * 8
    }

    static indexToSquare(index) {
        return this.coordinatesToSquare([Math.floor(index % 8), index / 8])
    }

    static squareToCoordinates(square) {
        const file = square.charCodeAt(0) - 97
        const rank = square.charCodeAt(1) - 49
        return [file, rank]
    }

    static coordinatesToSquare(coordinates) {
        const file = String.fromCharCode(coordinates[0] + 97)
        const rank = String.fromCharCode(coordinates[1] + 49)
        return file + rank
    }

    clone() {
        const cloned = new Position()
        cloned.squares = this.squares.slice(0)
        return cloned
    }

}
