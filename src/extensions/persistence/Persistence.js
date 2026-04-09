/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {FEN} from "../../model/Position.js"

const DEFAULT_STORAGE_KEY_PREFIX = "cm-chessboard:"

export class Persistence extends Extension {
    constructor(chessboard, props = {}) {
        super(chessboard)
        this.props = {
            storageKey: DEFAULT_STORAGE_KEY_PREFIX + (chessboard.id || "default"),
            initialPosition: FEN.empty
        }
        Object.assign(this.props, props)
        this.savePositionBound = this.savePosition.bind(this)
        this.registerExtensionPoint(EXTENSION_POINT.positionChanged, this.savePositionBound)
        this.loadPosition()
    }

    savePosition() {
        try {
            localStorage.setItem(this.props.storageKey, JSON.stringify(this.chessboard.getPosition()))
        } catch (e) {
            console.warn("Persistence: failed to save position", e)
        }
    }

    loadPosition() {
        let position
        try {
            position = localStorage.getItem(this.props.storageKey)
        } catch (e) {
            console.warn("Persistence: failed to read position", e)
        }
        if (position) {
            try {
                this.chessboard.setPosition(JSON.parse(position))
            } catch (e) {
                console.warn("Persistence: failed to parse stored position, using initial position", e)
                this.chessboard.setPosition(this.props.initialPosition)
            }
        } else {
            this.chessboard.setPosition(this.props.initialPosition)
        }
    }
}
