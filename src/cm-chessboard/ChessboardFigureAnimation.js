/**
 * Author: shaack
 * Date: 07.12.2017
 */
import {SQUARE_COORDINATES} from "./ChessboardModel.js";
import {Svg} from "../../node_modules/svjs-svg/src/svjs/Svg.js";

const CHANGE_TYPE = {
    move: 0,
    appear: 1,
    disappear: 2
};

// noinspection JSUnresolvedVariable
const requestAnimationFrame =
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

// noinspection JSUnresolvedVariable
const cancelAnimationFrame =
    window.cancelAnimationFrame ||
    window.mozCancelAnimationFrame;

let animationRunning = false;

function AnimationRunningException(chessboardFigureAnimation) {
    this.chessboardFigureAnimation = chessboardFigureAnimation;
}

export class ChessboardFigureAnimation {

    constructor(view, previousBoard, newBoard, duration, callback) {
        if (animationRunning) {
            throw new AnimationRunningException(this);
        }
        this.view = view;
        if (previousBoard && newBoard) {
            this.animatedElements = this.createAnimation(previousBoard, newBoard);
            this.duration = duration;
            this.callback = callback;
            animationRunning = true;
            this.frameHandle = requestAnimationFrame(this.animationStep.bind(this));
        }
    }

    animationStep(time) {
        if (!this.startTime) {
            this.startTime = time;
        }
        const timeDiff = time - this.startTime;
        if (timeDiff <= this.duration) {
            this.frameHandle = requestAnimationFrame(this.animationStep.bind(this));
        } else {
            cancelAnimationFrame(this.frameHandle);
            animationRunning = false;
            Svg.removeElement(this.animationGroup);
            this.callback();
        }
        const t = Math.min(1, timeDiff / this.duration);
        const progress = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut
        this.animatedElements.forEach((animatedItem) => {
            switch (animatedItem.type) {
                case CHANGE_TYPE.move:
                    animatedItem.element.transform.baseVal.removeItem(0);
                    const transform = (this.view.svg.createSVGTransform());
                    transform.setTranslate(
                        animatedItem.atX + (animatedItem.toX - animatedItem.atX) * progress,
                        animatedItem.atY + (animatedItem.toY - animatedItem.atY) * progress);
                    animatedItem.element.transform.baseVal.appendItem(transform);
                    break;
                case CHANGE_TYPE.appear:
                    animatedItem.element.style.opacity = progress;
                    break;
                case CHANGE_TYPE.disappear:
                    animatedItem.element.style.opacity = 1 - progress;
                    break;
            }
        });

    }

    static isAnimationRunning() {
        return animationRunning;
    }

    createAnimation(previousBoard, newBoard) {
        const changes = this.seekChanges(previousBoard, newBoard);
        const animatedElements = [];
        // create animation group in svg if not exists
        this.animationGroup = Svg.addElement(this.view.svg, "g", {class: "animation"}); // TODO remove after animation finished
        changes.forEach((change) => {
            const group = this.view.getSquareGroup(SQUARE_COORDINATES[change.atIndex]);
            const animatedItem = {
                type: change.type
            };
            switch (change.type) {
                case CHANGE_TYPE.move:
                    // replace moving figures with moveable dummys
                    const figureGroup = Svg.addElement(this.animationGroup, "g");
                    if(this.view.model.orientation === "white") {
                        animatedItem.atX = this.view.borderWidth + (change.atIndex % 8) * this.view.squareWidth;
                        animatedItem.atY = this.view.borderWidth + (7 - Math.floor(change.atIndex / 8)) * this.view.squareHeight;
                        animatedItem.toX = this.view.borderWidth + (change.toIndex % 8) * this.view.squareWidth;
                        animatedItem.toY = this.view.borderWidth + (7 - Math.floor(change.toIndex / 8)) * this.view.squareHeight;
                    } else {
                        animatedItem.atX = this.view.borderWidth + (7 - change.atIndex % 8) * this.view.squareWidth;
                        animatedItem.atY = this.view.borderWidth + (Math.floor(change.atIndex / 8)) * this.view.squareHeight;
                        animatedItem.toX = this.view.borderWidth + (7 - change.toIndex % 8) * this.view.squareWidth;
                        animatedItem.toY = this.view.borderWidth + (Math.floor(change.toIndex / 8)) * this.view.squareHeight;
                    }
                    const transform = (this.view.svg.createSVGTransform());
                    transform.setTranslate(animatedItem.atX, animatedItem.atY);
                    figureGroup.transform.baseVal.appendItem(transform);
                    this.view.drawFigure(figureGroup, change.figure);
                    animatedItem.element = figureGroup;
                    this.view.setFigureVisibility(SQUARE_COORDINATES[change.atIndex], false);
                    break;
                case CHANGE_TYPE.appear:
                    const squareGroup = this.view.getSquareGroup(SQUARE_COORDINATES[change.atIndex]);
                    animatedItem.element = this.view.drawFigure(squareGroup, change.figure);
                    animatedItem.element.style.opacity = 0;
                    break;
                case CHANGE_TYPE.disappear:
                    animatedItem.element = group.querySelector("use.figure[href='#" + change.figure + "']");
                    break;
            }
            animatedElements.push(animatedItem);
        });
        return animatedElements;
    }

    seekChanges(previousBoard, newBoard) {
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
        // find moved figures
        appearedList.forEach((appeared) => {
            // find nearest disappearence
            let shortestDistance = 7;
            let foundMoved = null;
            disappearedList.forEach((disappeared) => {
                if (appeared.figure === disappeared.figure) {
                    const moveDistance = this.squareDistance(appeared.index, disappeared.index);
                    if (moveDistance < shortestDistance) {
                        foundMoved = disappeared;
                        shortestDistance = moveDistance;
                    }
                }
            });
            if (foundMoved) {
                disappearedList.splice(disappearedList.indexOf(foundMoved), 1); // remove from disappearedList, because it is moved now
                changes.push({
                    type: CHANGE_TYPE.move,
                    figure: appeared.figure,
                    atIndex: foundMoved.index,
                    toIndex: appeared.index
                })
            } else {
                changes.push({type: CHANGE_TYPE.appear, figure: appeared.figure, atIndex: appeared.index})
            }
        });
        // check for left over disappearences
        disappearedList.forEach((disappeared) => {
            changes.push({type: CHANGE_TYPE.disappear, figure: disappeared.figure, atIndex: disappeared.index})
        });
        return changes;
    }

    squareDistance(index1, index2) {
        const file1 = index1 % 8;
        const rank1 = Math.floor(index1 / 8);
        const file2 = index2 % 8;
        const rank2 = Math.floor(index2 / 8);
        return Math.max(Math.abs(rank2 - rank1), Math.abs(file2 - file1));
    }

}