/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {ChessboardState} from "../src/model/ChessboardState.js"

describe("TestChessboardState", () => {

    it("should initialize with default values", () => {
        const state = new ChessboardState()
        assert.equal(state.inputWhiteEnabled, false)
        assert.equal(state.inputBlackEnabled, false)
        assert.equal(state.squareSelectEnabled, false)
        assert.equal(state.moveInputCallback, null)
        assert.equal(state.inputEnabled(), false)
    })

    it("inputEnabled should return true when either color is enabled", () => {
        const state = new ChessboardState()
        state.inputWhiteEnabled = true
        assert.equal(state.inputEnabled(), true)
        state.inputWhiteEnabled = false
        state.inputBlackEnabled = true
        assert.equal(state.inputEnabled(), true)
    })

    it("invokeExtensionPoints should call all registered callbacks", () => {
        const state = new ChessboardState()
        const calls = []
        state.extensionPoints["test"] = [
            () => calls.push("a"),
            () => calls.push("b"),
            () => calls.push("c")
        ]
        state.invokeExtensionPoints("test")
        assert.equal(calls.join(","), "a,b,c")
    })

    it("invokeExtensionPoints should pass cloned data to callbacks with extensionPoint name", () => {
        const state = new ChessboardState()
        let receivedData
        state.extensionPoints["test"] = [(d) => { receivedData = d }]
        const data = {foo: "bar"}
        state.invokeExtensionPoints("test", data)
        assert.equal(receivedData.foo, "bar")
        assert.equal(receivedData.extensionPoint, "test")
        // Original data must not be mutated
        assert.equal(data.extensionPoint, undefined)
    })

    it("invokeExtensionPoints should return false if any callback returns false", () => {
        const state = new ChessboardState()
        state.extensionPoints["test"] = [
            () => true,
            () => false,
            () => true
        ]
        assert.equal(state.invokeExtensionPoints("test"), false)
    })

    it("invokeExtensionPoints should return true when no callback returns false", () => {
        const state = new ChessboardState()
        state.extensionPoints["test"] = [
            () => true,
            () => undefined,
            () => "anything"
        ]
        assert.equal(state.invokeExtensionPoints("test"), true)
    })

    it("invokeExtensionPoints should be safe when no extension points registered", () => {
        const state = new ChessboardState()
        // Should not throw
        const result = state.invokeExtensionPoints("nonexistent")
        assert.equal(result, true)
    })

})
