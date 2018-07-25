/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {Test} from "../node_modules/svjs-test/src/svjs-test/Test.js"
import {PIECE, Chessboard} from "../src/cm-chessboard/Chessboard.js"

export class TestPosition extends Test {

    testStartPositionConstructor() {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            position: "start"
        }, () => {
            Test.assertEquals("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", chessboard.getPosition())
            chessboard.destroy()
        })
    }

    testStartPositionPromise() {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            position: "start"
        })
        chessboard.initialization.then(() => {
            Test.assertEquals("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", chessboard.getPosition())
            chessboard.destroy()
        })
    }

    testSetAndGetPosition() {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), null)
        chessboard.setPosition("rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR w Gkq - 4 11", false).then(() => {
            Test.assertEquals("rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR", chessboard.getPosition())
            chessboard.destroy()
        })
    }

    testGetSquare() {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            position: "start"
        })
        chessboard.initialization.then(() => {
            Test.assertEquals("wq", chessboard.getPiece("d1"))
            Test.assertEquals("bq", chessboard.getPiece("d8"))
            Test.assertEquals("wp", chessboard.getPiece("a2"))
            chessboard.destroy()
        })
    }

    testSetSquare() {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            position: "empty"
        })
        chessboard.setPiece("a1", PIECE.blackKing).then(() => {
            Test.assertEquals("bk", chessboard.getPiece("a1"))
        })
        chessboard.setPiece("e5", PIECE.whiteKing).then(() => {
            Test.assertEquals("wk", chessboard.getPiece("e5"))
        })
        setTimeout(() => {
            chessboard.destroy()
        }, 100)
    }

}