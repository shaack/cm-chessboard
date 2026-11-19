/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard} from "../src/Chessboard.js"
import {ARROW_TYPE, Arrows} from "../src/extensions/arrows/Arrows.js"

describe("TestArrows", () => {

    it("should add, get and remove arrows", () => {
        const chessboard = new Chessboard(document.getElementById("TestArrows"), {
            assetsUrl: "../assets/",
            extensions: [{class: Arrows}]
        })
        chessboard.addArrow(ARROW_TYPE.default, "e2", "e4")
        chessboard.addArrow(ARROW_TYPE.danger, "d2", "d4")
        assert.equal(chessboard.getArrows().length, 2)
        assert.equal(chessboard.getArrows(ARROW_TYPE.danger).length, 1)
        assert.equal(chessboard.getArrows(undefined, "e2").length, 1)
        assert.equal(chessboard.getArrows(undefined, "e2", "e4").length, 1)
        assert.equal(chessboard.getArrows(undefined, "a1").length, 0)
        chessboard.removeArrows(undefined, "e2")
        assert.equal(chessboard.getArrows().length, 1)
        assert.equal(chessboard.getArrows()[0].from, "d2")
        chessboard.removeArrows()
        assert.equal(chessboard.getArrows().length, 0)
        chessboard.destroy()
    })

    // Regression for https://github.com/shaack/cm-chessboard/pull/185
    it("should give arrows between the same squares distinct marker ids", () => {
        const chessboard = new Chessboard(document.getElementById("TestArrows"), {
            assetsUrl: "../assets/",
            extensions: [{class: Arrows}]
        })
        chessboard.addArrow(ARROW_TYPE.default, "e2", "e4")
        chessboard.addArrow(ARROW_TYPE.danger, "e2", "e4")
        const markers = chessboard.context.querySelectorAll(".arrows marker")
        assert.equal(markers.length, 2)
        assert.true(markers[0].id !== markers[1].id)
        // every arrow line points to the marker in its own group
        chessboard.context.querySelectorAll(".arrows > g").forEach((group) => {
            const marker = group.querySelector("marker")
            const line = group.querySelector("line")
            assert.equal(line.getAttribute("marker-end"), "url(#" + marker.id + ")")
        })
        chessboard.destroy()
    })

})
