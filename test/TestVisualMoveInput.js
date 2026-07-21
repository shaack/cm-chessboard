/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard} from "../src/Chessboard.js"
import {FEN} from "../src/model/Position.js"

const STATE_WAIT_FOR_INPUT_START = "waitForInputStart"
const STATE_PIECE_CLICKED_THRESHOLD = "pieceClickedThreshold"

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

})
