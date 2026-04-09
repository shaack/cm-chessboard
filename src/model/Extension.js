/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Utils} from "../lib/Utils.js"

export const EXTENSION_POINT = {
    positionChanged: "positionChanged", // the positions of the pieces was changed
    boardChanged: "boardChanged", // the board (orientation) was changed
    moveInputToggled: "moveInputToggled", // move input was enabled or disabled
    moveInput: "moveInput", // move started, moving over a square, validating or canceled
    beforeRedrawBoard: "beforeRedrawBoard", // called before redrawing the board
    afterRedrawBoard: "afterRedrawBoard", // called after redrawing the board
    animation: "animation", // called on animation start, end, and on every animation frame
    destroy: "destroy" // called, before the board is destroyed
}

export class Extension {

    constructor(chessboard) {
        this.chessboard = chessboard
    }

    registerExtensionPoint(name, callback) {
        if (!this.chessboard.state.extensionPoints[name]) {
            this.chessboard.state.extensionPoints[name] = []
        }
        this.chessboard.state.extensionPoints[name].push(callback)
    }

    /**
     * Resolve the sprite url honoring absolute urls and the chessboard's assetsUrl.
     * Subclasses that need a sprite should set `this.props.sprite`.
     */
    getSpriteUrl() {
        if (Utils.isAbsoluteUrl(this.props.sprite)) {
            return this.props.sprite
        }
        return this.chessboard.props.assetsUrl + this.props.sprite
    }

}
