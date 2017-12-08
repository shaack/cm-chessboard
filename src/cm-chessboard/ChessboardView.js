/**
 * Author: shaack
 * Date: 21.11.2017
 */

import {Svg} from "../../node_modules/svjs-svg/src/svjs/Svg.js";
import {SQUARE_COORDINATES} from "./ChessboardModel.js";
import {ChessboardMoveInput} from "./ChessboardMoveInput.js";

const SPRITE_LOADING_STATUS = {
    notLoaded: 1,
    loading: 2,
    loaded: 3
};

export class ChessboardView {

    constructor(containerElement, model, config, createCallback) {
        this.containerElement = containerElement;
        this.config = config;
        this.spriteLoadWaitingTries = 0;
        this.model = model;
        this.loadSprite(config, createCallback);
        this.spriteLoadWaitDelay = 0;
        this.moveInput = new ChessboardMoveInput(this, this.model, this.config, this.moveStartCallback, this.moveDoneCallback);
        if (config.responsive) {
            window.addEventListener('resize', () => {
                if (this.containerElement.offsetWidth !== this.width ||
                    this.containerElement.offsetHeight !== this.height) {
                    this.setNeedsRedraw();
                }
            });
        }
        // TODO create event handler on Chessboard.enableInput()
        containerElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.moveInput.onPointerDown(e);
        });
        containerElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.moveInput.onPointerDown(e);
        });
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
                this.spriteLoadWaitingTries++;
                if (this.spriteLoadWaitingTries < 10) {
                    this.loadSprite(config, callback);
                } else {
                    console.error("timeout loading sprite", config.sprite.file);
                }
            }, this.spriteLoadWaitDelay);
            this.spriteLoadWaitDelay += 10;
        } else if (ChessboardView.spriteLoadingStatus === SPRITE_LOADING_STATUS.loaded) {
            callback();
        } else {
            console.error("error ChessboardView.spriteLoadingStatus", ChessboardView.spriteLoadingStatus);
        }

    }

    updateMetrics() {
        this.width = this.containerElement.offsetWidth;
        this.height = this.containerElement.offsetHeight;
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
     * Redraw async and debounced
     */
    setNeedsRedraw() {
        if (this.redrawTimer) {
            window.clearTimeout(this.redrawTimer);
        }
        this.redrawTimer = setTimeout(() => {
            if (this.svg) {
                Svg.removeElement(this.svg);
            }
            this.svg = Svg.createSvg(this.containerElement);
            this.svg.setAttribute("class", "cm-chessboard");
            this.updateMetrics();
            this.mainGroup = Svg.addElement(this.svg, "g");
            this.mainGroup.setAttribute("class", "main-group");
            this.drawBoard();
            if (this.config.showCoordinates) {
                this.drawCoordinates();
            }
            this.drawFigures();
            this.drawMarkers();
        });
    }

    drawBoard() {
        if(this.model.inputWhiteEnabled || this.model.inputBlackEnabled) {
            if(this.model.inputWhiteEnabled || this.model.inputBlackEnabled) {
                this.mainGroup.setAttribute("class", this.mainGroup.getAttribute("class") + " input-enabled");
            }
        }
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
                if (this.model.orientation === "black") {
                    const transform = (this.svg.createSVGTransform());
                    transform.setRotate(180, this.squareWidth / 2, this.squareHeight / 2);
                    squareGroup.transform.baseVal.appendItem(transform);
                }
            }
        }
        // noinspection JSSuspiciousNameCombination
        Svg.addElement(this.mainGroup, "line", {
            x1: this.borderWidth, y1: this.borderWidth,
            x2: this.width - this.borderWidth, y2: this.borderWidth, class: "surrounding-line"
        });
        Svg.addElement(this.mainGroup, "line", {
            x1: this.borderWidth, y1: this.height - this.borderWidth,
            x2: this.width - this.borderWidth, y2: this.height - this.borderWidth, class: "surrounding-line"
        });
        // noinspection JSSuspiciousNameCombination
        Svg.addElement(this.mainGroup, "line", {
            x1: this.borderWidth, y1: this.borderWidth,
            x2: this.borderWidth, y2: this.height - this.borderWidth, class: "surrounding-line"
        });
        // noinspection JSSuspiciousNameCombination
        Svg.addElement(this.mainGroup, "line", {
            x1: this.width - this.borderWidth, y1: this.borderWidth,
            x2: this.width - this.borderWidth, y2: this.height - this.borderWidth, class: "surrounding-line"
        });

        if (this.model.orientation === "black") {
            const transform = (this.svg.createSVGTransform());
            transform.setRotate(180, this.width / 2, this.height / 2);
            this.mainGroup.transform.baseVal.appendItem(transform);
        }
    }

    drawFigures(animate = true) {
        const scaling = this.squareHeight / this.config.sprite.grid;
        const figureXTranslate = this.calculateFigureXTranslateInSquare();
        for (let i = 0; i < 64; i++) {
            const figureName = this.model.squares[i];
            const square = SQUARE_COORDINATES[i];
            const squareGroup = this.getSquareGroup(square);
            if (figureName) {
                const figure = Svg.addElement(squareGroup, "use", {"href": "#" + figureName, "class": "figure"});
                squareGroup.setAttribute("class", squareGroup.getAttribute("class") + " f" + figureName.substr(0, 1));
                squareGroup.setAttribute("data-figure", figureName);
                // center on square
                const transformTranslate = (this.svg.createSVGTransform());
                transformTranslate.setTranslate(figureXTranslate, 0);
                figure.transform.baseVal.appendItem(transformTranslate);
                // scale
                const transformScale = (this.svg.createSVGTransform());
                transformScale.setScale(scaling, scaling);
                figure.transform.baseVal.appendItem(transformScale);
            }
        }
    }

    calculateFigureXTranslateInSquare() {
        const scaling = this.squareHeight / this.config.sprite.grid;
        return (this.squareWidth / 2 - this.config.sprite.grid * scaling / 2);
    }

    setFigureVisibility(square, visible = true) {
        const squareGroup = this.getSquareGroup(square);
        const use = squareGroup.getElementsByTagName("use");
        if(visible) {
            use[0].setAttribute("visibility", "visible");
        } else {
            use[0].setAttribute("visibility", "hidden");
        }

    }

    drawMarkers() {
        const existingMarkers = this.mainGroup.querySelectorAll("use.marker");
        existingMarkers.forEach((existingMarker) => {
           Svg.removeElement(existingMarker);
        });
        this.model.markers.forEach((marker) => {
                this.drawMarker(marker.square, marker.type);
            }
        );
    }

    drawMarker(square, markerType) {
        const squareGroup = this.getSquareGroup(square);
        const marker = Svg.addElement(squareGroup, "use",
            {"href": "#" + markerType.slice, opacity: markerType.opacity, class: "marker"});
        const scalingX = this.squareWidth / this.config.sprite.grid;
        const scalingY = this.squareHeight / this.config.sprite.grid;
        const transformScale = (this.svg.createSVGTransform());
        transformScale.setScale(scalingX, scalingY);
        marker.transform.baseVal.appendItem(transformScale);
    }

    drawCoordinates() {
        const scalingX = this.squareWidth / this.config.sprite.grid;
        const scalingY = this.squareHeight / this.config.sprite.grid;

        // files
        for (let file = 0; file < 8; file++) {
            const textElement = Svg.addElement(this.mainGroup, "text", {
                class: "coordinate file",
                x: this.borderWidth + (18 + this.config.sprite.grid * file) * scalingX,
                y: this.height - (this.borderWidth / 3.4),
                style: "font-size: " + scalingY * 7 + "px"
            });
            if (this.model.orientation === "white") {
                textElement.textContent = String.fromCharCode(97 + file);
            } else {
                textElement.textContent = String.fromCharCode(104 - file);
            }
        }

        // ranks
        for (let rank = 0; rank < 8; rank++) {
            const textElement = Svg.addElement(this.mainGroup, "text", {
                class: "coordinate rank",
                x: (this.borderWidth / 3.6),
                y: this.borderWidth + 23 * scalingY + rank * this.squareHeight,
                style: "font-size: " + scalingY * 7 + "px"
            });
            if (this.model.orientation === "white") {
                textElement.textContent = 8 - rank;
            } else {
                textElement.textContent = 1 + rank;
            }
        }
    }

    getSquareGroup(square) {
        return this.svg.querySelector("g[data-square='" + square + "']");
    }

    moveStartCallback(square) {
        if(this.config.events.inputStart) {
            return this.config.events.inputStart(square);
        } else {
            return true;
        }
    }

    moveDoneCallback(fromSquare, toSquare) {
        if(this.config.events.inputDone) {
            return this.config.events.inputDone(fromSquare, toSquare);
        } else {
            return true;
        }
    }

}

ChessboardView.spriteLoadingStatus = SPRITE_LOADING_STATUS.notLoaded; // static