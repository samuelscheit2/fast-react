# Worker 758: Scheduler postTask Yield Act Consumer

## Goal Evidence

- Initial `get_goal` status: `active`.
- Objective: add a narrow private React act/Scheduler diagnostic bridge for
  Worker 751's `scheduler.yield`-available postTask handoff evidence without
  public Scheduler timing, public React act, root scheduling, renderer/effects,
  browser timing, or package compatibility admission.
- No nested managed agents were spawned.

## Summary

- Added a private React act dispatcher gate consumer for the frozen Worker 751
  `scheduler/unstable_post_task` priority diagnostic snapshot when the
  controlled shim selects `scheduler.yield`.
- The consumer accepts only the current private yield handoff shape:
  private postTask diagnostics export/symbol/version, low-priority delayed
  callback metadata, `scheduler.yield` fallback classification, accepted private
  act/root handoff metadata, and the two expected root work metadata records.
- The bridge report is diagnostic-only. It records that the shimmed
  `yield.then` continuation already ran, keeps stale root continuation evidence
  rejected, and keeps public Scheduler timing, browser postTask ordering,
  public React act, root scheduling, renderer/effects, and package
  compatibility claims false.
- Added React act conformance coverage for accepted consumption and fail-closed
  rejection of missing private shape/version, missing handoff brand, stale
  continuation identity, public/browser/React/root/renderer execution claims,
  ambiguous postTask reports, and non-yield postTask fallback reports.
- Tightened the audit follow-up gap by requiring the nested Worker 751 evidence
  records that Scheduler recursively freezes to remain frozen at the React
  bridge boundary, including priority metadata, delay metadata, callback run
  arrays, continuation metadata, private root execution metadata, act queue
  handoff metadata, and root work record arrays/items.
- Added mutable nested evidence rejection coverage using clones with exactly one
  Scheduler-frozen nested record left mutable.
- Tightened the second audit follow-up gap by requiring the nested
  `actRootWorkHandoff.priorityTimeout` record to be frozen and to match the
  accepted top-level Scheduler timeout evidence before the bridge can report
  timeout metadata.
- Added per-callback-run validation for the frozen `callbackRuns` array so each
  callback run record must be frozen and match the current Worker 751 yield-path
  callback sequence, delay, priority timeout, signal, and fallback metadata.
- Tightened the final audit follow-up gap by requiring
  `actRootWorkHandoff.actQueueHandoff.priorityTimeout` and each
  `actRootWorkHandoff.rootWorkRecords[].priorityTimeout` to be frozen and to
  match the accepted top-level and handoff timeout evidence.
- Added `packageCompatibilityClaimed` to the recursive blocked true-claim list
  so package compatibility claims reject like the existing public/browser/root
  and renderer claims.
- Updated the React DOM test-utils private routing assertion in the same
  conformance file to include the current sync-flush evidence IDs that the gate
  already reports.

## Changed Files

- `packages/react/private-act-dispatcher-gate.js`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `worker-progress/worker-758-scheduler-posttask-yield-act-consumer.md`

## Commands Run

- `pwd && git status --short --branch` - passed; confirmed assigned worktree and
  branch.
- `sed` inspections of `WORKER_BRIEF.md`, `MASTER_PLAN.md`, Worker 751 handoff,
  React private act gate, React act oracle test, scheduler postTask root
  continuation test, scheduler postTask oracle test, and related source helpers
  - passed.
- `node --check packages/react/private-act-dispatcher-gate.js` - passed.
- `node --check tests/conformance/test/react-act-oracle.test.mjs` - passed.
- `node --test tests/conformance/test/react-act-oracle.test.mjs --test-name-pattern "postTask|yield|Scheduler"` - passed, 16 tests.
- `node --test tests/conformance/test/react-act-oracle.test.mjs` - passed,
  16 tests.
- `node --test tests/conformance/test/scheduler-post-task-root-continuation.test.mjs` - passed, 4 tests.
- `node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs` -
  passed, 18 tests.
- `npm run check --workspace @fast-react/react` - passed; npm emitted the
  existing `minimum-release-age` warning.
- `npm run check --workspace scheduler` - passed; npm emitted the existing
  `minimum-release-age` warning.
- `npm run check:package-surface` - passed.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

Final audit follow-up rerun:

- `node --check packages/react/private-act-dispatcher-gate.js` - passed.
- `node --check tests/conformance/test/react-act-oracle.test.mjs` - passed.
- `node --test tests/conformance/test/react-act-oracle.test.mjs --test-name-pattern "postTask|yield|Scheduler"` - passed, 16 tests.
- `node --test tests/conformance/test/react-act-oracle.test.mjs` - passed,
  16 tests.
- `node --test tests/conformance/test/scheduler-post-task-root-continuation.test.mjs` - passed, 4 tests.
- `node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs` -
  passed, 18 tests.
- `npm run check --workspace @fast-react/react` - passed; npm emitted the
  existing `minimum-release-age` warning.
- `npm run check --workspace scheduler` - passed; npm emitted the existing
  `minimum-release-age` warning.
- `npm run check:package-surface` - passed.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

Audit follow-up rerun:

- `node --check packages/react/private-act-dispatcher-gate.js` - passed.
- `node --check tests/conformance/test/react-act-oracle.test.mjs` - passed.
- `node --test tests/conformance/test/react-act-oracle.test.mjs --test-name-pattern "postTask|yield|Scheduler"` - passed, 16 tests.
- `node --test tests/conformance/test/react-act-oracle.test.mjs` - passed,
  16 tests.
- `node --test tests/conformance/test/scheduler-post-task-root-continuation.test.mjs` - passed, 4 tests.
- `node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs` -
  passed, 18 tests.
- `npm run check --workspace @fast-react/react` - passed; npm emitted the
  existing `minimum-release-age` warning.
- `npm run check --workspace scheduler` - passed; npm emitted the existing
  `minimum-release-age` warning.
- `npm run check:package-surface` - passed.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

Second audit follow-up rerun:

- `node --check packages/react/private-act-dispatcher-gate.js` - passed.
- `node --check tests/conformance/test/react-act-oracle.test.mjs` - passed.
- `node --test tests/conformance/test/react-act-oracle.test.mjs --test-name-pattern "postTask|yield|Scheduler"` - passed, 16 tests.
- `node --test tests/conformance/test/react-act-oracle.test.mjs` - passed,
  16 tests.
- `node --test tests/conformance/test/scheduler-post-task-root-continuation.test.mjs` - passed, 4 tests.
- `node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs` -
  passed, 18 tests.
- `npm run check --workspace @fast-react/react` - passed; npm emitted the
  existing `minimum-release-age` warning.
- `npm run check --workspace scheduler` - passed; npm emitted the existing
  `minimum-release-age` warning.
- `npm run check:package-surface` - passed.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Evidence Gathered

- Worker 751's yield path source diagnostics are frozen private snapshots from
  `__FAST_REACT_PRIVATE_POST_TASK_PRIORITY_DIAGNOSTICS__` with symbol
  description `fast-react.scheduler.unstable_post_task.priority-diagnostics`.
- The Scheduler snapshot recursively freezes the nested evidence now required
  by the React bridge: `priorityMapping`, `priorityTimeout`, `schedule.delay`,
  `callbackRuns`, `continuationMetadata`,
  `privateRootContinuationExecution`, `actQueueHandoff`, `rootWorkRecords`, and
  each root work record.
- The nested handoff timeout is a distinct frozen object from the top-level
  timeout snapshot; the React bridge now requires it to match the accepted
  top-level timeout fields before reporting `timeoutMs` or `timeoutReason`.
- The act queue handoff timeout and each root work record timeout are also
  distinct frozen objects that match the accepted timeout fields; the React
  bridge now rejects mutable or tampered copies before consuming handoff
  metadata.
- The controlled yield handoff diagnostics include two frozen callback run
  records: the first records the scheduled continuation fallback, and the
  second records completion without a continuation after `yield.then` has
  already invoked the continuation.
- In the controlled shim, `scheduler.yield(...).then(...)` runs the continuation
  during the same controlled flush, so the source diagnostics have one scheduled
  continuation and two callback runs.
- The existing root-continuation adapter rejects that yield row as
  `stale-continuation`; the new React bridge preserves that as
  diagnostic-only evidence and does not admit root execution.
- The accepted bridge report keeps all public/browser/renderer/root/effects
  compatibility and execution flags false and does not add any public React or
  Scheduler exports/subpaths.

## Risks Or Blockers

- This remains controlled-shim private evidence only. It does not prove real
  browser Task Scheduling API ordering, raw timing, public Scheduler timing,
  public React act draining, public root scheduling, renderer work, effects, or
  package compatibility.
- The private consumer is intentionally narrow and will reject future postTask
  diagnostic shape changes until a follow-up worker updates the React-side gate.

## Recommended Next Tasks

- Keep public Scheduler postTask/browser compatibility blocked until a real
  browser harness proves Task Scheduling API ordering and timing.
- If the postTask diagnostics shape changes, update this React bridge together
  with the scheduler postTask root-continuation tests so stale continuation
  semantics stay explicit.
