/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard} from "../src/Chessboard.js"
import {COLOR, INPUT_EVENT_TYPE} from "../src/view/ChessboardView.js"
import {FEN} from "../src/model/Position.js"

const STATE_WAIT_FOR_INPUT_START = "waitForInputStart"
const STATE_PIECE_CLICKED_THRESHOLD = "pieceClickedThreshold"
const STATE_CLICK_TO = "clickTo"

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

    it("should mark the same-color reselect validation as a probe", async () => {
        const chessboard = new Chessboard(document.getElementById("TestBoard"), {
            assetsUrl: "../assets/",
            position: FEN.start
        })
        let probeSeen
        chessboard.enableMoveInput((event) => {
            if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
                probeSeen = event.probe
                return false // reject -> this is a re-selection, not a real move
            }
            return true
        }, COLOR.white)
        const visualMoveInput = chessboard.view.visualMoveInput

        // simulate an existing click-to-move selection of the white e2 pawn
        // (moveInputStartedCallback sets up the internal moveInputProcess task)
        visualMoveInput.moveInputStartedCallback("e2")
        visualMoveInput.moveInputState = STATE_CLICK_TO
        visualMoveInput.fromSquare = "e2"

        // click another own (white) piece, the d1 queen -> chess960 probe branch
        visualMoveInput.onPointerDown({
            type: "touchstart",
            target: {getAttribute: (name) => (name === "data-square" ? "d1" : null)},
            touches: [{clientX: 100, clientY: 100}],
            preventDefault: () => {}
        })

        assert.equal(probeSeen, true)

        await new Promise((resolve) => setTimeout(resolve))
        chessboard.destroy()
    })

})
