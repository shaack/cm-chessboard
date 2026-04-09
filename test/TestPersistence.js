/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard} from "../src/Chessboard.js"
import {FEN} from "../src/model/Position.js"
import {Persistence} from "../src/extensions/persistence/Persistence.js"

describe("TestPersistence", () => {

    it("should save position to localStorage when piece is placed", async () => {
        const storageKey = "cm-chessboard-test-save-" + Math.random()
        try { localStorage.removeItem(storageKey) } catch (e) {}
        const chessboard = new Chessboard(document.getElementById("TestPersistence"), {
            assetsUrl: "../assets/",
            extensions: [{class: Persistence, props: {storageKey, initialPosition: FEN.empty}}]
        })
        await chessboard.setPiece("e4", "wp")
        const stored = JSON.parse(localStorage.getItem(storageKey))
        assert.equal(stored.includes("4P3"), true)
        chessboard.destroy()
        localStorage.removeItem(storageKey)
    })

    it("should restore the previously saved position", async () => {
        const storageKey = "cm-chessboard-test-load-" + Math.random()
        localStorage.setItem(storageKey, JSON.stringify("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"))
        const chessboard = new Chessboard(document.getElementById("TestPersistence"), {
            assetsUrl: "../assets/",
            extensions: [{class: Persistence, props: {storageKey}}]
        })
        // setPosition is async; getPosition reads the in-memory state
        await new Promise((r) => setTimeout(r, 50))
        assert.equal(chessboard.getPosition(), "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
        chessboard.destroy()
        localStorage.removeItem(storageKey)
    })

    it("should fall back to initialPosition when no stored value", async () => {
        const storageKey = "cm-chessboard-test-initial-" + Math.random()
        try { localStorage.removeItem(storageKey) } catch (e) {}
        const chessboard = new Chessboard(document.getElementById("TestPersistence"), {
            assetsUrl: "../assets/",
            extensions: [{class: Persistence, props: {storageKey, initialPosition: FEN.start}}]
        })
        await new Promise((r) => setTimeout(r, 50))
        assert.equal(chessboard.getPosition(), "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
        chessboard.destroy()
        localStorage.removeItem(storageKey)
    })

    it("should not collide between two boards with different storageKeys", async () => {
        const key1 = "cm-chessboard-test-multi-1-" + Math.random()
        const key2 = "cm-chessboard-test-multi-2-" + Math.random()
        const board1 = new Chessboard(document.getElementById("TestPersistence"), {
            assetsUrl: "../assets/",
            extensions: [{class: Persistence, props: {storageKey: key1, initialPosition: FEN.empty}}]
        })
        const board2 = new Chessboard(document.getElementById("TestPersistence2"), {
            assetsUrl: "../assets/",
            extensions: [{class: Persistence, props: {storageKey: key2, initialPosition: FEN.empty}}]
        })
        await board1.setPiece("e4", "wp")
        await board2.setPiece("d5", "bp")
        const stored1 = JSON.parse(localStorage.getItem(key1))
        const stored2 = JSON.parse(localStorage.getItem(key2))
        assert.equal(stored1.includes("4P3"), true)
        assert.equal(stored2.includes("3p4"), true)
        // Crucially: board1's saved position must NOT contain board2's piece
        assert.equal(stored1.includes("3p4"), false)
        board1.destroy()
        board2.destroy()
        localStorage.removeItem(key1)
        localStorage.removeItem(key2)
    })

    it("should gracefully handle corrupted stored value", async () => {
        const storageKey = "cm-chessboard-test-corrupt-" + Math.random()
        localStorage.setItem(storageKey, "this is not valid json")
        // Should not throw
        const chessboard = new Chessboard(document.getElementById("TestPersistence"), {
            assetsUrl: "../assets/",
            extensions: [{class: Persistence, props: {storageKey, initialPosition: FEN.start}}]
        })
        await new Promise((r) => setTimeout(r, 50))
        // Should fall back to initialPosition
        assert.equal(chessboard.getPosition(), "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
        chessboard.destroy()
        localStorage.removeItem(storageKey)
    })

})
