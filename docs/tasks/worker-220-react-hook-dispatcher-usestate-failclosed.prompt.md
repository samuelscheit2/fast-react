# Worker 220: React Hook Dispatcher UseState Fail-Closed Surface

Objective: tighten the JS React hook dispatcher guard so `useState` and
`useReducer` fail deterministically when no native/private dispatcher is
installed, matching existing package placeholder style and preserving public
compatibility claims as blocked.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 097, 112, 136, 158, 182, 192, and 200.
- Inspect `packages/react/hook-dispatcher.js`, `packages/react/index.js`, and
  related React package smoke/oracle tests.

## Write Scope

- Primary: `packages/react/hook-dispatcher.js`.
- Secondary: `packages/react/index.js` and focused React hook dispatcher tests
  if needed.
- Report: `worker-progress/worker-220-react-hook-dispatcher-usestate-failclosed.md`.
- Do not edit Rust crates, React DOM, react-test-renderer, or master docs.

## Verification

- `node --check` for touched JS files.
- Focused React hook dispatcher smoke tests.
- `npm run check:js`
- `git diff --check`
