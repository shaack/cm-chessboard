/**
 * Author: shaack
 * Date: 21.11.2017
 */

import {Svg} from "../svjs-svg/src/svjs/Svg.js";
import {SQUARE_COORDINATES} from "./ChessboardModel.js";
import {ChessboardMoveInput} from "./ChessboardMoveInput.js";
import {COLOR, MOVE_INPUT_MODE, INPUT_EVENT_TYPE} from "./Chessboard.js";
import {ChessboardPiecesAnimation} from "./ChessboardPiecesAnimation.js";

const SPRITE_LOADING_STATUS = {
    notLoaded: 1,
    loading: 2,
    loaded: 3
};

export class ChessboardView {

    constructor(chessboard, callbackAfterCreation) {
        this.chessboard = chessboard;
        this.spriteLoadWaitingTries = 0;
        this.loadSprite(chessboard.config, () => {
            this.spriteLoadWaitDelay = 0;
            this.moveInput = new ChessboardMoveInput(this, chessboard.model, chessboard.config,
                this.moveStartCallback.bind(this),
                this.moveDoneCallback.bind(this),
                this.moveCanceledCallback.bind(this)
            );
            this.animationQueue = [];
            if (chessboard.config.responsive) {
                window.addEventListener("resize", () => {
                    window.clearTimeout(this.resizeDebounce);
                    this.resizeDebounce = setTimeout(() => {
                        if (chessboard.element.offsetWidth !== this.width ||
                            chessboard.element.offsetHeight !== this.height) {
                            this.redraw();
                        }
                    });
                });
            }
            if (chessboard.config.moveInputMode !== MOVE_INPUT_MODE.viewOnly) {
                chessboard.element.addEventListener("mousedown", (e) => {
                    e.preventDefault();
                    this.moveInput.onPointerDown(e);
                });
                chessboard.element.addEventListener("touchstart", (e) => {
                    e.preventDefault();
                    this.moveInput.onPointerDown(e);
                });
            }
            this.createSvgAndGroups();
            this.redraw();
            callbackAfterCreation();
        });
    }

    // Sprite //

    loadSprite(config, callback) {
        if (ChessboardView.spriteLoadingStatus === SPRITE_LOADING_STATUS.notLoaded) {
            ChessboardView.spriteLoadingStatus = SPRITE_LOADING_STATUS.loading;
            Svg.loadSprite(config.sprite.url, [
                "wk", "wq", "wr", "wb", "wn", "wp",
                "bk", "bq", "br", "bb", "bn", "bp",
                "marker1", "marker2"], () => {
                ChessboardView.spriteLoadingStatus = SPRITE_LOADING_STATUS.loaded;
                callback();
            }, config.sprite.grid);
        } else if (ChessboardView.spriteLoadingStatus === SPRITE_LOADING_STATUS.loading) {
            setTimeout(() => {
                this.spriteLoadWaitingTries++;
                if (this.spriteLoadWaitingTries < 50) {
                    this.loadSprite(config, callback);
                } else {
                    console.error("timeout loading sprite", config.sprite.url);
                }
            }, this.spriteLoadWaitDelay);
            this.spriteLoadWaitDelay += 10;
        } else if (ChessboardView.spriteLoadingStatus === SPRITE_LOADING_STATUS.loaded) {
            callback();
        } else {
            console.error("error ChessboardView.spriteLoadingStatus", ChessboardView.spriteLoadingStatus);
        }
    }

    // Draw //

    createSvgAndGroups() {
        if (this.svg) {
            Svg.removeElement(this.svg);
        }
        this.svg = Svg.createSvg(this.chessboard.element);
        let cssClass = this.chessboard.config.style.cssClass ? this.chessboard.config.style.cssClass : "default";
        if(this.chessboard.config.style.showBorder) {
            this.svg.setAttribute("class", "cm-chessboard has-border " + cssClass);
        } else {
            this.svg.setAttribute("class", "cm-chessboard " + cssClass);
        }
        this.updateMetrics();
        this.boardGroup = Svg.addElement(this.svg, "g", {class: "board"});
        this.coordinatesGroup = Svg.addElement(this.svg, "g", {class: "coordinates"});
        this.markersGroup = Svg.addElement(this.svg, "g", {class: "markers"});
        this.piecesGroup = Svg.addElement(this.svg, "g", {class: "pieces"});
    }

    updateMetrics() {
        this.width = this.chessboard.element.offsetWidth;
        this.height = this.chessboard.element.offsetHeight;
        if(this.chessboard.config.style.showBorder) {
            this.borderSize = this.width / 32;
        } else {
            this.borderSize = this.width / 320;
        }
        this.innerWidth = this.width - 2 * this.borderSize;
        this.innerHeight = this.height - 2 * this.borderSize;
        this.squareWidth = this.innerWidth / 8;
        this.squareHeight = this.innerHeight / 8;
        this.scalingX = this.squareWidth / this.chessboard.config.sprite.grid;
        this.scalingY = this.squareHeight / this.chessboard.config.sprite.grid;
        this.pieceXTranslate = (this.squareWidth / 2 - this.chessboard.config.sprite.grid * this.scalingY / 2);
    }

    redraw() {
        this.updateMetrics();
        this.drawBoard();
        this.drawCoordinates();
        this.drawMarkers();
        this.drawPieces();
        this.setCursor();
    }

    // Board //

    drawBoard() {
        window.clearTimeout(this.drawBoardDebounce);
        this.drawBoardDebounce = setTimeout(() => {
            while (this.boardGroup.firstChild) {
                this.boardGroup.removeChild(this.boardGroup.lastChild);
            }
            let boardBorder = Svg.addElement(this.boardGroup, "rect", {width: this.width, height: this.height});
            boardBorder.setAttribute("class", "border");
            if(this.chessboard.config.style.showBorder) {
                const innerPos = this.borderSize - this.borderSize / 9;
                let borderInner = Svg.addElement(this.boardGroup, "rect", {x: innerPos, y: innerPos, width: this.width - innerPos * 2, height: this.height - innerPos * 2});
                borderInner.setAttribute("class", "border-inner");
            }
            for (let i = 0; i < 64; i++) {
                const index = this.chessboard.model.orientation === COLOR.white ? i : 63 - i;
                const squareColor = ((9 * index) & 8) === 0 ? 'black' : 'white';
                const fieldClass = `square ${squareColor}`;
                const point = this.squareIndexToPoint(index);
                const squareRect = Svg.addElement(this.boardGroup, "rect", {
                    x: point.x, y: point.y, width: this.squareWidth, height: this.squareHeight
                });
                squareRect.setAttribute("class", fieldClass);
                squareRect.setAttribute("data-index", index);
            }
        });
    }

    drawCoordinates() {
        if (!this.chessboard.config.style.showCoordinates) {
            return;
        }
        window.clearTimeout(this.drawCoordinatesDebounce);
        this.drawCoordinatesDebounce = setTimeout(() => {
            while (this.coordinatesGroup.firstChild) {
                this.coordinatesGroup.removeChild(this.coordinatesGroup.lastChild);
            }
            const inline = !this.chessboard.config.style.showBorder;
            for (let file = 0; file < 8; file++) {
                let x = this.borderSize + (18 + this.chessboard.config.sprite.grid * file) * this.scalingX;
                let y = this.height - this.scalingY * 2.6;
                let cssClass = "coordinate file";
                if(inline) {
                    x = x + this.scalingX * 15.5;
                    if(this.chessboard.config.style.showBorder) {
                        y = y - this.scalingY * 11;
                    }
                    cssClass += file % 2 ? " dark" : " light";
                }
                const textElement = Svg.addElement(this.coordinatesGroup, "text", {
                    class: cssClass,
                    x: x,
                    y: y,
                    style: `font-size: ${this.scalingY * 8}px`
                });
                if (this.chessboard.model.orientation === COLOR.white) {
                    textElement.textContent = String.fromCharCode(97 + file);
                } else {
                    textElement.textContent = String.fromCharCode(104 - file);
                }
            }
            for (let rank = 0; rank < 8; rank++) {
                let x = (this.borderSize / 3.7);
                let y = this.borderSize + 24 * this.scalingY + rank * this.squareHeight;
                let cssClass = "coordinate rank";
                if(inline) {
                    cssClass += rank % 2 ? " light" : " dark";
                    if(this.chessboard.config.style.showBorder) {
                        x = x + this.scalingX * 10;
                        y = y - this.scalingY * 15;
                    } else {
                        x = x + this.scalingX * 2;
                        y = y - this.scalingY * 15;
                    }
                }
                const textElement = Svg.addElement(this.coordinatesGroup, "text", {
                    class: cssClass,
                    x: x,
                    y: y,
                    style: `font-size: ${this.scalingY * 8}px`
                });
                if (this.chessboard.model.orientation === COLOR.white) {
                    textElement.textContent = 8 - rank;
                } else {
                    textElement.textContent = 1 + rank;
                }
            }
        });
    }

    // Pieces //

    drawPieces(squares = this.chessboard.model.squares) {
        window.clearTimeout(this.drawPiecesDebounce);
        this.drawPiecesDebounce = setTimeout(() => {
            this.drawPiecesNow(squares);
        });
    }

    drawPiecesNow(squares) {
        while (this.piecesGroup.firstChild) {
            this.piecesGroup.removeChild(this.piecesGroup.lastChild);
        }
        for (let i = 0; i < 64; i++) {
            const pieceName = squares[i];
            if (pieceName) {
                this.drawPiece(i, pieceName);
            }
        }
    }

    drawPiece(index, pieceName) {
        const pieceGroup = Svg.addElement(this.piecesGroup, "g");
        pieceGroup.setAttribute("data-piece", pieceName);
        pieceGroup.setAttribute("data-index", index);
        const point = this.squareIndexToPoint(index);
        const transform = (this.svg.createSVGTransform());
        transform.setTranslate(point.x, point.y);
        pieceGroup.transform.baseVal.appendItem(transform);
        const pieceUse = Svg.addElement(pieceGroup, "use", {"href": `#${pieceName}`, "class": "piece"});
        // center on square
        const transformTranslate = (this.svg.createSVGTransform());
        transformTranslate.setTranslate(this.pieceXTranslate, 0);
        pieceUse.transform.baseVal.appendItem(transformTranslate);
        // scale
        const transformScale = (this.svg.createSVGTransform());
        transformScale.setScale(this.scalingY, this.scalingY);
        pieceUse.transform.baseVal.appendItem(transformScale);
        return pieceGroup;
    }

    setPieceVisibility(index, visible = true) {
        const piece = this.getPiece(index);
        if (visible) {
            piece.setAttribute("visibility", "visible");
        } else {
            piece.setAttribute("visibility", "hidden");
        }

    }

    getPiece(index) {
        return this.piecesGroup.querySelector(`g[data-index='${index}']`);
    }

    // Markers //

    drawMarkers() {
        window.clearTimeout(this.drawMarkersDebounce);
        this.drawMarkersDebounce = setTimeout(() => {
            while (this.markersGroup.firstChild) {
                this.markersGroup.removeChild(this.markersGroup.firstChild);
            }
            this.chessboard.model.markers.forEach((marker) => {
                    this.drawMarker(marker);
                }
            );
        });
    }

    drawMarker(marker) {
        const markerGroup = Svg.addElement(this.markersGroup, "g");
        markerGroup.setAttribute("data-index", marker.index);
        const point = this.squareIndexToPoint(marker.index);
        const transform = (this.svg.createSVGTransform());
        transform.setTranslate(point.x, point.y);
        markerGroup.transform.baseVal.appendItem(transform);
        const markerUse = Svg.addElement(markerGroup, "use",
            {href: `#${marker.type.slice}`, class: "marker " + marker.type.class});
        const transformScale = (this.svg.createSVGTransform());
        transformScale.setScale(this.scalingX, this.scalingY);
        markerUse.transform.baseVal.appendItem(transformScale);
        return markerGroup;
    }

    // animation queue //

    animatePieces(fromSquares, toSquares, callback) {
        this.animationQueue.push({fromSquares: fromSquares, toSquares: toSquares, callback: callback});
        if (!ChessboardPiecesAnimation.isAnimationRunning()) {
            this.nextPieceAnimationInQueue();
        }
    }

    nextPieceAnimationInQueue() {
        const nextAnimation = this.animationQueue.shift();
        if (nextAnimation !== undefined) {
            new ChessboardPiecesAnimation(this, nextAnimation.fromSquares, nextAnimation.toSquares, this.chessboard.config.animationDuration / (this.animationQueue.length + 1), () => {
                this.drawPiecesNow(nextAnimation.toSquares);
                this.nextPieceAnimationInQueue();
                if (nextAnimation.callback) {
                    nextAnimation.callback();
                }
            })
        }
    }

    // Callbacks //

    moveStartCallback(index) {
        if (this.chessboard.moveInputCallback) {
            return this.chessboard.moveInputCallback({
                chessboard: this.chessboard,
                type: INPUT_EVENT_TYPE.moveStart,
                square: SQUARE_COORDINATES[index]
            });
        } else {
            return true;
        }
    }

    moveDoneCallback(fromIndex, toIndex) {
        if (this.chessboard.moveInputCallback) {
            return this.chessboard.moveInputCallback({
                chessboard: this.chessboard,
                type: INPUT_EVENT_TYPE.moveDone,
                squareFrom: SQUARE_COORDINATES[fromIndex],
                squareTo: SQUARE_COORDINATES[toIndex]
            });
        } else {
            return true;
        }
    }

    moveCanceledCallback() {
        if (this.chessboard.moveInputCallback) {
            this.chessboard.moveInputCallback({
                chessboard: this.chessboard,
                type: INPUT_EVENT_TYPE.moveCanceled
            });
        }
    }

    // Helpers //

    setCursor() {
        if (this.chessboard.model.inputWhiteEnabled || this.chessboard.model.inputBlackEnabled) {
            this.boardGroup.setAttribute("class", "board input-enabled");
        } else {
            this.boardGroup.setAttribute("class", "board");
        }
    }

    squareIndexToPoint(index) {
        let x, y;
        if (this.chessboard.model.orientation === COLOR.white) {
            x = this.borderSize + (index % 8) * this.squareWidth;
            y = this.borderSize + (7 - Math.floor(index / 8)) * this.squareHeight;
        } else {
            x = this.borderSize + (7 - index % 8) * this.squareWidth;
            y = this.borderSize + (Math.floor(index / 8)) * this.squareHeight;
        }
        return {x: x, y: y};
    }

}

ChessboardView.spriteLoadingStatus = SPRITE_LOADING_STATUS.notLoaded;