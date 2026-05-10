# Worker 280 Scheduler Mock Flush Helper Gate

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before writing
  this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Add focused scheduler mock
  flush-helper gate coverage that proves the accepted mock Scheduler shell
  exposes deterministic helper metadata for react-test-renderer while keeping
  broad Scheduler compatibility and renderer work execution scoped to existing
  oracle rows.
- `ORCHESTRATOR.md` was not read.

## Summary

Added a focused checked-oracle gate to
`tests/conformance/test/scheduler-mock-oracle.test.mjs` that proves the
accepted `scheduler/unstable_mock` export-shape row exposes the flush helper
function metadata that react-test-renderer's `_Scheduler` shell depends on.

The new coverage reads only the existing `scheduler-mock-export-shape` oracle
row for official `scheduler@0.27.0` and the local Fast React scheduler copy. It
asserts `name`, `length`, and data-property descriptor metadata for:

- `unstable_flushAll`
- `unstable_flushAllWithoutAsserting`
- `unstable_flushExpired`
- `unstable_flushNumberOfYields`
- `unstable_flushUntilNextPaint`

No scheduler runtime behavior, root/native/post-task Scheduler entrypoint,
react-test-renderer package file, renderer execution path, oracle generator, or
checked oracle JSON was changed.

## Changed Files

- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `worker-progress/worker-280-scheduler-mock-flush-helper-gate.md`

## Evidence Gathered

- Read required worker context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Inspected workers 120, 164, and 255 progress reports. Worker 120 implemented
  the mock Scheduler state machine; worker 164 kept broad Scheduler
  compatibility unclaimed; worker 255 established the deterministic
  react-test-renderer `_Scheduler` shell shape.
- Worker 268 had no completed markdown report in this worktree; the sibling
  worktree was clean, and its Codex log showed its scope was a
  react-test-renderer act blocked gate with no renderer work execution.
- Inspected React reference source showing `react-test-renderer` imports
  `scheduler/unstable_mock` and exports it as `_Scheduler`.
- Confirmed `packages/scheduler/src/unstable_mock.js` is absent in the current
  package layout. I did not add an unused source file because the scheduler
  package has no `exports` or `main`, and the package-surface guard treats
  every JS/JSON file under `packages/scheduler` as a public physical resolver.
- Confirmed existing checked oracle data already records the needed flush helper
  descriptors for development and production, and local Fast React comparisons
  remain `matched-but-compatibility-not-claimed`.

## Commands Run

```sh
create_goal
get_goal
pwd && rg --files | sed -n '1,120p'
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files worker-progress tests/conformance packages/scheduler | sed -n '1,220p'
sed -n '1,260p' worker-progress/worker-120-scheduler-mock-source-implementation.md
sed -n '1,260p' worker-progress/worker-164-scheduler-regression-tests.md
sed -n '1,220p' worker-progress/worker-255-test-renderer-mock-scheduler-shell.md
find <worker-268-worktree>/worker-progress -maxdepth 1 -type f -name '*268*' -print
git -C <worker-268-worktree> status --short --untracked-files=no
git -C <worker-268-worktree> diff --name-status
tail -220 <worker-268-worktree>/worker-progress/worker-268-react-test-renderer-act-blocked-gate.codex.log
find packages/scheduler -maxdepth 3 -type f | sort
sed -n '1,220p' packages/scheduler/unstable_mock.js
sed -n '1,760p' packages/scheduler/cjs/scheduler-unstable_mock.development.js
sed -n '1,760p' packages/scheduler/cjs/scheduler-unstable_mock.production.js
sed -n '1,320p' tests/smoke/import-entrypoints.mjs
sed -n '1,320p' tests/conformance/test/scheduler-mock-oracle.test.mjs
sed -n '1,920p' tests/conformance/src/scheduler-mock-probe-runner.mjs
sed -n '1,260p' tests/conformance/src/scheduler-mock-scenarios.mjs
sed -n '1,260p' tests/conformance/src/scheduler-mock-targets.mjs
sed -n '1,360p' tests/conformance/src/scheduler-mock-oracle-generator.mjs
sed -n '1,260p' packages/react-test-renderer/index.js
sed -n '1,260p' packages/react-test-renderer/cjs/react-test-renderer.development.js
sed -n '1,260p' packages/react-test-renderer/cjs/react-test-renderer.production.js
sed -n '1,80p' <react-reference>/packages/react-test-renderer/src/ReactTestRenderer.js
sed -n '510,660p' <react-reference>/packages/react-test-renderer/src/ReactTestRenderer.js
node --input-type=module - <<'NODE' # inspect checked scheduler mock flush helper descriptors
node --check tests/conformance/test/scheduler-mock-oracle.test.mjs
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
node --check packages/scheduler/unstable_mock.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.development.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.production.js
node tests/smoke/import-entrypoints.mjs
git diff --check
npm run check:js
get_goal
```

## Verification Results

Passing:

```sh
node --check tests/conformance/test/scheduler-mock-oracle.test.mjs
node --check packages/scheduler/unstable_mock.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.development.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.production.js
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
node tests/smoke/import-entrypoints.mjs
npm run check:js
git diff --check
```

Focused scheduler mock oracle test result: 14 tests passed.

`npm run check:js` passed, including package-surface, smoke entrypoints,
benchmark gates, workspace checks, native loader probes, and 540 conformance
tests. npm emitted the existing `minimum-release-age` warnings.

## Delegated Checks

- No nested managed agents were spawned.

## Risks Or Blockers

- This is coverage-only over an existing checked oracle row. It does not create
  a new behavior row, execute react-test-renderer, or claim act/root scheduling
  compatibility.
- Broad Scheduler compatibility remains unclaimed by design. The gate asserts
  local metadata matches official Scheduler for the checked row only.
- The absent `packages/scheduler/src/unstable_mock.js` remains a package-layout
  gap if the project later wants source/CJS parity. Adding it safely will need a
  package-surface decision because physical JS files are public resolver files
  for this no-exports-map package.

## Recommended Next Tasks

1. Keep react-test-renderer `act`, root update/unmount, and serialization gates
   blocked until renderer work and effect flushing can execute through accepted
   roots.
2. If source/CJS parity for Scheduler mock files becomes required, handle it in
   a package-surface-owned slice that updates the resolver snapshot
   intentionally.
