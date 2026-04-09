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
        assert.equal(Position.indexToSquare(1), "b1")
        assert.equal(Position.indexToSquare(7), "h1")
        assert.equal(Position.indexToSquare(8), "a2")
        assert.equal(Position.indexToSquare(56), "a8")
        assert.equal(Position.indexToSquare(38), "g5")
        assert.equal(Position.indexToSquare(63), "h8")
    })

    it("should round-trip every index <-> square pair", () => {
        for (let i = 0; i < 64; i++) {
            assert.equal(Position.squareToIndex(Position.indexToSquare(i)), i)
        }
    })

    it("should return the correct FEN string", () => {
        const position = new Position(FEN.start)
        assert.equal(position.getFen(), "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
    })

    it("should round-trip FEN start position", () => {
        const original = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
        const position = new Position(original)
        assert.equal(position.getFen(), original)
    })

    it("should round-trip FEN empty position", () => {
        const position = new Position(FEN.empty)
        assert.equal(position.getFen(), FEN.empty)
    })

    it("should accept full FEN with side-to-move and castling rights", () => {
        const position = new Position("rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR w Gkq - 4 11")
        assert.equal(position.getFen(), "rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR")
    })

    it("should throw on invalid FEN with wrong rank count", () => {
        let thrown = false
        try {
            new Position("rnbqkbnr/pppppppp/8/8/8")
        } catch (e) {
            thrown = true
        }
        assert.equal(thrown, true)
    })

    it("should throw on invalid FEN with non-summing rank", () => {
        let thrown = false
        try {
            new Position("rnbqkbnr/ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
        } catch (e) {
            thrown = true
        }
        assert.equal(thrown, true)
    })

    it("should throw on invalid FEN character", () => {
        let thrown = false
        try {
            new Position("xnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
        } catch (e) {
            thrown = true
        }
        assert.equal(thrown, true)
    })

    it("should throw on null FEN", () => {
        let thrown = false
        try {
            const p = new Position()
            p.setFen(null)
        } catch (e) {
            thrown = true
        }
        assert.equal(thrown, true)
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

    it("should not include deprecated `name` and `position` fields on pieces", () => {
        const position = new Position("8/5P2/8/8/8/8/8/8")
        const pieces = position.getPieces()
        assert.equal(pieces[0].name, undefined)
        assert.equal(pieces[0].position, undefined)
        assert.equal(pieces[0].type, "p")
        assert.equal(pieces[0].square, "f7")
    })

    it("should sort pieces by type by default (king, queen, rook, bishop, knight, pawn)", () => {
        const position = new Position(FEN.start)
        const whitePieces = position.getPieces(COLOR.white)
        assert.equal(whitePieces[0].type, "k")
        assert.equal(whitePieces[1].type, "q")
    })

    it("setPiece and getPiece should work", () => {
        const position = new Position()
        position.setPiece("e4", "wq")
        assert.equal(position.getPiece("e4"), "wq")
        assert.equal(position.getPiece("e5"), null)
    })

    it("movePiece should move a piece and clear the source", () => {
        const position = new Position()
        position.setPiece("a1", "wr")
        position.movePiece("a1", "h8")
        assert.equal(position.getPiece("a1"), null)
        assert.equal(position.getPiece("h8"), "wr")
    })

    it("movePiece should warn and not crash on empty source", () => {
        const position = new Position()
        // should not throw
        position.movePiece("a1", "a2")
        assert.equal(position.getPiece("a1"), null)
        assert.equal(position.getPiece("a2"), null)
    })

    it("clone should produce an independent copy", () => {
        const original = new Position(FEN.start)
        const cloned = original.clone()
        cloned.setPiece("e4", "wp")
        assert.equal(original.getPiece("e4"), null)
        assert.equal(cloned.getPiece("e4"), "wp")
        // Original FEN must be unchanged
        assert.equal(original.getFen(), "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
    })

    it("toString should return the FEN", () => {
        const position = new Position(FEN.start)
        assert.equal("" + position, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
    })

    it("validateSquare should throw on invalid square strings", () => {
        let thrown = 0
        try { Position.validateSquare(null) } catch (e) { thrown++ }
        try { Position.validateSquare("") } catch (e) { thrown++ }
        try { Position.validateSquare("z9") } catch (e) { thrown++ }
        try { Position.validateSquare("a") } catch (e) { thrown++ }
        try { Position.validateSquare("a99") } catch (e) { thrown++ }
        try { Position.validateSquare("@1") } catch (e) { thrown++ }
        assert.equal(thrown, 6)
    })

    it("validateSquare should return the same index as squareToIndex for valid input", () => {
        for (let i = 0; i < 64; i++) {
            const sq = Position.indexToSquare(i)
            assert.equal(Position.validateSquare(sq), Position.squareToIndex(sq))
        }
    })

    it("setPiece should throw on invalid square (validates at API boundary)", () => {
        const position = new Position()
        let thrown = false
        try { position.setPiece("z9", "wp") } catch (e) { thrown = true }
        assert.equal(thrown, true)
    })

    it("getPiece should throw on invalid square", () => {
        const position = new Position()
        let thrown = false
        try { position.getPiece("not-a-square") } catch (e) { thrown = true }
        assert.equal(thrown, true)
    })

    it("movePiece should throw on invalid square", () => {
        const position = new Position()
        let thrown = false
        try { position.movePiece("e2", "z9") } catch (e) { thrown = true }
        assert.equal(thrown, true)
    })

})
