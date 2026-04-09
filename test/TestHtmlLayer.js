/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Chessboard} from "../src/Chessboard.js"
import {HtmlLayer} from "../src/extensions/html-layer/HtmlLayer.js"

describe("TestHtmlLayer", () => {

    it("should add an html layer and return the element", () => {
        const chessboard = new Chessboard(document.getElementById("TestHtmlLayer"), {
            assetsUrl: "../assets/",
            extensions: [{class: HtmlLayer}]
        })
        const layer = chessboard.addHtmlLayer("<span class='hello'>Hello</span>")
        assert.equal(layer.classList.contains("html-layer"), true)
        assert.equal(layer.querySelector(".hello").textContent, "Hello")
        chessboard.removeHtmlLayer(layer)
        chessboard.destroy()
    })

    it("removeHtmlLayer should detach the element", () => {
        const chessboard = new Chessboard(document.getElementById("TestHtmlLayer"), {
            assetsUrl: "../assets/",
            extensions: [{class: HtmlLayer}]
        })
        const layer = chessboard.addHtmlLayer("<div></div>")
        assert.equal(layer.parentNode, chessboard.context)
        chessboard.removeHtmlLayer(layer)
        assert.equal(layer.parentNode, null)
        chessboard.destroy()
    })

    it("should clean up all html layers on destroy", () => {
        const chessboard = new Chessboard(document.getElementById("TestHtmlLayer"), {
            assetsUrl: "../assets/",
            extensions: [{class: HtmlLayer}]
        })
        const layer1 = chessboard.addHtmlLayer("<div>1</div>")
        const layer2 = chessboard.addHtmlLayer("<div>2</div>")
        assert.equal(layer1.parentNode, chessboard.context)
        assert.equal(layer2.parentNode, chessboard.context)
        chessboard.destroy()
        assert.equal(layer1.parentNode, null)
        assert.equal(layer2.parentNode, null)
    })

    it("should clean up grafted methods on destroy", () => {
        const chessboard = new Chessboard(document.getElementById("TestHtmlLayer"), {
            assetsUrl: "../assets/",
            extensions: [{class: HtmlLayer}]
        })
        assert.equal(typeof chessboard.addHtmlLayer, "function")
        chessboard.destroy()
        assert.equal(chessboard.addHtmlLayer, undefined)
        assert.equal(chessboard.removeHtmlLayer, undefined)
    })

    it("removeHtmlLayer should warn but not throw on unknown layer", () => {
        const chessboard = new Chessboard(document.getElementById("TestHtmlLayer"), {
            assetsUrl: "../assets/",
            extensions: [{class: HtmlLayer}]
        })
        const fake = document.createElement("div")
        let thrown = false
        try {
            chessboard.removeHtmlLayer(fake)
        } catch (e) {
            thrown = true
        }
        assert.equal(thrown, false)
        chessboard.destroy()
    })

})
