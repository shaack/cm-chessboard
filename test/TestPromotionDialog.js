/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard, COLOR} from "../src/Chessboard.js"
import {PROMOTION_DIALOG_RESULT_TYPE, PromotionDialog} from "../src/extensions/promotion-dialog/PromotionDialog.js"

const POSITION = "4k3/1P6/8/8/8/8/6p1/4K3 w - - 0 1"

function makeBoard(props = {}) {
    return new Chessboard(document.getElementById("TestPromotionDialog"), {
        position: POSITION,
        assetsUrl: "../assets/",
        extensions: [{class: PromotionDialog, props: {language: "en"}}],
        ...props
    })
}

function buttonsOf(chessboard) {
    return [...chessboard.view.svg.querySelectorAll(".promotion-dialog-button-group")].map((group) => {
        const rect = group.querySelector("rect.promotion-dialog-button")
        return {
            group: group,
            piece: group.dataset.piece,
            index: group.dataset.index,
            label: group.getAttribute("aria-label"),
            tabindex: group.getAttribute("tabindex"),
            x: parseFloat(rect.getAttribute("x")),
            y: parseFloat(rect.getAttribute("y"))
        }
    })
}

function backgroundOf(chessboard) {
    const rect = chessboard.view.svg.querySelector("rect.promotion-dialog")
    return {
        x: parseFloat(rect.getAttribute("x")),
        y: parseFloat(rect.getAttribute("y")),
        height: parseFloat(rect.getAttribute("height"))
    }
}

// showPromotionDialog() defers the actual rendering over a setTimeout and the
// running position animation, so wait for the buttons instead of a fixed delay.
function showDialog(chessboard, square, color) {
    const answer = {}
    chessboard.showPromotionDialog(square, color, (result) => {
        answer.result = result
    })
    return new Promise((resolve, reject) => {
        const deadline = Date.now() + 2000
        const poll = () => {
            if (buttonsOf(chessboard).length === 4) {
                resolve(answer)
            } else if (Date.now() > deadline) {
                reject(new Error("the promotion dialog did not show up"))
            } else {
                setTimeout(poll)
            }
        }
        poll()
    })
}

function nextTick() {
    return new Promise((resolve) => setTimeout(resolve))
}

describe("TestPromotionDialog", () => {

    it("should offer queen, rook, bishop and knight of the promoting color", async () => {
        const chessboard = makeBoard()
        await showDialog(chessboard, "b8", COLOR.white)
        const buttons = buttonsOf(chessboard)
        assert.equal(buttons.length, 4)
        assert.equal(buttons.map((b) => b.piece).join(","), "wq,wr,wb,wn")
        assert.equal(buttons.map((b) => b.index).join(","), "0,1,2,3")
        assert.equal(buttons.map((b) => b.label).join(","), "Queen,Rook,Bishop,Knight")
        // only the first button is tabbable, the others are reached with the arrow keys
        assert.equal(buttons.map((b) => b.tabindex).join(","), "0,-1,-1,-1")
        assert.true(chessboard.isPromotionDialogShown())
        chessboard.destroy()
    })

    it("should grow away from the promotion square and stay inside its background", async () => {
        for (const [square, color, orientation, direction] of [
            ["b8", COLOR.white, COLOR.white, 1],
            ["b8", COLOR.white, COLOR.black, -1],
            ["g1", COLOR.black, COLOR.white, -1],
            ["g1", COLOR.black, COLOR.black, 1]
        ]) {
            const chessboard = makeBoard({orientation: orientation})
            await showDialog(chessboard, square, color)
            const buttons = buttonsOf(chessboard)
            const background = backgroundOf(chessboard)
            const squareHeight = chessboard.view.squareHeight
            const ys = buttons.map((b) => b.y)
            for (let i = 1; i < ys.length; i++) {
                assert.equal(Math.round(ys[i] - ys[i - 1]), Math.round(direction * squareHeight))
            }
            for (const button of buttons) {
                assert.equal(Math.round(button.x), Math.round(background.x))
            }
            assert.equal(Math.round(Math.min(...ys)), Math.round(background.y))
            assert.equal(Math.round(Math.max(...ys) + squareHeight), Math.round(background.y + background.height))
            chessboard.destroy()
        }
    })

    it("should answer with the selected piece and close", async () => {
        const chessboard = makeBoard()
        const answer = await showDialog(chessboard, "b8", COLOR.white)
        const knight = buttonsOf(chessboard).find((b) => b.piece === "wn")
        knight.group.querySelector("rect.promotion-dialog-button")
            .dispatchEvent(new PointerEvent("pointerdown", {bubbles: true, button: 0}))
        await nextTick()
        assert.equal(answer.result.type, PROMOTION_DIALOG_RESULT_TYPE.pieceSelected)
        assert.equal(answer.result.piece, "wn")
        assert.equal(answer.result.square, "b8")
        assert.false(chessboard.isPromotionDialogShown())
        assert.equal(buttonsOf(chessboard).length, 0)
        chessboard.destroy()
    })

    it("should answer canceled on escape", async () => {
        const chessboard = makeBoard()
        const answer = await showDialog(chessboard, "b8", COLOR.white)
        document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}))
        await nextTick()
        assert.equal(answer.result.type, PROMOTION_DIALOG_RESULT_TYPE.canceled)
        assert.false(chessboard.isPromotionDialogShown())
        assert.equal(buttonsOf(chessboard).length, 0)
        chessboard.destroy()
    })

    it("should remove its api and its live region on destroy", async () => {
        const chessboard = makeBoard()
        await showDialog(chessboard, "b8", COLOR.white)
        // Track this board's own live region. Counting them document wide would make
        // this test fail whenever another test left a board behind.
        const regions = chessboard.context.querySelectorAll(".cm-chessboard-promotion-live-region")
        const region = regions[regions.length - 1]
        assert.true(document.contains(region))
        chessboard.destroy()
        assert.equal(chessboard.showPromotionDialog, undefined)
        assert.equal(chessboard.isPromotionDialogShown, undefined)
        assert.false(document.contains(region))
    })

})
