/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {ChessboardState} from "../src/model/ChessboardState.js"
import {PositionsAnimation} from "../src/view/PositionAnimationsQueue.js"
import {Position} from "../src/model/Position.js"

describe("TestPiecesAnimation", () => {
    it("should calculate square distances", () => {
        assert.equal(PositionsAnimation.squareDistance(0, 0), 0)
        assert.equal(PositionsAnimation.squareDistance(0, 1), 1)
        assert.equal(PositionsAnimation.squareDistance(0, 7), 7)
        assert.equal(PositionsAnimation.squareDistance(0, 8), 1)
        assert.equal(PositionsAnimation.squareDistance(10, 20), 2)
        assert.equal(PositionsAnimation.squareDistance(0, 63), 7)
        assert.equal(PositionsAnimation.squareDistance(8, 24), 2)
        assert.equal(PositionsAnimation.squareDistance(14, 24), 6)
    })

    it("should seek changes", () => {
        const state1 = new ChessboardState()
        state1.position = new Position("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
        const state2 = new ChessboardState()
        state2.position = new Position("rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR")
        const previousBoard1 = state1.position.squares
        const newBoard1 = state2.position.squares
        const changes = PositionsAnimation.seekChanges(previousBoard1, newBoard1)

        assert.equal(changes[0].type,0 )
        assert.equal(changes[0].piece, "wn")
        assert.equal(changes[0].atIndex, 1)
        assert.equal(changes[0].toIndex,3)

        assert.equal(changes[2].type, 0)
        assert.equal(changes[2].piece, "wn")
        assert.equal(changes[2].atIndex, 6)
        assert.equal(changes[2].toIndex, 18)

        assert.equal(changes[4].type,0 )
        assert.equal(changes[4].piece, "wp")
        assert.equal(changes[4].atIndex, 8)
        assert.equal(changes[4].toIndex, 24)

        assert.equal(changes[13].type, 2)
        assert.equal(changes[13].piece, "bq")
        assert.equal(changes[13].atIndex, 59)
    })

})
