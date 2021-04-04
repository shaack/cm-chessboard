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
        chessboard.addMarker("e5")
        chessboard.addMarker("b6", MARKER_TYPE.danger)
        chessboard.addMarker("h6", MARKER_TYPE.move)
        setTimeout(() => {
            assert.equals(chessboard.getMarkers().length,3)
            assert.equals(chessboard.getMarkers("e5").length, 1)
            assert.equals(chessboard.getMarkers("e5")[0].square, "e5")
            assert.equals(chessboard.getMarkers("e5")[0].type.slice, "markerSquare")
            assert.equals(chessboard.getMarkers(undefined, MARKER_TYPE.emphasize).length, 1)
            assert.equals(chessboard.getMarkers("e5", MARKER_TYPE.emphasize).length, 1)
            assert.equals(chessboard.getMarkers("a4").length, 0)
            assert.equals(chessboard.getMarkers(undefined, MARKER_TYPE.move).length, 1)
            assert.equals(chessboard.getMarkers("b6", MARKER_TYPE.move).length, 0)
            chessboard.destroy()
        }, 100)
    })

})