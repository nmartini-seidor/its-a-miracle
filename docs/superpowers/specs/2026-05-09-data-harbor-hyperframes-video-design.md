# Data Harbor HyperFrames Video Design

## Status
Approved brainstorming design for a future HyperFrames implementation plan. This document defines the creative direction, narrative, assets, timing, and validation expectations for the product video. It does not implement the composition.

## Objective
Create a 60-75 second music-driven product video for **Data Harbor by SEIDOR** that sells the business value of product-data enrichment. The video should make the problem feel costly, reveal Data Harbor as the controlled solution, and prove the app is easy to use through real UI moments and cinematic overlays.

The target viewer is a business buyer: ecommerce directors, marketplace leads, product-content leaders, and operations managers who care about cost, speed, catalog quality, and operational control.

## Positioning
Product data quality is expensive to maintain. Catalog teams lose time finding missing attributes, checking sources, normalizing product details, validating evidence, and preparing updates for downstream systems. Manual enrichment does not scale as categories, SKUs, schemas, and source rules grow.

Data Harbor by SEIDOR helps teams turn scattered product information into governed, reviewable, structured product data. Research agents search trusted sources, map evidence to fields, and bring candidate improvements back to the operator. Humans stay in control: they review, accept, and sync only what they trust.

## Format
- Duration: 60-75 seconds, target 75 seconds.
- Aspect ratio: 1920x1080 landscape.
- Audio: music bed only.
- Voiceover: none.
- Text style: short kinetic copy, high contrast, large typography.
- App proof: hybrid treatment using real UI captures from the local app plus cinematic HyperFrames overlays.
- Final call to action: `Start enriching product data with Data Harbor`.

## Narrative Structure
Use the approved **Chaos -> Harbor -> Workflow** arc.

| Time | Beat | Purpose | Kinetic copy |
| --- | --- | --- | --- |
| 0-8s | Catalog pain | Establish that product data decays and becomes operational drag. | `Product data is never done` |
| 8-16s | Manual cost | Show that manual research and enrichment do not scale. | `Manual enrichment does not scale` |
| 16-24s | Brand reveal | Introduce Data Harbor by SEIDOR with the signature lighthouse moment. | `Data Harbor by SEIDOR` |
| 24-38s | Agent swarm | Show agents searching trusted sources for product facts. | `Agents search trusted sources` |
| 38-50s | Structured mapping | Show found evidence becoming field-level structured data. | `Evidence becomes structured fields` |
| 50-62s | Single-product workflow | Prove the happy path in the real app. | `Import. Review. Launch. Accept.` |
| 62-68s | Batch scale | Show selecting multiple products and launching many agents from the product list. | `Scale from one product to hundreds` |
| 68-72s | Governance proof | Show configurable schemas and source authority ratings. | `Govern every category. Rank every source.` |
| 72-75s | CTA | Close with the app logo, SEIDOR mark, and final light sweep. | `Start enriching product data with Data Harbor` |

## Visual Direction
Use **premium harbor tech**:
- Deep maritime navy background.
- Crisp cyan/white lighthouse beam.
- Clean white UI surfaces.
- Precise source nodes, field tokens, confidence badges, and schema rows.
- Controlled agent-swarm energy during the research sequence.
- Enterprise-grade polish rather than exaggerated sci-fi.

Avoid a generic AI dashboard look. The lighthouse and harbor identity must be the memorable visual device.

## Logo Treatment
Use the real app logo at `public/data-harbor-logo.svg` as the Data Harbor brand anchor.

Opening sequence:
1. The Data Harbor SVG appears first.
2. The lighthouse beam originates from the Data Harbor mark and sweeps left to right.
3. As the beam touches the frame, the official SEIDOR SVG materializes from left to right.
4. The final lockup reads visually as Data Harbor first, with SEIDOR as the partner signature.

Use the SEIDOR logo from Wikimedia as provided by the user:
`https://upload.wikimedia.org/wikipedia/commons/3/3f/Seidor.svg`

The Data Harbor logo should also appear subtly during the video where appropriate, such as a corner lockup on app proof scenes or as the source of recurring beam transitions.

## Agent Animation
Create the agents as deterministic SVG/HTML animation elements:
- One soft blob-like core contains a simple droid icon.
- The core splits into smaller agent blobs.
- Each smaller agent travels to a trusted source node.
- Source nodes should be labeled by source role rather than external brand dependency:
  - `Manufacturer`
  - `Datasheet`
  - `Retailer`
  - `Spec DB`
  - `Internal Schema`
- Agents return with field tokens such as `brand`, `EAN`, `dimensions`, `battery`, `compatibility`, and `description`.
- Tokens snap into structured schema rows with confidence/source badges.

The animation should make the business idea obvious: agents do the search work, but the result comes back mapped, reviewable, and governed.

## App Workflow
Use a happy-path app sequence. Do not show error states, failed sync, QA disputes, or a before/after score detour.

Workflow beats:
1. **Import products**: show products entering the workspace.
2. **Review one product**: open a product with missing fields.
3. **Launch an agent from product detail**: trigger the agent swarm overlay.
4. **Accept changes**: approve evidence-backed field candidates.
5. **Batch launch agents from product list**: return to the product list, select multiple products, click launch agents, and show multiple agent cores splitting outward.
6. **Sync with systems**: show approved fields mapping into clean sync/export output.
7. **Schemas and aggregators**: flash product schemas, required attributes, source aggregators, source authority, and confidence ratings to prove governance.

The single-product flow proves control. The batch-launch moment proves scale.

## Transition Vocabulary
Every scene transition should feel intentional and should avoid jump cuts:
- Lighthouse wipe.
- Scanline resolve.
- UI zoom-through.
- Data-row morph.
- Source-node orbit.
- Field-token snap.
- Final light sweep.

The lighthouse beam should be the primary transition motif so the video feels unified.

## HyperFrames Build Constraints
The future implementation should follow the HyperFrames model:
- Root `index.html` composition.
- Composition size: `1920x1080`.
- Use `data-composition-id`, timed clips, `data-start`, `data-duration`, and `data-track-index`.
- Build GSAP timelines synchronously and register them under `window.__timelines`.
- Timelines must be paused; HyperFrames controls playback.
- Use deterministic animation. Do not use `Math.random()`, `Date.now()`, timeouts, or infinite repeats.
- Multi-scene composition must include transitions and entrance animations.
- Use no narration track. Music only.

Reference reviewed: HyperFrames quickstart at `https://hyperframes.heygen.com/quickstart`.

## Assets
Required:
- `public/data-harbor-logo.svg`
- SEIDOR SVG from Wikimedia.
- Real app captures from the local app, especially catalog/product list, product detail/review, launch agent action, schema configuration, aggregator/source authority views, and sync/export proof.
- Music bed selected during implementation.
- Agent SVG/HTML elements created locally for deterministic animation.

Asset handling rules:
- Keep external brand/source names out of the agent-search nodes unless explicitly needed.
- Use source-role labels for source nodes.
- Use actual app UI for proof scenes rather than fully invented UI.
- Do not expose credentials or live Mirakl secrets in any captured screen.

## Validation Plan
Implementation will be considered ready only after:
- `npx hyperframes lint` passes.
- `npx hyperframes validate` passes.
- `npx hyperframes inspect` passes or all intentional overflow is documented.
- The composition previews correctly through HyperFrames.
- A rendered MP4 is generated successfully.
- The rendered video visibly includes the real Data Harbor logo and SEIDOR logo treatment.
- The happy-path app sequence is readable without narration.
- No prohibited data, credentials, or live secrets appear in captured assets.

## Acceptance Criteria
- The video communicates cost/pain before introducing the product.
- The Data Harbor lighthouse/beam is the signature visual device.
- The real Data Harbor app SVG is used.
- The SEIDOR logo materializes from left to right when touched by the lighthouse beam.
- The video is music-driven with kinetic text only.
- The agent swarm clearly shows search, return, field mapping, and structured evidence.
- The app workflow shows import, review, launch agent, accept changes, batch launch, sync, schemas, and aggregators.
- The final CTA is `Start enriching product data with Data Harbor`.
- The design remains feasible in HyperFrames without adding new runtime dependencies.

## Open Implementation Notes
The implementation plan should decide:
- Exact music bed and timing markers.
- Whether app proof scenes use screenshots, short screen recordings, or recreated static captures.
- Exact screen routes/products to capture from `localhost:3000`.
- Whether to inline the SEIDOR SVG or store it as a local asset during the video build.

These notes are implementation choices, not unresolved design requirements.
