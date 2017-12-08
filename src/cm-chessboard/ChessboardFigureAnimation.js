/**
 * Author: shaack
 * Date: 07.12.2017
 */
const CHANGE_TYPE = {
    move: 1,
    appear: 2,
    disappear: 3
};

export class ChessboardFigureAnimation {

    /*
    - Iterate through all squares and mark changes
        - find pairs of appear and disappear of the same figure type, prefer nearer distance
            - store these pairs in an array
        - store also left over appears and disappars in the array, will fade in
        - animate all figures in the array
     */

    static animate(previousBoard, newBoard) {
        const changes = this.seekChanges(previousBoard, newBoard);
    }

    static seekChanges(previousBoard, newBoard) {
        const appearedList = [], disappearedList = [], changes = [];
        for (let i = 0; i < 64; i++) {
            const previousSquare = previousBoard[i];
            const newSquare = newBoard[i];
            if (newSquare !== previousSquare) {
                if (newSquare) {
                    appearedList.push({figure: newSquare, index: i});
                }
                if (previousSquare) {
                    disappearedList.push({figure: previousSquare, index: i});
                }
            }
        }

        // found moved figures (appeared figures that disappeared somewhere else)
        appearedList.forEach((appeared) => {
            // find nearest disappearence
            let shortestDistance = 7;
            let foundMoved = null;
            disappearedList.forEach((disappeared) => {
                if (appeared.figure === disappeared.figure) {
                    const moveDistance = this.squareDistance(appeared.index, disappeared.index);
                    if(moveDistance < shortestDistance) {
                        foundMoved = disappeared;
                        shortestDistance = moveDistance;
                    }
                }
            });
            if (foundMoved) {
                disappearedList.splice(disappearedList.indexOf(foundMoved), 1); // remove from disappeared list because it is moved now
                changes.push({ // and push as move change
                    type: CHANGE_TYPE.move,
                    figure: appeared.figure,
                    fromIndex: foundMoved.index,
                    toIndex: appeared.index
                })
            } else {
                changes.push({type: CHANGE_TYPE.appear, figure: appeared.figure, atIndex: appeared.index})
            }
        });
        // check for let over disappearences
        disappearedList.forEach((disappeared) => {
            changes.push({type: CHANGE_TYPE.disappear, figure: disappeared.figure, atIndex: disappeared.index})
        });
        return changes;
    }

    static squareDistance(index1, index2) {
        const file1 = index1 % 8;
        const rank1 = Math.floor(index1 / 8);
        const file2 = index2 % 8;
        const rank2 = Math.floor(index2 / 8);
        const rankDistance = Math.abs(rank2 - rank1);
        const fileDistance = Math.abs(file2 - file1);
        return Math.max(rankDistance, fileDistance);
    }

}