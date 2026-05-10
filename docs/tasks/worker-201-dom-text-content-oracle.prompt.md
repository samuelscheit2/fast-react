# Worker 201: DOM Text Content Oracle

Objective: add a dedicated React DOM 19.2.6 text-content oracle/gate for
`shouldSetTextContent`, host text creation/update boundaries, and
`dangerouslySetInnerHTML` exclusions, without implementing Fast React DOM text
mutation behavior, changing React DOM package exports, or claiming DOM
compatibility.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 061, 091, 110, 154, 185, and 186.
- Inspect existing oracle patterns under `tests/conformance/src/*oracle*`,
  `tests/conformance/test/*oracle.test.mjs`, and package scripts in
  `tests/conformance/package.json` plus root `package.json`.
- Use exact `react-dom@19.2.6` npm artifacts or the local React reference clone
  as appropriate, following existing oracle style.

## Write Scope

- New or updated files under `tests/conformance/src/`,
  `tests/conformance/test/`, `tests/conformance/scripts/`,
  `tests/conformance/oracles/`, and package scripts needed to run this oracle.
- Report: `worker-progress/worker-201-dom-text-content-oracle.md`.
- Do not edit `packages/react-dom/src/**`, Rust crates, scheduler packages,
  React package facades, or master docs.

## Implementation Notes

- Keep Fast React compatibility claims false/blocked until implementation
  exists.
- Normalize temporary paths and timestamps as existing generated artifacts do.
- Prefer focused fake-DOM evidence over browser claims.
- Include a checked artifact and a test that proves it is stable/readable.

## Verification

- Relevant `node --check` commands for new scripts/modules.
- Focused conformance test(s) for the new oracle.
- `npm run test:conformance -- --runInBand` if the repo's test runner supports
  that flag; otherwise run the focused conformance command used locally.
- `npm run check:js`
- `git diff --check`

