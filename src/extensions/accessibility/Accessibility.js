/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {COLOR, INPUT_EVENT_TYPE} from "../../Chessboard.js"
import {piecesTranslations, renderPieceTitle} from "./I18n.js"
import {Utils} from "../../lib/Utils.js"

import {Svg} from "../../lib/Svg.js"

const translations = {
    de: {
        chessboard: "Schachbrett",
        pieces_lists: "Figurenlisten",
        board_as_table: "Schachbrett als Tabelle",
        move_piece: "Figur bewegen",
        from: "Zug von",
        to: "Zug nach",
        move: "Zug ausführen",
        input_white_enabled: "Eingabe Weiß aktiviert",
        input_black_enabled: "Eingabe Schwarz aktiviert",
        input_disabled: "Eingabe deaktiviert",
        pieces: "Figuren",
        empty_square: "leer",
        move_from: "Zug von",
        move_to: "Zug nach",
        move_canceled: "Zug abgebrochen"
    },
    en: {
        chessboard: "Chessboard",
        pieces_lists: "Pieces lists",
        board_as_table: "Chessboard as table",
        move_piece: "Move piece",
        from: "Move from",
        to: "Move to",
        move: "Make move",
        input_white_enabled: "Input white enabled",
        input_black_enabled: "Input black enabled",
        input_disabled: "Input disabled",
        pieces: "Pieces",
        empty_square: "empty",
        move_from: "Move from",
        move_to: "Move to",
        move_canceled: "Move canceled"
    }
}

export class Accessibility extends Extension {
    constructor(chessboard, props) {
        super(chessboard)
        this.props = {
            language: navigator.language.substring(0, 2).toLowerCase(), // supports "de" and "en" for now, used for pieces naming
            brailleNotationInAlt: true, // show the braille notation of the position in the alt attribute of the SVG image
            movePieceForm: true, // display a form to move a piece (from, to, move)
            boardAsTable: true, // display the board additionally as HTML table
            piecesAsList: true, // display the pieces additionally as List
            keyboardMoveInput: true, // enable keyboard navigation on the board with arrow keys
            visuallyHidden: true // hide all those extra outputs visually but keep them accessible for screen readers and braille displays
        }
        Object.assign(this.props, props)
        if (this.props.language !== "de" && this.props.language !== "en") {
            this.props.language = "en"
        }
        this.lang = this.props.language
        this.tPieces = piecesTranslations[this.lang]
        this.t = translations[this.lang]
        this.components = []
        if(this.props.movePieceForm || this.props.boardAsTable || this.props.piecesAsList) {
            const container = document.createElement("div")
            container.classList.add("cm-chessboard-accessibility")
            this.chessboard.context.appendChild(container)
            if(this.props.visuallyHidden) {
                container.classList.add("visually-hidden")
            }
            if (this.props.movePieceForm) {
                this.components.push(new MovePieceForm(container, this))
            }
            if (this.props.boardAsTable) {
                this.components.push(new BoardAsTable(container, this))
            }
            if (this.props.piecesAsList) {
                this.components.push(new PiecesAsList(container, this))
            }
        }
        if (this.props.brailleNotationInAlt) {
            this.components.push(new BrailleNotationInAlt(this))
        }
        if (this.props.keyboardMoveInput) {
            this.components.push(new KeyboardMoveInput(this))
        }
    }
}

class BrailleNotationInAlt {
    constructor(extension) {
        this.extension = extension
        extension.registerExtensionPoint(EXTENSION_POINT.positionChanged, () => {
            this.redraw()
        })
    }

    redraw() {
        const pieces = this.extension.chessboard.state.position.getPieces()
        let listW = piecesTranslations[this.extension.lang].colors.w.toUpperCase() + ":"
        let listB = piecesTranslations[this.extension.lang].colors.b.toUpperCase() + ":"
        for (const piece of pieces) {
            const pieceName = piece.type === "p" ? "" : piecesTranslations[this.extension.lang].pieces[piece.type].toUpperCase()
            if (piece.color === "w") {
                listW += " " + pieceName + piece.position
            } else {
                listB += " " + pieceName + piece.position
            }
        }
        const altText = `${listW}
${listB}`
        this.extension.chessboard.view.svg.setAttribute("alt", altText)
    }
}

class MovePieceForm {
    constructor(container, extension) {
        this.chessboard = extension.chessboard
        this.movePieceFormContainer = Utils.createDomElement(`
<div>
    <h3 id="hl_form_${this.chessboard.id}">${extension.t.move_piece}</h3>
    <form aria-labelledby="hl_form_${this.chessboard.id}">
        <label for="move_piece_input_from_${this.chessboard.id}">${extension.t.from}</label>
        <input class="input-from" type="text" size="2" id="move_piece_input_from_${this.chessboard.id}"/>
        <label for="move_piece_input_to_${this.chessboard.id}">${extension.t.to}</label>
        <input class="input-to" type="text" size="2" id="move_piece_input_to_${this.chessboard.id}"/>
        <button type="submit" class="button-move">${extension.t.move}</button>
    </form>
</div>`)
        this.form = this.movePieceFormContainer.querySelector("form")
        this.inputFrom = this.form.querySelector(".input-from")
        this.inputTo = this.form.querySelector(".input-to")
        this.moveButton = this.form.querySelector(".button-move")
        this.form.addEventListener("submit", (evt) => {
            evt.preventDefault()
            if (this.chessboard.state.moveInputCallback({
                chessboard: this.chessboard,
                type: INPUT_EVENT_TYPE.validateMoveInput,
                squareFrom: this.inputFrom.value,
                squareTo: this.inputTo.value
            })) {
                this.chessboard.movePiece(this.inputFrom.value, this.inputTo.value,
                    true).then(() => {
                    this.inputFrom.value = ""
                    this.inputTo.value = ""
                    this.updateButtonState()
                })
            }
        })
        container.appendChild(this.movePieceFormContainer)
        extension.registerExtensionPoint(EXTENSION_POINT.moveInputToggled, () => {
            this.redraw()
        })
        // Update button state when input values change
        this.inputFrom.addEventListener("input", () => {
            this.updateButtonState()
        })
        this.inputTo.addEventListener("input", () => {
            this.updateButtonState()
        })
        this.keydownListener = (event) => {
            if (event.shiftKey && event.altKey && event.code === 'KeyE') {
                event.preventDefault()
                this.inputFrom.focus()
            }
        }
        document.addEventListener("keydown", this.keydownListener)
        extension.registerExtensionPoint(EXTENSION_POINT.destroy, () => {
            document.removeEventListener("keydown", this.keydownListener)
        })
        // Initial button state
        this.updateButtonState()
    }

    isValidSquare(value) {
        const square = value.trim().toLowerCase()
        if (square.length !== 2) {
            return false
        }
        const file = square.charAt(0)
        const rank = square.charAt(1)
        return file >= 'a' && file <= 'h' && rank >= '1' && rank <= '8'
    }

    updateButtonState() {
        const inputEnabled = this.chessboard.state.inputWhiteEnabled || this.chessboard.state.inputBlackEnabled
        const isValidFrom = this.isValidSquare(this.inputFrom.value)
        const isValidTo = this.isValidSquare(this.inputTo.value)
        this.moveButton.disabled = !inputEnabled || !isValidFrom || !isValidTo
    }

    redraw() {
        if (this.inputFrom) {
            if (this.chessboard.state.inputWhiteEnabled || this.chessboard.state.inputBlackEnabled) {
                this.inputFrom.disabled = false
                this.inputTo.disabled = false
            } else {
                this.inputFrom.disabled = true
                this.inputTo.disabled = true
            }
            this.updateButtonState()
        }
    }
}

class BoardAsTable {
    constructor(container, extension) {
        this.extension = extension
        this.chessboard = extension.chessboard
        this.boardAsTableContainer = Utils.createDomElement(`<div><h3 id="hl_table_${this.chessboard.id}">${extension.t.board_as_table}</h3><div class="table"></div></div>`)
        this.boardAsTable = this.boardAsTableContainer.querySelector(".table")
        container.appendChild(this.boardAsTableContainer)
        extension.registerExtensionPoint(EXTENSION_POINT.positionChanged, () => {
            this.redraw()
        })
        extension.registerExtensionPoint(EXTENSION_POINT.boardChanged, () => {
            this.redraw()
        })
    }

    redraw() {
        const squares = this.chessboard.state.position.squares.slice()
        const ranks = ["a", "b", "c", "d", "e", "f", "g", "h"]
        const files = ["8", "7", "6", "5", "4", "3", "2", "1"]
        if (this.chessboard.state.orientation === COLOR.black) {
            ranks.reverse()
            files.reverse()
            squares.reverse()
        }
        let html = `<table aria-labelledby="hl_table_${this.chessboard.id}"><tr><th></th>`
        for (const rank of ranks) {
            html += `<th scope='col'>${rank}</th>`
        }
        html += "</tr>"
        for (let x = 7; x >= 0; x--) {
            html += `<tr><th scope="row">${files[7 - x]}</th>`
            for (let y = 0; y < 8; y++) {
                const pieceCode = squares[y % 8 + x * 8]
                let color, name
                if (pieceCode) {
                    color = pieceCode.charAt(0)
                    name = pieceCode.charAt(1)
                    html += `<td>${renderPieceTitle(this.extension.lang, name, color)}</td>`
                } else {
                    html += `<td></td>`
                }
            }
            html += "</tr>"
        }
        html += "</table>"
        this.boardAsTable.innerHTML = html
    }
}

class PiecesAsList {
    constructor(container, extension) {
        this.extension = extension
        this.chessboard = extension.chessboard
        this.piecesListContainer = Utils.createDomElement(`<div><h3 id="hl_lists_${this.chessboard.id}">${extension.t.pieces_lists}</h3><div class="list"></div></div>`)
        this.piecesList = this.piecesListContainer.querySelector(".list")
        container.appendChild(this.piecesListContainer)
        extension.registerExtensionPoint(EXTENSION_POINT.positionChanged, () => {
            this.redraw()
        })
    }

    redraw() {
        const pieces = this.chessboard.state.position.getPieces()
        let listW = ""
        let listB = ""
        for (const piece of pieces) {
            if (piece.color === "w") {
                listW += `<li class="list-inline-item">${renderPieceTitle(this.extension.lang, piece.type)} ${piece.position}</li>`
            } else {
                listB += `<li class="list-inline-item">${renderPieceTitle(this.extension.lang, piece.type)} ${piece.position}</li>`
            }
        }
        this.piecesList.innerHTML = `
        <h4 id="white_${this.chessboard.id}">${this.extension.t.pieces} ${this.extension.tPieces.colors_long.w}</h4>
        <ul aria-labelledby="white_${this.chessboard.id}" class="list-inline">${listW}</ul>
        <h4 id="black_${this.chessboard.id}">${this.extension.t.pieces} ${this.extension.tPieces.colors_long.b}</h4>
        <ul aria-labelledby="black_${this.chessboard.id}" class="list-inline">${listB}</ul>`
    }
}

class KeyboardMoveInput {
    constructor(extension) {
        this.extension = extension
        this.chessboard = extension.chessboard
        this.t = extension.t
        this.tPieces = extension.tPieces

        // Current focus position (file 0-7, rank 0-7)
        this.focusedFile = 0 // a-h
        this.focusedRank = 0 // 1-8 (0 = rank 1)

        // Move selection state
        this.fromSquare = null

        // Create focus indicator group in SVG
        this.focusIndicatorGroup = Svg.addElement(
            this.chessboard.view.markersTopLayer,
            "g",
            {class: "keyboard-focus-indicator"}
        )

        // Create live region for screen reader announcements
        this.liveRegion = document.createElement("div")
        this.liveRegion.setAttribute("aria-live", "polite")
        this.liveRegion.setAttribute("aria-atomic", "true")
        this.liveRegion.className = "cm-chessboard-keyboard-live-region visually-hidden"
        this.liveRegion.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;"
        this.chessboard.context.appendChild(this.liveRegion)

        // Make SVG focusable
        this.chessboard.view.svg.setAttribute("tabindex", "0")
        this.chessboard.view.svg.setAttribute("role", "application")
        this.chessboard.view.svg.setAttribute("aria-label", this.t.chessboard)

        // Bind event handlers
        this.handleKeyDown = this.handleKeyDown.bind(this)
        this.handleFocus = this.handleFocus.bind(this)
        this.handleBlur = this.handleBlur.bind(this)

        this.chessboard.view.svg.addEventListener("keydown", this.handleKeyDown)
        this.chessboard.view.svg.addEventListener("focus", this.handleFocus)
        this.chessboard.view.svg.addEventListener("blur", this.handleBlur)

        // Register extension points
        extension.registerExtensionPoint(EXTENSION_POINT.afterRedrawBoard, () => {
            this.redrawFocusIndicator()
        })
        extension.registerExtensionPoint(EXTENSION_POINT.destroy, () => {
            this.destroy()
        })
        extension.registerExtensionPoint(EXTENSION_POINT.moveInputToggled, () => {
            // Reset move selection when input is toggled
            this.fromSquare = null
            this.redrawFocusIndicator()
        })
    }

    handleFocus() {
        this.redrawFocusIndicator()
        this.announceCurrentSquare()
    }

    handleBlur() {
        this.clearFocusIndicator()
    }

    handleKeyDown(event) {
        const orientation = this.chessboard.state.orientation

        switch (event.key) {
            case "ArrowRight":
                event.preventDefault()
                if (orientation === COLOR.white) {
                    this.focusedFile = Math.min(7, this.focusedFile + 1)
                } else {
                    this.focusedFile = Math.max(0, this.focusedFile - 1)
                }
                this.redrawFocusIndicator()
                this.announceCurrentSquare()
                break

            case "ArrowLeft":
                event.preventDefault()
                if (orientation === COLOR.white) {
                    this.focusedFile = Math.max(0, this.focusedFile - 1)
                } else {
                    this.focusedFile = Math.min(7, this.focusedFile + 1)
                }
                this.redrawFocusIndicator()
                this.announceCurrentSquare()
                break

            case "ArrowUp":
                event.preventDefault()
                if (orientation === COLOR.white) {
                    this.focusedRank = Math.min(7, this.focusedRank + 1)
                } else {
                    this.focusedRank = Math.max(0, this.focusedRank - 1)
                }
                this.redrawFocusIndicator()
                this.announceCurrentSquare()
                break

            case "ArrowDown":
                event.preventDefault()
                if (orientation === COLOR.white) {
                    this.focusedRank = Math.max(0, this.focusedRank - 1)
                } else {
                    this.focusedRank = Math.min(7, this.focusedRank + 1)
                }
                this.redrawFocusIndicator()
                this.announceCurrentSquare()
                break

            case "Enter":
            case " ":
                event.preventDefault()
                this.selectSquare()
                break

            case "Escape":
                event.preventDefault()
                if (this.fromSquare) {
                    this.fromSquare = null
                    this.redrawFocusIndicator()
                    this.announce(this.t.move_canceled)
                }
                break
        }
    }

    selectSquare() {
        if (!this.chessboard.state.inputWhiteEnabled && !this.chessboard.state.inputBlackEnabled) {
            return // Input not enabled
        }

        const square = this.getCurrentSquare()
        const piece = this.chessboard.getPiece(square)

        if (!this.fromSquare) {
            // Selecting "from" square
            if (piece) {
                const pieceColor = piece.charAt(0)
                // Check if the piece color matches enabled input
                if ((pieceColor === "w" && this.chessboard.state.inputWhiteEnabled) ||
                    (pieceColor === "b" && this.chessboard.state.inputBlackEnabled)) {
                    // Trigger moveInputStarted callback
                    const startResult = this.chessboard.state.moveInputCallback({
                        chessboard: this.chessboard,
                        type: INPUT_EVENT_TYPE.moveInputStarted,
                        square: square,
                        squareFrom: square,
                        piece: piece
                    })
                    if (startResult) {
                        this.fromSquare = square
                        this.redrawFocusIndicator()
                        this.announce(this.t.move_from + " " + square)
                    }
                }
            }
        } else {
            // Selecting "to" square
            if (square === this.fromSquare) {
                // Clicking same square cancels
                this.fromSquare = null
                this.redrawFocusIndicator()
                this.announce(this.t.move_canceled)
            } else {
                // Try to make the move
                const fromPiece = this.chessboard.getPiece(this.fromSquare)
                const result = this.chessboard.state.moveInputCallback({
                    chessboard: this.chessboard,
                    type: INPUT_EVENT_TYPE.validateMoveInput,
                    squareFrom: this.fromSquare,
                    squareTo: square,
                    piece: fromPiece
                })
                if (result) {
                    const fromSquare = this.fromSquare
                    this.fromSquare = null
                    this.chessboard.movePiece(fromSquare, square, true).then(() => {
                        this.redrawFocusIndicator()
                    })
                    this.announce(this.t.move_to + " " + square)
                } else {
                    // Invalid move - check if clicking on own piece to start new move
                    if (piece) {
                        const pieceColor = piece.charAt(0)
                        if ((pieceColor === "w" && this.chessboard.state.inputWhiteEnabled) ||
                            (pieceColor === "b" && this.chessboard.state.inputBlackEnabled)) {
                            const startResult = this.chessboard.state.moveInputCallback({
                                chessboard: this.chessboard,
                                type: INPUT_EVENT_TYPE.moveInputStarted,
                                square: square,
                                squareFrom: square,
                                piece: piece
                            })
                            if (startResult) {
                                this.fromSquare = square
                                this.redrawFocusIndicator()
                                this.announce(this.t.move_from + " " + square)
                            }
                        }
                    }
                }
            }
        }
    }

    getCurrentSquare() {
        const file = String.fromCharCode(97 + this.focusedFile) // 'a' + file
        const rank = this.focusedRank + 1
        return `${file}${rank}`
    }

    announceCurrentSquare() {
        const square = this.getCurrentSquare()
        const piece = this.chessboard.getPiece(square)
        let announcement = square
        if (piece) {
            const pieceType = piece.charAt(1)
            const pieceColor = piece.charAt(0)
            announcement += " " + renderPieceTitle(this.extension.lang, pieceType, pieceColor)
        } else {
            announcement += " " + this.t.empty_square
        }
        if (this.fromSquare) {
            announcement += " (" + this.t.move_from + " " + this.fromSquare + ")"
        }
        this.announce(announcement)
    }

    announce(message) {
        this.liveRegion.textContent = ""
        setTimeout(() => {
            this.liveRegion.textContent = message
        }, 50)
    }

    redrawFocusIndicator() {
        this.clearFocusIndicator()

        // Only show if SVG is focused
        if (document.activeElement !== this.chessboard.view.svg) {
            return
        }

        const square = this.getCurrentSquare()
        const point = this.chessboard.view.squareToPoint(square)
        const squareWidth = this.chessboard.view.squareWidth
        const squareHeight = this.chessboard.view.squareHeight

        // Draw focus indicator
        Svg.addElement(this.focusIndicatorGroup, "rect", {
            x: point.x,
            y: point.y,
            width: squareWidth,
            height: squareHeight,
            class: "keyboard-focus"
        })

        // If we have a from square selected, also highlight it
        if (this.fromSquare) {
            const fromPoint = this.chessboard.view.squareToPoint(this.fromSquare)
            Svg.addElement(this.focusIndicatorGroup, "rect", {
                x: fromPoint.x,
                y: fromPoint.y,
                width: squareWidth,
                height: squareHeight,
                class: "keyboard-from-square"
            })
        }
    }

    clearFocusIndicator() {
        while (this.focusIndicatorGroup.firstChild) {
            this.focusIndicatorGroup.removeChild(this.focusIndicatorGroup.firstChild)
        }
    }

    destroy() {
        this.chessboard.view.svg.removeEventListener("keydown", this.handleKeyDown)
        this.chessboard.view.svg.removeEventListener("focus", this.handleFocus)
        this.chessboard.view.svg.removeEventListener("blur", this.handleBlur)
        if (this.liveRegion && this.liveRegion.parentNode) {
            this.liveRegion.parentNode.removeChild(this.liveRegion)
        }
        this.clearFocusIndicator()
    }
}
