# Worker 218: Hydration Boundary Fail-Closed Gate

Objective: add or tighten a private React DOM hydration boundary helper/gate
that records unsupported hydrate-root paths deterministically against accepted
hydration marker oracles, without implementing hydration replay, DOM mutation,
event replay, public root behavior, or compatibility claims.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 043, 049, 140, and 169.
- Inspect React DOM client root/hydration placeholders, root markers, and
  hydration conformance oracles.

## Write Scope

- Primary: `packages/react-dom/src/client/**` hydration/root helper files.
- Secondary: focused hydration gate tests only.
- Report: `worker-progress/worker-218-hydration-boundary-failclosed.md`.
- Do not edit DOM mutation, event dispatch, Rust crates, or master docs.

## Verification

- `node --check` for touched JS files.
- Focused hydration marker/gate tests.
- `npm run check:js`
- `git diff --check`
