/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */

export class ChessboardState {

    constructor() {
        this.squares = new Array(64).fill(null)
        this.orientation = undefined
        this.markers = []
        this.inputWhiteEnabled = false
        this.inputBlackEnabled = false
        this.inputEnabled = false
        this.squareSelectEnabled = false
    }

    setPiece(index, piece) {
        this.squares[index] = piece
    }

    addMarker(index, type) {
        this.markers.push({index: index, type: type})
    }

    removeMarkers(index = undefined, type = undefined) {
        if (!index && !type) {
            this.markers = []
        } else {
            this.markers = this.markers.filter((marker) => {
                if (!marker.type) {
                    if (index === marker.index) {
                        return false
                    }
                } else if (!index) {
                    if (marker.type === type) {
                        return false
                    }
                } else if (marker.type === type && index === marker.index) {
                    return false
                }
                return true
            })
        }
    }

    setPosition(fen) {
        if (fen) {
            const parts = fen.replace(/^\s*/, "").replace(/\s*$/, "").split(/\/|\s/)
            for (let part = 0; part < 8; part++) {
                const row = parts[7 - part].replace(/\d/g, (str) => {
                    const numSpaces = parseInt(str)
                    let ret = ''
                    for (let i = 0; i < numSpaces; i++) {
                        ret += '-'
                    }
                    return ret
                })
                for (let c = 0; c < 8; c++) {
                    const char = row.substr(c, 1)
                    let piece = null
                    if (char !== '-') {
                        if (char.toUpperCase() === char) {
                            piece = `w${char.toLowerCase()}`
                        } else {
                            piece = `b${char}`
                        }
                    }
                    this.squares[part * 8 + c] = piece
                }
            }
        }
    }

    getPosition() {
        let parts = new Array(8).fill("")
        for (let part = 0; part < 8; part++) {
            let spaceCounter = 0
            for (let i = 0; i < 8; i++) {
                const piece = this.squares[part * 8 + i]
                if (!piece) {
                    spaceCounter++
                } else {
                    if (spaceCounter > 0) {
                        parts[7 - part] += spaceCounter
                        spaceCounter = 0
                    }
                    const color = piece.substr(0, 1)
                    const name = piece.substr(1, 1)
                    if (color === "w") {
                        parts[7 - part] += name.toUpperCase()
                    } else {
                        parts[7 - part] += name
                    }
                }
            }
            if (spaceCounter > 0) {
                parts[7 - part] += spaceCounter
                spaceCounter = 0
            }
        }
        return parts.join("/")
    }

    squareToIndex(square) {
        const file = square.substr(0, 1).charCodeAt(0) - 97
        const rank = square.substr(1, 1) - 1
        return 8 * rank + file
    }

}