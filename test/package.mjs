/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/cm-chessboard
 * License: MIT, see file 'LICENSE'
 *
 * Verifies that the published npm package is complete, i.e. that the `files`
 * field in package.json does not drop anything the library needs at runtime.
 *
 * It packs the tarball, unpacks it into a temp folder and then
 *   1. compares it against the git-tracked files of src/ and assets/,
 *   2. resolves every relative import and every asset path found in the
 *      shipped sources against the shipped files,
 *   3. runs the regular Teevi suite against the unpacked package.
 *
 * Step 3 needs a global puppeteer, like test/headless.mjs:
 *     npm install -g puppeteer
 *     npm run test:package
 */

import {execFileSync, execSync} from "child_process"
import {mkdtempSync, rmSync, readdirSync, readFileSync, statSync, cpSync, symlinkSync, existsSync} from "fs"
import {tmpdir} from "os"
import {join, dirname, relative, resolve, normalize} from "path"
import {fileURLToPath} from "url"

const projectRoot = normalize(join(dirname(fileURLToPath(import.meta.url)), ".."))
const work = mkdtempSync(join(tmpdir(), "cm-chessboard-pkg-"))
let failures = 0

function check(name, ok, detail = "") {
    console.log(`${ok ? "  ok  " : "FAIL  "}${name}${detail ? "  " + detail : ""}`)
    if (!ok) failures++
}

function walk(dir, base = dir) {
    if (!existsSync(dir)) return []
    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry)
        return statSync(full).isDirectory() ? walk(full, base) : [relative(base, full)]
    })
}

// --- pack and unpack ---------------------------------------------------------
const tarball = JSON.parse(
    execSync(`npm pack --pack-destination "${work}" --json`, {cwd: projectRoot, encoding: "utf8"})
)[0].filename
execFileSync("tar", ["xzf", join(work, tarball), "-C", work])
const pkg = join(work, "package")
console.log(`packed ${tarball}, unpacked to ${pkg}\n`)

// --- 1. nothing from src/ and assets/ got lost -------------------------------
const tracked = execSync("git ls-files src assets", {cwd: projectRoot, encoding: "utf8"})
    .split("\n").filter(Boolean)
const shipped = new Set(walk(pkg))
const missing = tracked.filter((f) => !shipped.has(f))
check(`all ${tracked.length} tracked files of src/ and assets/ are in the tarball`,
    missing.length === 0, missing.length ? "missing: " + missing.join(", ") : "")

// --- 2. imports and asset paths resolve inside the tarball -------------------
const shippedJs = walk(pkg).filter((f) => f.endsWith(".js"))
const unresolvedImports = []
for (const file of shippedJs) {
    const source = readFileSync(join(pkg, file), "utf8")
    for (const match of source.matchAll(/(?:^|[\s;])(?:import|export)[^'"]*?from\s*["'](\.[^"']+)["']/g)) {
        const target = resolve(dirname(join(pkg, file)), match[1])
        if (!existsSync(target)) unresolvedImports.push(`${file} -> ${match[1]}`)
    }
}
check(`every relative import in the ${shippedJs.length} shipped modules resolves`,
    unresolvedImports.length === 0, unresolvedImports.join(", "))

const assetRefs = new Set()
for (const file of shippedJs) {
    const source = readFileSync(join(pkg, file), "utf8")
    for (const match of source.matchAll(/["'`]((?:pieces|extensions)\/[\w./-]+\.svg)["'`]/g)) {
        assetRefs.add(match[1])
    }
}
const missingAssets = [...assetRefs].filter((a) => !existsSync(join(pkg, "assets", a)))
check(`every asset path referenced in the sources exists (${assetRefs.size} found)`,
    missingAssets.length === 0, missingAssets.join(", "))

const shippedCss = walk(pkg).filter((f) => f.endsWith(".css"))
const unresolvedCss = []
for (const file of shippedCss) {
    const source = readFileSync(join(pkg, file), "utf8")
    for (const match of source.matchAll(/url\(\s*["']?(?!data:|https?:)([^"')]+)["']?\s*\)/g)) {
        if (!existsSync(resolve(dirname(join(pkg, file)), match[1]))) unresolvedCss.push(`${file} -> ${match[1]}`)
    }
}
check(`every url() in the ${shippedCss.length} shipped stylesheets resolves`,
    unresolvedCss.length === 0, unresolvedCss.join(", "))

// --- 3. run the real test suite against the unpacked package -----------------
cpSync(join(projectRoot, "test"), join(pkg, "test"), {recursive: true})
rmSync(join(pkg, "test", "package.mjs"), {force: true}) // don't recurse
symlinkSync(join(projectRoot, "node_modules"), join(pkg, "node_modules"), "dir")
try {
    const output = execSync(`node "${join(pkg, "test", "headless.mjs")}"`, {encoding: "utf8"})
    const summary = output.trim().split("\n").pop()
    check("the test suite passes against the unpacked package", /All \d+ tests passed/.test(summary), summary)
} catch (error) {
    check("the test suite passes against the unpacked package", false,
        (error.stdout || "" + error.stderr || "").trim().split("\n").slice(-3).join(" | "))
}

rmSync(work, {recursive: true, force: true})
console.log(failures === 0 ? "\nPackage is complete" : `\n${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
