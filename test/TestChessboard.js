/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {PIECE, Chessboard} from "../src/Chessboard.js"
import {FEN} from "../src/model/Position.js"

describe("TestChessboard", () => {

    // https://github.com/shaack/cm-chessboard/issues/47
    it("should create and immediately destroy a board without failure", () => {
        const chessboard = new Chessboard(document.getElementById("TestBoard"), {
            assetsUrl: "../assets/",
            position: FEN.start
        })
        chessboard.destroy()
    })

    it("should create and destroy a board", () => {
        const chessboard = new Chessboard(document.getElementById("TestBoard"), {
            assetsUrl: "../assets/",
            position: FEN.start
        })
        assert.equal(chessboard.view.container.childNodes.length, 1)
        chessboard.destroy()
        assert.equal(chessboard.state, undefined)
    })

    it("should create and destroy a chessboard", () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            assetsUrl: "../assets/",
            position: FEN.start
        })
        assert.equal("" + chessboard.getPosition(), "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
        chessboard.destroy()
    })

    it("should set and get the position", () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"),
            {assetsUrl: "../assets/"})
        chessboard.setPosition("rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR w Gkq - 4 11", false).then(() => {
            assert.equal("" + chessboard.getPosition(), "rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR")
            chessboard.destroy()
        })
    })

    it("should get pieces on squares", () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            assetsUrl: "../assets/",
            position: FEN.start
        })
        assert.equal(chessboard.getPiece("d1"), "wq")
        assert.equal(chessboard.getPiece("d8"), "bq")
        assert.equal(chessboard.getPiece("a2"), "wp")
        chessboard.destroy()
    })

    it("should set pieces on squares", () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            assetsUrl: "../assets/",
        })
        chessboard.setPiece("a1", PIECE.bk)
        assert.equal(chessboard.getPiece("a1"), "bk")
        chessboard.setPiece("e5", PIECE.wk)
        assert.equal(chessboard.getPiece("e5"), "wk")
        chessboard.destroy()
    })

})
