# worker-045-scheduler-root-implementation

## Objective

Implement public `scheduler@0.27.0` root package behavior against the checked
scheduler root oracle, replacing the root placeholder operations while keeping
variant, mock, post-task, native runtime delegation, React lanes, reconciler
root scheduling, and React DOM integration out of scope.

## Progress

- Started from `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Inspected the resumed worktree status before editing. Existing scoped partial
  changes were limited to `packages/scheduler/cjs/scheduler.development.js`,
  `packages/scheduler/cjs/scheduler.production.js`, and
  `tests/smoke/import-entrypoints.mjs`.
- Preserved the valid partial root scheduler implementation and verified it
  against the checked root oracle scenarios.
- Updated smoke coverage so public root scheduler entrypoints are asserted as
  implemented behavior, while `scheduler/unstable_mock`,
  `scheduler/unstable_post_task`, native entrypoints, and their CJS files remain
  explicit placeholders.
- Used a nested verification agent to independently test the hypothesis that
  local root behavior matches the checked oracle and that the smoke scheduler
  section no longer treats implemented root files as placeholders.

## Implementation

- `packages/scheduler/cjs/scheduler.development.js` now implements the public
  root scheduler behavior with the same observable model as `scheduler@0.27.0`:
  public priority constants, `unstable_Profiling = null`, `performance.now`
  fallback, binary min-heaps for ready and delayed work, cancellation
  tombstones, continuation callbacks, `didTimeout`, priority context APIs,
  `requestPaint`, `forceFrameRate`, `shouldYield`, and Node host transport
  preference for `setImmediate`.
- `packages/scheduler/cjs/scheduler.production.js` now carries the production
  root implementation directly instead of delegating to the development
  placeholder.
- `packages/scheduler/index.js` already selected development or production CJS
  root files by `NODE_ENV`; no package entry wiring changes were needed.
- `tests/smoke/import-entrypoints.mjs` now separates implemented root keys from
  placeholder root-shaped keys, asserts no placeholder metadata on implemented
  root files, and checks representative root behavior for priority context,
  wrapped callbacks, task object shape, ready/delayed sort indexes, and
  cancellation tombstones in both direct-file and installed-package probes.

## Unsupported Surfaces

- `scheduler/unstable_mock` remains a placeholder and is intentionally left for
  worker 052.
- `scheduler/unstable_post_task` remains a placeholder and is intentionally left
  for worker 068.
- Native entrypoints and native runtime delegation remain placeholders and are
  intentionally left for worker 069 or a later implementation slice.
- React lanes, reconciler root scheduling, and React DOM integration remain out
  of scope; this worker only implements the public Scheduler package root API.

## Verification

- `node --check tests/smoke/import-entrypoints.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- Local scheduler root probe loop for all checked scheduler-root scenarios in
  development and production mode passed.
- Exact normalized local-vs-oracle comparison passed for every checked
  scheduler-root scenario in development and production mode, after normalizing
  only the probe target package string.

Additional final verification is still being run:

- `npm run check:js`
- scoped whitespace/path/conflict checks over changed files

## Quality Review

- Maintainability: the root implementation intentionally mirrors the checked
  upstream public scheduler algorithm instead of adding a facade around
  placeholder operations. Smoke tests distinguish implemented and placeholder
  scheduler surfaces so future mock/post-task/native work can land separately.
- Performance: task selection uses binary heaps and tombstone cancellation as in
  the oracle baseline, avoiding linear queue scans for the normal work path.
- Security: no dynamic code execution, subprocess loading, or native delegation
  was added. Host scheduling uses existing global timer/message APIs only.
- Compatibility: public Scheduler priorities remain separate from Fast React
  internal lane/event priorities.

## Risks And Follow-Ups

- The implementation is copied at the CJS artifact level to match the checked
  public oracle. Future source-level scheduler maintenance should decide whether
  to keep this vendored shape or introduce a shared authored source that
  regenerates development and production artifacts deterministically.
- Smoke tests now cover representative behavior, but the exact local-vs-oracle
  comparison currently runs as a worker verification command rather than a
  committed conformance comparison, because this worker must not modify
  `tests/conformance/**`.
- Mock, post-task, and native scheduler compatibility remain intentionally
  unsupported until their owning workers implement those surfaces.
