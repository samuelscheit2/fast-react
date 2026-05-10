# Worker 255 - Test Renderer Mock Scheduler Shell

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Tighten the `react-test-renderer`
  placeholder `_Scheduler` shell so its public key/throwing behavior is
  deterministic against accepted act/export oracles, without implementing mock
  Scheduler flushing, `act`, root updates, Rust routing, or compatibility
  claims.
- `ORCHESTRATOR.md` was not read.

## Summary

- Replaced the opaque empty `_Scheduler` proxy in the
  `@fast-react/react-test-renderer` root and CJS placeholders with a
  deterministic plain-object shell whose public key order matches the accepted
  React Test Renderer 19.2.6 act/export oracle evidence for
  `scheduler/unstable_mock`.
- Preserved the throwing boundary by making every behaviorful mock Scheduler
  method throw `FastReactTestRendererUnimplementedError` with export names like
  `_Scheduler.unstable_scheduleCallback`.
- Exposed only the oracle-backed mock Scheduler priority constants and
  `unstable_Profiling: null`; no Scheduler flushing, task queues, `act`, root
  updates, Rust routing, or compatibility claims were added.
- Reused the same `_Scheduler` shell object for module exports and
  `create()` renderer roots, matching the accepted root/package identity
  observation while keeping all root behavior fail-closed.

## Changed Files

- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-255-test-renderer-mock-scheduler-shell.md`

## Evidence Gathered

- Required context read after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Worker context read: 083 export oracle, 086 act oracle, 202 package
  placeholder, 210 create fail-closed surface, and Scheduler mock oracle/source
  workers 052, 120, and 164.
- Worker 237 and worker 258 progress files were not present in their sibling
  worktrees when checked, so this patch stayed scoped to package files and the
  existing import smoke.
- Accepted React Test Renderer evidence used:
  `_Scheduler`, `act`, `create`, `unstable_batchedUpdates`, and `version` root
  keys; production `act` remains present with value `undefined`; `_Scheduler`
  exposes the 27 `scheduler/unstable_mock` keys in the accepted order.
- Accepted Scheduler mock shape used only for public shell shape: priority
  constants `1..5`, `unstable_Profiling: null`, and function names/lengths.
  Behavior remains explicitly unimplemented.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,300p' MASTER_PROGRESS.md
sed -n '300,620p' MASTER_PROGRESS.md
rg --files worker-progress | rg 'worker-(083|086|202|210|237|052|120|164)'
sed -n '<ranges>' worker-progress/worker-083-react-test-renderer-export-oracle.md
sed -n '<ranges>' worker-progress/worker-086-react-test-renderer-act-oracle.md
sed -n '<ranges>' worker-progress/worker-202-react-test-renderer-package-placeholder.md
sed -n '<ranges>' worker-progress/worker-210-react-test-renderer-js-create-failclosed.md
sed -n '<ranges>' worker-progress/worker-052-scheduler-mock-oracle.md
sed -n '<ranges>' worker-progress/worker-120-scheduler-mock-source-implementation.md
sed -n '<ranges>' worker-progress/worker-164-scheduler-regression-tests.md
find <worker-237-worktree>/worker-progress -maxdepth 1 -type f -name '*237*.md'
find <worker-258-worktree>/worker-progress -maxdepth 1 -type f -name '*258*.md'
git status --short --untracked-files=all
rg --files packages/react-test-renderer tests | rg '(react-test-renderer|test-renderer|package-surface|import-entrypoints)'
sed -n '<ranges>' packages/react-test-renderer/index.js
sed -n '<ranges>' packages/react-test-renderer/cjs/react-test-renderer.development.js
sed -n '<ranges>' packages/react-test-renderer/cjs/react-test-renderer.production.js
sed -n '<ranges>' packages/react-test-renderer/shallow.js
sed -n '<ranges>' tests/smoke/import-entrypoints.mjs
sed -n '<ranges>' tests/smoke/package-surface-guard.mjs
sed -n '<ranges>' tests/smoke/package-surface-snapshot.json
sed -n '<ranges>' tests/conformance/test/react-test-renderer-export-oracle.test.mjs
sed -n '<ranges>' tests/conformance/test/react-test-renderer-act-oracle.test.mjs
sed -n '<ranges>' tests/conformance/src/react-test-renderer-act-probe-runner.mjs
sed -n '<ranges>' tests/conformance/src/react-test-renderer-export-probe-runner.mjs
node --input-type=module - <<'NODE' # inspect accepted _Scheduler oracle keys/descriptors
node --input-type=module - <<'NODE' # local placeholder _Scheduler probe
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/smoke/import-entrypoints.mjs
node tests/smoke/import-entrypoints.mjs
npm run check:package-surface
node --test tests/conformance/test/react-test-renderer-export-oracle.test.mjs tests/conformance/test/react-test-renderer-act-oracle.test.mjs
git diff --check
git add -N worker-progress/worker-255-test-renderer-mock-scheduler-shell.md && git diff --check; rc=$?; git reset -q -- worker-progress/worker-255-test-renderer-mock-scheduler-shell.md; exit $rc
npm run check:js
git diff --name-status
git diff --stat
get_goal
```

## Verification Results

- `node --check` passed for all touched JS files.
- `node --test tests/conformance/test/react-test-renderer-export-oracle.test.mjs tests/conformance/test/react-test-renderer-act-oracle.test.mjs` passed, 23 tests.
- `npm run check:package-surface` passed.
- `node tests/smoke/import-entrypoints.mjs` passed after updating the embedded
  react-test-renderer package probe to the same `_Scheduler` shell contract.
- `npm run check:js` passed, including package-surface, smoke entrypoints,
  benchmark gates, workspace checks, native loader probes, and 505 conformance
  tests.
- `git diff --check` passed, including the new report with intent-to-add.
- npm emitted the existing `minimum-release-age` config warning during npm
  commands; it did not affect results.

## Delegated Checks

- No nested managed agents were spawned.

## Risks Or Blockers

- `_Scheduler` now has the accepted public key/constant shape, but all
  behaviorful methods intentionally throw. Any test expecting mock Scheduler
  flushing remains blocked by design.
- The shell is duplicated across the no-exports-map root and CJS files to avoid
  adding helper files that would become public physical deep imports.
- Workers 237 and 258 may still touch nearby package files or snapshots, so
  merge conflict risk remains around `react-test-renderer` smoke/package
  surface work.

## Recommended Next Tasks

- Keep `act`, root updates, serialization, and Scheduler flushing gated until
  the JS facade can route through accepted renderer/reconciler behavior.
- If a future worker implements real test-renderer scheduling, replace this
  throwing shell with explicit dual-run coverage rather than loosening the
  placeholder tests.
- After concurrent worker merges, rerun `node tests/smoke/import-entrypoints.mjs`
  and `npm run check:package-surface` to catch package-surface drift.
