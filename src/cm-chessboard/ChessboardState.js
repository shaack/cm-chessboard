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
        this.markers = []
        this.inputWhiteEnabled = false
        this.inputBlackEnabled = false
        this.inputEnabled = false
        this.squareSelectEnabled = false
    }
/*
    getPieces() {
        return this.position.getPieces()
    }

    setPiece(square, piece) {
        this.position.setPiece(square, piece)
    }
*/
    setPosition(fen) {
        this.position.setFen(fen)
    }

    getPosition() {
        return this.position.getFen()
    }

    addMarker(square, type) {
        this.markers.push({square: square, type: type})
    }

    removeMarkers(square = undefined, type = undefined) {
        if (!square && !type) {
            this.markers = []
        } else {
            this.markers = this.markers.filter((marker) => {
                if (!marker.type) {
                    if (square === marker.square) {
                        return false
                    }
                } else if (!square) {
                    if (marker.type === type) {
                        return false
                    }
                } else if (marker.type === type && square === marker.square) {
                    return false
                }
                return true
            })
        }
    }

}
