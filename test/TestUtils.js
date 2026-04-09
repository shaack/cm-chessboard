/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

import {describe, it, assert} from "../node_modules/teevi/src/teevi.js"
import {Utils} from "../src/lib/Utils.js"

describe("TestUtils", () => {

    it("should merge simple objects", () => {
        const target = {a: 1, b: 2}
        const source = {b: 20, c: 30}
        Utils.mergeObjects(target, source)
        assert.equal(target.a, 1)
        assert.equal(target.b, 20)
        assert.equal(target.c, 30)
    })

    it("should deep-merge nested objects", () => {
        const target = {style: {color: "red", size: 10, pieces: {file: "a.svg"}}}
        const source = {style: {size: 20, pieces: {tileSize: 40}}}
        Utils.mergeObjects(target, source)
        assert.equal(target.style.color, "red")
        assert.equal(target.style.size, 20)
        assert.equal(target.style.pieces.file, "a.svg")
        assert.equal(target.style.pieces.tileSize, 40)
    })

    it("should NOT mutate the source object when merging", () => {
        const target1 = {nested: {a: 1}}
        const target2 = {nested: {a: 100, b: 200}}
        const source = {nested: {a: 2}}
        Utils.mergeObjects(target1, source)
        Utils.mergeObjects(target2, source)
        // source must still be untouched
        assert.equal(source.nested.a, 2)
        assert.equal(source.nested.b, undefined)
        // target1 got the source's value
        assert.equal(target1.nested.a, 2)
        // target2 kept its own key `b` and got source's `a`
        assert.equal(target2.nested.a, 2)
        assert.equal(target2.nested.b, 200)
    })

    it("should allow the same source object to be used for multiple merges without pollution", () => {
        const defaults1 = {style: {cssClass: "green", showCoordinates: true}}
        const defaults2 = {style: {cssClass: "blue", showCoordinates: true}}
        const userProps = {style: {cssClass: "custom"}}
        Utils.mergeObjects(defaults1, userProps)
        Utils.mergeObjects(defaults2, userProps)
        assert.equal(defaults1.style.cssClass, "custom")
        assert.equal(defaults2.style.cssClass, "custom")
        // showCoordinates must have been preserved in both
        assert.equal(defaults1.style.showCoordinates, true)
        assert.equal(defaults2.style.showCoordinates, true)
        // userProps must not have been polluted with showCoordinates
        assert.equal(userProps.style.showCoordinates, undefined)
    })

    it("should detect absolute urls", () => {
        assert.equal(Utils.isAbsoluteUrl("https://example.com/foo.svg"), true)
        assert.equal(Utils.isAbsoluteUrl("http://example.com/foo.svg"), true)
        assert.equal(Utils.isAbsoluteUrl("/root-relative.svg"), true)
        assert.equal(Utils.isAbsoluteUrl("./relative.svg"), false)
        assert.equal(Utils.isAbsoluteUrl("relative.svg"), false)
        assert.equal(Utils.isAbsoluteUrl("pieces/standard.svg"), false)
    })

    it("should create a task with resolve and reject", () => {
        const task = Utils.createTask()
        assert.equal(typeof task.resolve, "function")
        assert.equal(typeof task.reject, "function")
        assert.equal(typeof task.then, "function")
    })

    it("should create a task that can be resolved externally", async () => {
        const task = Utils.createTask()
        task.resolve("hello")
        const result = await task
        assert.equal(result, "hello")
    })

    it("should create a DOM element from HTML string", () => {
        const el = Utils.createDomElement("<div class='test'><span>Hi</span></div>")
        assert.equal(el.tagName.toLowerCase(), "div")
        assert.equal(el.className, "test")
        assert.equal(el.firstChild.tagName.toLowerCase(), "span")
        assert.equal(el.firstChild.textContent, "Hi")
    })

    it("delegate should return an object with remove()", () => {
        const el = document.createElement("div")
        const handler = () => {}
        const delegation = Utils.delegate(el, "click", ".child", handler)
        assert.equal(typeof delegation.remove, "function")
        delegation.remove()
    })

})
