/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard} from "../src/Chessboard.js"
import {COLOR, INPUT_EVENT_TYPE} from "../src/view/ChessboardView.js"
import {FEN, Position} from "../src/model/Position.js"
import {Markers} from "../src/extensions/markers/Markers.js"
import {Premove, premoveDests, PREMOVE_MARKER_TYPE, PREMOVE_UNSET_REASON} from "../src/extensions/premove/Premove.js"

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

function click(board, square) {
    const vmi = board.view.visualMoveInput
    vmi.onPointerDown(mouseDown(square))
    vmi.onPointerUp(mouseUp(square))
}

function newBoard(premoveProps = {}, fen = FEN.start) {
    const log = {app: [], set: [], unset: []}
    const board = new Chessboard(document.getElementById("TestPremove"), {
        assetsUrl: "../assets/",
        position: fen,
        style: {animationDuration: 0},
        extensions: [
            {class: Markers, props: {autoMarkers: null}},
            {
                class: Premove, props: Object.assign({
                    color: COLOR.white,
                    onSet: (premove) => log.set.push(premove),
                    onUnset: (premove, reason) => log.unset.push(reason)
                }, premoveProps)
            }
        ]
    })
    board.enableMoveInput((event) => {
        log.app.push(event.type)
        return true
    }, COLOR.white)
    return {board, log}
}

const sorted = (squares) => squares.slice().sort().join(",")

describe("TestPremove", () => {

    it("should calculate pseudo legal premove destinations", () => {
        const position = new Position(FEN.start)
        assert.equal(sorted(premoveDests(position, "b1")), "a3,c3,d2")
        assert.equal(sorted(premoveDests(position, "e2")), "d3,e3,e4,f3")
        assert.equal(sorted(premoveDests(position, "e7")), "d6,e5,e6,f6")
        // blockers are ignored, the bishop sees the whole diagonal
        assert.equal(sorted(premoveDests(position, "c1")), "a3,b2,d2,e3,f4,g5,h6")
        // king: neighbours, castling to c1/g1 and onto own rooks
        assert.equal(sorted(premoveDests(position, "e1")), "a1,c1,d1,d2,e2,f1,f2,g1,h1")
        assert.equal(sorted(premoveDests(position, "e1", false)), "d1,d2,e2,f1,f2")
        // no castling without the rook
        assert.equal(sorted(premoveDests(new Position("4k3/8/8/8/8/8/8/4K2R"), "e1")), "d1,d2,e2,f1,f2,g1,h1")
    })

    it("should not intercept, while it is the player's turn", async () => {
        const {board, log} = newBoard()
        board.setTurn(COLOR.white)
        click(board, "e2")
        click(board, "e4")
        await tick()
        assert.equal(board.getPiece("e4"), "wp")
        assert.true(log.app.includes(INPUT_EVENT_TYPE.validateMoveInput))
        assert.equal(board.getPremove(), null)
        board.destroy()
    })

    it("should be inert, if no turn is set", async () => {
        const {board, log} = newBoard()
        click(board, "e2")
        click(board, "e4")
        await tick()
        assert.equal(board.getPiece("e4"), "wp")
        assert.equal(log.set.length, 0)
        board.destroy()
    })

    it("should store a click premove without changing the position", async () => {
        const {board, log} = newBoard()
        board.setTurn(COLOR.black)
        click(board, "e2")
        assert.equal(board.getMarkers(PREMOVE_MARKER_TYPE.dest).length, 4)
        click(board, "e4")
        await tick()
        assert.equal(board.getPiece("e2"), "wp")
        assert.equal(board.getPiece("e4"), null)
        assert.equal(board.getPremove().from, "e2")
        assert.equal(board.getPremove().to, "e4")
        assert.equal(log.set.length, 1)
        assert.equal(log.app.length, 0) // the app handler is not bothered
        assert.equal(board.getMarkers(PREMOVE_MARKER_TYPE.square).length, 2)
        assert.equal(board.getMarkers(PREMOVE_MARKER_TYPE.dest).length, 0)
        assert.equal(board.view.visualMoveInput.moveInputState, "waitForInputStart")
        board.destroy()
    })

    it("should store a drag premove", async () => {
        const {board} = newBoard()
        board.setTurn(COLOR.black)
        const vmi = board.view.visualMoveInput
        vmi.onPointerDown(mouseDown("g1", 100, 100))
        vmi.onPointerMove(mouseMove("g1", 130, 130))
        vmi.onPointerUp(mouseUp("f3"))
        await tick()
        assert.equal(board.getPiece("g1"), "wn")
        assert.equal(board.getPremove().to, "f3")
        assert.equal(board.view.piecesGroup.querySelectorAll("[visibility=hidden]").length, 0)
        board.destroy()
    })

    it("should store a recapture premove into an own piece instead of selecting it", async () => {
        const {board} = newBoard()
        board.setTurn(COLOR.black)
        click(board, "b1")
        click(board, "d2")
        await tick()
        assert.equal(board.getPremove().from, "b1")
        assert.equal(board.getPremove().to, "d2")
        assert.equal(board.view.visualMoveInput.moveInputState, "waitForInputStart")
        board.destroy()
    })

    it("should select another own piece, if it is no premove destination", async () => {
        const {board} = newBoard()
        board.setTurn(COLOR.black)
        click(board, "b1")
        board.view.visualMoveInput.onPointerDown(mouseDown("h2"))
        assert.equal(board.getPremove(), null)
        assert.equal(board.view.visualMoveInput.fromSquare, "h2")
        board.destroy()
    })

    it("should reject a premove to an unreachable square", async () => {
        const {board, log} = newBoard()
        board.setTurn(COLOR.black)
        click(board, "e2")
        click(board, "e5")
        await tick()
        assert.equal(board.getPremove(), null)
        assert.equal(log.set.length, 0)
        board.destroy()
    })

    it("should play the premove with the executor", async () => {
        const {board, log} = newBoard()
        board.setTurn(COLOR.black)
        click(board, "e2")
        click(board, "e4")
        await tick()
        // the opponent moves
        await board.setPosition("rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
        let executed = null
        const played = board.playPremove((premove) => {
            executed = premove
            board.movePiece(premove.from, premove.to)
            return true
        })
        assert.true(played)
        assert.equal(executed.from + executed.to, "e2e4")
        assert.equal(executed.piece, "wp")
        assert.equal(board.getPiece("e4"), "wp")
        assert.equal(board.getPremove(), null)
        assert.equal(board.getTurn(), COLOR.white)
        assert.equal(log.unset.join(","), PREMOVE_UNSET_REASON.played)
        assert.equal(board.getMarkers(PREMOVE_MARKER_TYPE.square).length, 0)
        board.destroy()
    })

    it("should clear the premove, if the executor rejects it", async () => {
        const {board, log} = newBoard()
        board.setTurn(COLOR.black)
        click(board, "e2")
        click(board, "e4")
        await tick()
        assert.false(board.playPremove(() => false))
        assert.equal(board.getPremove(), null)
        assert.equal(log.unset.join(","), PREMOVE_UNSET_REASON.failed)
        assert.false(board.playPremove(() => true)) // nothing stored anymore
        board.destroy()
    })

    it("should unset the premove, if the premoved piece gets captured", async () => {
        const {board, log} = newBoard()
        board.setTurn(COLOR.black)
        click(board, "b1")
        click(board, "c3")
        await tick()
        await board.setPiece("b1", "bb")
        assert.equal(board.getPremove(), null)
        assert.equal(log.unset.join(","), PREMOVE_UNSET_REASON.pieceChanged)
        board.destroy()
    })

    it("should cancel the premove with a click on the board", async () => {
        const {board, log} = newBoard()
        board.setTurn(COLOR.black)
        click(board, "e2")
        click(board, "e4")
        await tick()
        const square = board.view.boardGroup.querySelector("[data-square='a5']")
        square.dispatchEvent(new MouseEvent("mousedown", {bubbles: true, button: 0}))
        window.dispatchEvent(new MouseEvent("mouseup", {bubbles: true, button: 0}))
        assert.equal(board.getPremove(), null)
        assert.equal(log.unset.join(","), PREMOVE_UNSET_REASON.clicked)
        board.destroy()
    })

    it("should not cancel the premove by the compatibility mousedown after a tap", async () => {
        const {board} = newBoard()
        board.setTurn(COLOR.black)
        const premove = board.getExtension(Premove)
        // the tap on the destination square, it completes the premove input
        premove.onPointerDown({type: "touchstart"})
        board.setPremove("e2", "e4")
        // the browser fires a compatibility mousedown for the same tap
        premove.onPointerDown({type: "mousedown", button: 0})
        assert.equal(board.getPremove().to, "e4")
        board.destroy()
    })

    it("should not cancel the premove, when the click completes a premove input", async () => {
        const {board, log} = newBoard()
        board.setTurn(COLOR.black)
        click(board, "e2")
        click(board, "e4")
        await tick()
        // select a piece (this click cancels the old premove), then click the destination
        const sq = (s) => board.view.boardGroup.querySelector(`[data-square='${s}']`)
        sq("g1").dispatchEvent(new MouseEvent("mousedown", {bubbles: true, button: 0}))
        sq("g1").dispatchEvent(new MouseEvent("mouseup", {bubbles: true, button: 0}))
        sq("f3").dispatchEvent(new MouseEvent("mousedown", {bubbles: true, button: 0}))
        await tick()
        assert.equal(board.getPremove().from + board.getPremove().to, "g1f3")
        assert.equal(log.unset.join(","), PREMOVE_UNSET_REASON.clicked)
        board.destroy()
    })

    it("should make a regular move, if the turn changes while dragging", async () => {
        const {board, log} = newBoard()
        board.setTurn(COLOR.black)
        const vmi = board.view.visualMoveInput
        vmi.onPointerDown(mouseDown("e2", 100, 100))
        vmi.onPointerMove(mouseMove("e2", 130, 130))
        board.setTurn(COLOR.white) // the opponent moved meanwhile
        vmi.onPointerUp(mouseUp("e4"))
        await tick()
        assert.equal(board.getPremove(), null)
        assert.equal(board.getPiece("e4"), "wp")
        assert.true(log.app.includes(INPUT_EVENT_TYPE.validateMoveInput))
        assert.true(log.app.includes(INPUT_EVENT_TYPE.moveInputFinished))
        board.destroy()
    })

    it("should auto queen promotion premoves", async () => {
        const {board} = newBoard({}, "8/4P3/8/8/8/8/8/k6K w - - 0 1")
        board.setTurn(COLOR.black)
        click(board, "e7")
        click(board, "e8")
        await tick()
        assert.equal(board.getPremove().promotion, "q")
        board.destroy()
    })

    it("should use custom destinations", async () => {
        const {board} = newBoard({dests: () => ["h5"]})
        board.setTurn(COLOR.black)
        click(board, "e2")
        click(board, "e4")
        assert.equal(board.getPremove(), null)
        click(board, "e2")
        click(board, "h5")
        await tick()
        assert.equal(board.getPremove().to, "h5")
        board.destroy()
    })

    it("should clean up on destroy", async () => {
        const {board, log} = newBoard()
        board.setTurn(COLOR.black)
        board.setPremove("e2", "e4")
        const state = board.state
        board.destroy()
        assert.equal(state.moveInputInterceptor, null)
        assert.equal(board.playPremove, undefined)
        assert.equal(log.unset.join(","), PREMOVE_UNSET_REASON.destroyed)
    })

})
