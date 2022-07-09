/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

export const EXTENSION_POINT = {
    positionChanged: "positionChanged",
    boardChanged: "boardChanged",
    moveInputStateChanged: "moveInputStateChanged",
    destroy: "destroy"
}

export class Extension {

    constructor(chessboard, props) {
        this.chessboard = chessboard
        this.props = props
    }

    registerExtensionPoint(name, callback) {
        if(!this.chessboard.state.extensionPoints[name]) {
            this.chessboard.state.extensionPoints[name] = []
        }
        this.chessboard.state.extensionPoints[name].push(callback)
    }

}
