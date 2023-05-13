/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Position} from "../src/model/Position.js"

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
})
