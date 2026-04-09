/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard} from "../src/Chessboard.js"
import {MARKER_TYPE, Markers} from "../src/extensions/markers/Markers.js"

describe("TestMarkers", () => {

    it("should set and get markers", () => {
        const chessboard = new Chessboard(document.getElementById("TestMarkers"), {
            assetsUrl: "../assets/",
            extensions: [{class: Markers}]
        })
        chessboard.addMarker(MARKER_TYPE.square, "e5")
        chessboard.addMarker(MARKER_TYPE.frame, "b6")
        chessboard.addMarker(MARKER_TYPE.frame, "h6")
        assert.equal(chessboard.getMarkers().length, 3)
        const markersE5 = chessboard.getMarkers(undefined,"e5")
        assert.equal(markersE5.length, 1)
        assert.equal(markersE5[0].square, "e5")
        assert.equal(markersE5[0].type.slice, "markerSquare")
        assert.equal(chessboard.getMarkers(MARKER_TYPE.square).length, 1)
        assert.equal(chessboard.getMarkers(undefined, "a4").length, 0)
        assert.equal(chessboard.getMarkers(MARKER_TYPE.frame).length, 2)
        assert.equal(chessboard.getMarkers(MARKER_TYPE.frame, "b6").length, 1)
        assert.equal(chessboard.getMarkers(MARKER_TYPE.frame, "h6").length, 1)
        chessboard.removeMarkers(undefined, "h6")
        assert.equal(chessboard.getMarkers(MARKER_TYPE.frame, "h6").length, 0)
        chessboard.addMarker(MARKER_TYPE.frame, "h6")
        assert.equal(chessboard.getMarkers(MARKER_TYPE.frame, "h6").length, 1)
        chessboard.removeMarkers(MARKER_TYPE.square, "h6")
        assert.equal(chessboard.getMarkers(MARKER_TYPE.frame, "h6").length, 1)
        chessboard.removeMarkers(MARKER_TYPE.frame, "h6")
        assert.equal(chessboard.getMarkers(MARKER_TYPE.frame, "h6").length, 0)
        chessboard.destroy()
    })

    it("should reject invalid input", () => {
        const chessboard = new Chessboard(document.getElementById("TestMarkers"), {
            assetsUrl: "../assets/",
            extensions: [{class: Markers}]
        })
        chessboard.addMarker(null, "e5")
        chessboard.addMarker(MARKER_TYPE.square, null)
        chessboard.addMarker("string-not-allowed", "e5")
        chessboard.addMarker(MARKER_TYPE.square, {invalid: "object"})
        assert.equal(chessboard.getMarkers().length, 0)
        chessboard.destroy()
    })

    it("should batch addLegalMovesMarkers without intermediate redraws", () => {
        const chessboard = new Chessboard(document.getElementById("TestMarkers"), {
            assetsUrl: "../assets/",
            extensions: [{class: Markers}]
        })
        const moves = [
            {to: "e3"}, {to: "e4"}, {to: "d3"}, {to: "f3"}, {to: "d4"}, {to: "f4"}
        ]
        chessboard.addLegalMovesMarkers(moves)
        assert.equal(chessboard.getMarkers(MARKER_TYPE.dot).length, 6)
        chessboard.removeLegalMovesMarkers()
        assert.equal(chessboard.getMarkers(MARKER_TYPE.dot).length, 0)
        chessboard.destroy()
    })

    it("should clean up grafted methods and SVG groups on destroy", () => {
        const chessboard = new Chessboard(document.getElementById("TestMarkers"), {
            assetsUrl: "../assets/",
            extensions: [{class: Markers}]
        })
        chessboard.addMarker(MARKER_TYPE.frame, "e4")
        assert.equal(typeof chessboard.addMarker, "function")
        chessboard.destroy()
        assert.equal(chessboard.addMarker, undefined)
        assert.equal(chessboard.getMarkers, undefined)
        assert.equal(chessboard.removeMarkers, undefined)
        assert.equal(chessboard.addLegalMovesMarkers, undefined)
        assert.equal(chessboard.removeLegalMovesMarkers, undefined)
    })

})
