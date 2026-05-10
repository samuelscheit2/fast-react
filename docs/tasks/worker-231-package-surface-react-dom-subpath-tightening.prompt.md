# Worker 231: Package Surface React DOM Subpath Tightening

Objective: tighten package-surface smoke coverage for React DOM subpaths and
placeholder boundaries introduced so far, ensuring unsupported server/static,
profiling, test-utils, and client subpaths remain deterministic without
implementing new runtime behavior.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 035, 053, 054, 145, 165, 177, and 202.
- Inspect `tests/smoke/package-surface-*`, React DOM package files, and
  package-surface snapshots.

## Write Scope

- Primary: `tests/smoke/package-surface-*`.
- Secondary: React DOM placeholder files only for deterministic unsupported
  errors if the tests reveal drift.
- Report: `worker-progress/worker-231-package-surface-react-dom-subpath-tightening.md`.
- Do not edit Rust crates, conformance oracles, React package internals, or
  master docs.

## Verification

- `node --check` for touched JS files.
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check:js`
- `git diff --check`
