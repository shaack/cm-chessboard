/**
 * Author: shaack
 * Date: 03.12.2017
 */

import {Test} from "../node_modules/svjs-test/src/svjs/Test.js"
import {Chessboard} from "../src/cm-chessboard/Chessboard.js";

export class TestBoard extends Test {

    testCreateAndDestroy() {
        const chessboard = new Chessboard(document.getElementById("TestBoard"), {
            sprite: {url: "../assets/images/chessboard-sprite.svg"},
            position: "start"
        }, () => {
            setTimeout(() => {
                Test.assertEquals(1, chessboard.element.childNodes.length);
                chessboard.destroy();
                Test.assertEquals(null, chessboard.view);
            });

        });
    }

}