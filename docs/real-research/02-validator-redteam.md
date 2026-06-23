# Phase 2 — Validator adversarial verification (2026-06-23)

Per EXECUTION_PLAN §5, the trust-boundary validator (`lib/research-contract.ts`) was
adversarially verified by a 4-agent red-team workflow that generated 34 malicious output.json
payloads trying to slip evidence-less / D-tier / self-high-confidence / spoofed-source data past
the rules. Every payload was then run through the real validator with a deterministic harness.

## Result
- Baseline (first pass): **8 genuine bypasses** found.
- After hardening: **0 bypasses** across all 34 payloads. Locked in with regression tests in
  `tests/research-contract.test.mjs`.

## Bypasses found and fixed
1. **Source-label spoofing** (5 payloads): a retailer/forum/blog/marketplace URL self-labeled
   `manufacturer_official`/`manufacturer_pdf`/`mirakl`/`operator_document` to steal tier-A/high.
   FIX: hostname ground-truth — a claimed source type can never *upgrade* trust above what the
   host warrants (`effectivePolicy` / `hostPolicy`). amazon→marketplace, reddit→rejected, blog→C,
   generic `shop`/`store` host→retailer.
2. **mirakl / operator_document abuse**: those aren't web sources a browsing runner produces.
   FIX: removed from the agent-claimable enum → unknown → rejected.
3. **Duplicate-citation inflation** (`evidenceIds: ["r1","r1","r1"]`). FIX: dedupe citations.
4. **`data:` URI / userinfo trick** (`https://a@data:text/html,...`) past the URL regex.
   FIX: strict `new URL()` parse — http(s) only, no embedded credentials, dotted host.
5. **Free-text / prompt-injection in `description`** at high confidence. FIX: strip HTML tags,
   strip control chars, cap value length (description ≤ 2000, others ≤ 240). (The injection text
   is inert anyway — candidate values are never fed back to an acting LLM.)

## Documented residual (accepted)
An **unknown** host (not in any denylist) self-labeled `manufacturer_official` is trusted as
tier A — we cannot enumerate every real manufacturer domain, and the realistic threat (the
operator's own trusted CLIs hallucinating) is mitigated by (a) the operator seeing the real
hostname in the UI, and (b) three-runner consensus. This is by design, not a hole.
