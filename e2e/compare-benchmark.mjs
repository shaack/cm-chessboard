/**
 * Compare two benchmark JSON outputs and produce a Markdown report.
 *
 * Usage:
 *   node e2e/compare-benchmark.mjs <baseline.json> <candidate.json>
 */
import {readFileSync, writeFileSync} from "node:fs"

const [, , baselinePath, candidatePath, outPath] = process.argv
if (!baselinePath || !candidatePath) {
    console.error("Usage: compare-benchmark.mjs <baseline.json> <candidate.json> [out.md]")
    process.exit(1)
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"))
const candidate = JSON.parse(readFileSync(candidatePath, "utf8"))

const byLabel = new Map()
for (const r of baseline) byLabel.set(r.label, {base: r})
for (const r of candidate) {
    const entry = byLabel.get(r.label) || {}
    entry.cand = r
    byLabel.set(r.label, entry)
}

function fmtMs(x) {
    const n = parseFloat(x)
    return n.toFixed(3)
}

function change(baseTotal, candTotal) {
    const b = parseFloat(baseTotal)
    const c = parseFloat(candTotal)
    if (b === 0 && c === 0) return {pct: 0, label: "  0.0%"}
    if (b === 0) return {pct: Infinity, label: "new"}
    const pct = ((c - b) / b) * 100
    const sign = pct > 0 ? "+" : ""
    return {pct, label: `${sign}${pct.toFixed(1)}%`}
}

const lines = []
lines.push("# Benchmark: baseline vs fork")
lines.push("")
lines.push("Measured in headless Chromium via Playwright on a single machine.")
lines.push("Each benchmark runs its inner loop 50 times after 5 warm-up iterations.")
lines.push("The reported numbers are the **total** time across all 50 iterations (in milliseconds).")
lines.push("Lower is better. `Δ` is the relative change of the candidate vs baseline.")
lines.push("")
lines.push("| Benchmark | Baseline total (ms) | Fork total (ms) | Baseline median | Fork median | Δ |")
lines.push("|---|---:|---:|---:|---:|---:|")

const rows = []
for (const [label, {base, cand}] of byLabel) {
    if (!base || !cand) continue
    const ch = change(base.total, cand.total)
    rows.push({
        label,
        baseTotal: base.total,
        candTotal: cand.total,
        baseMedian: base.median,
        candMedian: cand.median,
        delta: ch
    })
}

// Sort by biggest improvement first
rows.sort((a, b) => a.delta.pct - b.delta.pct)

for (const r of rows) {
    const marker = r.delta.pct < -10 ? " ✅" : r.delta.pct > 10 ? " ⚠️" : ""
    lines.push(`| ${r.label} | ${fmtMs(r.baseTotal)} | ${fmtMs(r.candTotal)} | ${fmtMs(r.baseMedian)} | ${fmtMs(r.candMedian)} | **${r.delta.label}**${marker} |`)
}

lines.push("")
lines.push("### Summary")
const improvements = rows.filter(r => r.delta.pct < -10)
const regressions = rows.filter(r => r.delta.pct > 10)
const noise = rows.filter(r => r.delta.pct >= -10 && r.delta.pct <= 10)
lines.push(`- **${improvements.length}** benchmarks improved by more than 10%`)
lines.push(`- **${noise.length}** benchmarks are within ±10% (noise / unchanged)`)
lines.push(`- **${regressions.length}** benchmarks regressed by more than 10%`)

if (improvements.length > 0) {
    lines.push("")
    lines.push("### Biggest wins")
    for (const r of improvements.slice(0, 5)) {
        lines.push(`- **${r.label}** — ${r.delta.label} (${fmtMs(r.baseTotal)} ms → ${fmtMs(r.candTotal)} ms)`)
    }
}
if (regressions.length > 0) {
    lines.push("")
    lines.push("### Regressions to investigate")
    for (const r of regressions) {
        lines.push(`- **${r.label}** — ${r.delta.label} (${fmtMs(r.baseTotal)} ms → ${fmtMs(r.candTotal)} ms)`)
    }
}

const out = lines.join("\n") + "\n"
if (outPath) {
    writeFileSync(outPath, out)
    console.error(`Wrote report to ${outPath}`)
}
process.stdout.write(out)
