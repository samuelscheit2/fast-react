# worker-103-scheduler-mock-implementation-plan

## Objective

Produce a report-only implementation plan for `scheduler/unstable_mock`
compatibility, including virtual time, deterministic flushing helpers,
priority/log behavior, integration boundaries with the root scheduler package,
and the conformance gates needed before upstream-style React scheduler tests can
rely on it.

Write scope honored: only this report file was created. Source, package,
conformance, smoke, and task-planning files were not modified.

Goal state recorded after startup with `get_goal`:

- Status: `active`
- Objective: Produce a report-only implementation plan for
  `scheduler/unstable_mock` compatibility, including virtual time,
  deterministic flushing helpers, priority/log behavior, integration boundaries
  with the root scheduler package, and the conformance gates needed before
  upstream-style React scheduler tests can rely on it.

## Summary

`scheduler/unstable_mock` should be implemented as a separate module-level mock
scheduler state machine, not as a wrapper around the already implemented root
`scheduler` singleton. The current gap is not a collection of placeholder
functions; it is the absence of deterministic mock-owned virtual time, yielded
logs, explicit flush-stop state, paint yielding, pending-work visibility, and
reset behavior.

The root scheduler and mock scheduler share algorithms, but not mutable state.
Safe sharing is limited to stateless primitives such as priority constants,
timeout mapping, binary heap ordering, task object shape, cancellation
tombstones, continuation retention, and priority-context rules. Root queues,
host callback transport, real time, root current priority, root paint flags,
and mock logs must stay isolated.

The compatibility target remains `scheduler@0.27.0`, established by prior
scheduler reports. Current Fast React root scheduler behavior is implemented,
but the mock entrypoint still exposes structured placeholders. Worker 052's
checked oracle records current local mock status as `2` export-shape known
mismatches and `16` unsupported-placeholder behavior comparisons. Upstream-style
React tests that alias `scheduler` to `scheduler/unstable_mock` should not rely
on Fast React until those comparisons are promoted to exact behavior matches or
an intentional divergence is documented.

## Current Local State

- `packages/scheduler/index.js` selects the implemented root scheduler CJS file
  by `NODE_ENV`.
- `packages/scheduler/cjs/scheduler.development.js` and
  `packages/scheduler/cjs/scheduler.production.js` implement public root
  `scheduler@0.27.0` behavior with host time, host callbacks, binary heaps,
  cancellation tombstones, continuations, priority context, request-paint, and
  force-frame-rate behavior.
- `packages/scheduler/unstable_mock.js` selects
  `cjs/scheduler-unstable_mock.production.js` or
  `cjs/scheduler-unstable_mock.development.js`.
- `packages/scheduler/cjs/scheduler-unstable_mock.development.js` currently
  exports the mock surface as structured placeholders.
- `packages/scheduler/cjs/scheduler-unstable_mock.production.js` currently
  delegates to the development placeholder.
- `tests/smoke/import-entrypoints.mjs` currently treats mock entrypoints and
  mock CJS files as placeholders.
- `tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json` records the
  official mock behavior in development and production modes.

## Required Public API

The mock entrypoint must expose these enumerable public keys in the observed
`scheduler@0.27.0` order:

- `log`
- `reset`
- `unstable_IdlePriority`
- `unstable_ImmediatePriority`
- `unstable_LowPriority`
- `unstable_NormalPriority`
- `unstable_Profiling`
- `unstable_UserBlockingPriority`
- `unstable_advanceTime`
- `unstable_cancelCallback`
- `unstable_clearLog`
- `unstable_flushAll`
- `unstable_flushAllWithoutAsserting`
- `unstable_flushExpired`
- `unstable_flushNumberOfYields`
- `unstable_flushUntilNextPaint`
- `unstable_forceFrameRate`
- `unstable_getCurrentPriorityLevel`
- `unstable_hasPendingWork`
- `unstable_next`
- `unstable_now`
- `unstable_requestPaint`
- `unstable_runWithPriority`
- `unstable_scheduleCallback`
- `unstable_setDisableYieldValue`
- `unstable_shouldYield`
- `unstable_wrapCallback`

Constants and absence rules:

- `unstable_ImmediatePriority = 1`
- `unstable_UserBlockingPriority = 2`
- `unstable_NormalPriority = 3`
- `unstable_LowPriority = 4`
- `unstable_IdlePriority = 5`
- `unstable_Profiling = null`
- `unstable_NoPriority` is absent.

Task objects must keep the public root scheduler shape and key order: `id`,
`callback`, `priorityLevel`, `startTime`, `expirationTime`, and `sortIndex`.
Ready tasks use `expirationTime` as `sortIndex`; delayed tasks use `startTime`
until virtual time makes them ready. `unstable_cancelCallback(task)` must set
`task.callback = null` and leave the tombstone for later heap cleanup.

Priority timeout buckets must match `scheduler@0.27.0`:

- Immediate: `-1ms`
- UserBlocking: `250ms`
- Normal/default: `5000ms`
- Low: `10000ms`
- Idle: `1073741823ms`

Priority context APIs should match root behavior:

- Default current priority is Normal.
- `unstable_runWithPriority(priority, fn)` coerces invalid priorities to Normal
  and restores the previous priority in `finally`.
- `unstable_next(fn)` lowers Immediate, UserBlocking, and Normal to Normal, but
  preserves Low and Idle.
- `unstable_wrapCallback(fn)` captures current priority and later calls `fn`
  with the original `this` and arguments while restoring the caller's priority.

## Virtual Time And Mock State

The mock module needs its own module-local state:

- `currentMockTime`, initially `0`, returned by `unstable_now`.
- `taskQueue` and `timerQueue`, both binary min-heaps ordered by `sortIndex`,
  then task `id`.
- `taskIdCounter`, starting at `1`.
- `currentTask`, `currentPriorityLevel`, and `isPerformingWork`.
- yielded-values log storage for `log` and `unstable_clearLog`.
- `disableYieldValue`, controlled by `unstable_setDisableYieldValue`.
- flush-stop state for `unstable_flushNumberOfYields`.
- paint-request state for `unstable_requestPaint` and
  `unstable_flushUntilNextPaint`.
- reset guards and any scheduled-handle bookkeeping needed to match the oracle.

`unstable_advanceTime(ms)` advances `currentMockTime` only when
`disableYieldValue` is false. It should make delayed tasks visible by allowing
`advanceTimers(currentMockTime)` to move due timers from `timerQueue` to
`taskQueue`, but it must not execute callbacks by itself.

`log(value)` appends to the yielded log unless `disableYieldValue` is true.
`unstable_clearLog()` returns the current yielded array and clears it; repeated
calls return `[]`.

`unstable_hasPendingWork()` must reflect flushable mock work after due-timer
advancement and tombstone cleanup. Worker 052 records a surprising upstream
boundary: after `reset()` with pending work, fresh equal-priority work can
remain non-flushable because upstream clears scheduled handles rather than
fully replacing every stale heap interaction. The lowest-risk plan is to match
this behavior. If a future worker chooses to break from it, the oracle and
worker report must document why.

## Deterministic Flush Behavior

The deterministic helpers are the main reason upstream React tests need this
subpackage:

- `unstable_flushAll()` asserts that the log is empty before flushing, flushes
  all available work, and then throws if any callback yielded a value. Empty
  flush returns `undefined`.
- `unstable_flushAllWithoutAsserting()` flushes all currently available work and
  returns `true` if work ran or `false` if no work ran.
- `unstable_flushExpired()` runs only tasks whose
  `expirationTime <= currentMockTime`, leaving non-expired work pending.
- `unstable_flushNumberOfYields(n)` stops after `n` yielded values. Passing `0`
  runs no work. Continuations and later tasks must remain pending.
- `unstable_flushUntilNextPaint()` runs until a paint request and leaves the
  paint-yielded continuation plus later work pending.

Callbacks receive `didTimeout` from virtual expiration:

- Immediate work normally receives `true` because its timeout is `-1`.
- UserBlocking work receives `true` after mock time advances past `250ms`.
- Normal work at `251ms` still receives `false`.

If a callback returns a function, store the returned function back on the same
task. That continuation must run before lower-priority work and before later
equal-priority tasks with larger ids.

`reset()` must clear normal mock state when not flushing and must throw exactly
`Cannot reset while already flushing work.` when called during a flush.

## Integration Boundaries

Keep mock state isolated from root `scheduler`:

- Do not import `packages/scheduler/cjs/scheduler.development.js` or
  `packages/scheduler/cjs/scheduler.production.js` from mock CJS files.
- Do not call root `unstable_scheduleCallback`, root `unstable_now`, root
  `unstable_shouldYield`, or root host timeout scheduling.
- Do not share root `taskQueue`, `timerQueue`, `taskIdCounter`,
  `currentPriorityLevel`, `currentTask`, host callback flags, or paint flags.
- Keep `scheduler/unstable_mock.js` as the environment selector for
  `cjs/scheduler-unstable_mock.development.js` and
  `cjs/scheduler-unstable_mock.production.js`.

Safe sharing or factoring:

- priority constants and `unstable_Profiling = null`;
- priority-to-timeout mapping;
- binary heap `push`, `peek`, `pop`, and `compare`;
- `advanceTimers` only if it receives explicit queues and current time;
- task object construction only if it receives explicit state inputs;
- priority context helpers only if they operate on an explicit mock state
  object.

Unsafe sharing:

- root `unstable_now`, because it uses wall-clock `performance.now()` or
  `Date.now() - initialTime`;
- root host callback transport using `setImmediate`, `MessageChannel`, or
  `setTimeout`;
- root `shouldYieldToHost`, `frameInterval`, and `startTime`;
- root mutable queues, task id counter, current priority, current task, and
  host scheduling flags;
- mock `yieldedValues`, `disableYieldValue`, `currentMockTime`, flush-stop
  state, and reset handles.

Because `scheduler@0.27.0` has no `exports` map, every physical file under
`packages/scheduler` is potentially deep-importable. Avoid adding new helper
files under the shipped package tree unless that physical surface change is
intentional and covered by the variant/deep-import oracle. The conservative
first implementation should duplicate small stateless helpers inside the mock
CJS files or move helper authoring outside the shipped package tree and
generate artifacts later.

Do not mix this public Scheduler mock with React lanes, Fiber roots, React DOM
event priorities, test renderer host storage, or Rust reconciler scheduling
state. Those remain separate compatibility surfaces.

## Implementation Phases

1. Replace placeholder exports with real mock behavior.

   - Touch only the future worker's scoped files, likely
     `packages/scheduler/cjs/scheduler-unstable_mock.development.js`,
     `packages/scheduler/cjs/scheduler-unstable_mock.production.js`,
     `tests/smoke/import-entrypoints.mjs`, scheduler mock conformance files,
     and that worker's progress report.
   - Remove `__FAST_REACT_PLACEHOLDER__`, `compatibilityTarget`, and structured
     unimplemented errors from implemented mock exports.
   - Preserve key order, constants, descriptors, function lengths, task shape,
     and absence of `unstable_NoPriority`.

2. Implement virtual scheduling and priority APIs.

   - Implement `unstable_now`, `unstable_advanceTime`,
     `unstable_scheduleCallback`, `unstable_cancelCallback`,
     `unstable_hasPendingWork`, delayed timer advancement, and priority context
     APIs over a mock-owned state record.
   - Assert ready/delayed task fields, timeout buckets, cancellation tombstones,
     priority ordering, equal-priority FIFO, `didTimeout`, and restoration after
     throws.

3. Implement logs, deterministic flushing, paint, and reset.

   - Implement `log`, `unstable_clearLog`,
     `unstable_setDisableYieldValue`, all flush helpers,
     `unstable_requestPaint`, mock `unstable_shouldYield`, and `reset`.
   - Add regressions for `disableYieldValue(true)` disabling both logs and
     virtual-time advancement, `flushNumberOfYields(0)`, paint-stop behavior,
     continuation ordering, and the exact reset guard message.

4. Promote conformance comparisons.

   - Regenerate `scheduler-0.27.0-mock-oracle.json`.
   - Update scheduler mock oracle tests so Fast React development and
     production comparisons are exact behavior matches instead of
     `known-mismatch` or `unsupported-placeholder`.
   - Keep root scheduler, post-task, native, React lanes, reconciler, and
     renderer behavior outside the mock compatibility claim.

5. Revisit package metadata only if the compatibility claim includes package
   identity.

   - Published `scheduler@0.27.0` has no `exports`, no explicit `main`, no
     `type`, no runtime dependencies, and no engines field.
   - Local `packages/scheduler/package.json` has workspace-specific metadata
     and a placeholder description. A stricter package-identity slice may need
     a deliberate breaking cleanup and lockfile sync.

6. Admit upstream-style tests only after mock gates pass.

   - The gate is deterministic mock behavior, not root scheduler health alone.
   - Root scheduler green status is necessary for package health but
     insufficient for tests that alias `scheduler` to `scheduler/unstable_mock`.

## Tests And Verification Gates

A future implementation worker should run these exact commands before claiming
mock behavior compatibility:

```sh
node --check packages/scheduler/cjs/scheduler-unstable_mock.development.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.production.js
node tests/smoke/import-entrypoints.mjs
node tests/conformance/scripts/generate-scheduler-mock-oracle.mjs --write
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
tmpfile=$(mktemp); node tests/conformance/scripts/generate-scheduler-mock-oracle.mjs > "$tmpfile"; cmp -s tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json "$tmpfile"; rc=$?; rm -f "$tmpfile"; exit $rc
npm test --workspace @fast-react/conformance
npm run check:js
rg -n "<local-or-temp-path-patterns>" tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json worker-progress/worker-<id>.md
rg -n "[ \t]+$" packages/scheduler/cjs/scheduler-unstable_mock.development.js packages/scheduler/cjs/scheduler-unstable_mock.production.js tests/smoke/import-entrypoints.mjs tests/conformance/src/scheduler-mock-*.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs worker-progress/worker-<id>.md
git diff --check -- packages/scheduler tests/smoke tests/conformance worker-progress/worker-<id>.md
git status --short
```

Conformance gates before upstream-style tests can rely on the mock:

1. Export surface gate: mock entrypoint and direct mock CJS imports match the
   key order, descriptors, constants, function lengths, and absence of
   `unstable_NoPriority`.
2. Virtual time gate: `unstable_now`, `unstable_advanceTime`, and
   `unstable_setDisableYieldValue` match in development and production.
3. Queue gate: task shape, heap ordering, delayed timers, timeout buckets, FIFO
   tie-breaking, cancellation tombstones, and `didTimeout` match the oracle.
4. Priority gate: `runWithPriority`, `next`, `wrapCallback`, invalid priority
   coercion, current priority, and restoration after throws match the oracle.
5. Log/flush gate: log state, all flush helper return values, assertion
   messages, yielded logs, and pending-work states match the oracle.
6. Continuation/paint gate: callback-returned continuations stay on the same
   task and preserve ordering across yield and paint stops.
7. Reset gate: clean reset, in-flush reset error, and reset-with-pending-work
   behavior match or are documented as an intentional breaking divergence.
8. Isolation gate: probes show mock flushes are unaffected by root scheduler
   host callbacks, real timers, or root queued work.
9. Artifact gate: regenerated oracle is deterministic, byte-compares cleanly,
   and has no local path leaks.
10. Scope gate: compatibility claims explicitly exclude post-task, native,
    reconciler lanes, renderer scheduling, and React DOM integration until
    their own gates pass.

## Evidence Gathered

- Worker 034 established `scheduler@0.27.0` as the compatibility baseline,
  recorded the package file surface, and separated public Scheduler behavior
  from React lanes and reconciler root scheduling.
- Worker 039 confirmed `scheduler/unstable_mock` is a first-milestone gate for
  upstream-style tests and that physical scheduler entry files remain
  importable because the package has no `exports` map.
- Worker 045 implemented the root scheduler entrypoint, leaving mock,
  post-task, native, lanes, reconciler root scheduling, and React DOM
  integration out of scope.
- Worker 052 added the checked `scheduler/unstable_mock` oracle, including
  virtual time, logs, priority context, task shape, flushing helpers, delayed
  and expired work, cancellation, continuations, paint yielding, and reset
  behavior in development and production modes.
- Local package inspection confirmed the root scheduler is implemented while
  mock CJS files still expose structured placeholders.
- Local oracle inspection confirmed the current Fast React comparison boundary:
  `2` known mismatches and `16` unsupported placeholders.

## Delegated Checks

Two managed read-only nested agents were used to test hypotheses:

- Agent `019e0ee9-e0e2-7780-a563-d7e4faae1cbc` inspected the mock oracle and
  confirmed the public API, virtual-time behavior, task shape, flush helpers,
  priority/log behavior, continuations, paint yielding, reset edge cases, and
  current placeholder comparison boundaries. It reported that the targeted
  scheduler mock oracle test passed.
- Agent `019e0ee9-e191-71c3-916a-8ee11d294e56` inspected the scheduler package
  and smoke tests. It confirmed that mock state must be isolated from the root
  scheduler and that only stateless primitives should be shared or generated.
  It also identified likely future touch points and verification gates.

Both delegated checks supported the local conclusion that
`scheduler/unstable_mock` needs a dedicated virtual-time state machine rather
than wrapping the root scheduler singleton.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-034-scheduler-package-inventory.md
sed -n '261,520p' worker-progress/worker-034-scheduler-package-inventory.md
sed -n '1,320p' worker-progress/worker-039-scheduler-variant-oracles.md
sed -n '1,320p' worker-progress/worker-045-scheduler-root-implementation.md
sed -n '1,360p' worker-progress/worker-052-scheduler-mock-oracle.md
git status --short
test -f worker-progress/worker-103-scheduler-mock-implementation-plan.md && sed -n '1,260p' worker-progress/worker-103-scheduler-mock-implementation-plan.md
rg --files packages/scheduler tests/conformance/src tests/conformance/scripts tests/conformance/test tests/conformance/oracles tests/smoke | sort
sed -n '1,260p' worker-progress/worker-038-scheduler-root-oracle.md
cat packages/scheduler/package.json
sed -n '1,220p' packages/scheduler/unstable_mock.js
sed -n '1,260p' packages/scheduler/cjs/scheduler-unstable_mock.development.js
sed -n '1,220p' packages/scheduler/cjs/scheduler-unstable_mock.production.js
sed -n '1,520p' packages/scheduler/cjs/scheduler.development.js
sed -n '1,320p' tests/conformance/src/scheduler-mock-scenarios.mjs
sed -n '1,260p' tests/conformance/src/scheduler-mock-oracle.mjs
sed -n '1,760p' tests/conformance/src/scheduler-mock-probe-runner.mjs
sed -n '1,260p' tests/conformance/src/scheduler-mock-oracle-generator.mjs
sed -n '1,920p' tests/smoke/import-entrypoints.mjs
sed -n '2490,2738p' tests/smoke/import-entrypoints.mjs
cat tests/conformance/package.json
sed -n '1,260p' tests/conformance/src/scheduler-mock-targets.mjs
node tests/conformance/scripts/print-scheduler-mock-oracle.mjs --format=markdown
node -e "<scheduler mock oracle status summary>"
node -e "<selected scheduler mock oracle observations>"
sed -n '100,535p' tests/conformance/test/scheduler-mock-oracle.test.mjs
rg -n "module.exports = require|placeholder|unstable_mock|scheduler-unstable_mock" packages/scheduler
rg -n "taskQueue|timerQueue|push\\(|peek\\(|pop\\(|compare\\(|advanceTimers|currentPriorityLevel|unstable_scheduleCallback" packages/scheduler/cjs/scheduler.production.js packages/scheduler/cjs/scheduler.development.js
git ls-files worker-progress | rg 'scheduler|worker-103'
cat package.json
find . -name AGENTS.md -print
sed -n '1,220p' worker-progress/worker-068-scheduler-post-task-oracle.md
sed -n '1,220p' worker-progress/worker-069-scheduler-native-entry-oracle.md
sed -n '1,260p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '1,260p' worker-progress/worker-073-test-renderer-update-model-plan.md
sed -n '1,220p' worker-progress/worker-070-core-update-queue-plan.md
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
node tests/smoke/import-entrypoints.mjs
rg -n "<local-or-temp-path-patterns>" worker-progress/worker-103-scheduler-mock-implementation-plan.md tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json
rg -n "[ \t]+$" worker-progress/worker-103-scheduler-mock-implementation-plan.md && exit 1 || exit 0
npm test --workspace @fast-react/conformance
git diff --check -- worker-progress/worker-103-scheduler-mock-implementation-plan.md && git status --short
sed -n '1,560p' worker-progress/worker-103-scheduler-mock-implementation-plan.md
```

Goal/tool actions:

- `create_goal` for the worker objective.
- `get_goal` immediately after goal setup.
- Spawned and waited for two managed read-only nested agents.

## Verification Performed

- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs` passed:
  13 tests.
- `node tests/smoke/import-entrypoints.mjs` passed.
- `npm test --workspace @fast-react/conformance` passed: 272 tests.
- Scoped local/temp path leak check over this report and the checked scheduler
  mock oracle returned no matches.
- Scoped trailing-whitespace check over this report returned no matches.
- `git diff --check -- worker-progress/worker-103-scheduler-mock-implementation-plan.md`
  passed.
- Final `git status --short` showed only this untracked report file.

## Changed Files

- `worker-progress/worker-103-scheduler-mock-implementation-plan.md`

## Risks Or Blockers

- `scheduler/unstable_mock` behavior remains unimplemented after this
  report-only task.
- The reset-with-pending-work behavior is odd and may tempt a cleanup; changing
  it would be a deliberate compatibility break.
- Package metadata differs from the published scheduler package and may need a
  separate package-identity cleanup if stricter compatibility is claimed.
- Adding helper files under `packages/scheduler` would create new physical deep
  import surface because the package has no `exports` map.
- Upstream React tests may still need harness aliasing and environment
  adaptation after mock behavior is green.

## Recommended Next Tasks

1. Implement `scheduler/unstable_mock` in the mock CJS files against worker
   052's checked oracle.
2. Promote Fast React mock oracle comparisons from placeholder statuses to
   exact behavior matches.
3. Update smoke coverage so mock entrypoints are treated as implemented while
   post-task and native entrypoints remain placeholders.
4. Decide whether scheduler package metadata should be normalized to the
   published `scheduler@0.27.0` shape.
5. Admit upstream-style scheduler tests only after the mock-specific gates pass.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan is grounded in checked `scheduler@0.27.0` oracle evidence and local
  package shape.
- It identifies the compatibility root cause as missing deterministic mock
  state, not scattered placeholder throws.

Maintainability:

- Shared code is limited to stateless primitives.
- Mock, root, post-task, native, React lanes, reconciler, and renderer
  responsibilities stay separate.

Performance:

- The planned implementation keeps binary heap scheduling and tombstone
  cancellation.
- Mock flushes stay synchronous and deterministic, avoiding host callback and
  wall-clock flake.

Security:

- No native binding or browser global dependency is needed.
- Priority and flush paths need `finally` restoration so thrown callbacks do
  not corrupt module state.
- The verification plan includes artifact path-leak and whitespace checks.

## Completion Audit

Success criteria mapped to artifact evidence:

- Report-only plan exists at the required path: satisfied by this file.
- Write scope limited to the report: final status shows only this report as a
  new untracked file.
- Required project and scheduler reports were read: satisfied by the commands
  for `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and workers
  034, 039, 045, and 052. `ORCHESTRATOR.md` was not read.
- Public API and observable behavior are explained: satisfied by "Required
  Public API", "Virtual Time And Mock State", and "Deterministic Flush
  Behavior".
- Mock state isolation and safe shared primitives are identified: satisfied by
  "Integration Boundaries".
- Implementation phases are specified: satisfied by "Implementation Phases".
- Tests and exact verification commands are specified: satisfied by "Tests And
  Verification Gates".
- Conformance gates before upstream-style tests are specified: satisfied by the
  numbered gate list.
- Breaking changes are allowed and documented where necessary: satisfied by the
  placeholder metadata removal, package metadata note, helper-file warning, and
  reset-boundary policy.
- Nested agents were used and summarized: satisfied by "Delegated Checks".
- Commands run, changed files, risks, and recommended next tasks are listed in
  dedicated sections.
- Quality, maintainability, performance, and security were reviewed in the
  section above.

Unresolved work is future implementation work, not missing report work.
