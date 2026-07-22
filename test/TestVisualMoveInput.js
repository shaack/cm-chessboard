/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard} from "../src/Chessboard.js"
import {COLOR, INPUT_EVENT_TYPE} from "../src/view/ChessboardView.js"
import {MOVE_CANCELED_REASON} from "../src/view/VisualMoveInput.js"
import {FEN} from "../src/model/Position.js"

const STATE_WAIT_FOR_INPUT_START = "waitForInputStart"
const STATE_PIECE_CLICKED_THRESHOLD = "pieceClickedThreshold"
const STATE_CLICK_TO = "clickTo"
const STATE_DRAG_TO = "dragTo"

// Synthetic pointer events. The mouse path reads e.target / e.clientX directly,
// so it drives the real state machine without needing document.elementFromPoint.
const squareTarget = (name) => ({getAttribute: (n) => (n === "data-square" ? name : null)})
const mouseDown = (name, x = 100, y = 100) => ({
    type: "mousedown", button: 0, target: squareTarget(name),
    clientX: x, clientY: y, preventDefault: () => {}
})
const mouseMove = (name, x, y) => ({
    type: "mousemove", target: squareTarget(name), clientX: x, clientY: y, pageX: x, pageY: y
})
const mouseUp = (name) => ({type: "mouseup", target: squareTarget(name)})
const tick = () => new Promise((resolve) => setTimeout(resolve, 30))

function newBoard() {
    return new Chessboard(document.getElementById("TestBoard"), {
        assetsUrl: "../assets/",
        position: FEN.start,
        style: {animationDuration: 0}
    })
}

describe("TestVisualMoveInput", () => {

    it("should reset move input state on touchcancel", async () => {
        const chessboard = new Chessboard(document.getElementById("TestBoard"), {
            assetsUrl: "../assets/",
            position: FEN.start
        })
        chessboard.enableMoveInput(() => true)
        const visualMoveInput = chessboard.view.visualMoveInput

        visualMoveInput.onPointerDown({
            type: "touchstart",
            target: {getAttribute: (name) => (name === "data-square" ? "e2" : null)},
            touches: [{clientX: 100, clientY: 100}],
            preventDefault: () => {}
        })
        assert.equal(visualMoveInput.moveInputState, STATE_PIECE_CLICKED_THRESHOLD)

        window.dispatchEvent(new Event("touchcancel"))

        assert.equal(visualMoveInput.moveInputState, STATE_WAIT_FOR_INPUT_START)

        await new Promise((resolve) => setTimeout(resolve))
        chessboard.destroy()
    })

    // Regression for https://github.com/shaack/cm-chessboard/pull/174
    it("should validate once and finish the move when moving into own piece is marked as valid", async () => {
        const chessboard = new Chessboard(document.getElementById("TestBoard"), {
            assetsUrl: "../assets/",
            position: FEN.start
        })
        let validateCallCount = 0
        let moveInputFinishedCount = 0
        chessboard.enableMoveInput((event) => {
            if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
                validateCallCount++
                return true // accept the castling-by-clicking-the-rook move
            } else if (event.type === INPUT_EVENT_TYPE.moveInputFinished) {
                moveInputFinishedCount++
            }
            return true
        }, COLOR.white)
        const visualMoveInput = chessboard.view.visualMoveInput

        // simulate an existing click-to-move selection of the white king on e1
        visualMoveInput.moveInputStartedCallback("e1")
        visualMoveInput.moveInputState = STATE_CLICK_TO
        visualMoveInput.fromSquare = "e1"

        // castle by clicking the rook on h1 -> same-color-click branch
        visualMoveInput.onPointerDown({
            type: "touchstart",
            target: {getAttribute: (name) => (name === "data-square" ? "h1" : null)},
            touches: [{clientX: 100, clientY: 100}],
            preventDefault: () => {}
        })

        assert.equal(validateCallCount, 1)

        await new Promise((resolve) => setTimeout(resolve))
        // the move must complete (not get stuck in `clickTo`), firing moveInputFinished exactly once
        assert.equal(moveInputFinishedCount, 1)

        chessboard.destroy()
    })

    it("should complete a click-to-move (select, then click destination)", async () => {
        const board = newBoard()
        let finished = 0
        board.enableMoveInput((e) => {
            if (e.type === INPUT_EVENT_TYPE.moveInputFinished) finished++
            return true
        }, COLOR.white)
        const vmi = board.view.visualMoveInput

        vmi.onPointerDown(mouseDown("e2"))
        vmi.onPointerUp(mouseUp("e2"))
        assert.equal(vmi.moveInputState, STATE_CLICK_TO)

        vmi.onPointerDown(mouseDown("e4"))
        await tick()
        assert.equal(board.getPiece("e4"), "wp")
        assert.equal(board.getPiece("e2"), null)
        assert.equal(finished, 1)
        board.destroy()
    })

    it("should complete a drag move to a new square", async () => {
        const board = newBoard()
        board.enableMoveInput(() => true, COLOR.white)
        const vmi = board.view.visualMoveInput

        vmi.onPointerDown(mouseDown("e2", 100, 100))
        vmi.onPointerMove(mouseMove("e4", 100, 140)) // past DRAG_THRESHOLD -> dragTo
        assert.equal(vmi.moveInputState, STATE_DRAG_TO)
        vmi.onPointerUp(mouseUp("e4"))
        await tick()
        assert.equal(board.getPiece("e4"), "wp")
        assert.equal(board.getPiece("e2"), null)
        board.destroy()
    })

    // Regression for https://github.com/shaack/cm-chessboard/issues/170 (PR #171)
    it("should cancel when a piece is dragged back to its origin", async () => {
        const board = newBoard()
        let canceledReason
        board.enableMoveInput((e) => {
            if (e.type === INPUT_EVENT_TYPE.moveInputCanceled) canceledReason = e.reason
            return true
        }, COLOR.white)
        const vmi = board.view.visualMoveInput

        vmi.onPointerDown(mouseDown("e2", 100, 100))
        vmi.onPointerMove(mouseMove("e2", 100, 140)) // -> dragTo
        assert.equal(vmi.moveInputState, STATE_DRAG_TO)
        vmi.onPointerUp(mouseUp("e2")) // dropped back on origin
        await tick()

        assert.equal(canceledReason, MOVE_CANCELED_REASON.draggedBack)
        assert.equal(vmi.moveInputState, STATE_WAIT_FOR_INPUT_START)
        assert.equal(board.getPiece("e2"), "wp") // piece stays put
        board.destroy()
    })

    // Regression for https://github.com/shaack/cm-chessboard/issues/170
    it("should re-select when clicking another own piece", async () => {
        const board = newBoard()
        let canceledReason
        board.enableMoveInput((e) => {
            if (e.type === INPUT_EVENT_TYPE.validateMoveInput) return false // not a legal move onto own piece
            if (e.type === INPUT_EVENT_TYPE.moveInputCanceled) canceledReason = e.reason
            return true
        }, COLOR.white)
        const vmi = board.view.visualMoveInput

        vmi.onPointerDown(mouseDown("e2"))
        vmi.onPointerUp(mouseUp("e2"))
        assert.equal(vmi.moveInputState, STATE_CLICK_TO)

        vmi.onPointerDown(mouseDown("d1")) // own white queen
        assert.equal(canceledReason, MOVE_CANCELED_REASON.clickedAnotherPiece)
        assert.equal(vmi.fromSquare, "d1")
        assert.equal(vmi.moveInputState, STATE_PIECE_CLICKED_THRESHOLD)
        await tick()
        board.destroy()
    })

    // Regression for https://github.com/shaack/cm-chessboard/pull/173
    it("should cancel an in-progress move on right click", async () => {
        const board = newBoard()
        let canceledReason
        board.enableMoveInput((e) => {
            if (e.type === INPUT_EVENT_TYPE.moveInputCanceled) canceledReason = e.reason
            return true
        }, COLOR.white)
        const vmi = board.view.visualMoveInput

        vmi.onPointerDown(mouseDown("e2"))
        vmi.onPointerUp(mouseUp("e2"))
        assert.equal(vmi.moveInputState, STATE_CLICK_TO)

        vmi.onContextMenu({preventDefault: () => {}})
        assert.equal(canceledReason, MOVE_CANCELED_REASON.secondaryClick)
        assert.equal(vmi.moveInputState, STATE_WAIT_FOR_INPUT_START)
        await tick()
        board.destroy()
    })

    it("should ignore input when move input is disabled", () => {
        const board = newBoard()
        const vmi = board.view.visualMoveInput
        vmi.onPointerDown(mouseDown("e2"))
        assert.equal(vmi.moveInputState, STATE_WAIT_FOR_INPUT_START)
        board.destroy()
    })

    it("should ignore a piece of the disabled color", () => {
        const board = newBoard()
        board.enableMoveInput(() => true, COLOR.white)
        const vmi = board.view.visualMoveInput
        vmi.onPointerDown(mouseDown("e7")) // black pawn, black input disabled
        assert.equal(vmi.moveInputState, STATE_WAIT_FOR_INPUT_START)
        board.destroy()
    })

    it("should not start a move when moveInputStarted returns false", () => {
        const board = newBoard()
        board.enableMoveInput((e) => e.type !== INPUT_EVENT_TYPE.moveInputStarted, COLOR.white)
        const vmi = board.view.visualMoveInput
        vmi.onPointerDown(mouseDown("e2"))
        assert.equal(vmi.moveInputState, STATE_WAIT_FOR_INPUT_START)
        board.destroy()
    })

})
