# Worker 202: React Test Renderer Package Placeholder

Objective: add a minimal JS package placeholder surface for
`react-test-renderer` that matches the existing Fast React package placeholder
style and keeps compatibility claims blocked, without wiring the Rust
test-renderer crate, implementing serialization, `act`, public create/update
behavior, or changing React/React DOM package behavior.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 073, 078, 088, 153, 178, 188, and 194.
- Inspect `packages/react`, `packages/react-dom`, `tests/smoke/package-surface-guard.mjs`,
  `tests/smoke/package-surface-snapshot.json`, and react-test-renderer
  conformance/oracle files.
- Inspect published `react-test-renderer@19.2.6` package metadata/export shape
  from existing checked oracle files before adding local package shape.

## Write Scope

- New `packages/react-test-renderer/**` placeholder package files if absent.
- Smoke/package-surface tests and snapshots needed for the new package.
- Report: `worker-progress/worker-202-react-test-renderer-package-placeholder.md`.
- Do not edit Rust crates, React DOM implementation files, Scheduler package,
  or master docs.

## Implementation Notes

- Follow existing placeholder error utilities/style where possible.
- Keep exports deterministic and fail-loud.
- Do not claim public `create`, `act`, serialization, tree output, or update
  behavior compatibility.

## Verification

- `node --check` for new JS files.
- `npm run check:package-surface`
- Focused smoke/conformance tests touched by this package.
- `npm run check:js`
- `git diff --check`

