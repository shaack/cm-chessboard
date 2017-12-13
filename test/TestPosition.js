/**
 * Author: shaack
 * Date: 01.12.2017
 */

import {Test} from "../node_modules/svjs-test/src/svjs/Test.js"
import {Chessboard} from "../src/cm-chessboard/Chessboard.js";

export class TestPosition extends Test {

    testSetAndGetStartPosition() {
        const chessboard = new Chessboard(document.getElementById("testboard2"), {
            position: "start"
        }, () => {
            Test.assertEquals("wq", chessboard.getSquare("d1"));
            Test.assertEquals("bq", chessboard.getSquare("d8"));
            Test.assertEquals("wp", chessboard.getSquare("a2"));
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

}