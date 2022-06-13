/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {ChessboardView} from "./ChessboardView.js"
import {COLOR} from "./Chessboard.js"
import {piecesTranslations} from "./ChessboardView.js"

let count = 0

export class ChessboardViewAccessible extends ChessboardView {

    constructor(chessboard, callbackAfterCreation) {
        super(chessboard, callbackAfterCreation)
        this.lang = document.documentElement.getAttribute("lang")
        if (this.lang !== "de" && this.lang !== "en") {
            this.lang = "en"
        }
        this.translations = piecesTranslations
        this.t = this.translations[this.lang]
        this.piecesListContainer = this.createElement(`<div class="cm-chessboard-content visually-hidden"><h3>${this.t.pieces_lists}</h3><div class="list"></div></div>`)
        this.piecesList = this.piecesListContainer.querySelector(".list")
        this.chessboard.element.appendChild(this.piecesListContainer)
        this.boardAsTableContainer = this.createElement(`<div class="cm-chessboard-content visually-hidden"><h3>${this.t.board_as_table}</h3><div class="table"></div></div>`)
        this.boardAsTable = this.boardAsTableContainer.querySelector(".table")
        this.chessboard.element.appendChild(this.boardAsTableContainer)
    }

    drawPieces(squares = this.chessboard.state.squares) {
        super.drawPieces(squares)
        setTimeout(() => {
            this.redrawPiecesLists()
            this.redrawBoardAsTable()
        })
    }

    redrawPiecesLists() {
        const pieces = this.chessboard.state.getPieces()
        let listW = ""
        let listB = ""
        for (const piece of pieces) {
            if (piece.color === "w") {
                listW += `<li class="list-inline-item">${this.t.pieces_long[piece.name]} ${piece.position}</li>`
            } else {
                listB += `<li class="list-inline-item">${this.t.pieces_long[piece.name]} ${piece.position}</li>`
            }
        }
        count++
        this.piecesList.innerHTML = `
        <h4 id="white-${count}">${this.t.colors_long.w}</h4>
        <ul aria-labelledby="white-${count}" class="list-inline">${listW}</ul>
        <h4 id="black-${count}">${this.t.colors_long.b}</h4>
        <ul aria-labelledby="black-${count}" class="list-inline">${listB}</ul>`
    }

    redrawBoardAsTable() {
        const squares = this.chessboard.state.squares.slice()
        const ranks = ["a", "b", "c", "d", "e", "f", "g", "h"]
        const files = ["1", "2", "3", "4", "5", "6", "7", "8"]
        if (this.chessboard.state.orientation === COLOR.black) {
            ranks.reverse()
            files.reverse()
            squares.reverse()
        }
        let html = `<table><caption>${this.t.board_as_table}</caption><tr><th></th>`
        for (const rank of ranks) {
            html += `<th scope='col'>${rank}</th>`
        }
        html += "</tr>"
        for (let x = 7; x >= 0; x--) {
            html += `<tr><th scope="row">${files[7 - x]}</th>`
            for (let y = 0; y < 8; y++) {
                const pieceCode = squares[y % 8 + x * 8]
                let color, name
                if(pieceCode) {
                    color = pieceCode.charAt(0)
                    name = pieceCode.charAt(1)
                    html += `<td>${this.t.pieces_long[name]} ${this.t.colors_long[color]}</td>`
                } else {
                    html += `<td></td>`
                }
            }
            html += "</tr>"
        }
        html += "</table>"
        this.boardAsTable.innerHTML = html
    }

    createElement(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        return template.content.firstChild
    }

}
