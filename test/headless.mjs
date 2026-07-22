/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 *
 * Optional headless test runner. Serves the project over a tiny static server
 * and runs test/index.html in headless Chrome, then prints the Teevi summary
 * and exits non-zero on failure.
 *
 * Puppeteer is intentionally NOT a project dependency (cm-chessboard ships
 * without dependencies). Install it globally to use this runner:
 *
 *     npm install -g puppeteer
 *     npm run test:headless
 *
 * The regular `npm test` just points you at test/index.html in a browser and
 * needs nothing installed.
 */

import {createServer} from "http"
import {createRequire} from "module"
import {execSync} from "child_process"
import {readFile} from "fs/promises"
import {fileURLToPath} from "url"
import {dirname, join, normalize, extname} from "path"

const projectRoot = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."))

// Resolve the globally installed puppeteer without adding a project dependency.
function loadPuppeteer() {
    let globalRoot
    try {
        globalRoot = execSync("npm root -g", {encoding: "utf8"}).trim()
    } catch {
        globalRoot = ""
    }
    for (const base of [globalRoot + "/", projectRoot + "/"]) {
        try {
            return createRequire(base)("puppeteer")
        } catch { /* try next */ }
    }
    console.error(
        "\nCould not find puppeteer. This headless runner needs it installed globally:\n" +
        "    npm install -g puppeteer\n" +
        "Or just open test/index.html in a browser (see `npm test`).\n")
    process.exit(2)
}

const MIME = {
    ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
    ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json",
    ".png": "image/png", ".map": "application/json"
}

function startServer() {
    const server = createServer(async (req, res) => {
        const urlPath = decodeURIComponent(req.url.split("?")[0])
        const filePath = normalize(join(projectRoot, urlPath))
        if (!filePath.startsWith(projectRoot)) { // block path traversal
            res.writeHead(403).end()
            return
        }
        try {
            const body = await readFile(filePath)
            res.writeHead(200, {"Content-Type": MIME[extname(filePath)] || "application/octet-stream"})
            res.end(body)
        } catch {
            res.writeHead(404).end()
        }
    })
    return new Promise((resolve) => {
        server.listen(0, "127.0.0.1", () => resolve({server, port: server.address().port}))
    })
}

const puppeteer = loadPuppeteer()
const {server, port} = await startServer()
const url = `http://127.0.0.1:${port}/test/index.html`

let exitCode = 1
const browser = await puppeteer.launch({headless: "new"})
try {
    const page = await browser.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(e.message))
    await page.goto(url, {waitUntil: "networkidle0", timeout: 30000})
    await page.waitForFunction(
        () => /All \d+ tests passed|\d+ tests, \d+ passed, \d+ failed/.test(document.body.innerText),
        {timeout: 30000})
    const {summary, fails} = await page.evaluate(() => {
        const text = document.body.innerText
        const m = text.match(/All \d+ tests passed|\d+ tests, \d+ passed, \d+ failed/)
        const fails = []
        document.querySelectorAll("div").forEach((d) => {
            if (d.innerText && d.innerText.includes("→ fail")) {
                fails.push(d.innerText.replace(/\s+/g, " ").trim().slice(0, 500))
            }
        })
        return {summary: m ? m[0] : "NO SUMMARY", fails}
    })
    console.log(summary)
    for (const f of fails) console.log("  FAIL: " + f)
    for (const e of errors.slice(0, 10)) console.log("  pageerror: " + e)
    exitCode = /failed|NO SUMMARY/.test(summary) ? 1 : 0
} finally {
    await browser.close()
    server.close()
}
process.exit(exitCode)
