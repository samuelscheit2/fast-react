# Worker 914 - Scheduler Root Currentness Gate

## Summary

Added a focused Scheduler root currentness gate under conformance that re-runs
safe public `scheduler` root-entry observations against the checked
`oracles/scheduler-0.27.0-root-oracle.json` rows. The gate is fail-closed and
keeps public Scheduler timing, root/act/native/postTask/mock behavior, package
compatibility, and native runtime execution blocked.

Worker 886 is consumed only as accepted private Scheduler variant boundary
context. No Worker 909 ledger files were edited.

## Changed Files

- `tests/conformance/src/scheduler-root-currentness-gate.mjs`
- `tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `worker-progress/worker-914-scheduler-root-currentness-gate.md`

## Currentness And Oracle Path

- Gate source: `tests/conformance/src/scheduler-root-currentness-gate.mjs`
- Gate test: `tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- Checked oracle: `tests/conformance/oracles/scheduler-0.27.0-root-oracle.json`
- Oracle artifact constant: `oracles/scheduler-0.27.0-root-oracle.json`

## Evidence Gathered

- Current local observation rows are collected by running
  `tests/conformance/src/scheduler-root-probe-runner.mjs` against
  `packages/scheduler` through the public root entrypoint.
- Covered rows:
  - `scheduler-root-export-shape`
  - `scheduler-root-priority-ordering`
  - `scheduler-root-equal-priority-fifo`
  - `scheduler-root-delayed-callbacks`
  - `scheduler-root-cancellation`
  - `scheduler-root-continuations`
  - `scheduler-root-yield-paint-frame-rate`
  - `scheduler-root-node-host-transport`
- Development and production modes are both checked using
  `SCHEDULER_ROOT_PROBE_MODES`.
- Source context rows validate the public root wrapper and mark deep CJS
  development/production files as context-only, not root behavior evidence.
- Negative canaries cover stale oracle schema, missing local rows,
  production/development mode mismatch, compatibility flags flipped true, and
  variant/deep-CJS evidence used as root behavior evidence.

## Commands Run

- `node --check tests/conformance/src/scheduler-root-currentness-gate.mjs`
- `node --check tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `node --test tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `node --test tests/conformance/test/scheduler-root-oracle.test.mjs`
- `node --test tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs`
- `git diff --check`
- `npm test --workspace @fast-react/conformance`

## Check Results

Passing:

- `node --check tests/conformance/src/scheduler-root-currentness-gate.mjs`
- `node --check tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `node --test tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `node --test tests/conformance/test/scheduler-root-oracle.test.mjs`
- `node --test tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs`
- `git diff --check`

Failed:

- `npm test --workspace @fast-react/conformance`

The workspace conformance run fails in existing suites outside this worker's
write scope, including react-test-renderer serialization local/oracle tests and
private-admission ledger tests such as 727-728, 739-745, 804, 807, and 821.
The new Scheduler root currentness test passed in focused runs.

## Risks Or Blockers

- Full conformance remains blocked by unrelated existing failures outside the
  Worker 914 files.
- The currentness gate intentionally does not claim public Scheduler timing
  compatibility, root execution, act behavior, native runtime execution,
  postTask behavior, mock scheduler behavior, or package compatibility.
- Worker 909 overlap risk is limited to Scheduler variant boundary semantics;
  this worker imports Worker 886 context only and did not edit the active Worker
  909 ledger files.

## Recommended Next Tasks

- After Worker 909 lands, re-run the new
  `scheduler-root-currentness-gate.test.mjs` together with the Scheduler variant
  boundary tests to confirm no context drift.
- Triage the existing full-conformance failures separately before using
  `npm test --workspace @fast-react/conformance` as a merge gate for this
  worktree.
