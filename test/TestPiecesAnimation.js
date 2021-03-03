/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {Test} from "../node_modules/svjs-test/src/svjs-test/Test.js"
import {ChessboardPiecesAnimation} from "../src/cm-chessboard/ChessboardPiecesAnimation.js"
import {ChessboardState} from "../src/cm-chessboard/ChessboardState.js"
import {ViewMock} from "./mocks/ViewMock.js"

const cfa = new ChessboardPiecesAnimation(new ViewMock())

export class TestPiecesAnimation extends Test {
    testSquareDistance() {
        Test.assertEquals(0, cfa.squareDistance(0, 0))
        Test.assertEquals(1, cfa.squareDistance(0, 1))
        Test.assertEquals(7, cfa.squareDistance(0, 7))
        Test.assertEquals(1, cfa.squareDistance(0, 8))
        Test.assertEquals(2, cfa.squareDistance(10, 20))
        Test.assertEquals(7, cfa.squareDistance(0, 63))
        Test.assertEquals(2, cfa.squareDistance(8, 24))
        Test.assertEquals(6, cfa.squareDistance(14, 24))
    }

    testSeekChanges() {
        const state1 = new ChessboardState()
        state1.setPosition("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
        const state2 = new ChessboardState()
        state2.setPosition("rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR")
        const previousBoard1 = state1.squares
        const newBoard1 = state2.squares
        const changes = cfa.seekChanges(previousBoard1, newBoard1)

        Test.assertEquals(0, changes[0].type)
        Test.assertEquals("wn", changes[0].piece)
        Test.assertEquals(1, changes[0].atIndex)
        Test.assertEquals(3, changes[0].toIndex)

        Test.assertEquals(0, changes[2].type)
        Test.assertEquals("wn", changes[2].piece)
        Test.assertEquals(6, changes[2].atIndex)
        Test.assertEquals(18, changes[2].toIndex)

        Test.assertEquals(0, changes[4].type)
        Test.assertEquals("wp", changes[4].piece)
        Test.assertEquals(8, changes[4].atIndex)
        Test.assertEquals(24, changes[4].toIndex)

        Test.assertEquals(2, changes[13].type)
        Test.assertEquals("bq", changes[13].piece)
        Test.assertEquals(59, changes[13].atIndex)
    }

}