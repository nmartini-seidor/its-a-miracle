# HyperFrames Storyboard Project

## Commands

```bash
npm run check
npm run render
```

## Rules

- Keep this project scoped to storyboard iteration.
- HTML is the source of truth.
- Every visible timed element uses `class="clip"` plus `data-start`, `data-duration`, and `data-track-index`.
- GSAP timelines must be synchronous, paused, and registered on `window.__timelines`.
- Use deterministic animation only.
