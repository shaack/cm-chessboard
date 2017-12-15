/**
 * Author: shaack
 * Date: 01.12.2017
 */

import {Test} from "../node_modules/svjs-test/src/svjs/Test.js"
import {FIGURE, Chessboard} from "../src/cm-chessboard/Chessboard.js";

export class TestPosition extends Test {

    testStartPosition() {
        const chessboard = new Chessboard(document.getElementById("testboard2"), {
            position: "start"
        }, () => {
            Test.assertEquals("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", chessboard.getPosition());
            setTimeout(() => {
                chessboard.destroy();
            });
        });
    }

    testSetAndGetPosition() {
        const chessboard = new Chessboard(document.getElementById("testboard3"), null, () => {
            chessboard.setPosition("rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR w Gkq - 4 11", false);
            Test.assertEquals("rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR", chessboard.getPosition());
            setTimeout(() => {
                chessboard.destroy();
            });
        });
    }

    testGetSquare() {
        const chessboard = new Chessboard(document.getElementById("testboard2"), {
            position: "start"
        }, () => {
            Test.assertEquals("wq", chessboard.getSquare("d1"));
            Test.assertEquals("bq", chessboard.getSquare("d8"));
            Test.assertEquals("wp", chessboard.getSquare("a2"));
            setTimeout(() => {
                chessboard.destroy();
            });
        });
    }

    testSetSquare() {
        const chessboard = new Chessboard(document.getElementById("testboard2"), {
            position: "empty"
        }, () => {
            chessboard.setSquare("a1", FIGURE.blackKing);
            chessboard.setSquare("e5", FIGURE.whiteKing);
            Test.assertEquals("bk", chessboard.getSquare("a1"));
            Test.assertEquals("wk", chessboard.getSquare("e5"));
            setTimeout(() => {
                chessboard.destroy();
            });
        });
    }

}