# Phase 3 + 4 — Real end-to-end integration proof (2026-06-23)

Ran the real Worker against one real product (Huawei FreeClip 2) with all three subscription
CLIs, on an isolated SQLite db. Nothing mocked.

## Result
- Job `research-freeclip-2-1` → SUCCEEDED in **283s**.
- Runs: cursor SUCCEEDED (8 candidates), codex SUCCEEDED (16), claude SUCCEEDED (15).
- Merged → **34 candidate values** across 3 runners.

## Consensus (ADR 0004) — agreement collapses + raises confidence
- `brand = Huawei` — high, runners [cursor, codex, claude], 4 evidence.
- `bluetoothVersion = Bluetooth 6.0` — high, [cursor, codex].
- `productName = HUAWEI FreeClip 2` — [codex, claude]; `bluetooth = Yes` — [codex, claude].

## Conflict (ADR 0004) — disagreement surfaces competing candidates
- `ean` produced THREE competing values — the runners found different colour-variant barcodes
  (cursor 6942103169434, claude 6942103169441, codex enumerated all four colours). A genuine
  conflict, correctly kept as competing candidates tagged per runner for the reviewer.
- `usbC`, `microphone`, `description`, `compatibility` etc. show per-runner phrasing variants as
  competing candidates (reviewer picks the best wording).

## Trust boundary held in the wild
- Evidence was overwhelmingly `consumer.huawei.com` (tier A, manufacturer official); supporting
  tier-C retailers (argos.co.uk, etoren.com, dakauf.eu, movertix.com…). No D-tier survived.
- EAN candidates came out `medium` (retailer/single-source); manufacturer-backed spec values `high`.
- Every candidate cites real evidence; nothing fabricated.

## Acceptance
- Phase 3: real agents spawned + validated candidates ✓; timeout/cancel handled by the worker ✓;
  Worker is a separate process so it survives Next dev-server reloads ✓.
- Phase 4: agreement→single high-confidence candidate ✓; disagreement→competing candidates ✓.
