/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard, COLOR} from "../src/Chessboard.js"
import {FEN} from "../src/model/Position.js"
import {PieceRotation} from "../src/extensions/piece-rotation/PieceRotation.js"

function makeBoard(props = {}) {
    return new Chessboard(document.getElementById("TestPieceRotation"), {
        position: FEN.start,
        assetsUrl: "../assets/",
        ...props
    })
}

function rotationOf(useElement) {
    // the appended rotation is the last transform in the list
    const list = useElement.transform.baseVal
    const item = list.getItem(list.numberOfItems - 1)
    return item.type === SVGTransform.SVG_TRANSFORM_ROTATE ? item.angle : null
}

function piecesOf(chessboard, color) {
    return chessboard.view.piecesGroup.querySelectorAll(`g[data-piece^="${color}"] use.piece`)
}

// The MutationObserver in the extension applies the angles to freshly drawn
// pieces in a microtask, wait one tick before asserting.
function nextTick() {
    return new Promise((resolve) => setTimeout(resolve))
}

describe("TestPieceRotation", () => {

    it("should rotate all pieces instantly and back", async () => {
        const chessboard = makeBoard({extensions: [{class: PieceRotation}]})
        assert.equal(chessboard.getPiecesRotation(), 0)
        await chessboard.setPiecesRotation(180, {animated: false})
        assert.equal(chessboard.getPiecesRotation(COLOR.white), 180)
        assert.equal(chessboard.getPiecesRotation(COLOR.black), 180)
        const pieces = chessboard.view.piecesGroup.querySelectorAll("use.piece")
        assert.equal(pieces.length, 32)
        for (const piece of pieces) {
            assert.equal(rotationOf(piece), 180)
        }
        await chessboard.setPiecesRotation(0, {animated: false})
        for (const piece of pieces) {
            assert.equal(rotationOf(piece), 0)
        }
        chessboard.destroy()
    })

    it("should rotate only one color", async () => {
        const chessboard = makeBoard({extensions: [{class: PieceRotation}]})
        await chessboard.setPiecesRotation(180, {color: COLOR.black, animated: false})
        assert.equal(chessboard.getPiecesRotation(COLOR.black), 180)
        assert.equal(chessboard.getPiecesRotation(COLOR.white), 0)
        for (const piece of piecesOf(chessboard, "b")) {
            assert.equal(rotationOf(piece), 180)
        }
        for (const piece of piecesOf(chessboard, "w")) {
            assert.equal(rotationOf(piece), 0)
        }
        chessboard.destroy()
    })

    it("should animate the rotation to the target angle", async () => {
        const chessboard = makeBoard({
            extensions: [{class: PieceRotation, props: {animationDuration: 50}}]
        })
        await chessboard.setPiecesRotation(90)
        const pieces = chessboard.view.piecesGroup.querySelectorAll("use.piece")
        assert.equal(pieces.length, 32)
        for (const piece of pieces) {
            assert.equal(rotationOf(piece), 90)
        }
        chessboard.destroy()
    })

    it("should keep the rotation on pieces after a position change", async () => {
        const chessboard = makeBoard({extensions: [{class: PieceRotation}]})
        await chessboard.setPiecesRotation(180, {animated: false})
        await chessboard.movePiece("e2", "e4", false)
        await nextTick()
        const moved = chessboard.view.piecesGroup.querySelector('g[data-square="e4"] use.piece')
        assert.true(moved !== null)
        assert.equal(rotationOf(moved), 180)
        // all the other pieces keep it too
        const pieces = chessboard.view.piecesGroup.querySelectorAll("use.piece")
        for (const piece of pieces) {
            assert.equal(rotationOf(piece), 180)
        }
        chessboard.destroy()
    })

    it("should keep the rotation after an animated move", async () => {
        const chessboard = makeBoard({
            style: {animationDuration: 50},
            extensions: [{class: PieceRotation}]
        })
        await chessboard.setPiecesRotation(180, {animated: false})
        await chessboard.movePiece("b1", "c3", true)
        await nextTick()
        const moved = chessboard.view.piecesGroup.querySelector('g[data-square="c3"] use.piece')
        assert.true(moved !== null)
        assert.equal(rotationOf(moved), 180)
        chessboard.destroy()
    })

    it("should apply an initial angle from the props", async () => {
        const chessboard = makeBoard({
            extensions: [{class: PieceRotation, props: {angle: 180}}]
        })
        await nextTick()
        for (const piece of chessboard.view.piecesGroup.querySelectorAll("use.piece")) {
            assert.equal(rotationOf(piece), 180)
        }
        chessboard.destroy()
    })

    it("should supersede a running animation", async () => {
        const chessboard = makeBoard({
            extensions: [{class: PieceRotation, props: {animationDuration: 1000}}]
        })
        chessboard.setPiecesRotation(180) // not awaited, will be superseded
        await chessboard.setPiecesRotation(45, {animated: false})
        assert.equal(chessboard.getPiecesRotation(), 45)
        const pieces = chessboard.view.piecesGroup.querySelectorAll("use.piece")
        for (const piece of pieces) {
            assert.equal(rotationOf(piece), 45)
        }
        chessboard.destroy()
    })
})
