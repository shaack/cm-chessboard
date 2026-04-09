# Benchmark: baseline vs fork

Measured in headless Chromium via Playwright on a single machine.
Each benchmark runs its inner loop 50 times after 5 warm-up iterations.
The reported numbers are the **total** time across all 50 iterations (in milliseconds).
Lower is better. `Δ` is the relative change of the candidate vs baseline.

| Benchmark | Baseline total (ms) | Fork total (ms) | Baseline median | Fork median | Δ |
|---|---:|---:|---:|---:|---:|
| Arrows: add+remove single arrow | 25.500 | 1.800 | 0.200 | 0.000 | **-92.9%** ✅ |
| Markers: addLegalMovesMarkers (20) + remove | 308.900 | 26.700 | 3.000 | 0.300 | **-91.4%** ✅ |
| Position.clone() | 51.200 | 5.300 | 1.000 | 0.000 | **-89.6%** ✅ |
| setPiece (no animation) | 0.800 | 0.200 | 0.000 | 0.000 | **-75.0%** ✅ |
| Arrows: add 5 arrows then remove all | 86.400 | 23.500 | 0.800 | 0.200 | **-72.8%** ✅ |
| new Position(FEN.start) | 70.100 | 53.900 | 1.400 | 1.100 | **-23.1%** ✅ |
| setPosition (no animation) | 1.100 | 0.900 | 0.000 | 0.000 | **-18.2%** ✅ |
| Position.squareToIndex round-trip x64 | 9.900 | 8.600 | 0.200 | 0.200 | **-13.1%** ✅ |
| Position.getFen() | 27.200 | 25.400 | 0.500 | 0.500 | **-6.6%** |
| Position.getPieces() | 94.300 | 93.200 | 1.900 | 1.900 | **-1.2%** |
| Markers: 20 individual addMarker calls | 277.800 | 282.600 | 2.700 | 2.700 | **+1.7%** |

### Summary
- **8** benchmarks improved by more than 10%
- **3** benchmarks are within ±10% (noise / unchanged)
- **0** benchmarks regressed by more than 10%

### Biggest wins
- **Arrows: add+remove single arrow** — -92.9% (25.500 ms → 1.800 ms)
- **Markers: addLegalMovesMarkers (20) + remove** — -91.4% (308.900 ms → 26.700 ms)
- **Position.clone()** — -89.6% (51.200 ms → 5.300 ms)
- **setPiece (no animation)** — -75.0% (0.800 ms → 0.200 ms)
- **Arrows: add 5 arrows then remove all** — -72.8% (86.400 ms → 23.500 ms)
