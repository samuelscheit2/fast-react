# worker-115-scheduler-mock-source-plan

## Objective

Produce a report-only source implementation plan for `scheduler/unstable_mock`,
including virtual time, deterministic flushing helpers, priority/log behavior,
integration with the root scheduler package, and conformance gates before
upstream-style React scheduler tests rely on it.

Write scope honored: this worker created only
`worker-progress/worker-115-scheduler-mock-source-plan.md`. No source code,
tests, package metadata, generated artifacts, or upstream oracle files were
modified.

Goal state recorded after startup with `get_goal`:

- Status: `active`
- Objective: Produce a report-only source implementation plan for
  `scheduler/unstable_mock`, including virtual time, deterministic flushing
  helpers, priority/log behavior, integration with the root scheduler package,
  and conformance gates before upstream-style React scheduler tests rely on it.
  Write only `worker-progress/worker-115-scheduler-mock-source-plan.md` and
  anchor the plan in merged workers 034, 038, 039, 045, 052, 068, 069, and
  103, with workers 081 and 111 treated as related reconciler-scheduler
  evidence only.

## Summary

The future `scheduler/unstable_mock` source implementation should be a
dedicated mock scheduler state machine, not a wrapper over the already
implemented root `scheduler` singleton. The root cause of the current gap is
missing mock-owned deterministic state: virtual time, yielded logs,
disable-yield controls, synchronous flush stop conditions, paint-yield state,
pending-work visibility, reset guards, and the exact upstream reset edge case.

Workers 034, 038, 039, 045, 052, 068, 069, and 103 collectively establish that
`scheduler@0.27.0` is the public package baseline, the root scheduler is a
separate implemented package surface, `scheduler/unstable_mock` is a public
physical subpath needed by upstream-style React tests, and post-task/native
entrypoints remain separate compatibility surfaces. Workers 081 and 111
reinforce the negative boundary: reconciler root scheduling, sync flushing,
act routing, lane selection, and DOM/test-renderer facades must not become
dependencies of the public scheduler mock.

## Current Local State

- `packages/scheduler/index.js` selects the implemented root CJS scheduler by
  `NODE_ENV`.
- `packages/scheduler/cjs/scheduler.development.js` and
  `packages/scheduler/cjs/scheduler.production.js` implement the public root
  `scheduler@0.27.0` behavior from worker 045.
- `packages/scheduler/unstable_mock.js` selects
  `cjs/scheduler-unstable_mock.production.js` or
  `cjs/scheduler-unstable_mock.development.js`.
- `packages/scheduler/cjs/scheduler-unstable_mock.development.js` still exposes
  structured placeholders for the mock API.
- `packages/scheduler/cjs/scheduler-unstable_mock.production.js` delegates to
  the development placeholder.
- `tests/smoke/import-entrypoints.mjs` treats root scheduler entries as
  implemented and mock, post-task, and native entries as placeholders.
- `tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json` records current
  Fast React mock status as one `known-mismatch` plus eight
  `unsupported-placeholder` comparisons per mode, for two known mismatches and
  sixteen unsupported placeholders overall. `compatibilityClaimed` remains
  false.

## Evidence Anchors

- Worker 034: established `scheduler@0.27.0` as the pinned public package
  baseline. The published package has no `exports`, no explicit `main`, no
  `type`, no runtime dependencies, and no engines. Physical files and deep CJS
  paths are therefore compatibility-sensitive.
- Worker 038: added the root scheduler oracle covering root exports, priority
  constants, timeout buckets, task object shape, binary heaps, cancellation
  tombstones, continuations, priority context, yielding, paint, frame rate, and
  Node host callback transport.
- Worker 039: added the variant/deep-import oracle and identified
  `scheduler/unstable_mock` as a first-milestone gate before upstream-style
  tests can rely on scheduler aliases.
- Worker 045: implemented public root scheduler behavior and intentionally left
  mock, post-task, native, React lanes, reconciler root scheduling, and React
  DOM integration unsupported.
- Worker 052: added the checked `scheduler/unstable_mock` oracle covering
  export shape, virtual time, logs, task shape, priority context, flush helpers,
  pending/delayed/expired/cancelled work, continuations, paint yielding, and
  reset behavior in development and production.
- Worker 068: documents `scheduler/unstable_post_task` as its own browser
  Task Scheduling API surface with controlled Node shim evidence only. The
  mock implementation must not claim or depend on this surface.
- Worker 069: documents native entrypoint fallback and `nativeRuntimeScheduler`
  delegation shape. The mock implementation must not depend on native runtime
  behavior.
- Worker 103: provides the direct implementation-plan root cause: the mock
  needs isolated virtual-time scheduler state while sharing only stateless
  primitives or duplicated algorithmic structure with root scheduler.
- Worker 081: related reconciler evidence only. Root scheduling owns root lists,
  lanes, Scheduler callback routing, sync flushing, continuations, and act
  queue routing. That layer should not use public mock scheduler state as its
  internal test harness.
- Worker 111: related reconciler evidence only. Sync flush and act integration
  belong to the shared reconciler scheduler layer; React DOM/test-renderer
  facades should call shared reconciler APIs, not inspect or depend on the
  public scheduler mock.

## Public API Contract

The implemented mock entrypoint must expose the observed `scheduler@0.27.0`
mock keys in this order:

```text
log
reset
unstable_IdlePriority
unstable_ImmediatePriority
unstable_LowPriority
unstable_NormalPriority
unstable_Profiling
unstable_UserBlockingPriority
unstable_advanceTime
unstable_cancelCallback
unstable_clearLog
unstable_flushAll
unstable_flushAllWithoutAsserting
unstable_flushExpired
unstable_flushNumberOfYields
unstable_flushUntilNextPaint
unstable_forceFrameRate
unstable_getCurrentPriorityLevel
unstable_hasPendingWork
unstable_next
unstable_now
unstable_requestPaint
unstable_runWithPriority
unstable_scheduleCallback
unstable_setDisableYieldValue
unstable_shouldYield
unstable_wrapCallback
```

The constants must match the root scheduler and oracle:

- `unstable_ImmediatePriority = 1`
- `unstable_UserBlockingPriority = 2`
- `unstable_NormalPriority = 3`
- `unstable_LowPriority = 4`
- `unstable_IdlePriority = 5`
- `unstable_Profiling = null`
- `unstable_NoPriority` is absent.

Task objects must keep the root scheduler shape and key order:

```text
id
callback
priorityLevel
startTime
expirationTime
sortIndex
```

Timeout buckets must match `scheduler@0.27.0`: Immediate `-1`,
UserBlocking `250`, Normal `5000`, Low `10000`, Idle `1073741823`.

## Source Implementation Plan

### Phase 1: Replace placeholder mock artifacts

Future source work should start with the shipped mock CJS files:

- `packages/scheduler/cjs/scheduler-unstable_mock.development.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.production.js`

Keep `packages/scheduler/unstable_mock.js` as the environment selector unless
an oracle shows selector behavior is wrong. Remove placeholder metadata and
placeholder throwers from the implemented mock files:

- `__FAST_REACT_PLACEHOLDER__`
- `__FAST_REACT_ENTRYPOINT__`
- `compatibilityTarget`
- `FastReactSchedulerUnimplementedError`

Because `scheduler@0.27.0` has no `exports` map, do not add helper files under
`packages/scheduler` during the first implementation. New files in that tree
would create additional physical deep-import surface. If source generation is
introduced later, put authored generation inputs outside the published package
surface and regenerate the shipped CJS files deterministically.

### Phase 2: Implement isolated mock state

Add module-local mock state inside each mock CJS artifact, or generate both
artifacts from the same non-shipped source later:

- `currentMockTime`, initially `0`, returned by `unstable_now`.
- `taskQueue` and `timerQueue` binary min-heaps ordered by `sortIndex`, then
  `id`.
- `taskIdCounter`, starting at `1`.
- `currentTask`, `currentPriorityLevel`, and `isPerformingWork`.
- `yieldedValues` log storage.
- `disableYieldValue`, controlled by `unstable_setDisableYieldValue`.
- flush-stop state for `unstable_flushNumberOfYields`.
- paint-yield state for `unstable_requestPaint` and
  `unstable_flushUntilNextPaint`.
- reset guard state so `reset()` throws exactly when called during a flush.

The mock must not import or call root scheduler mutable state. In particular,
do not share root `taskQueue`, `timerQueue`, `taskIdCounter`,
`currentPriorityLevel`, `currentTask`, host callback flags, `needsPaint`,
frame interval state, host timeout handles, or wall-clock `unstable_now`.

### Phase 3: Implement scheduling primitives

Implement the mock versions of root-compatible scheduling over virtual time:

- `unstable_scheduleCallback(priority, callback, options)` creates the same
  public task shape, computes virtual `startTime` and `expirationTime`, pushes
  ready work to `taskQueue`, and pushes delayed work to `timerQueue`.
- Ready tasks use `expirationTime` as `sortIndex`.
- Delayed tasks use `startTime` as `sortIndex` until
  `advanceTimers(currentMockTime)` promotes them.
- `unstable_cancelCallback(task)` mutates `task.callback = null` and leaves a
  tombstone for heap cleanup.
- Callback `didTimeout` is `task.expirationTime <= currentMockTime`.
- Callback-returned continuation functions are stored on the same task object.
  The continuation must run before lower-priority work and before later
  equal-priority tasks with larger IDs.

`unstable_advanceTime(ms)` advances only virtual time and should not execute
work. It must respect `disableYieldValue` according to the oracle: when
disabled, log calls and virtual time advancement are suppressed.

`unstable_hasPendingWork()` should advance due timers and clean tombstones
before answering. It must match the worker 052 reset-with-pending-work edge
case unless a future worker deliberately documents a breaking divergence.

### Phase 4: Implement priority and log behavior

Priority context should mirror the root scheduler:

- Default current priority is Normal.
- `unstable_runWithPriority(priority, fn)` coerces invalid priorities to Normal
  and restores previous priority in `finally`.
- `unstable_next(fn)` lowers Immediate, UserBlocking, and Normal contexts to
  Normal, while preserving Low and Idle.
- `unstable_wrapCallback(fn)` captures current priority and later forwards
  `this`, arguments, and return value while restoring the caller's priority.

Log helpers should be mock-owned:

- `log(value)` appends to `yieldedValues` unless disabled.
- `unstable_clearLog()` returns the current yielded array and clears it.
- Repeated `unstable_clearLog()` calls return an empty array.
- `unstable_setDisableYieldValue(true)` suppresses both yielded logs and
  virtual time advancement until set back to false.

### Phase 5: Implement deterministic flushing helpers

Implement the synchronous helpers as the primary upstream-test contract:

- `unstable_flushAll()` asserts that the log is empty before flushing, flushes
  all available work, and throws if callbacks yielded values. Empty flush
  returns `undefined`.
- `unstable_flushAllWithoutAsserting()` flushes all currently available work
  and returns `true` if work ran or `false` if no work ran.
- `unstable_flushExpired()` runs only tasks whose
  `expirationTime <= currentMockTime` and leaves non-expired work pending.
- `unstable_flushNumberOfYields(n)` stops after `n` yielded values. `0` runs no
  work. Continuations and later tasks remain pending.
- `unstable_flushUntilNextPaint()` runs until `unstable_requestPaint()` asks to
  yield, then leaves the paint-yielded continuation and later work pending.

Every flush path must restore `currentTask`, `currentPriorityLevel`, flush
flags, and `isPerformingWork` in `finally` so thrown callbacks do not corrupt
future tests.

### Phase 6: Preserve reset behavior deliberately

Implement:

- clean reset of virtual time, log state, disable-yield state, and scheduled
  handles when no flush is active;
- exact in-flush error text: `Cannot reset while already flushing work.`;
- reset-with-pending-work behavior from worker 052.

Worker 052 records a surprising boundary: after reset with pending mock work,
stale queue/handle behavior can make fresh equal-priority work non-flushable.
The compatibility-first source plan is to match it. Breaking from it is
allowed only as a deliberate compatibility break, with the oracle updated and
the worker report explaining why upstream-style tests should accept the
divergence.

## Integration With Root Scheduler Package

Safe sharing:

- priority constants;
- priority-to-timeout mapping;
- task object shape;
- binary heap compare/push/peek/pop algorithms;
- tombstone cancellation convention;
- continuation retention on the same task;
- priority context rules.

Unsafe sharing:

- root `unstable_now`, because root uses host wall-clock time;
- root host callback transport using `setImmediate`, `MessageChannel`, or
  `setTimeout`;
- root queues, task IDs, current task, current priority, paint state, frame
  interval, scheduled callback flags, timeout handles, and message-loop flags;
- any reconciler lanes, event priority, root scheduling, act queue, DOM events,
  native runtime, or post-task globals.

The root CJS implementation can be used as an algorithmic reference, but the
mock implementation must own its state and synchronous flush entrypoints. This
keeps public Scheduler package compatibility separate from React's lane-driven
root scheduler.

## Exact Future Files

Primary source files:

- `packages/scheduler/cjs/scheduler-unstable_mock.development.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.production.js`
- `packages/scheduler/unstable_mock.js` only if selector behavior needs
  adjustment, which is not expected from current evidence.

Smoke and package-entry checks:

- `tests/smoke/import-entrypoints.mjs`

Conformance comparison files:

- `tests/conformance/src/scheduler-mock-targets.mjs`
- `tests/conformance/src/scheduler-mock-scenarios.mjs`
- `tests/conformance/src/scheduler-mock-probe-runner.mjs`
- `tests/conformance/src/scheduler-mock-oracle-generator.mjs`
- `tests/conformance/src/scheduler-mock-oracle.mjs`
- `tests/conformance/scripts/generate-scheduler-mock-oracle.mjs`
- `tests/conformance/scripts/print-scheduler-mock-oracle.mjs`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json`

Possible package-identity follow-up, not part of the first behavior slice
unless assigned:

- `packages/scheduler/package.json`
- root lockfile if package metadata changes.

Progress report for the future implementation worker:

- `worker-progress/worker-<future-id>.md`

## Source-Level Tests To Add Or Promote

Update `tests/smoke/import-entrypoints.mjs` so the mock entrypoint and both
mock CJS files are treated as implemented rather than placeholders. The smoke
coverage should assert:

- key order and absence of placeholder metadata;
- constants and `unstable_Profiling`;
- no `unstable_NoPriority`;
- representative virtual time behavior;
- task shape and tombstone cancellation;
- a small `flushAllWithoutAsserting` ordering check;
- named CJS import interop for direct file imports.

Promote the conformance comparison in
`tests/conformance/test/scheduler-mock-oracle.test.mjs` so local Fast React
mock observations are exact matches instead of `known-mismatch` or
`unsupported-placeholder`. Keep root, post-task, native, reconciler, DOM, and
test-renderer claims outside this oracle.

## Oracle Regeneration And Verification Commands

Future implementation workers should run these exact checks before claiming
mock compatibility:

```sh
node --check packages/scheduler/cjs/scheduler-unstable_mock.development.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.production.js
node tests/smoke/import-entrypoints.mjs
node tests/conformance/scripts/generate-scheduler-mock-oracle.mjs --write
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
tmpfile=$(mktemp); node tests/conformance/scripts/generate-scheduler-mock-oracle.mjs > "$tmpfile"; cmp -s tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json "$tmpfile"; rc=$?; rm -f "$tmpfile"; exit $rc
npm test --workspace @fast-react/conformance
npm run check:js
rg -n "<local-or-temp-path-patterns>" tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json worker-progress/worker-<future-id>.md
rg -n "[ \t]+$" packages/scheduler/cjs/scheduler-unstable_mock.development.js packages/scheduler/cjs/scheduler-unstable_mock.production.js tests/smoke/import-entrypoints.mjs tests/conformance/src/scheduler-mock-*.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs worker-progress/worker-<future-id>.md
git diff --check -- packages/scheduler tests/smoke tests/conformance worker-progress/worker-<future-id>.md
git status --short
```

Related surfaces should keep their own gates:

- Root scheduler: `node --test tests/conformance/test/scheduler-root-oracle.test.mjs`
  and root oracle byte-compare when root behavior changes.
- Variant/deep import: `node --test tests/conformance/test/scheduler-variant-oracle.test.mjs`
  and variant oracle regeneration if package physical surface changes.
- Post-task: `node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs`
  if post-task files are touched.
- Native: `node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
  if native files are touched.

## Gates Before Upstream-Style Tests Rely On Mock

1. Export gate: `scheduler/unstable_mock` and direct mock CJS imports match
   key order, descriptors, constants, function names/lengths, and absence of
   `unstable_NoPriority`.
2. Placeholder-removal gate: implemented mock files expose no Fast React
   placeholder metadata or unimplemented scheduler errors.
3. Virtual-time gate: `unstable_now`, `unstable_advanceTime`, and
   `unstable_setDisableYieldValue` match worker 052 in development and
   production.
4. Queue gate: task shape, timeout buckets, delayed timer promotion, heap
   ordering, FIFO tie-breaks, cancellation tombstones, and `didTimeout` match.
5. Priority gate: `runWithPriority`, `next`, `wrapCallback`, invalid priority
   coercion, default priority, and restoration after throws match.
6. Log gate: `log`, `unstable_clearLog`, disabled yields, and yielded-value
   assertions match.
7. Flush gate: all flush helper return values, stop conditions, assertion
   errors, pending-work states, and `flushNumberOfYields(0)` match.
8. Continuation and paint gate: returned continuations stay on the same task
   and paint yielding leaves the right work pending.
9. Reset gate: clean reset, in-flush reset error, and reset-with-pending-work
   behavior match or are documented as a breaking divergence.
10. Isolation gate: mock behavior is unaffected by root scheduler host
    callbacks, real timers, root queued work, native runtime globals,
    post-task globals, DOM events, React lanes, reconciler act queues, or test
    renderer internals.
11. Oracle gate: regenerated mock oracle byte-compares cleanly and reports
    exact-match Fast React comparisons for both development and production.
12. Package gate: physical `scheduler/unstable_mock.js` and
    `scheduler/cjs/scheduler-unstable_mock.*.js` remain importable because
    package behavior has no `exports` map.

## Risks And Breaking-Change Decisions

- The reset-with-pending-work behavior is surprising. Matching it is the
  safest path for upstream React-style tests. Breaking it must be explicit and
  oracle-backed.
- Adding helper files under `packages/scheduler` changes physical deep-import
  surface. Avoid that unless the variant oracle is updated and the break is
  intentional.
- Package metadata differs from the published scheduler package because the
  local workspace package is private and has engines/scripts/description. Do
  not mix metadata cleanup with mock behavior unless assigned.
- Production currently delegates to development placeholder. A future worker
  may either duplicate implementation or use deterministic generation, but the
  shipped production artifact must not expose development-only placeholder
  behavior.
- Root Scheduler public priorities are not React lanes. Do not use mock
  Scheduler priority as a substitute for reconciler event priority or SyncLane.
- Upstream-style React tests still need harness aliasing and test-environment
  adaptation after the mock is green. Mock compatibility is necessary but not
  sufficient for the whole upstream test suite.

## Delegated Checks

Three managed read-only nested agents were used:

- Explorer 019e0ef8-3fb3-7db2-b37b-31a6ebf645b4 inspected workers 034, 038,
  039, 052, 068, and 069 plus scheduler oracle artifacts. It confirmed the
  pinned package baseline, oracle file names, regeneration commands, root/mock
  behavior boundaries, post-task/native separations, and current mock mismatch
  posture.
- Explorer 019e0ef8-483a-7503-a4df-4c2753f979a6 inspected
  `packages/scheduler`, smoke tests, and worker 045. It confirmed root
  scheduler is implemented, mock CJS files are still placeholders, smoke tests
  model the split, and future mock source should integrate through isolated
  state rather than root scheduler wrapping.
- Explorer 019e0ef8-51e7-7231-a6f4-a589212031d5 inspected workers 081, 103,
  and sibling worker 111 evidence. It confirmed 081/111 are useful negative
  boundary evidence only and that public `scheduler/unstable_mock` must not
  depend on unmerged reconciler internals.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,280p' MASTER_PROGRESS.md
rg --files worker-progress | rg 'worker-(034|038|039|045|052|068|069|081|103|111)'
rg --files packages/scheduler tests/smoke tests/conformance | rg 'scheduler|package.json'
git status --short
sed -n '1,260p' worker-progress/worker-034-scheduler-package-inventory.md
sed -n '1,260p' worker-progress/worker-038-scheduler-root-oracle.md
sed -n '1,280p' worker-progress/worker-039-scheduler-variant-oracles.md
sed -n '1,320p' worker-progress/worker-045-scheduler-root-implementation.md
sed -n '1,360p' worker-progress/worker-052-scheduler-mock-oracle.md
sed -n '1,280p' worker-progress/worker-068-scheduler-post-task-oracle.md
sed -n '1,320p' worker-progress/worker-069-scheduler-native-entry-oracle.md
sed -n '1,420p' worker-progress/worker-103-scheduler-mock-implementation-plan.md
sed -n '421,760p' worker-progress/worker-103-scheduler-mock-implementation-plan.md
sed -n '1,420p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '1,420p' worker-progress/worker-111-reconciler-sync-flush-act-plan.md
cat packages/scheduler/package.json
sed -n '1,180p' packages/scheduler/unstable_mock.js
sed -n '1,320p' packages/scheduler/cjs/scheduler-unstable_mock.development.js
sed -n '1,200p' packages/scheduler/cjs/scheduler-unstable_mock.production.js
sed -n '1,260p' packages/scheduler/cjs/scheduler.development.js
sed -n '261,620p' packages/scheduler/cjs/scheduler.development.js
sed -n '491,630p' tests/smoke/import-entrypoints.mjs
sed -n '620,910p' tests/smoke/import-entrypoints.mjs
sed -n '1730,1845p' tests/smoke/import-entrypoints.mjs
sed -n '2380,2750p' tests/smoke/import-entrypoints.mjs
sed -n '1,240p' tests/conformance/src/scheduler-mock-targets.mjs
sed -n '1,360p' tests/conformance/src/scheduler-mock-scenarios.mjs
sed -n '1,420p' tests/conformance/src/scheduler-mock-probe-runner.mjs
sed -n '421,980p' tests/conformance/src/scheduler-mock-probe-runner.mjs
sed -n '1,260p' tests/conformance/src/scheduler-mock-oracle.mjs
node tests/conformance/scripts/print-scheduler-mock-oracle.mjs --format=markdown
node - <<'NODE' ... scheduler mock oracle shape inspection ... NODE
test -f worker-progress/worker-115-scheduler-mock-source-plan.md && sed -n '1,220p' worker-progress/worker-115-scheduler-mock-source-plan.md || true
sed -n '1,260p' worker-progress/worker-115-scheduler-mock-source-plan.md
sed -n '261,620p' worker-progress/worker-115-scheduler-mock-source-plan.md
sed -n '621,760p' worker-progress/worker-115-scheduler-mock-source-plan.md
rg -n "[ \t]+$" worker-progress/worker-115-scheduler-mock-source-plan.md
git diff --check -- worker-progress/worker-115-scheduler-mock-source-plan.md
git status --short
wc -l worker-progress/worker-115-scheduler-mock-source-plan.md
```

Notes:

- Reading `worker-progress/worker-111-reconciler-sync-flush-act-plan.md` in
  this worktree failed because the file is not present on this branch. Worker
  111 evidence remains useful boundary evidence after merge.
- An initial ad hoc oracle-inspection script used the wrong nested JSON path
  and failed after printing the top-level conformance claims and comparison
  counts. A follow-up shape inspection confirmed the nested result structure.

Goal/tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after goal setup.
- Spawned three managed read-only explorer agents.

## Verification Performed

- Confirmed `worker-progress/worker-115-scheduler-mock-source-plan.md` did not
  exist before writing.
- Confirmed `packages/scheduler` current mock files are placeholders and root
  CJS files are implemented.
- Confirmed the checked mock oracle currently keeps Fast React compatibility
  false and reports placeholder comparison status.
- Confirmed worker 111 evidence is related boundary evidence only.
- Post-write scoped trailing-whitespace check returned no matches.
- `git diff --check -- worker-progress/worker-115-scheduler-mock-source-plan.md`
  passed.
- Final `git status --short` showed only
  `?? worker-progress/worker-115-scheduler-mock-source-plan.md`.
- Final completion audit below maps every explicit prompt requirement to this
  artifact.

No source or behavior tests were run for this report-only task because no
source code was changed.

## Completion Audit

Success criteria from the prompt and evidence:

- Report-only plan for `scheduler/unstable_mock`: satisfied by this file.
- Write only `worker-progress/worker-115-scheduler-mock-source-plan.md`:
  satisfied by the scoped patch and final status check.
- Include virtual time: satisfied by "Phase 2" and "Phase 3".
- Include deterministic flushing helpers: satisfied by "Phase 5".
- Include priority/log behavior: satisfied by "Phase 4".
- Include integration with the root scheduler package: satisfied by
  "Integration With Root Scheduler Package".
- Include conformance gates before upstream-style React scheduler tests rely on
  it: satisfied by "Gates Before Upstream-Style Tests Rely On Mock".
- Anchor in merged workers 034, 038, 039, 045, 052, 068, 069, and 103:
  satisfied by "Evidence Anchors" and the commands reading those reports.
- Treat workers 081 and 111 as related reconciler-scheduler evidence, without
  making public scheduler mock depend on unmerged reconciler internals:
  satisfied by "Evidence Anchors", "Integration With Root Scheduler Package",
  and "Gates".
- Keep the slice below React root scheduling, act integration, DOM events, and
  native bindings except where API boundaries must be documented: satisfied by
  negative boundaries in "Evidence Anchors", "Integration", and "Risks".
- Specify exact future source files: satisfied by "Exact Future Files".
- Specify tests: satisfied by "Source-Level Tests To Add Or Promote" and
  "Oracle Regeneration And Verification Commands".
- Specify oracle regeneration steps: satisfied by "Oracle Regeneration And
  Verification Commands".
- Specify package entrypoint checks: satisfied by smoke-test and package-gate
  sections.
- Specify risks and completion gates: satisfied by "Risks" and "Gates".
- Summarize delegated checks: satisfied by "Delegated Checks".
- Review quality, maintainability, performance, and security: satisfied below.
- Include handoff requirements: satisfied by "Summary", "Exact Future Files",
  "Commands Run", "Evidence Anchors", "Risks", and "Recommended Next Tasks".

No uncovered prompt requirement remains for this report-only task.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan is rooted in checked scheduler oracle evidence and current local
  package state rather than assuming root scheduler behavior proves mock
  behavior.
- It identifies missing isolated virtual-time state as the root cause.

Maintainability:

- It keeps public scheduler root, mock, post-task, native, reconciler lanes,
  act, DOM, and test-renderer responsibilities separate.
- It avoids adding package-surface helper files unless deliberately covered by
  variant oracle updates.

Performance:

- The future implementation keeps binary heap scheduling and tombstone
  cancellation, avoiding linear queue scans for normal scheduling.
- Mock flushing remains synchronous and virtual-time driven, avoiding host timer
  flake in upstream-style tests.

Security:

- The plan adds no native binding, dynamic code execution, or browser-global
  dependency.
- It requires `finally` restoration around priority and flush state so thrown
  callbacks cannot corrupt shared module state across tests.

## Changed Files

- `worker-progress/worker-115-scheduler-mock-source-plan.md`

## Risks Or Blockers

- `scheduler/unstable_mock` remains unimplemented after this report-only task.
- Reset-with-pending-work behavior is odd and should not be "cleaned up"
  accidentally.
- Package metadata cleanup is separate from mock behavior and may require a
  deliberate breaking package-identity task.
- Upstream React tests still need aliasing/harness work even after mock
  behavior passes its oracle.

## Recommended Next Tasks

1. Implement `scheduler/unstable_mock` in the two mock CJS artifacts against
   worker 052's checked oracle and worker 103's isolation plan.
2. Promote Fast React mock oracle comparisons to exact matches in development
   and production.
3. Update smoke tests so mock entrypoints are treated as implemented while
   post-task and native remain placeholders.
4. Run the mock oracle regeneration and byte-compare gate before admitting
   upstream-style scheduler tests.
5. Keep reconciler root scheduler, sync flush, act integration, DOM events, and
   native scheduler entrypoints in their own implementation tracks.
