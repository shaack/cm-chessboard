/**
 * Author: shaack
 * Date: 21.11.2017
 */

import {Svg} from "../../node_modules/svjs-svg/src/svjs/Svg.js";
import {SQUARE_COORDINATES} from "./ChessboardModel.js";
import {ChessboardMovingFigure} from "./ChessboardMovingFigure.js";

const SPRITE_LOADING_STATUS = {
    notLoaded: 1,
    loading: 2,
    loaded: 3
};

export class ChessboardView {

    constructor(containerElement, model, config, createCallback, inputCallback) {
        this._containerElement = containerElement;
        this._config = config;
        this._spriteLoadWaitingTries = 0;
        this._model = model;
        this._inputCallback = inputCallback;
        this.loadSprite(config, createCallback);
        this._spriteLoadWaitDelay = 0;
        if (config.responsive) {
            window.addEventListener('resize', () => {
                if (this._containerElement.offsetWidth !== this.width ||
                    this._containerElement.offsetHeight !== this.height) {
                    this.setNeedsRedraw();
                }
            });
        }

    }

    loadSprite(config, callback) {
        if (ChessboardView.spriteLoadingStatus === SPRITE_LOADING_STATUS.notLoaded) {
            ChessboardView.spriteLoadingStatus = SPRITE_LOADING_STATUS.loading;
            Svg.loadSprite(config.sprite.file, [
                "wk", "wq", "wr", "wb", "wn", "wp",
                "bk", "bq", "br", "bb", "bn", "bp",
                "marker1", "marker2"], () => {
                ChessboardView.spriteLoadingStatus = SPRITE_LOADING_STATUS.loaded;
                callback();
            }, config.sprite.grid);
        } else if (ChessboardView.spriteLoadingStatus === SPRITE_LOADING_STATUS.loading) {
            setTimeout(() => {
                this._spriteLoadWaitingTries++;
                if (this._spriteLoadWaitingTries < 10) {
                    this.loadSprite(config, callback);
                } else {
                    console.error("timeout loading sprite", config.sprite.file);
                }
            }, this._spriteLoadWaitDelay);
            this._spriteLoadWaitDelay += 10;
        } else if (ChessboardView.spriteLoadingStatus === SPRITE_LOADING_STATUS.loaded) {
            callback();
        } else {
            console.error("error ChessboardView.spriteLoadingStatus", ChessboardView.spriteLoadingStatus);
        }

    }

    updateMetrics() {
        this.width = this._containerElement.offsetWidth;
        this.height = this._containerElement.offsetHeight;
        this.borderWidth = this.width / 35;
        this.innerWidth = this.width - 2 * this.borderWidth;
        this.innerHeight = this.height - 2 * this.borderWidth;
        this.squareWidth = this.innerWidth / 8;
        this.squareHeight = this.innerHeight / 8;
    }

    remove() {
        if (this.svg) {
            Svg.removeElement(this.svg);
        }
    }

    /**
     * Redraw async and only once
     */
    setNeedsRedraw() {
        if (this.redrawTimer) {
            window.clearTimeout(this.redrawTimer);
        }
        this.redrawTimer = setTimeout(() => {
            if (this.svg) {
                Svg.removeElement(this.svg);
            }
            this.svg = Svg.createSvg(this._containerElement);
            this.svg.setAttribute("class", "cm-chessboard");
            this.updateMetrics();
            this.mainGroup = Svg.addElement(this.svg, "g");
            this.drawBoard();
            if (this._config.showCoordinates) {
                this.drawCoordinates();
            }
            this.drawFigures();
            this.drawMarkers();
        });
    }

    /**
     * Draw the checkered squares
     */
    drawBoard() {
        let boardBorder = Svg.addElement(this.mainGroup, "rect", {width: this.width, height: this.height});
        boardBorder.setAttribute("class", "board-border");
        for (let squareY = 0; squareY < 8; squareY++) {
            for (let squareX = 0; squareX < 8; squareX++) {
                const squareColor = (squareX % 2 + squareY % 2) % 2 ? 'black' : 'white';
                const fieldClass = "square " + squareColor;
                const x = this.borderWidth + squareX * this.innerWidth / 8;
                const y = this.borderWidth + squareY * this.innerHeight / 8;
                const squareGroup = Svg.addElement(this.mainGroup, "g");
                const transform = (this.svg.createSVGTransform());
                transform.setTranslate(x, y);
                squareGroup.transform.baseVal.appendItem(transform);
                Svg.addElement(squareGroup, "rect", {
                    width: this.squareWidth, height: this.squareHeight
                });
                squareGroup.setAttribute("class", fieldClass);
                squareGroup.setAttribute("data-square", String.fromCharCode(97 + squareX) + (8 - squareY));
                if (this._model.orientation === "black") {
                    const transform = (this.svg.createSVGTransform());
                    transform.setRotate(180, this.squareWidth / 2, this.squareHeight / 2);
                    squareGroup.transform.baseVal.appendItem(transform);
                }
            }
        }
        Svg.addElement(this.mainGroup, "line", {
            x1: this.borderWidth, y1: this.borderWidth,
            x2: this.width - this.borderWidth, y2: this.borderWidth, class: "surrounding-line"
        });
        Svg.addElement(this.mainGroup, "line", {
            x1: this.borderWidth, y1: this.height - this.borderWidth,
            x2: this.width - this.borderWidth, y2: this.height - this.borderWidth, class: "surrounding-line"
        });
        Svg.addElement(this.mainGroup, "line", {
            x1: this.borderWidth, y1: this.borderWidth,
            x2: this.borderWidth, y2: this.height - this.borderWidth, class: "surrounding-line"
        });
        Svg.addElement(this.mainGroup, "line", {
            x1: this.width - this.borderWidth, y1: this.borderWidth,
            x2: this.width - this.borderWidth, y2: this.height - this.borderWidth, class: "surrounding-line"
        });

        if (this._model.orientation === "black") {
            const transform = (this.svg.createSVGTransform());
            transform.setRotate(180, this.width / 2, this.height / 2);
            this.mainGroup.transform.baseVal.appendItem(transform);
        }
    }

    drawFigures() {
        const scaling = this.squareHeight / this._config.sprite.grid;
        for (let i = 0; i < 64; i++) {
            const figureName = this._model.squares[i];
            const square = SQUARE_COORDINATES[i];
            const squareGroup = this.svg.querySelector("g[data-square='" + square + "']");
            if (figureName) {
                const figure = Svg.addElement(squareGroup, "use", {"href": "#" + figureName});
                squareGroup.setAttribute("class", squareGroup.getAttribute("class") + " f" + figureName.substr(0, 1));
                squareGroup.setAttribute("data-figure", figureName);
                const color = figureName.substr(0, 1);
                if (color === "w" && this._model.inputWhiteEnabled || color === "b" && this._model.inputBlackEnabled) {
                    squareGroup.setAttribute("class", squareGroup.getAttribute("class") + " input-enabled");
                    squareGroup.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this._movingFigure = new ChessboardMovingFigure(this, this._model, this._config);
                        console.log("mousedown", e.path, e.target, e.path[1]);
                        this._movingFigure.pointerDown(e.path[1].getAttribute("data-square"), e);
                    });
                    squareGroup.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this._movingFigure = new ChessboardMovingFigure(this, this._model, this._config);
                        this._movingFigure.pointerDown(e.path[1].getAttribute("data-square"), e);
                    });
                    /*
                    squareGroup.addEventListener('mousedown', (e) => {
                        this._inputCallback("pointerdown", e);
                        this._status = "drag";
                        let dragable = Svg.createSvg(document.body);
                        dragable.setAttribute("width", this.squareWidth);
                        dragable.setAttribute("height", this.squareHeight);
                        dragable.setAttribute("style", "position: absolute; top: " + e.clientY + "; left: " + e.clientX);
                        Svg.addElement(dragable, "rect", {
                            width: this.squareWidth,
                            height: this.squareHeight
                        });

                        this.moveHandler = (e) => {
                            console.log("mousemove", e.clientX, e.clientY);
                            dragable.setAttribute("style",
                                "position: absolute; top: " + e.clientY + "; left: " + (e.clientX - this.squareWidth / 2));
                        };

                        this.moveListener = document.addEventListener("mousemove", this.moveHandler);
                        document.addEventListener("mouseup", (e) => {
                            console.log("mouseup");
                            document.removeEventListener("mousemove", this.moveHandler);
                            if(dragable) {
                                Svg.removeElement(dragable);
                                dragable = null;
                            }
                        });
                    }, false);
                    squareGroup.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.clientX = e.touches[0].clientX;
                        e.clientY = e.touches[0].clientY;
                        e.screenX = e.touches[0].screenX;
                        e.screenY = e.touches[0].screenY;
                        this._inputCallback("pointerdown", e);
                    }, false);
                    */
                }
                // figure.setAttribute("filter", "url(#dropshadow)");
                // center on square
                const transformTranslate = (this.svg.createSVGTransform());
                transformTranslate.setTranslate((this.squareWidth / 2 - this._config.sprite.grid * scaling / 2), 0);
                figure.transform.baseVal.appendItem(transformTranslate);
                // scale
                const transformScale = (this.svg.createSVGTransform());
                transformScale.setScale(scaling, scaling);
                figure.transform.baseVal.appendItem(transformScale);
            }
            /*
            squareGroup.addEventListener('mouseleave', (e) => {
                this._inputCallback("pointerleave", e);
            });
            squareGroup.addEventListener('mouseenter', (e) => {
                this._inputCallback("pointerenter", e);
            });
            squareGroup.addEventListener('touchmove', (e) => {
                this._inputCallback("pointermove", e);
            });
            */
        }
    }

    drawMarkers() {
        console.log("drawMarkers", this._model.markers);
        this._model.markers.forEach((marker) => {
                this.drawMarker(marker.square, marker.type);
            }
        );
    }

    drawMarker(square, markerType) {
        console.log("drawMarker", square, markerType);
        const squareGroup = this.svg.querySelector("g[data-square='" + square + "']");
        const marker = Svg.addElement(squareGroup, "use", {"href": "#" + markerType.slice, opacity: markerType.opacity});
        const scalingX = this.squareWidth / this._config.sprite.grid;
        const scalingY = this.squareHeight / this._config.sprite.grid;
        const transformScale = (this.svg.createSVGTransform());
        transformScale.setScale(scalingX, scalingY);
        marker.transform.baseVal.appendItem(transformScale);
    }

    drawCoordinates() {
        console.log("drawCoordinates");
        const scalingX = this.squareWidth / this._config.sprite.grid;
        const scalingY = this.squareHeight / this._config.sprite.grid;
        // console.log("scaling", this.squareWidth, scaling);

        // files
        for (let file = 0; file < 8; file++) {
            const textElement = Svg.addElement(this.svg, "text", {
                class: "coordinate file",
                x: this.borderWidth + (18 + this._config.sprite.grid * file) * scalingX,
                y: this.height - (this.borderWidth / 3.4),
                style: "font-size: " + scalingY * 7 + "px"
            });
            if (this._model.orientation === "white") {
                textElement.textContent = String.fromCharCode(97 + file);
            } else {
                textElement.textContent = String.fromCharCode(104 - file);
            }
        }

        // ranks
        for (let rank = 0; rank < 8; rank++) {
            const textElement = Svg.addElement(this.svg, "text", {
                class: "coordinate rank",
                x: (this.borderWidth / 3.6),
                y: this.borderWidth + 23 * scalingY + rank * this.squareHeight,
                style: "font-size: " + scalingY * 7 + "px"
            });
            if (this._model.orientation === "white") {
                textElement.textContent = 8 - rank;
            } else {
                textElement.textContent = 1 + rank;
            }
        }

    }
}

ChessboardView.spriteLoadingStatus = SPRITE_LOADING_STATUS.notLoaded; // static