/**
 * Author: shaack
 * Date: 07.12.2017
 */

import {Test} from "../node_modules/svjs-test/src/svjs/Test.js"
import {ChessboardFigureAnimation} from "../src/cm-chessboard/ChessboardFigureAnimation.js";

export class TestFigureAnimation extends Test {
    testSquareDistance() {
        const cfa = new ChessboardFigureAnimation();
        Test.assertEquals(0, cfa._squareDistance(0, 0));
        Test.assertEquals(1, cfa._squareDistance(0, 1));
        Test.assertEquals(7, cfa._squareDistance(0, 7));
        Test.assertEquals(1, cfa._squareDistance(0, 8));
        Test.assertEquals(2, cfa._squareDistance(10, 20));
        Test.assertEquals(7, cfa._squareDistance(0, 63));
    }
}