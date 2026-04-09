/**
 * Tiny zero-dependency static file server for Playwright.
 * Serves the project root so fixtures can import from /src/, /assets/, /e2e/.
 */
import {createServer} from "node:http"
import {readFile, stat} from "node:fs/promises"
import {extname, join, normalize, resolve} from "node:path"
import {fileURLToPath} from "node:url"

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..")
const PORT = parseInt(process.env.PORT || "4173", 10)

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".mjs":  "application/javascript; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".svg":  "image/svg+xml",
    ".png":  "image/png",
    ".json": "application/json",
    ".ico":  "image/x-icon"
}

const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://localhost:${PORT}`)
        let pathname = decodeURIComponent(url.pathname)
        if (pathname === "/") pathname = "/index.html"
        const filePath = normalize(join(ROOT, pathname))
        if (!filePath.startsWith(ROOT)) {
            res.writeHead(403)
            res.end("Forbidden")
            return
        }
        const stats = await stat(filePath)
        if (stats.isDirectory()) {
            res.writeHead(403)
            res.end("Directory listing disabled")
            return
        }
        const data = await readFile(filePath)
        const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream"
        res.writeHead(200, {
            "Content-Type": type,
            "Cache-Control": "no-store"
        })
        res.end(data)
    } catch (err) {
        if (err && err.code === "ENOENT") {
            res.writeHead(404)
            res.end("Not found: " + req.url)
        } else {
            res.writeHead(500)
            res.end(String(err))
        }
    }
})

server.listen(PORT, () => {
    console.log(`e2e server listening on http://localhost:${PORT} (root: ${ROOT})`)
})

const shutdown = () => {
    server.close(() => process.exit(0))
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
