/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {ChessboardState} from "../src/cm-chessboard/ChessboardState.js"

describe("TestState", () => {
    it("should convert square to index", () => {
        const state = new ChessboardState()
        assert.equals(state.squareToIndex("a1"), 0)
        assert.equals(state.squareToIndex("h1"), 7)
        assert.equals(state.squareToIndex("a8"), 56)
        assert.equals(state.squareToIndex("g5"), 38)
        assert.equals(state.squareToIndex("h8"), 63)
    })
    it("should convert index to square", () => {
        const state = new ChessboardState()
        assert.equals(state.indexToSquare(0), "a1")
        assert.equals(state.indexToSquare(7), "h1")
        assert.equals(state.indexToSquare(56), "a8")
        assert.equals(state.indexToSquare(38), "g5")
        assert.equals(state.indexToSquare(63), "h8")
    })
})
