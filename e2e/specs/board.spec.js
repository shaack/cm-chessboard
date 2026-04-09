import {test, expect} from "@playwright/test"
import {openBoardFixture, createBoard, getPosition} from "../helpers/board.js"

test.describe("Chessboard core", () => {

    test.beforeEach(async ({page}) => {
        await openBoardFixture(page)
    })

    test("renders 64 squares with data-square attributes", async ({page}) => {
        await createBoard(page)
        const count = await page.locator("#board [data-square]").count()
        // Each square is rendered as a board square AND a piece-layer square,
        // so >= 64 with the start position. Just assert all 64 squares exist.
        const squares = await page.locator("#board [data-square]").evaluateAll(els =>
            [...new Set(els.map(e => e.getAttribute("data-square")))].sort()
        )
        expect(squares).toHaveLength(64)
        expect(squares).toContain("a1")
        expect(squares).toContain("h8")
    })

    test("renders all 32 pieces from the starting FEN", async ({page}) => {
        await createBoard(page)
        // Pieces are SVG <use> elements with class "piece"
        const pieceCount = await page.locator("#board g.pieces use.piece").count()
        expect(pieceCount).toBe(32)
    })

    test("getPosition returns the start FEN piece placement", async ({page}) => {
        await createBoard(page)
        const fen = await getPosition(page)
        expect(fen).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
    })

    test("respects custom position prop", async ({page}) => {
        await createBoard(page, {props: {position: "8/8/8/3k4/3K4/8/8/8"}})
        const fen = await getPosition(page)
        expect(fen).toBe("8/8/8/3k4/3K4/8/8/8")
    })

    test("setPiece updates the model and renders the piece", async ({page}) => {
        await createBoard(page, {props: {position: "8/8/8/8/8/8/8/8"}})
        await page.evaluate(() => window.boards.board.setPiece("e4", "wq"))
        const fen = await getPosition(page)
        expect(fen).toBe("8/8/8/8/4Q3/8/8/8")
    })

    test("movePiece moves a piece in the model", async ({page}) => {
        await createBoard(page)
        await page.evaluate(() => window.boards.board.movePiece("e2", "e4"))
        const fen = await getPosition(page)
        // e2 empty, e4 has white pawn
        expect(fen).toBe("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR")
    })

    test("setPosition replaces the entire board", async ({page}) => {
        await createBoard(page)
        await page.evaluate(() =>
            window.boards.board.setPosition("8/8/8/4k3/4K3/8/8/8", false)
        )
        const fen = await getPosition(page)
        expect(fen).toBe("8/8/8/4k3/4K3/8/8/8")
    })

    test("invalid FEN throws", async ({page}) => {
        await createBoard(page)
        const error = await page.evaluate(() => {
            try {
                window.boards.board.setPosition("not-a-fen", false)
                return null
            } catch (e) {
                return e.message
            }
        })
        // setPosition is async; the throw happens inside the promise callback,
        // so the synchronous return is null. Check via the async path:
        const asyncError = await page.evaluate(async () => {
            try {
                await window.boards.board.setPosition("not-a-fen", false)
                return null
            } catch (e) {
                return e.message
            }
        })
        expect(error || asyncError).toBeTruthy()
    })

    test("setOrientation flips the board (model unchanged, orientation reported)", async ({page}) => {
        await createBoard(page)
        const before = await page.evaluate(() => window.boards.board.getOrientation())
        expect(before).toBe("w")
        await page.evaluate(() => window.boards.board.setOrientation("b", false))
        const after = await page.evaluate(() => window.boards.board.getOrientation())
        expect(after).toBe("b")
        // FEN should be unchanged
        const fen = await getPosition(page)
        expect(fen).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
    })

    test("destroy removes the board from the DOM", async ({page}) => {
        await createBoard(page)
        const beforeCount = await page.locator("#board *").count()
        expect(beforeCount).toBeGreaterThan(0)
        await page.evaluate(() => window.boards.board.destroy())
        const afterCount = await page.locator("#board *").count()
        expect(afterCount).toBe(0)
    })

    test("destroy is idempotent", async ({page}) => {
        await createBoard(page)
        const errors = await page.evaluate(() => {
            const errs = []
            try { window.boards.board.destroy() } catch (e) { errs.push(e.message) }
            try { window.boards.board.destroy() } catch (e) { errs.push(e.message) }
            return errs
        })
        expect(errors).toHaveLength(0)
    })

    test("two boards on one page have unique ids and don't share state", async ({page}) => {
        await createBoard(page, {containerId: "board"})
        await createBoard(page, {containerId: "board2", props: {position: "8/8/8/8/8/8/8/8"}})
        const ids = await page.evaluate(() => ({
            id1: window.boards.board.id,
            id2: window.boards.board2.id
        }))
        expect(ids.id1).not.toBe(ids.id2)
        const fens = await page.evaluate(() => ({
            f1: window.boards.board.getPosition(),
            f2: window.boards.board2.getPosition()
        }))
        expect(fens.f1).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")
        expect(fens.f2).toBe("8/8/8/8/8/8/8/8")
    })

})
