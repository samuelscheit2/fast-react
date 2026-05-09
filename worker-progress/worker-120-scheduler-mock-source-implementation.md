# worker-120-scheduler-mock-source-implementation

## Objective

Implement `scheduler/unstable_mock` source behavior from the merged oracle
evidence.

Goal state recorded with `get_goal`:

- Startup status: `active`
- Startup objective: `Implement scheduler/unstable_mock source behavior from the merged oracle evidence.`
- Post-implementation status before completion audit: `active`
- Post-implementation objective: `Implement scheduler/unstable_mock source behavior from the merged oracle evidence.`

## Summary

Replaced the mock scheduler placeholder with an isolated virtual-time mock
scheduler state machine for both development and production CJS artifacts.
The implementation owns its task queues, yielded log, virtual clock, paint
yield state, flush helpers, priority context, cancellation tombstones, and
reset behavior. It does not import or share mutable state with the root
`scheduler` implementation.

Promoted the scheduler mock oracle and smoke checks from placeholder boundaries
to implemented mock behavior. The regenerated oracle now reports 18
`matched-but-compatibility-not-claimed` Fast React comparisons across
development and production. Workspace package metadata is still observed in
the oracle but excluded from behavior comparison because package identity
cleanup is outside this source slice.

## Changed Files

- `packages/scheduler/cjs/scheduler-unstable_mock.development.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.production.js`
- `tests/smoke/import-entrypoints.mjs`
- `tests/conformance/scripts/generate-scheduler-mock-oracle.mjs`
- `tests/conformance/src/scheduler-mock-oracle-generator.mjs`
- `tests/conformance/src/scheduler-mock-oracle.mjs`
- `tests/conformance/src/scheduler-mock-targets.mjs`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json`
- `worker-progress/worker-120-scheduler-mock-source-implementation.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, worker 103,
  worker 115, local scheduler mock oracle/test files, root scheduler CJS
  implementation, and the React 19.2.6 reference `SchedulerMock.js`.
- Nested read-only agents checked the oracle/test expectations and the React
  reference source. Both confirmed the root cause: missing mock-owned virtual
  scheduler state, not a root scheduler integration bug.
- Generated comparison after implementation reported:
  `{"matched-but-compatibility-not-claimed":18}`.
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs` passed
  13 tests.
- `npm run check:js` passed, including 402 conformance tests. npm emitted only
  the existing `minimum-release-age` warning.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-103-scheduler-mock-implementation-plan.md
sed -n '1,260p' worker-progress/worker-115-scheduler-mock-source-plan.md
rg --files packages/scheduler tests/conformance worker-progress
sed -n '261,520p' worker-progress/worker-103-scheduler-mock-implementation-plan.md
sed -n '261,620p' worker-progress/worker-115-scheduler-mock-source-plan.md
sed -n '1,260p' packages/scheduler/cjs/scheduler-unstable_mock.development.js
sed -n '1,220p' packages/scheduler/cjs/scheduler-unstable_mock.production.js
sed -n '1,260p' tests/conformance/test/scheduler-mock-oracle.test.mjs
sed -n '1,520p' tests/conformance/src/scheduler-mock-probe-runner.mjs
sed -n '521,1080p' tests/conformance/src/scheduler-mock-probe-runner.mjs
sed -n '1,260p' tests/conformance/src/scheduler-mock-oracle-generator.mjs
sed -n '1,180p' tests/conformance/src/scheduler-mock-targets.mjs
sed -n '1,160p' tests/conformance/scripts/generate-scheduler-mock-oracle.mjs
sed -n '1,260p' packages/scheduler/cjs/scheduler.development.js
sed -n '261,620p' packages/scheduler/cjs/scheduler.development.js
rg --files <react-reference>/packages/scheduler | rg "SchedulerMock|unstable_mock|scheduler-unstable_mock"
sed -n '1,260p' <react-reference>/packages/scheduler/src/forks/SchedulerMock.js
sed -n '261,620p' <react-reference>/packages/scheduler/src/forks/SchedulerMock.js
sed -n '621,900p' <react-reference>/packages/scheduler/src/forks/SchedulerMock.js
sed -n '1,220p' <react-reference>/packages/scheduler/src/SchedulerMinHeap.js
node tests/conformance/scripts/generate-scheduler-mock-oracle.mjs > <tmpfile>
node tests/conformance/scripts/generate-scheduler-mock-oracle.mjs > <tmpfile>
node --check packages/scheduler/cjs/scheduler-unstable_mock.development.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.production.js
node --check tests/smoke/import-entrypoints.mjs
node --check tests/conformance/src/scheduler-mock-oracle-generator.mjs
node --check tests/conformance/test/scheduler-mock-oracle.test.mjs
node tests/smoke/import-entrypoints.mjs
node tests/conformance/scripts/generate-scheduler-mock-oracle.mjs --write
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
npm run check:js
git status --short
git diff --stat
git diff --check
rg -n "<conflict-marker-pattern>" <scoped scheduler mock paths>
rg -n "[ \t]+$" <scoped scheduler mock paths>
rg -n "<local-or-temp-path-pattern>" tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json worker-progress/worker-120-scheduler-mock-source-implementation.md
```

Goal/tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after goal setup.
- Spawned two managed read-only nested agents.
- `get_goal` again before the completion audit.

## Verification

Completed and passing:

```sh
node --check packages/scheduler/cjs/scheduler-unstable_mock.development.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.production.js
node tests/conformance/scripts/generate-scheduler-mock-oracle.mjs --write
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
npm run check:js
git diff --check
rg -n "<conflict-marker-pattern>" <scoped scheduler mock paths>
rg -n "[ \t]+$" packages/scheduler/cjs/scheduler-unstable_mock.development.js packages/scheduler/cjs/scheduler-unstable_mock.production.js packages/scheduler/unstable_mock.js tests/smoke/import-entrypoints.mjs tests/conformance/src/scheduler-mock-*.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json worker-progress/worker-120-scheduler-mock-source-implementation.md
rg -n "<local-or-temp-path-pattern>" tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json worker-progress/worker-120-scheduler-mock-source-implementation.md
```

## Risks Or Blockers

- The mock implementation intentionally preserves React's surprising reset
  behavior: `reset()` does not clear task queues or host scheduling flags.
  This is required for the checked oracle edge case where reset-with-pending
  work leaves fresh equal-priority work non-flushable.
- Broad package compatibility remains unclaimed because local
  `packages/scheduler/package.json` still has workspace-specific metadata.
  The oracle records metadata but excludes it from behavior comparison.
- Upstream-style tests still need harness aliasing outside this public mock
  source slice.
- `.worker-logs/` is untracked and was present during status checks; it was not
  created, modified, staged, or removed by this task.

## Recommended Next Tasks

1. Keep package metadata cleanup as a separate package-identity task if broad
   `scheduler@0.27.0` package compatibility is desired.
2. Use this implemented mock as the scheduler alias for upcoming upstream-style
   React scheduler/test-renderer harness work.
3. Keep post-task, native scheduler, React lanes, root scheduling, and act
   integration on their own compatibility tracks.
