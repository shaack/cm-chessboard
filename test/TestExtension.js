/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard, FEN} from "../src/Chessboard.js"
import {Extension, EXTENSION_POINT} from "../src/model/Extension.js"

class TestSpyExtension extends Extension {
    constructor(chessboard, props = {}) {
        super(chessboard)
        this.props = {sprite: "extensions/markers/markers.svg"}
        Object.assign(this.props, props)
        this.events = []
        this.registerExtensionPoint(EXTENSION_POINT.positionChanged, () => {
            this.events.push("positionChanged")
        })
        this.registerExtensionPoint(EXTENSION_POINT.afterRedrawBoard, () => {
            this.events.push("afterRedrawBoard")
        })
        this.registerExtensionPoint(EXTENSION_POINT.destroy, () => {
            this.events.push("destroy")
        })
        chessboard.spy = this
    }
}

describe("TestExtension", () => {

    it("should register extension points and receive callbacks", async () => {
        const chessboard = new Chessboard(document.getElementById("TestExtension"), {
            assetsUrl: "../assets/",
            position: FEN.start,
            extensions: [{class: TestSpyExtension}]
        })
        const spy = chessboard.spy
        assert.equal(spy.events.includes("afterRedrawBoard"), true)
        assert.equal(spy.events.includes("positionChanged"), true)
        await chessboard.setPiece("e4", "wp")
        assert.equal(spy.events.filter(e => e === "positionChanged").length >= 2, true)
        chessboard.destroy()
        assert.equal(spy.events.includes("destroy"), true)
    })

    it("getSpriteUrl should resolve relative urls against assetsUrl", () => {
        const chessboard = new Chessboard(document.getElementById("TestExtension"), {
            assetsUrl: "/static/",
            extensions: [{class: TestSpyExtension, props: {sprite: "foo.svg"}}]
        })
        assert.equal(chessboard.spy.getSpriteUrl(), "/static/foo.svg")
        chessboard.destroy()
    })

    it("getSpriteUrl should respect absolute urls", () => {
        const chessboard = new Chessboard(document.getElementById("TestExtension"), {
            assetsUrl: "/static/",
            extensions: [{class: TestSpyExtension, props: {sprite: "https://cdn.example.com/foo.svg"}}]
        })
        assert.equal(chessboard.spy.getSpriteUrl(), "https://cdn.example.com/foo.svg")
        chessboard.destroy()
    })

    it("getSpriteUrl should treat root-relative urls as absolute", () => {
        const chessboard = new Chessboard(document.getElementById("TestExtension"), {
            assetsUrl: "/static/",
            extensions: [{class: TestSpyExtension, props: {sprite: "/cdn/foo.svg"}}]
        })
        assert.equal(chessboard.spy.getSpriteUrl(), "/cdn/foo.svg")
        chessboard.destroy()
    })

    it("addExtension should throw when extension is added twice", () => {
        const chessboard = new Chessboard(document.getElementById("TestExtension"), {
            assetsUrl: "../assets/",
            extensions: [{class: TestSpyExtension}]
        })
        let thrown = false
        try {
            chessboard.addExtension(TestSpyExtension)
        } catch (e) {
            thrown = true
        }
        assert.equal(thrown, true)
        chessboard.destroy()
    })

    it("getExtension should return the extension instance", () => {
        const chessboard = new Chessboard(document.getElementById("TestExtension"), {
            assetsUrl: "../assets/",
            extensions: [{class: TestSpyExtension}]
        })
        const extension = chessboard.getExtension(TestSpyExtension)
        assert.equal(extension instanceof TestSpyExtension, true)
        chessboard.destroy()
    })

})
