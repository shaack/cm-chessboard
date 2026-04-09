/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard} from "../src/Chessboard.js"
import {ARROW_TYPE, Arrows} from "../src/extensions/arrows/Arrows.js"

describe("TestArrows", () => {

    it("should add and get arrows", () => {
        const chessboard = new Chessboard(document.getElementById("TestArrows"), {
            assetsUrl: "../assets/",
            extensions: [{class: Arrows}]
        })
        chessboard.addArrow(ARROW_TYPE.danger, "e2", "e4")
        chessboard.addArrow(ARROW_TYPE.success, "g1", "f3")
        assert.equal(chessboard.getArrows().length, 2)
        chessboard.destroy()
    })

    it("should filter arrows by type", () => {
        const chessboard = new Chessboard(document.getElementById("TestArrows"), {
            assetsUrl: "../assets/",
            extensions: [{class: Arrows}]
        })
        chessboard.addArrow(ARROW_TYPE.danger, "e2", "e4")
        chessboard.addArrow(ARROW_TYPE.success, "g1", "f3")
        chessboard.addArrow(ARROW_TYPE.success, "b1", "c3")
        assert.equal(chessboard.getArrows(ARROW_TYPE.success).length, 2)
        assert.equal(chessboard.getArrows(ARROW_TYPE.danger).length, 1)
        chessboard.destroy()
    })

    it("should filter arrows by from/to squares", () => {
        const chessboard = new Chessboard(document.getElementById("TestArrows"), {
            assetsUrl: "../assets/",
            extensions: [{class: Arrows}]
        })
        chessboard.addArrow(ARROW_TYPE.success, "e2", "e4")
        chessboard.addArrow(ARROW_TYPE.success, "g1", "f3")
        assert.equal(chessboard.getArrows(undefined, "e2").length, 1)
        assert.equal(chessboard.getArrows(undefined, "e2", "e4").length, 1)
        assert.equal(chessboard.getArrows(undefined, undefined, "f3").length, 1)
        assert.equal(chessboard.getArrows(undefined, "z9").length, 0)
        chessboard.destroy()
    })

    it("should remove arrows", () => {
        const chessboard = new Chessboard(document.getElementById("TestArrows"), {
            assetsUrl: "../assets/",
            extensions: [{class: Arrows}]
        })
        chessboard.addArrow(ARROW_TYPE.success, "e2", "e4")
        chessboard.addArrow(ARROW_TYPE.danger, "e2", "e4")
        chessboard.removeArrows(ARROW_TYPE.danger)
        assert.equal(chessboard.getArrows().length, 1)
        assert.equal(chessboard.getArrows()[0].type, ARROW_TYPE.success)
        chessboard.destroy()
    })

    it("should remove all arrows when called without args", () => {
        const chessboard = new Chessboard(document.getElementById("TestArrows"), {
            assetsUrl: "../assets/",
            extensions: [{class: Arrows}]
        })
        chessboard.addArrow(ARROW_TYPE.success, "e2", "e4")
        chessboard.addArrow(ARROW_TYPE.danger, "g1", "f3")
        chessboard.removeArrows()
        assert.equal(chessboard.getArrows().length, 0)
        chessboard.destroy()
    })

    it("should clean up grafted methods on destroy", () => {
        const chessboard = new Chessboard(document.getElementById("TestArrows"), {
            assetsUrl: "../assets/",
            extensions: [{class: Arrows}]
        })
        assert.equal(typeof chessboard.addArrow, "function")
        chessboard.destroy()
        assert.equal(chessboard.addArrow, undefined)
        assert.equal(chessboard.getArrows, undefined)
        assert.equal(chessboard.removeArrows, undefined)
    })

    it("should reject invalid input", () => {
        const chessboard = new Chessboard(document.getElementById("TestArrows"), {
            assetsUrl: "../assets/",
            extensions: [{class: Arrows}]
        })
        chessboard.addArrow(null, "e2", "e4")
        chessboard.addArrow(ARROW_TYPE.success, null, "e4")
        chessboard.addArrow(ARROW_TYPE.success, "e2", null)
        assert.equal(chessboard.getArrows().length, 0)
        chessboard.destroy()
    })

})
