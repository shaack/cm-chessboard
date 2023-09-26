/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

export const EXTENSION_POINT = {
    positionChanged: "positionChanged", // the positions of the pieces was changed
    boardChanged: "boardChanged", // the board (orientation) was changed
    moveInputToggled: "moveInputToggled", // move input was enabled or disabled
    moveInput: "moveInput", // move started, moving over a square, validating or canceled
    beforeRedrawBoard: "beforeRedrawBoard", // called before redrawing the board
    afterRedrawBoard: "afterRedrawBoard", // called after redrawing the board
    redrawBoard: "redrawBoard", // called after redrawing the board, DEPRECATED, use afterRedrawBoard 2023-09-18
    animation: "animation", // called on animation start, end, and on every animation frame
    destroy: "destroy" // called, before the board is destroyed
}

export class Extension {

    constructor(chessboard) {
        this.chessboard = chessboard
    }

    registerExtensionPoint(name, callback) {
        if(name === EXTENSION_POINT.redrawBoard) { // deprecated 2023-09-18
            console.warn("EXTENSION_POINT.redrawBoard is deprecated, use EXTENSION_POINT.afterRedrawBoard")
            name = EXTENSION_POINT.afterRedrawBoard
        }
        if (!this.chessboard.state.extensionPoints[name]) {
            this.chessboard.state.extensionPoints[name] = []
        }
        this.chessboard.state.extensionPoints[name].push(callback)
    }

    /** @deprecated 2023-05-18 */
    registerMethod(name, callback) {
        console.warn("registerMethod is deprecated, just add methods directly to the chessboard instance")
        if (!this.chessboard[name]) {
            this.chessboard[name] = (...args) => {
                return callback.apply(this, args)
            }
        } else {
            log.error("method", name, "already exists")
        }
    }

}
