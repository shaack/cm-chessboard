/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {ChessboardPiecesAnimation} from "./ChessboardPiecesAnimation.js"
import {FEN_EMPTY_POSITION, Position} from "../model/Position.js"

export class ChessboardPositionsAnimation {

    constructor(chessboard) {
        this.chessboard = chessboard
        this.currentPosition = new Position(FEN_EMPTY_POSITION)
        this.finished = Promise.resolve()
    }

    async renderPosition(position) {
        // console.log("renderPosition", positionFrom.getFen(), position.getFen())
        this.finished = this.finished.then(() => {
            const positionFrom = this.currentPosition
            this.currentPosition = position
            return new Promise((resolve) => {
                new ChessboardPiecesAnimation(this.chessboard.view,
                    positionFrom, position,
                    position.animated ? this.chessboard.props.animationDuration : 0, () => {
                        this.chessboard.view.drawPieces(position.squares) // reset the view
                        resolve()
                    })
            })
        })
        return this.finished
    }

}
