/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {ChessboardPiecesAnimation} from "../src/cm-chessboard/ChessboardPiecesAnimation.js"
import {ChessboardState} from "../src/cm-chessboard/ChessboardState.js"
import {ViewMock} from "./mocks/ViewMock.js"

const cfa = new ChessboardPiecesAnimation(new ViewMock())

describe("TestPiecesAnimation", () => {
    it("should calculate square distances", () => {
        assert.equals(cfa.squareDistance(0, 0), 0)
        assert.equals(cfa.squareDistance(0, 1), 1)
        assert.equals(cfa.squareDistance(0, 7), 7)
        assert.equals(cfa.squareDistance(0, 8), 1)
        assert.equals(cfa.squareDistance(10, 20), 2)
        assert.equals(cfa.squareDistance(0, 63), 7)
        assert.equals(cfa.squareDistance(8, 24), 2)
        assert.equals(cfa.squareDistance(14, 24), 6)
    })

    it("should seek changes", () => {
        const state1 = new ChessboardState()
        state1.setPosition("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
        const state2 = new ChessboardState()
        state2.setPosition("rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR")
        const previousBoard1 = state1.squares
        const newBoard1 = state2.squares
        const changes = cfa.seekChanges(previousBoard1, newBoard1)

        assert.equals(changes[0].type,0 )
        assert.equals(changes[0].piece, "wn")
        assert.equals(changes[0].atIndex, 1)
        assert.equals(changes[0].toIndex,3)

        assert.equals(changes[2].type, 0)
        assert.equals(changes[2].piece, "wn")
        assert.equals(changes[2].atIndex, 6)
        assert.equals(changes[2].toIndex, 18)

        assert.equals(changes[4].type,0 )
        assert.equals(changes[4].piece, "wp")
        assert.equals(changes[4].atIndex, 8)
        assert.equals(changes[4].toIndex, 24)

        assert.equals(changes[13].type, 2)
        assert.equals(changes[13].piece, "bq")
        assert.equals(changes[13].atIndex, 59)
    })

})