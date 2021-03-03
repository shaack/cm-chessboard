/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {Test} from "../node_modules/svjs-test/src/svjs-test/Test.js"
import {Chessboard} from "../src/cm-chessboard/Chessboard.js"

export class TestBoard extends Test {

    testCreateAndDestroy() {
        const chessboard = new Chessboard(document.getElementById("TestBoard"), {
            sprite: {url: "../assets/images/chessboard-sprite.svg"},
            position: "start"
        })
        chessboard.initialization.then(() => {
            Test.assertEquals(1, chessboard.element.childNodes.length)
            chessboard.destroy().then(() => {
                Test.assertEquals(null, chessboard.state)
            })
        })
    }
}