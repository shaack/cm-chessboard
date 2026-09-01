/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Position} from "./Position.js"

export class ChessboardState {

    constructor() {
        this.position = new Position()
        this.orientation = undefined
        this.inputWhiteEnabled = false
        this.inputBlackEnabled = false
        this.squareSelectEnabled = false
        this.moveInputCallback = null
        // set per move from `event.animate` in the validateMoveInput callback; `false` skips
        // the completion animation of a click move (see ChessboardView/VisualMoveInput)
        this.moveInputAnimate = undefined
        this.extensionPoints = {}
        this.moveInputProcess = Promise.resolve()
    }

    inputEnabled() {
        return this.inputWhiteEnabled || this.inputBlackEnabled
    }

    invokeExtensionPoints(name, data = {}) {
        const extensionPoints = this.extensionPoints[name]
        const dataCloned = Object.assign({}, data)
        dataCloned.extensionPoint = name
        let returnValue = true
        if (extensionPoints) {
            for (const extensionPoint of extensionPoints) {
                if(extensionPoint(dataCloned) === false) {
                    returnValue = false
                }
            }
        }
        return returnValue
    }

}
