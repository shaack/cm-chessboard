/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Position} from "../src/cm-chessboard/Position.js"

describe("TestPosition", () => {
    it("should convert square to index", () => {
        assert.equals(Position.squareToIndex("a1"), 0)
        assert.equals(Position.squareToIndex("h1"), 7)
        assert.equals(Position.squareToIndex("a8"), 56)
        assert.equals(Position.squareToIndex("g5"), 38)
        assert.equals(Position.squareToIndex("h8"), 63)
    })
    it("should convert index to square", () => {
        assert.equals(Position.indexToSquare(0), "a1")
        assert.equals(Position.indexToSquare(7), "h1")
        assert.equals(Position.indexToSquare(56), "a8")
        assert.equals(Position.indexToSquare(38), "g5")
        assert.equals(Position.indexToSquare(63), "h8")
    })
})
