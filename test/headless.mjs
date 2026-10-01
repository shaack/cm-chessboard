/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 *
 * Optional headless test runner. Serves the project over a tiny static server,
 * opens test/index.html in headless Chrome, prints the Teevi summary and exits
 * non-zero when a test failed.
 *
 * Puppeteer is intentionally NOT a project dependency (cm-chessboard ships
 * without dependencies). Install it globally to use this runner:
 *
 *     npm install -g puppeteer
 *     npm run test:headless
 *
 * This file is a copy of test/headless.mjs from the teevi repository.
 * Environment variables: TEEVI_TEST_PAGE (default /test/index.html) and
 * TEEVI_TIMEOUT in ms (default 30000) for page load and test run.
 *
 * Exit codes: 0 all tests passed, 1 a test failed, 2 puppeteer or its Chrome
 * is not available.
 */

import {createServer} from "http"
import {createRequire} from "module"
import {execSync} from "child_process"
import {readFile} from "fs/promises"
import {fileURLToPath} from "url"
import {dirname, join, normalize, extname} from "path"

const TEST_PAGE = process.env.TEEVI_TEST_PAGE || "/test/index.html"
const TIMEOUT = Number(process.env.TEEVI_TIMEOUT) || 30000

const projectRoot = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."))

// Resolve puppeteer from the global npm root, or from the project if it is installed there.
function loadPuppeteer() {
    let globalRoot = ""
    try {
        globalRoot = execSync("npm root -g", {encoding: "utf8"}).trim()
    } catch { /* npm not available, try the project only */ }
    for (const base of [globalRoot + "/", projectRoot + "/"]) {
        try {
            return createRequire(base)("puppeteer")
        } catch { /* try next */ }
    }
    console.error(
        "\nCould not find puppeteer. This headless runner needs it installed globally:\n" +
        "    npm install -g puppeteer\n" +
        "Or just open test/index.html in a browser.\n")
    process.exit(2)
}

const MIME = {
    ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
    ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json",
    ".png": "image/png", ".ico": "image/x-icon", ".map": "application/json"
}

// ES modules do not load from file://, so serve the project over http.
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
const url = `http://127.0.0.1:${port}${TEST_PAGE}`

let browser
try {
    browser = await puppeteer.launch({headless: true})
} catch (e) {
    console.error(
        "\nCould not launch headless Chrome: " + e.message.split("\n")[0] + "\n" +
        "Puppeteer is installed, but its browser is missing or broken. Download it with:\n" +
        "    npx puppeteer browsers install chrome\n")
    server.close()
    process.exit(2)
}

let exitCode = 1
try {
    const page = await browser.newPage()
    // page errors and failed requests explain why a test page did not even start
    const errors = []
    const consoleErrors = []
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message))
    const isNoise = (url) => url.endsWith("/favicon.ico")
    page.on("requestfailed", (r) => {
        if (!isNoise(r.url())) errors.push("request failed: " + r.url() + " " + (r.failure()?.errorText || ""))
    })
    page.on("response", (r) => {
        if (r.status() >= 400 && !isNoise(r.url())) errors.push("HTTP " + r.status() + ": " + r.url())
    })
    page.on("console", (m) => {
        if (m.type() === "error") consoleErrors.push("console.error: " + m.text())
    })
    await page.goto(url, {waitUntil: "networkidle0", timeout: TIMEOUT})
    // teevi.run() appends #teevi-summary when all tests are done
    const summaryFound = await page.waitForSelector("#teevi-summary", {timeout: TIMEOUT})
        .then(() => true, () => false)
    if (summaryFound) {
        const {summary, failed, fails} = await page.evaluate(() => {
            const summary = document.getElementById("teevi-summary")
            const fails = [...document.querySelectorAll(".teevi-test.teevi-fail")]
                .map((line) => line.innerText.replace(/\s+/g, " ").trim().slice(0, 500))
            return {summary: summary.innerText, failed: Number(summary.dataset.failed), fails}
        })
        console.log(summary)
        for (const fail of fails) console.log("  FAIL: " + fail)
        for (const error of errors.slice(0, 10)) console.log("  " + error)
        exitCode = failed > 0 ? 1 : 0
    } else {
        console.log("No test summary after " + TIMEOUT + "ms. The test page did not load, or a test never finished.")
        console.log("Hint: pass a timeout to teevi.run({timeout}) to make hanging tests fail with their name.")
        for (const error of [...errors, ...consoleErrors].slice(0, 20)) console.log("  " + error)
        exitCode = 1
    }
} finally {
    await browser.close()
    server.close()
}
process.exit(exitCode)
