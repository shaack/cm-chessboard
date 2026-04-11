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

    // Regression for a production crash: the ResizeObserver callback defers
    // handleResize() via setTimeout to avoid "ResizeObserver loop completed"
    // warnings. If destroy() is called between the observer firing and the
    // setTimeout running, handleResize -> redrawBoard hits
    // `this.chessboard.state.invokeExtensionPoints(...)` where `state` is
    // now undefined, throwing TypeError.
    //
    // We invalidate view.width by zeroing it so that the size-changed branch
    // of handleResize is guaranteed to enter updateMetrics + redrawBoard.
    // Otherwise a stable container size would short-circuit the branch and
    // the bug path wouldn't be exercised.
    it("should not crash when destroyed while a resize handler is pending", async () => {
        const chessboard = new Chessboard(document.getElementById("TestBoard"), {
            assetsUrl: "../assets/",
            position: FEN.start
        })
        const view = chessboard.view
        // Force the size-changed branch to trigger on the next handleResize
        view.width = 0
        view.height = 0
        // Simulate what the ResizeObserver callback does: defer handleResize
        // via setTimeout. This path is deterministic.
        const pending = new Promise((resolve) => {
            setTimeout(() => {
                try {
                    view.handleResize()
                    resolve(null)
                } catch (e) {
                    resolve(e)
                }
            })
        })
        // Force the race: destroy the board before the setTimeout fires.
        chessboard.destroy()
        const error = await pending
        assert.equal(error, null, error && error.message)
    })

})
