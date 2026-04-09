/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {PIECE, Chessboard, COLOR} from "../src/Chessboard.js"
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

    it("should set and get the position", async () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"),
            {assetsUrl: "../assets/"})
        await chessboard.setPosition("rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR w Gkq - 4 11", false)
        assert.equal("" + chessboard.getPosition(), "rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR")
        chessboard.destroy()
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

    it("should move pieces", async () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            assetsUrl: "../assets/",
            position: FEN.start
        })
        await chessboard.movePiece("e2", "e4", false)
        assert.equal(chessboard.getPiece("e2"), null)
        assert.equal(chessboard.getPiece("e4"), "wp")
        chessboard.destroy()
    })

    it("should report orientation", () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            assetsUrl: "../assets/",
            orientation: COLOR.black
        })
        assert.equal(chessboard.getOrientation(), COLOR.black)
        chessboard.destroy()
    })

    it("should be safe to call destroy twice (idempotent)", () => {
        const chessboard = new Chessboard(document.getElementById("TestPosition"), {
            assetsUrl: "../assets/"
        })
        chessboard.destroy()
        let thrown = false
        try {
            chessboard.destroy()
        } catch (e) {
            thrown = true
        }
        assert.equal(thrown, false)
    })

    it("should not pollute shared props between two boards", () => {
        const sharedProps = {style: {cssClass: "default", showCoordinates: true}}
        const board1 = new Chessboard(document.getElementById("TestBoard"), {
            assetsUrl: "../assets/",
            ...sharedProps
        })
        const board2 = new Chessboard(document.getElementById("TestPosition"), {
            assetsUrl: "../assets/",
            ...sharedProps
        })
        // Default for cssClass after first call shouldn't be polluted
        assert.equal(sharedProps.style.cssClass, "default")
        board1.destroy()
        board2.destroy()
    })

    it("should generate unique board ids", () => {
        const a = new Chessboard(document.getElementById("TestBoard"), {assetsUrl: "../assets/"})
        const b = new Chessboard(document.getElementById("TestPosition"), {assetsUrl: "../assets/"})
        assert.equal(a.id !== b.id, true)
        a.destroy()
        b.destroy()
    })

})
