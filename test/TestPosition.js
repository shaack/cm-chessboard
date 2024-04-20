/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {FEN, Position} from "../src/model/Position.js"
import {COLOR, PIECE_TYPE} from "../src/Chessboard.js"

describe("TestPosition", () => {
    it("should convert square to index", () => {
        assert.equal(Position.squareToIndex("a1"), 0)
        assert.equal(Position.squareToIndex("h1"), 7)
        assert.equal(Position.squareToIndex("a8"), 56)
        assert.equal(Position.squareToIndex("g5"), 38)
        assert.equal(Position.squareToIndex("h8"), 63)
    })
    it("should convert index to square", () => {
        assert.equal(Position.indexToSquare(0), "a1")
        assert.equal(Position.indexToSquare(7), "h1")
        assert.equal(Position.indexToSquare(56), "a8")
        assert.equal(Position.indexToSquare(38), "g5")
        assert.equal(Position.indexToSquare(63), "h8")
    })
    it("should return the correct FEN string", () => {
        const position = new Position(FEN.start)
        assert.equal(position.getFen(), "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
    })
    it("should find the correct pieces", () => {
        const position = new Position("8/5P2/8/1P3r2/8/8/1P3P1P/8")
        const blackPiece = position.getPieces(COLOR.black)
        assert.equal(blackPiece.length, 1)
        assert.equal(blackPiece[0].type, PIECE_TYPE.rook)
        assert.equal(blackPiece[0].square, "f5")
        const whitePieces = position.getPieces(COLOR.white)
        assert.equal(whitePieces.length, 5)
        const rooks = position.getPieces(undefined, PIECE_TYPE.rook)
        assert.equal(rooks.length, 1)
        assert.equal(rooks[0].square, "f5")
    })
})

