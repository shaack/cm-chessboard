/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {Extension, EXTENSION_POINT} from "../../model/Extension.js"
import {COLOR, INPUT_EVENT_TYPE} from "../../Chessboard.js"
import {piecesTranslations, renderPieceTitle} from "./I18n.js"
import {Utils} from "../../lib/Utils.js"

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
        pieces: "Pieces"
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
            const pieceName = piece.name === "p" ? "" : piecesTranslations[this.extension.lang].pieces[piece.name].toUpperCase()
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
                })
            }
        })
        container.appendChild(this.movePieceFormContainer)
        extension.registerExtensionPoint(EXTENSION_POINT.moveInputToggled, () => {
            this.redraw()
        })
    }

    redraw() {
        if (this.inputFrom) {
            if (this.chessboard.state.inputWhiteEnabled || this.chessboard.state.inputBlackEnabled) {
                this.inputFrom.disabled = false
                this.inputTo.disabled = false
                this.moveButton.disabled = false
            } else {
                this.inputFrom.disabled = true
                this.inputTo.disabled = true
                this.moveButton.disabled = true
            }
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
                listW += `<li class="list-inline-item">${renderPieceTitle(this.extension.lang, piece.name)} ${piece.position}</li>`
            } else {
                listB += `<li class="list-inline-item">${renderPieceTitle(this.extension.lang, piece.name)} ${piece.position}</li>`
            }
        }
        this.piecesList.innerHTML = `
        <h4 id="white_${this.chessboard.id}">${this.extension.t.pieces} ${this.extension.tPieces.colors_long.w}</h4>
        <ul aria-labelledby="white_${this.chessboard.id}" class="list-inline">${listW}</ul>
        <h4 id="black_${this.chessboard.id}">${this.extension.t.pieces} ${this.extension.tPieces.colors_long.b}</h4>
        <ul aria-labelledby="black_${this.chessboard.id}" class="list-inline">${listB}</ul>`
    }
}
