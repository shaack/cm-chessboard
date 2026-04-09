/**
 * Standalone benchmark runner.
 * Spawns a static server, opens the benchmark fixture in headless Chromium,
 * waits for results, and prints them to stdout as JSON.
 *
 * Usage:
 *   node e2e/run-benchmark.mjs                # human-readable output
 *   node e2e/run-benchmark.mjs --json         # JSON output
 *   node e2e/run-benchmark.mjs --json > out   # capture
 */
import {spawn} from "node:child_process"
import {chromium} from "@playwright/test"

const PORT = parseInt(process.env.PORT || "4174", 10)
const JSON_OUT = process.argv.includes("--json")

function log(...args) {
    if (!JSON_OUT) console.error(...args)
}

async function waitForServer(url, timeoutMs = 10000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(url)
            if (res.ok) return
        } catch {}
        await new Promise(r => setTimeout(r, 100))
    }
    throw new Error("Server didn't come up in time")
}

async function main() {
    log("Starting static server on port", PORT)
    const server = spawn("node", ["e2e/server.mjs"], {
        env: {...process.env, PORT: String(PORT)},
        stdio: ["ignore", "pipe", "pipe"]
    })
    const cleanup = () => {
        try { server.kill() } catch {}
    }
    process.on("exit", cleanup)
    process.on("SIGINT", () => { cleanup(); process.exit(1) })

    try {
        await waitForServer(`http://localhost:${PORT}/index.html`)
        log("Server is up")

        const browser = await chromium.launch()
        const ctx = await browser.newContext()
        const page = await ctx.newPage()
        page.on("pageerror", (err) => log("PAGE ERROR:", err.message))
        page.on("console", (msg) => {
            if (msg.type() === "error") log("CONSOLE ERROR:", msg.text())
        })

        log("Opening benchmark fixture")
        await page.goto(`http://localhost:${PORT}/e2e/fixtures/benchmark.html`)
        await page.waitForFunction(() => window.benchmarkDone === true, {timeout: 60000})

        const results = await page.evaluate(() => window.benchmarkResults)
        await browser.close()

        if (JSON_OUT) {
            process.stdout.write(JSON.stringify(results, null, 2) + "\n")
        } else {
            console.log()
            for (const r of results) {
                console.log(
                    `${r.label.padEnd(50)} median=${String(r.median).padStart(8)} ms` +
                    `   min=${String(r.min).padStart(8)} ms` +
                    `   max=${String(r.max).padStart(8)} ms` +
                    `   total=${String(r.total).padStart(8)} ms`
                )
            }
            console.log()
        }
    } finally {
        cleanup()
    }
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
