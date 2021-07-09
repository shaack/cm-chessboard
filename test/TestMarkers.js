/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard, MARKER_TYPE} from "../src/cm-chessboard/Chessboard.js"

describe("TestMarkers", () => {

    it("should set and get markers", () => {
        const chessboard = new Chessboard(document.getElementById("TestMarkers"), {
            sprite: {url: "../assets/images/chessboard-sprite.svg"},
            position: "empty"
        })
        chessboard.addMarker("e5", MARKER_TYPE.square)
        chessboard.addMarker("b6", MARKER_TYPE.frame)
        chessboard.addMarker("h6", MARKER_TYPE.frame)
        assert.equals(chessboard.getMarkers().length,3)
        const markersE5 = chessboard.getMarkers("e5")
        assert.equals(markersE5.length, 1)
        assert.equals(markersE5[0].square, "e5")
        assert.equals(markersE5[0].type.slice, "markerSquare")
        assert.equals(chessboard.getMarkers(undefined, MARKER_TYPE.square).length, 1)
        assert.equals(chessboard.getMarkers("a4").length, 0)
        assert.equals(chessboard.getMarkers(undefined, MARKER_TYPE.frame).length, 2)
        assert.equals(chessboard.getMarkers("b6", MARKER_TYPE.frame).length, 1)
        chessboard.destroy()
    })

})