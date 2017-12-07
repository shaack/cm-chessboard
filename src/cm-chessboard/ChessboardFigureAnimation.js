/**
 * Author: shaack
 * Date: 07.12.2017
 */
export class ChessboardFigureAnimation {
    constructor(previousBoard, newBoard) {
        this._previousBoard = previousBoard;
        this._newBoard = newBoard;
    }

    _squareDistance(index1, index2) {
        const file1 = index1 % 8;
        const rank1 = Math.floor(index1 / 8);
        const file2 = index2 % 8;
        const rank2 = Math.floor(index2 / 8);
        const rankDistance = Math.abs(rank2 - rank1);
        const fileDistance = Math.abs(file2 - file1);
        return Math.max(rankDistance, fileDistance);
    }
}