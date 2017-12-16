/**
 * Author: shaack
 * Date: 16.12.2017
 */

import {Test} from "../node_modules/svjs-test/src/svjs/Test.js"
import {Chessboard, MARKER_TYPE} from "../src/cm-chessboard/Chessboard.js";

export class TestMarkers extends Test {
    testSetMarker() {
        const chessboard = new Chessboard(document.getElementById("TestMarkers"), {
            position: "empty"
        }, () => {
            chessboard.addMarker("e5");
            Test.assertEquals(1, chessboard.getMarkers().length);
            Test.assertEquals(1, chessboard.getMarkers("e5").length);
            Test.assertEquals("e5", chessboard.getMarkers("e5")[0].square);
            Test.assertEquals("marker2", chessboard.getMarkers("e5")[0].type.slice);
            Test.assertEquals(1, chessboard.getMarkers(null, MARKER_TYPE.emphasize).length);
            Test.assertEquals(1, chessboard.getMarkers("e5", MARKER_TYPE.emphasize).length);
            Test.assertEquals(0, chessboard.getMarkers("a4").length);
            Test.assertEquals(0, chessboard.getMarkers(null, MARKER_TYPE.lastMove).length);
            chessboard.destroy();
        });
    }
}