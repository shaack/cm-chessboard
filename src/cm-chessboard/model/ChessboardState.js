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

    setPosition(fen, animated = false) {
        this.position = new Position(fen, animated)
    }

    movePiece(fromSquare, toSquare, animated = false) {
        const position = this._position.clone()
        position.animated = animated
        const piece = position.getPiece(fromSquare)
        if(!piece) {
            console.error("no piece on", fromSquare)
        }
        position.setPiece(fromSquare, undefined)
        position.setPiece(toSquare, piece)
        this._position = position
    }

    setPiece(square, piece, animated = false) {
        const position = this._position.clone()
        position.animated = animated
        position.setPiece(square, piece)
        this._position = position
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
