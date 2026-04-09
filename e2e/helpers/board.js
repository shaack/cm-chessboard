/**
 * Helper functions for the board fixture page.
 * Tests should call these from inside `test(...)` blocks.
 */

/**
 * Navigate to the board fixture and wait until cm globals are ready.
 */
export async function openBoardFixture(page) {
    await page.goto("/e2e/fixtures/board.html")
    await page.waitForFunction(() => window.ready === true)
}

/**
 * Create a board on the fixture page. `opts` is forwarded to window.createBoard.
 * Pass extensions as an array of strings (e.g. ["Markers", "Arrows"]) or
 * objects: [{class: "Markers", props: {...}}].
 */
export async function createBoard(page, opts = {}) {
    return page.evaluate((opts) => window.createBoard(opts), opts)
}

/**
 * Get the bounding box of a square on the board.
 */
export async function squareBoundingBox(page, square, boardId = "board") {
    const handle = page.locator(`#${boardId} [data-square="${square}"]`).first()
    return handle.boundingBox()
}

/**
 * Drag a piece from one square to another using real pointer events.
 */
export async function dragPiece(page, from, to, boardId = "board") {
    const fromBox = await squareBoundingBox(page, from, boardId)
    const toBox = await squareBoundingBox(page, to, boardId)
    if (!fromBox || !toBox) {
        throw new Error(`Could not locate squares ${from}->${to}`)
    }
    const fromX = fromBox.x + fromBox.width / 2
    const fromY = fromBox.y + fromBox.height / 2
    const toX = toBox.x + toBox.width / 2
    const toY = toBox.y + toBox.height / 2
    await page.mouse.move(fromX, fromY)
    await page.mouse.down()
    // Move in steps so VisualMoveInput sees movingOverSquare events
    await page.mouse.move(toX, toY, {steps: 10})
    await page.mouse.up()
}

/**
 * Click a square (used for click-to-move input).
 */
export async function clickSquare(page, square, boardId = "board", options = {}) {
    const box = await squareBoundingBox(page, square, boardId)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, options)
}

/**
 * Right-click a square (button: "right").
 */
export async function rightClickSquare(page, square, boardId = "board", modifiers = []) {
    const box = await squareBoundingBox(page, square, boardId)
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, {
        button: "right",
        modifiers
    })
}

/**
 * Drag with the right button between squares (for arrow drawing).
 */
export async function rightDrag(page, from, to, boardId = "board", modifiers = []) {
    const fromBox = await squareBoundingBox(page, from, boardId)
    const toBox = await squareBoundingBox(page, to, boardId)
    const fromX = fromBox.x + fromBox.width / 2
    const fromY = fromBox.y + fromBox.height / 2
    const toX = toBox.x + toBox.width / 2
    const toY = toBox.y + toBox.height / 2
    for (const m of modifiers) await page.keyboard.down(m)
    await page.mouse.move(fromX, fromY)
    await page.mouse.down({button: "right"})
    await page.mouse.move(toX, toY, {steps: 10})
    await page.mouse.up({button: "right"})
    for (const m of modifiers) await page.keyboard.up(m)
}

/**
 * Read the current FEN piece-placement from the board's model.
 */
export async function getPosition(page, boardId = "board") {
    return page.evaluate((id) => window.boards[id].getPosition(), boardId)
}

/**
 * Read the captured event log.
 */
export async function getEvents(page) {
    return page.evaluate(() => window.events.slice())
}

/**
 * Clear the event log.
 */
export async function clearEvents(page) {
    return page.evaluate(() => { window.events.length = 0 })
}
