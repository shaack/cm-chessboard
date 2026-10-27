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
        // set per move from `event.premove` in the validateMoveInput callback; `true` marks a rejected
        // move as consumed (e.g. stored as premove), so a click into an own piece does not reselect it
        this.moveInputPremove = false
        // optional `(event) => boolean`, set by an extension (e.g. Premove) to take over the move input
        // events from the `moveInputCallback`; returns `true` if it handled the event
        this.moveInputInterceptor = null
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
