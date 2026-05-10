# Worker 213: DOM Property Payload Style/Dangerous HTML

Objective: extend the private DOM property payload helper with a small,
data-only style and `dangerouslySetInnerHTML` slice aligned with accepted
oracles, keeping unsupported behavior fail-closed and avoiding DOM mutation,
public roots, events, forms, hydration, or compatibility claims.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 061, 062, 110, 134, 186, and 201.
- Inspect `packages/react-dom/src/dom-host/property-payload.js` and related
  conformance oracle files.

## Write Scope

- Primary: `packages/react-dom/src/dom-host/property-payload.js`.
- Secondary: focused property-payload tests only.
- Report: `worker-progress/worker-213-dom-property-payload-style-dangerous-html.md`.
- Do not edit mutation.js, root bridge, event code, Rust crates, or master docs.

## Verification

- `node --check` for touched JS files.
- Focused property-payload tests.
- `npm run check:js`
- `git diff --check`
