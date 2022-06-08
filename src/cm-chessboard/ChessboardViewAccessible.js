/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 */
import {ChessboardView} from "./ChessboardView.js"

export class ChessboardViewAccessible extends ChessboardView {

    constructor(chessboard, callbackAfterCreation) {
        super(chessboard, callbackAfterCreation)
        this.translations = {
            en: {
                pieces_lists: "Pieces lists",
                board_as_table: "Chessboard as table",
                colors: {
                    w: "w", b: "b"
                },
                colors_long: {
                    w: "White", b: "Black"
                },
                pieces: {
                    p: "p", n: "n", b: "b", r: "r", q: "q", k: "k"
                },
                pieces_long: {
                    p: "Pawn", n: "Knight", b: "Bishop", r: "Rook", q: "Queen", k: "King"
                }
            },
            de: {
                pieces_lists: "Figurenlisten",
                board_as_table: "Schachbrett als Tabelle",
                colors: {
                    w: "w", b: "s"
                },
                colors_long: {
                    w: "Weiß", b: "Schwarz"
                },
                pieces: {
                    p: "b", n: "s", b: "l", r: "t", q: "d", k: "k"
                },
                pieces_long: {
                    p: "Bauer", n: "Springer", b: "Läufer", r: "Turm", q: "Dame", k: "König"
                }
            }
        }
        this.lang = document.documentElement.getAttribute("lang")
        if(this.lang !== "de" && this.lang !== "en") {
            this.lang = "en"
        }
        this.t = this.translations[this.lang]
        this.piecesListContainer = this.createElement(`<div class="cm-chessboard-content"><h3>${this.t.pieces_lists}</h3><div class="list"></div></div>`)
        this.piecesList = this.piecesListContainer.querySelector(".list")
        this.chessboard.element.appendChild(this.piecesListContainer)
        this.boardAsTableContainer = this.createElement(`<div class="cm-chessboard-content"><h3>${this.t.board_as_table}</h3><div class="table"></div></div>`)
        this.boardAsTable = this.boardAsTableContainer.querySelector(".table")
        this.chessboard.element.appendChild(this.boardAsTableContainer)
    }

    drawPieces(squares = this.chessboard.state.squares) {
        super.drawPieces(squares);
        setTimeout(() => {
            this.redrawPiecesLists()
            this.redrawBoardAsTable()
        })
    }

    redrawPiecesLists() {
        const pieces = this.chessboard.state.getPieces()
        let listW = ""
        let listB = ""
        console.log(pieces)
        for (const piece of pieces) {
            if(piece.color === "w") {
                listW += `<li class="list-inline-item">${this.t.pieces_long[piece.name]} ${piece.position}</li>`
            } else {
                listB += `<li class="list-inline-item">${this.t.pieces_long[piece.name]} ${piece.position}</li>`
            }
        }
        // let piecesW = `<ul title="${this.t.colors.w}" aria-label="${this.t.colors.w}">`

        // piecesW += "</ul>"
        this.piecesList.innerHTML = `
        <ul aria-label="${this.t.colors_long.w}" class="list-inline">${listW}</ul>
        <ul aria-label="${this.t.colors_long.b}" class="list-inline">${listB}</ul>`
    }

    redrawBoardAsTable() {

    }

    createElement(html) {
        const template = document.createElement('template')
        template.innerHTML = html.trim()
        return template.content.firstChild
    }

    createKey(length = 10) {
        let key = ""
        const iterations = length / 10
        for (let i = 0; i < iterations; i++) {
            key += Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString(36).substr(0, 10)
        }
        return key.substr(0, length)
    }

}
