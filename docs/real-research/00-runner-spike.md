# Phase 0 — Runner feasibility spike — GREEN PASS (2026-06-23)

Verified each subscription-CLI runner headlessly, NO API keys (env keys stripped),
jailed cwd, against one real product (Huawei FreeClip 2).

| Runner | (a) no API key | (b) real web search | (c) conformant output.json | (d) wall-clock |
|---|---|---|---|---|
| cursor-agent | yes (login: nmartini.dev@gmail.com) | yes (Huawei UK specs + MediaMarkt) | yes | 38s |
| codex (`exec`, `-c tools.web_search=true`) | yes (ChatGPT login) | yes (El Corte Inglés + Huawei specs) | yes | 75s (~115k tok) |
| claude (`-p`) | yes (subscription OAuth) | yes (Huawei specs; resolved BT5.4-vs-6.0 conflict by opening source) | yes | 70s |

No rate-limit / quota / ToS warnings observed.

## Headline
All three INDEPENDENTLY converged on the same values from THREE DIFFERENT sources:
EAN 6942103169441 (white variant matching the product URL), weight 5.1 g/earbud + 37.8 g case,
Bluetooth 6.0, battery 9 h / 38 h. This is ADR 0004's consensus thesis working for real.
They all disagree with the OLD hardcoded mock EAN (6942103169434) — the real agents found the
correct white-variant barcode. Premise validated.

## Working launch invocations (subscription auth, jailed cwd, web on)
- cursor: `cursor-agent -p --output-format text --force --workspace <jail> "<mission>"`
- codex:  `codex exec --skip-git-repo-check -C <jail> --dangerously-bypass-approvals-and-sandbox -c tools.web_search=true "<mission>"`
- claude: `claude -p --output-format text --dangerously-skip-permissions --allowedTools "WebSearch,WebFetch,Write,Read" <mission-via-stdin>`
  (NOTE: claude `--allowedTools` is variadic — pass comma-separated as ONE token and feed the prompt via stdin, or it eats the prompt.)

Gate satisfied: no runner failed (a) or (b). Proceed with all three runners.
