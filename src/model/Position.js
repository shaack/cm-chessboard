/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
export const FEN = {
    start: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    empty: "8/8/8/8/8/8/8/8"
}

const VALID_PIECE_CHARS = /^[prnbqkPRNBQK]$/
const DEFAULT_SORT = ['k', 'q', 'r', 'b', 'n', 'p']

export class Position {

    constructor(fen = FEN.empty) {
        this.squares = new Array(64).fill(null)
        if (fen) {
            this.setFen(fen)
        }
    }

    setFen(fen = FEN.empty) {
        if (typeof fen !== "string") {
            throw new Error("Position.setFen: fen must be a string, got " + typeof fen)
        }
        const placement = fen.trim().split(/\s+/)[0]
        const ranks = placement.split("/")
        if (ranks.length !== 8) {
            throw new Error("Position.setFen: invalid FEN, expected 8 ranks, got " + ranks.length + " in '" + fen + "'")
        }
        const squares = new Array(64).fill(null)
        for (let part = 0; part < 8; part++) {
            const rank = ranks[7 - part]
            let file = 0
            for (let c = 0; c < rank.length; c++) {
                const char = rank.charAt(c)
                if (char >= "1" && char <= "8") {
                    file += parseInt(char, 10)
                } else if (VALID_PIECE_CHARS.test(char)) {
                    if (file >= 8) {
                        throw new Error("Position.setFen: rank overflow in '" + rank + "'")
                    }
                    const isWhite = char === char.toUpperCase()
                    squares[part * 8 + file] = (isWhite ? "w" : "b") + char.toLowerCase()
                    file++
                } else {
                    throw new Error("Position.setFen: invalid character '" + char + "' in rank '" + rank + "'")
                }
            }
            if (file !== 8) {
                throw new Error("Position.setFen: rank '" + rank + "' does not sum to 8 squares")
            }
        }
        this.squares = squares
    }

    getFen() {
        const parts = new Array(8).fill("")
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
                    const color = piece.charAt(0)
                    const type = piece.charAt(1)
                    parts[7 - part] += color === "w" ? type.toUpperCase() : type
                }
            }
            if (spaceCounter > 0) {
                parts[7 - part] += spaceCounter
            }
        }
        return parts.join("/")
    }

    getPieces(pieceColor = undefined, pieceType = undefined, sortBy = DEFAULT_SORT) {
        const pieces = []
        for (let i = 0; i < 64; i++) {
            const piece = this.squares[i]
            if (!piece) continue
            const type = piece.charAt(1)
            const color = piece.charAt(0)
            if (pieceType && pieceType !== type || pieceColor && pieceColor !== color) {
                continue
            }
            pieces.push({
                type: type,
                color: color,
                square: Position.indexToSquare(i)
            })
        }
        if (sortBy) {
            pieces.sort((a, b) => sortBy.indexOf(a.type) - sortBy.indexOf(b.type))
        }
        return pieces
    }

    movePiece(squareFrom, squareTo) {
        const fromIndex = Position.validateSquare(squareFrom)
        const toIndex = Position.validateSquare(squareTo)
        if (!this.squares[fromIndex]) {
            console.warn("no piece on", squareFrom)
            return
        }
        this.squares[toIndex] = this.squares[fromIndex]
        this.squares[fromIndex] = null
    }

    setPiece(square, piece) {
        this.squares[Position.validateSquare(square)] = piece
    }

    getPiece(square) {
        return this.squares[Position.validateSquare(square)]
    }

    /**
     * Hot-path square-to-index. No validation; assumes valid input.
     * Callers at API boundaries should use `validateSquare` instead.
     */
    static squareToIndex(square) {
        return (square.charCodeAt(0) - 97) + (square.charCodeAt(1) - 49) * 8
    }

    /**
     * Validate a square string and return its index. Throws on invalid input.
     * Use this at user-facing API boundaries; internal code that already
     * has a known-valid square should call `squareToIndex` for speed.
     */
    static validateSquare(square) {
        if (typeof square !== "string" || square.length !== 2) {
            throw new Error("Position: invalid square '" + square + "'")
        }
        const index = (square.charCodeAt(0) - 97) + (square.charCodeAt(1) - 49) * 8
        if (index < 0 || index > 63 || (index | 0) !== index) {
            throw new Error("Position: square out of range '" + square + "'")
        }
        return index
    }

    static indexToSquare(index) {
        return String.fromCharCode((index & 7) + 97) + String.fromCharCode((index >> 3) + 49)
    }

    static squareToCoordinates(square) {
        return [square.charCodeAt(0) - 97, square.charCodeAt(1) - 49]
    }

    static coordinatesToSquare(coordinates) {
        return String.fromCharCode(coordinates[0] + 97) + String.fromCharCode(coordinates[1] + 49)
    }

    toString() {
        return this.getFen()
    }

    clone() {
        const cloned = Object.create(Position.prototype)
        cloned.squares = this.squares.slice()
        return cloned
    }

}
