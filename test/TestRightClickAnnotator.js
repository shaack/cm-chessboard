/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard} from "../src/Chessboard.js"
import {RightClickAnnotator} from "../src/extensions/right-click-annotator/RightClickAnnotator.js"

// Synthetic mouse events, the annotator reads the square from e.target
const squareTarget = (name) => ({getAttribute: (n) => (n === "data-square" ? name : null)})
const rightDown = (name) => ({button: 2, target: squareTarget(name)})
const move = (name) => ({target: squareTarget(name)})
const rightUp = (name) => ({button: 2, target: squareTarget(name)})

function newAnnotatedBoard() {
    const chessboard = new Chessboard(document.getElementById("TestRightClickAnnotator"), {
        assetsUrl: "../assets/",
        extensions: [{class: RightClickAnnotator}]
    })
    return {chessboard, annotator: chessboard.getExtension(RightClickAnnotator)}
}

describe("TestRightClickAnnotator", () => {

    // Regression for https://github.com/shaack/cm-chessboard/pull/184
    it("should show the preview again when dragging to the same square twice", () => {
        const {chessboard, annotator} = newAnnotatedBoard()
        for (let i = 0; i < 2; i++) {
            annotator.onMouseDown(rightDown("e2"))
            annotator.onMouseMove(move("e4"))
            assert.equal(chessboard.getArrows(undefined, "e2", "e4").length, 1)
            annotator.onMouseUp(rightUp("e2")) // released on the start square, no arrow is added
            assert.equal(chessboard.getArrows().length, 0)
        }
        chessboard.destroy()
    })

    // Regression for https://github.com/shaack/cm-chessboard/pull/184
    it("should remove the preview when dragging back to the start square", () => {
        const {chessboard, annotator} = newAnnotatedBoard()
        annotator.onMouseDown(rightDown("e2"))
        annotator.onMouseMove(move("e4"))
        assert.equal(chessboard.getArrows().length, 1)
        annotator.onMouseMove(move("e2"))
        assert.equal(chessboard.getArrows().length, 0)
        annotator.onMouseMove(move("e4")) // and shows it again when leaving the start square
        assert.equal(chessboard.getArrows(undefined, "e2", "e4").length, 1)
        annotator.onMouseUp(rightUp("e4"))
        assert.equal(chessboard.getArrows(undefined, "e2", "e4").length, 1) // the arrow was added
        chessboard.destroy()
    })

})
