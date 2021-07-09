/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {PIECE, Chessboard} from "../src/cm-chessboard/Chessboard.js"

describe("TestPosition", () => {

    it("should create and destroy a chessboard", () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            sprite: {url: "../assets/images/chessboard-sprite.svg"},
            position: "start"
        })
        assert.equals(chessboard.getPosition(), "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
        chessboard.destroy()
    })

    it("should set and get the position", () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"),
            {sprite: {url: "../assets/images/chessboard-sprite.svg"},})
        chessboard.setPosition("rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR w Gkq - 4 11", false).then(() => {
            assert.equals(chessboard.getPosition(), "rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR")
            chessboard.destroy()
        })
    })

    it("should get pieces on squares", () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            sprite: {url: "../assets/images/chessboard-sprite.svg"},
            position: "start"
        })
        assert.equals(chessboard.getPiece("d1"), "wq")
        assert.equals(chessboard.getPiece("d8"), "bq")
        assert.equals(chessboard.getPiece("a2"), "wp")
        chessboard.destroy()
    })

    it("should set pieces on squares", () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            position: "empty",
            sprite: {url: "../assets/images/chessboard-sprite.svg"},
        })
        chessboard.setPiece("a1", PIECE.bk)
        assert.equals(chessboard.getPiece("a1"), "bk")
        chessboard.setPiece("e5", PIECE.wk)
        assert.equals(chessboard.getPiece("e5"), "wk")
        chessboard.destroy()
    })

})
