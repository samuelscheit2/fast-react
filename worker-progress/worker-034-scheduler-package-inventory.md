# worker-034-scheduler-package-inventory

## Objective

Build a report-only inventory for the public `scheduler` package behavior needed
by React 19.2.6 compatibility, and recommend the first safe implementation
slices. No project code was implemented by this worker.

Write scope honored: only this report file was created.

## Summary

React DOM 19.2.6 depends on `scheduler: ^0.27.0`; npm currently resolves that
range to `scheduler@0.27.0`. Fast React should treat `scheduler@0.27.0` as the
pinned public package behavior baseline for React 19.2.6 compatibility.

The public `scheduler` package is a JS-observable package surface, not React's
internal lane or root scheduler. It should be implemented as a separate package
facade with its own conformance probes. React's lanes/root scheduling can use it
as a host callback mechanism, but lane selection, root task reuse, Suspense
pings, transitions, and update queue rebasing remain reconciler responsibilities.

The first safe implementation slices are:

1. Add a package scaffold for `scheduler@0.27.0`-compatible CommonJS entrypoints
   and metadata, with explicit conformance placeholders.
2. Implement the root `scheduler` entrypoint with binary task/timer heaps,
   delayed work, cancellation tombstones, continuations, priority context, yield
   and paint semantics, and host callback transport abstraction.
3. Implement `scheduler/unstable_mock` separately for upstream React-style
   tests and deterministic scheduler oracles.
4. Defer `scheduler/unstable_post_task`, native runtime delegation, and broad
   deep physical CJS import compatibility until root and mock behavior are green.

## Package Identity Evidence

Pinned target:

- `react-dom@19.2.6` declares `dependencies: { "scheduler": "^0.27.0" }` and
  `peerDependencies: { "react": "^19.2.6" }`.
- `npm view scheduler@^0.27.0 version --json` returned `"0.27.0"`.
- `scheduler@0.27.0` tarball:
  - Registry URL: `https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz`
  - Integrity:
    `sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==`
  - Shasum: `0c4ef82d67d1e5c1e359e8fc76d3a87f045fe5bd`
  - Packed file count: 15
  - Unpacked size: 82665 bytes
- The checked conformance inventory already records `scheduler@0.27.0` as a
  supporting runtime package for React DOM artifact probes, not as an official
  React package target.

Package layout:

- `package.json` has no `exports` map, no explicit `main`, no `type`, no
  runtime dependencies, and no engines field.
- Node resolves `require("scheduler")` through physical `index.js`.
- Because there is no `exports` map, physical deep imports are not blocked by
  Node package exports. Compatibility-sensitive subpaths include:
  - `scheduler`
  - `scheduler/package.json`
  - `scheduler/unstable_mock`
  - `scheduler/unstable_post_task`
  - `scheduler/index.native.js`
  - shipped `scheduler/cjs/*` files if external consumers rely on physical deep
    imports.

Tarball files:

- `LICENSE`
- `README.md`
- `index.js`
- `index.native.js`
- `unstable_mock.js`
- `unstable_post_task.js`
- `package.json`
- `cjs/scheduler.development.js`
- `cjs/scheduler.production.js`
- `cjs/scheduler.native.development.js`
- `cjs/scheduler.native.production.js`
- `cjs/scheduler-unstable_mock.development.js`
- `cjs/scheduler-unstable_mock.production.js`
- `cjs/scheduler-unstable_post_task.development.js`
- `cjs/scheduler-unstable_post_task.production.js`

## Public Root Entrypoint Inventory

`require("scheduler")` exports the same key set in development and production:

- `unstable_scheduleCallback`
- `unstable_cancelCallback`
- `unstable_shouldYield`
- `unstable_now`
- `unstable_runWithPriority`
- `unstable_next`
- `unstable_wrapCallback`
- `unstable_requestPaint`
- `unstable_forceFrameRate`
- `unstable_getCurrentPriorityLevel`
- `unstable_Profiling`
- `unstable_ImmediatePriority`
- `unstable_UserBlockingPriority`
- `unstable_NormalPriority`
- `unstable_LowPriority`
- `unstable_IdlePriority`

Priority constants:

- `unstable_ImmediatePriority = 1`
- `unstable_UserBlockingPriority = 2`
- `unstable_NormalPriority = 3`
- `unstable_LowPriority = 4`
- `unstable_IdlePriority = 5`
- `unstable_Profiling = null`
- `unstable_NoPriority` is not exported by the public root package.

Timeouts used when computing callback expiration:

- Immediate: `-1ms`
- UserBlocking: `250ms`
- Normal/default: `5000ms`
- Low: `10000ms`
- Idle: `1073741823ms`

Returned task object shape from the shipped implementation:

- `id`
- `callback`
- `priorityLevel`
- `startTime`
- `expirationTime`
- `sortIndex`

React DOM treats task nodes mostly opaquely, but the shape is JS-observable
because the package returns it to callers.

## Public Root Behavior Inventory

Task and timer queues:

- The implementation uses two binary min-heaps: `taskQueue` for ready work and
  `timerQueue` for delayed work.
- Heap comparison is `sortIndex`, then monotonically increasing task `id`. That
  preserves insertion order for equal sort keys.
- Ready tasks use `expirationTime` as `sortIndex`.
- Delayed tasks use `startTime` as `sortIndex` until they become due. When due,
  `advanceTimers` moves them to `taskQueue` and changes `sortIndex` to
  `expirationTime`.

Scheduling:

- `unstable_scheduleCallback(priority, callback, options)` computes:
  - `startTime = now + options.delay` when `delay > 0`, otherwise `now`
  - `expirationTime = startTime + timeoutForPriority`
  - a task object with callback and sorting fields
- Ready tasks request a host callback unless one is already scheduled or work is
  already being performed.
- Delayed tasks request a host timeout for the earliest timer when no ready
  task is pending.

Cancellation:

- `unstable_cancelCallback(task)` does not remove the task from its heap
  immediately.
- It sets `task.callback = null`.
- Later heap advancement/popping treats `null` callbacks as tombstones.

Continuation callbacks:

- If a scheduled callback returns a function, that function is stored back on
  the same task as its new callback.
- The work loop yields/reschedules after recording the continuation.
- Because the same task keeps its original heap identity, its continuation runs
  before lower-priority work and before later equal-priority tasks with larger
  ids.

`didTimeout`:

- The callback argument is `currentTask.expirationTime <= currentTime`.
- Immediate callbacks normally receive `true` because their timeout is `-1ms`.
- UserBlocking/Normal/Low callbacks receive `true` if the event loop is blocked
  past their expiration before the scheduler runs them.

Priority context APIs:

- Default current priority is Normal (`3`).
- `unstable_runWithPriority(priority, fn)` sets current priority while `fn`
  runs and restores it in `finally`.
- Invalid priorities passed to `runWithPriority` are coerced to Normal.
- `unstable_next(fn)` lowers Immediate, UserBlocking, and Normal contexts to
  Normal, but preserves Low and Idle contexts.
- `unstable_wrapCallback(fn)` captures the current priority when wrapped and
  restores the previous priority after invocation.

Time and yielding:

- `unstable_now` uses `performance.now()` when available; otherwise it uses
  `Date.now() - initialTime`.
- The default frame/yield interval is `5ms`.
- `unstable_shouldYield()` returns `true` when `unstable_requestPaint()` has
  been called or when current work has exceeded the frame interval.
- `unstable_forceFrameRate(fps)` accepts `0..125`; `0` resets to `5ms`, and
  positive values set `Math.floor(1000 / fps)`. Invalid values log an error in
  development.

Host callback transport:

- Root CJS scheduler prefers `setImmediate`, then `MessageChannel`, then
  `setTimeout(0)`.
- Delayed timers use `setTimeout` and `clearTimeout`.
- A Node runtime probe instrumented `global.setImmediate` before requiring
  `scheduler` and observed `setImmediate` scheduling for public work.

## Auxiliary Entrypoints

`scheduler/unstable_mock`:

- Exports the root scheduler APIs plus deterministic test helpers:
  - `log`
  - `reset`
  - `unstable_advanceTime`
  - `unstable_clearLog`
  - `unstable_flushAll`
  - `unstable_flushAllWithoutAsserting`
  - `unstable_flushExpired`
  - `unstable_flushNumberOfYields`
  - `unstable_flushUntilNextPaint`
  - `unstable_hasPendingWork`
  - `unstable_setDisableYieldValue`
- Uses virtual `currentMockTime` instead of host time.
- Uses the same priority constants, timeouts, task/timer heap ordering,
  cancellation tombstones, delayed-task movement, and continuation model.
- Upstream React tests rely heavily on this subpath. Worker 005 already noted
  that source tests alias `scheduler` to `scheduler/unstable_mock`.
- React DOM development builds read `Scheduler.log` and
  `Scheduler.unstable_setDisableYieldValue` only when the scheduler module is
  replaced by the mock; the root scheduler does not export those keys.

`scheduler/unstable_post_task`:

- Plain Node import fails without a browser-like `window` and global
  `scheduler.postTask`.
- Exports the same root API key set when a `window`, `global.scheduler`, and
  `TaskController` shim are present.
- Uses `window.performance.now`, `scheduler.postTask`, optional
  `scheduler.yield`, and `TaskController`.
- Priority mapping:
  - Immediate and UserBlocking -> `"user-blocking"`
  - Normal and Low -> `"user-visible"`
  - Idle -> `"background"`
- `unstable_forceFrameRate` and `unstable_requestPaint` are no-ops in this
  variant.
- `unstable_shouldYield()` is based on a local deadline of `now + 5`.

`index.native.js`:

- Chooses `cjs/scheduler.native.production.js` or
  `cjs/scheduler.native.development.js`.
- If global `nativeRuntimeScheduler` exists, it delegates priority constants and
  scheduler operations to that runtime.
- Without `nativeRuntimeScheduler`, it falls back for scheduling, cancellation,
  current priority, should-yield, request-paint, and now.
- Without `nativeRuntimeScheduler`, these exported APIs throw
  `Error("Not implemented.")`:
  - `unstable_runWithPriority`
  - `unstable_next`
  - `unstable_wrapCallback`
  - `unstable_forceFrameRate`

## React DOM Usage Evidence

The React DOM 19.2.6 tarball requires the root scheduler package from:

- `cjs/react-dom-client.development.js`
- `cjs/react-dom-client.production.js`
- `cjs/react-dom-profiling.development.js`
- `cjs/react-dom-profiling.profiling.js`

Observed `Scheduler.unstable_*` references in those React DOM files include:

- `unstable_scheduleCallback`
- `unstable_cancelCallback`
- `unstable_shouldYield`
- `unstable_now`
- `unstable_requestPaint`
- `unstable_getCurrentPriorityLevel`
- all five public priority constants
- `unstable_setDisableYieldValue` only for the mock/test path described above

React DOM does not import `scheduler/unstable_mock` or
`scheduler/unstable_post_task` from the shipped production/client bundles, but
Fast React needs `unstable_mock` before React upstream-style test reuse can be
enabled.

## Public Scheduler Is Not Internal React Scheduling

Do not collapse these layers:

- Public `scheduler` priorities are numeric callback priorities with host
  callback transport and JS-visible APIs.
- React internal lanes are reconciler bitsets used to select root work,
  interrupt or preserve work in progress, model transitions, Suspense retries,
  hidden/offscreen work, entanglements, expiration, and update queue rebasing.
- React DOM maps selected root/event priority to scheduler callback priority,
  but `scheduler` does not know about lanes, fibers, roots, Suspense, class or
  hook update queues, passive effects, or commits.

Root cause implication:

- A single flat Rust priority enum used for both public `scheduler` and lanes
  would conflate independent invariants.
- Public `scheduler` should be a JS package/module with heap semantics and host
  callback abstraction.
- The reconciler should separately implement lanes and root scheduling, using
  the public scheduler only at the callback boundary.

## Black-Box Probe Results

Node and npm versions used:

- Node `v26.0.0`
- npm `11.12.1`

The root runtime probe against `scheduler@0.27.0` observed:

```json
{
  "defaultPriority": 3,
  "runWithPriorityUserBlocking": 2,
  "runWithPriorityInvalid": 3,
  "nextInsideUserBlocking": 3,
  "nextInsideLow": 4,
  "wrapCallbackCapturedPriority": 2,
  "priorityOrder": [
    ["immediate", true, 1],
    ["user-blocking", false, 2],
    ["normal", false, 3],
    ["low", false, 4]
  ],
  "equalPriorityFIFO": ["a", "b", "c"],
  "cancellation": ["kept"],
  "continuationBeforeLowerPriority": [
    "normal-start",
    "normal-continuation",
    "low"
  ],
  "delayed": [
    ["ready", 0],
    ["delay20", 20]
  ],
  "didTimeoutAfterEventLoopBlock": [
    ["user-blocking-after-block", true]
  ],
  "requestPaintShouldYield": [
    ["beforeRequestPaint", false],
    ["afterRequestPaint", true]
  ],
  "setImmediateCallsAfterScheduledWork": 9
}
```

These probes are evidence for Node/CJS behavior. Browser transport paths were
source-inspected but not run in a real browser by this worker.

## Delegated Checks

Nested explorer `019e0e74-0e91-74d1-8c4c-f902a966ca59` independently checked
npm metadata, the scheduler tarball, source files, the local inventory artifact,
and the prior worker 007 scheduler/fiber report. It confirmed the package
identity, public exports, two-heap model, cancellation tombstones,
continuations, `didTimeout`, paint/yield semantics, transport order, post-task
variant, native variant caveat, and the public/internal scheduling distinction.

Nested explorer `019e0e74-22d6-7e82-af42-4e59261c6806` independently ran
black-box Node probes in disposable npm projects. It confirmed export keys,
priority constants, ordering, FIFO behavior, cancellation, delayed callbacks,
continuations, timeout behavior, priority context APIs, `shouldYield` and
`requestPaint`, and Node `setImmediate` transport evidence.

I used both delegated checks to challenge the local source-read conclusions.
They did not produce contradictions; they added two caveats reflected above:
runtime probes are Node/CJS only, and host transport evidence outside Node still
needs browser-environment verification if it becomes a compatibility gate.

## Recommended Follow-Up Workers

1. `worker-035-scheduler-package-scaffold`
   - Objective: add the npm workspace package scaffold for `scheduler` with
     root, `unstable_mock`, `unstable_post_task`, native, and package metadata
     entrypoints that fail loudly until implemented.
   - Suggested write scope:
     `packages/scheduler/**`, root workspace metadata if needed,
     `tests/smoke/**`, and the worker progress file.
   - Non-overlap note: do not implement scheduler behavior in this slice.

2. `worker-036-scheduler-root-oracle`
   - Objective: add deterministic root `scheduler@0.27.0` public behavior
     oracle scenarios against the real package and current Fast React scheduler
     package placeholder.
   - Suggested write scope:
     `tests/conformance/**`, `tests/smoke/**`, and the worker progress file.
   - Required scenarios: export keys, constants, priority ordering,
     equal-priority FIFO, delayed callbacks, cancellation, continuations,
     `didTimeout`, priority context APIs, `shouldYield`, `requestPaint`,
     `forceFrameRate`, and temp-path leak guards.

3. `worker-037-scheduler-root-implementation`
   - Objective: implement the root `scheduler` CommonJS entrypoint to pass the
     root oracle.
   - Suggested write scope:
     `packages/scheduler/**`, targeted smoke tests, conformance expected Fast
     React observations if the oracle framework requires them, and the worker
     progress file.
   - Root constraints: binary heaps, sortIndex/id ordering, delayed timer heap,
     tombstone cancellation, same-task continuation, `didTimeout`, priority
     context stack, host callback abstraction, and no lane logic.

4. `worker-038-scheduler-mock-oracle-and-implementation`
   - Objective: implement `scheduler/unstable_mock` for upstream-style tests.
   - Suggested write scope:
     `packages/scheduler/**`, `tests/conformance/**`, and the worker progress
     file.
   - Required scenarios: virtual time, `log`, `clearLog`, `flushAll`,
     `flushAllWithoutAsserting`, `flushExpired`, `flushNumberOfYields`,
     `flushUntilNextPaint`, `advanceTime`, `hasPendingWork`,
     `setDisableYieldValue`, continuation behavior, and reset guards.

5. `worker-039-scheduler-variant-inventory-oracles`
   - Objective: decide whether Fast React must support
     `scheduler/unstable_post_task`, `index.native.js`, and physical deep CJS
     imports in the first compatibility milestone; add oracles for accepted
     surfaces.
   - Suggested write scope:
     `tests/conformance/**`, optional `packages/scheduler/**` only for
     placeholders, and the worker progress file.

6. `worker-040-react-dom-scheduler-boundary`
   - Objective: after root scheduler behavior is green, map React DOM/root
     scheduling needs to the reconciler callback boundary without mixing public
     scheduler priorities with lane bitsets.
   - Suggested write scope should be assigned after worker 033 reports React DOM
     inventory; likely reconciler/root-scheduling files plus targeted tests.

## Risks Or Blockers

- Browser runtime transport was source-inspected but not run in a real browser.
  If browser timing behavior becomes a gate, add browser probes before claiming
  compatibility.
- The package has no `exports` map, so any shipped physical file can be deep
  imported in Node. Supporting every physical CJS path may increase package
  maintenance cost. The first implementation should at least support documented
  entry files and decide deep CJS compatibility explicitly.
- `scheduler/unstable_mock` is not used by shipped React DOM client bundles, but
  it is a real public subpath and a prerequisite for many upstream React tests.
- Timing probes can vary under heavy load. Conformance tests should assert
  logical order and timeout categories with generous margins, not exact wall
  times except where virtual mock time is used.
- `scheduler/unstable_post_task` depends on browser-only globals. It should be
  tested in a controlled browser-like environment, not inferred from Node.
- The native variant has partial fallback behavior and explicit
  "Not implemented." throws. Do not accidentally make native APIs silently work
  differently unless the compatibility plan chooses a breaking change and
  documents why.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The inventory is anchored on React DOM 19.2.6 npm dependency metadata,
  `scheduler@0.27.0` tarball evidence, shipped CJS source inspection, local
  conformance inventory, and black-box runtime probes.
- The report separates JS-observable scheduler behavior from internal React
  lanes/root scheduling to avoid patching the wrong abstraction.

Maintainability:

- Follow-up slices isolate package surface, root runtime behavior, mock runtime
  behavior, variants, and React DOM integration. This keeps future write scopes
  reviewable and avoids overlap with lane/core workers.
- Constants and behavior names should stay close to React's names in code and
  tests so diffs against `scheduler@0.27.0` remain straightforward.

Performance:

- The implementation should use binary heaps or an equivalent O(log n) priority
  queue with stable id tie-breaking. FIFO queues or sorted arrays would either
  miss semantics or risk avoidable hot-path cost.
- Cancellation tombstones avoid arbitrary heap deletion. This is both semantic
  evidence and a performance-friendly implementation detail.

Security:

- Scheduler callbacks are arbitrary JS functions. Native/Rust integration must
  preserve callback lifetime/rooting and must restore priority/reentrancy state
  in `finally`-equivalent paths.
- Host timers and message channels should be abstracted so tests can control
  them without exposing mutable global scheduler state across test files.
- No tarball lifecycle scripts were run by this worker. Package code was
  executed only in short-lived runtime probes from exact npm package contents.

## Evidence Gathered

- npm metadata tied React DOM 19.2.6 to `scheduler: ^0.27.0` and confirmed
  that the range currently resolves to `scheduler@0.27.0`.
- The checked conformance inventory already records the exact
  `scheduler@0.27.0` tarball identity and file list as supporting package
  evidence.
- Shipped scheduler CJS files provided source evidence for public exports,
  priority constants, two-heap task/timer queues, sort order, delayed timer
  advancement, cancellation tombstones, continuation handling, `didTimeout`,
  yield/paint behavior, host callback transport, mock APIs, post-task behavior,
  and native fallback/delegation behavior.
- Runtime probes against an extracted `scheduler@0.27.0` package confirmed the
  root Node/CJS behavior for exports, priority context, ordering, FIFO,
  cancellation, continuation, delay, timeout, request-paint yield, and
  `setImmediate` host transport.
- React DOM 19.2.6 tarball inspection confirmed shipped client/profiling
  bundles import the root `scheduler` entrypoint and use its callback,
  cancellation, priority, time, yield, and paint APIs.
- Two nested read-only explorers independently verified the source and
  black-box probe conclusions. Their results are summarized in this report.

## Commands Run

Initial required context:

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,260p' worker-progress/worker-017-runtime-inventory-generation.md
find tests/conformance -maxdepth 3 -type f | sort | sed -n '1,200p'
git status --short
```

Version and npm metadata:

```sh
node --version
npm --version
npm view react-dom@19.2.6 version dependencies dist.integrity dist.tarball gitHead --json
npm view scheduler@0.27.0 version dist.integrity dist.tarball gitHead dependencies main exports files --json
npm view scheduler@^0.27.0 version --json
npm view react-dom@19.2.6 version dependencies peerDependencies --json
```

Tarball and source inspection:

```sh
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" --json; tar -tf "$workdir"/scheduler-0.27.0.tgz | sort; rm -rf "$workdir"
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" >/dev/null; tar -xzf "$workdir"/scheduler-0.27.0.tgz -C "$workdir"; cd "$workdir"/package; node -e "const p=require('./package.json'); console.log(JSON.stringify({name:p.name,version:p.version,main:p.main,files:p.files,repository:p.repository}, null, 2));"; rg -n "exports\\.|ImmediatePriority|UserBlockingPriority|NormalPriority|LowPriority|IdlePriority|NoPriority|taskQueue|timerQueue|requestHostCallback|MessageChannel|setImmediate|setTimeout|shouldYieldToHost|requestPaint|frameYieldMs|performWorkUntilDeadline|advanceTimers|workLoop|didTimeout|currentPriorityLevel|unstable_scheduleCallback|unstable_cancelCallback|unstable_runWithPriority|unstable_next|unstable_wrapCallback|unstable_getCurrentPriorityLevel|unstable_forceFrameRate" cjs/scheduler.development.js index.js unstable_mock.js unstable_post_task.js; rm -rf "$workdir"
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" >/dev/null 2>/dev/null; tar -xzf "$workdir"/scheduler-0.27.0.tgz -C "$workdir"; cd "$workdir"/package; nl -ba cjs/scheduler.development.js | sed -n '1,380p'; rm -rf "$workdir"
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" >/dev/null 2>/dev/null; tar -xzf "$workdir"/scheduler-0.27.0.tgz -C "$workdir"; cd "$workdir"/package; nl -ba cjs/scheduler-unstable_post_task.development.js | sed -n '1,220p'; rm -rf "$workdir"
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" >/dev/null 2>/dev/null; tar -xzf "$workdir"/scheduler-0.27.0.tgz -C "$workdir"; cd "$workdir"/package; nl -ba index.js; nl -ba index.native.js; nl -ba unstable_mock.js; nl -ba unstable_post_task.js; nl -ba cjs/scheduler.native.development.js | sed -n '1,260p'; rm -rf "$workdir"
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" >/dev/null 2>/dev/null; tar -xzf "$workdir"/scheduler-0.27.0.tgz -C "$workdir"; cd "$workdir"/package; nl -ba cjs/scheduler.native.development.js | sed -n '260,520p'; rm -rf "$workdir"
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" >/dev/null 2>/dev/null; tar -xzf "$workdir"/scheduler-0.27.0.tgz -C "$workdir"; cd "$workdir"/package; rg -n "exports\\.|function unstable_|function flush|unstable_flush|unstable_advanceTime|unstable_hasPendingWork|unstable_setDisableYieldValue|yieldedValues|taskQueue|timerQueue|compare|requestPaint|shouldYieldToHost|didTimeout" cjs/scheduler-unstable_mock.development.js | sed -n '1,220p'; rm -rf "$workdir"
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" >/dev/null 2>/dev/null; tar -xzf "$workdir"/scheduler-0.27.0.tgz -C "$workdir"; cd "$workdir"/package; nl -ba cjs/scheduler-unstable_mock.development.js | sed -n '1,150p'; rm -rf "$workdir"
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" >/dev/null 2>/dev/null; tar -xzf "$workdir"/scheduler-0.27.0.tgz -C "$workdir"; cd "$workdir"/package; nl -ba cjs/scheduler-unstable_mock.development.js | sed -n '150,420p'; rm -rf "$workdir"
```

Runtime probes:

```sh
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" >/dev/null 2>/dev/null; mkdir -p "$workdir/node_modules/scheduler"; tar -xzf "$workdir"/scheduler-0.27.0.tgz -C "$workdir/node_modules/scheduler" --strip-components=1; cd "$workdir"; node - <<'NODE'
const { spawnSync } = require('node:child_process');
const base = process.cwd();
const modes = ['development', 'production'];
for (const mode of modes) {
  const script = `
    process.env.NODE_ENV = ${JSON.stringify(mode)};
    const pkg = require('scheduler/package.json');
    const entries = ['scheduler', 'scheduler/unstable_mock', 'scheduler/unstable_post_task'];
    const rows = {};
    for (const entry of entries) {
      try {
        const mod = require(entry);
        rows[entry] = {
          resolved: require.resolve(entry).replace(process.cwd(), '<tmp>'),
          keys: Object.keys(mod).sort(),
          constants: Object.fromEntries(Object.keys(mod).filter(k => /Priority$/.test(k) || k === 'unstable_Profiling').sort().map(k => [k, mod[k]])),
          nowType: typeof mod.unstable_now,
          shouldYieldType: typeof mod.unstable_shouldYield,
          scheduleType: typeof mod.unstable_scheduleCallback
        };
      } catch (error) {
        rows[entry] = { error: error && error.message };
      }
    }
    console.log(JSON.stringify({ mode: ${JSON.stringify(mode)}, packageVersion: pkg.version, packageHasExports: Object.prototype.hasOwnProperty.call(pkg, 'exports'), rows }, null, 2));
  `;
  const result = spawnSync(process.execPath, ['-e', script], { cwd: base, encoding: 'utf8' });
  process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}
NODE
rm -rf "$workdir"
```

```sh
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" >/dev/null 2>/dev/null; mkdir -p "$workdir/node_modules/scheduler"; tar -xzf "$workdir"/scheduler-0.27.0.tgz -C "$workdir/node_modules/scheduler" --strip-components=1; cd "$workdir"; node - <<'NODE'
global.window = { performance, setTimeout };
global.scheduler = {
  postTask(fn, options) { return Promise.resolve().then(fn); },
  yield(options) { return Promise.resolve(); }
};
global.TaskController = class TaskController {
  constructor(options) { this.options = options; this.signal = { aborted: false }; }
  abort() { this.signal.aborted = true; }
};
process.env.NODE_ENV = 'development';
const mod = require('scheduler/unstable_post_task');
console.log(JSON.stringify({
  keys: Object.keys(mod).sort(),
  constants: Object.fromEntries(Object.keys(mod).filter(k => /Priority$/.test(k) || k === 'unstable_Profiling').sort().map(k => [k, mod[k]])),
  shouldYieldInitial: mod.unstable_shouldYield(),
  runWithPriorityValue: mod.unstable_runWithPriority(mod.unstable_LowPriority, () => mod.unstable_getCurrentPriorityLevel())
}, null, 2));
NODE
rm -rf "$workdir"
```

```sh
workdir=$(mktemp -d); npm pack scheduler@0.27.0 --pack-destination "$workdir" >/dev/null 2>/dev/null; mkdir -p "$workdir/node_modules/scheduler"; tar -xzf "$workdir"/scheduler-0.27.0.tgz -C "$workdir/node_modules/scheduler" --strip-components=1; cd "$workdir"; node - <<'NODE'
(async () => {
  process.env.NODE_ENV = 'development';
  const realSetImmediate = global.setImmediate;
  let setImmediateCalls = 0;
  global.setImmediate = function instrumentedSetImmediate(...args) {
    setImmediateCalls += 1;
    return realSetImmediate(...args);
  };
  const Scheduler = require('scheduler');
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const rows = {};
  rows.defaultPriority = Scheduler.unstable_getCurrentPriorityLevel();
  rows.runWithPriorityUserBlocking = Scheduler.unstable_runWithPriority(
    Scheduler.unstable_UserBlockingPriority,
    () => Scheduler.unstable_getCurrentPriorityLevel(),
  );
  rows.runWithPriorityInvalid = Scheduler.unstable_runWithPriority(
    999,
    () => Scheduler.unstable_getCurrentPriorityLevel(),
  );
  rows.nextInsideUserBlocking = Scheduler.unstable_runWithPriority(
    Scheduler.unstable_UserBlockingPriority,
    () => Scheduler.unstable_next(() => Scheduler.unstable_getCurrentPriorityLevel()),
  );
  rows.nextInsideLow = Scheduler.unstable_runWithPriority(
    Scheduler.unstable_LowPriority,
    () => Scheduler.unstable_next(() => Scheduler.unstable_getCurrentPriorityLevel()),
  );
  const wrapped = Scheduler.unstable_runWithPriority(
    Scheduler.unstable_UserBlockingPriority,
    () => Scheduler.unstable_wrapCallback(() => Scheduler.unstable_getCurrentPriorityLevel()),
  );
  rows.wrapCallbackCapturedPriority = Scheduler.unstable_runWithPriority(
    Scheduler.unstable_LowPriority,
    () => wrapped(),
  );
  const priorityOrder = [];
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_LowPriority, didTimeout => priorityOrder.push(['low', didTimeout, Scheduler.unstable_getCurrentPriorityLevel()]));
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, didTimeout => priorityOrder.push(['normal', didTimeout, Scheduler.unstable_getCurrentPriorityLevel()]));
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_UserBlockingPriority, didTimeout => priorityOrder.push(['user-blocking', didTimeout, Scheduler.unstable_getCurrentPriorityLevel()]));
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_ImmediatePriority, didTimeout => priorityOrder.push(['immediate', didTimeout, Scheduler.unstable_getCurrentPriorityLevel()]));
  await sleep(40);
  rows.priorityOrder = priorityOrder;
  const fifo = [];
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => fifo.push('a'));
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => fifo.push('b'));
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => fifo.push('c'));
  await sleep(40);
  rows.equalPriorityFIFO = fifo;
  const canceled = [];
  const canceledTask = Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => canceled.push('canceled'));
  Scheduler.unstable_cancelCallback(canceledTask);
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => canceled.push('kept'));
  await sleep(40);
  rows.cancellation = canceled;
  const continuation = [];
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
    continuation.push('normal-start');
    return () => continuation.push('normal-continuation');
  });
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_LowPriority, () => continuation.push('low'));
  await sleep(80);
  rows.continuationBeforeLowerPriority = continuation;
  const delayed = [];
  const delayStart = Scheduler.unstable_now();
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => delayed.push(['ready', Math.round(Scheduler.unstable_now() - delayStart)]));
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => delayed.push(['delay20', Math.round(Scheduler.unstable_now() - delayStart)]), { delay: 20 });
  await sleep(80);
  rows.delayed = delayed;
  const timeoutRows = [];
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_UserBlockingPriority, didTimeout => timeoutRows.push(['user-blocking-after-block', didTimeout]));
  const blockStart = Date.now();
  while (Date.now() - blockStart < 320) {}
  await sleep(40);
  rows.didTimeoutAfterEventLoopBlock = timeoutRows;
  const paint = [];
  Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, () => {
    paint.push(['beforeRequestPaint', Scheduler.unstable_shouldYield()]);
    Scheduler.unstable_requestPaint();
    paint.push(['afterRequestPaint', Scheduler.unstable_shouldYield()]);
  });
  await sleep(40);
  rows.requestPaintShouldYield = paint;
  rows.setImmediateCallsAfterScheduledWork = setImmediateCalls;
  console.log(JSON.stringify(rows, null, 2));
})().catch(error => {
  console.error(error && error.stack || error);
  process.exit(1);
});
NODE
rm -rf "$workdir"
```

One initial version of the async black-box probe used top-level `await` with
CommonJS `require` and failed with `ERR_AMBIGUOUS_MODULE_SYNTAX`. No evidence
from that failed run was used; the probe was rerun inside an async IIFE and
passed.

Local inventory and React DOM package usage:

```sh
node - <<'NODE'
const inventory = require('./tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json');
console.log(Object.keys(inventory));
console.log(Object.keys(inventory.packages || {}));
console.log(JSON.stringify(inventory.packages?.scheduler || inventory.supportingPackages?.scheduler || null, null, 2));
NODE
rg -n 'scheduler|0\\.27\\.0|supporting' tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json | sed -n '1,80p'
workdir=$(mktemp -d); curl -L --fail --silent --show-error https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -o "$workdir/react-dom.tgz"; mkdir -p "$workdir/extract"; tar -xzf "$workdir/react-dom.tgz" -C "$workdir/extract"; cd "$workdir/extract/package"; rg -n "require\\(['\\\"]scheduler|from ['\\\"]scheduler|scheduler/unstable" . | sed -n '1,200p'; rm -rf "$workdir"
workdir=$(mktemp -d); curl -L --fail --silent --show-error https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -o "$workdir/react-dom.tgz"; mkdir -p "$workdir/extract"; tar -xzf "$workdir/react-dom.tgz" -C "$workdir/extract"; cd "$workdir/extract/package"; rg -o "Scheduler\\.unstable_[A-Za-z0-9_]+" cjs/react-dom-client.development.js cjs/react-dom-profiling.development.js cjs/react-dom-client.production.js cjs/react-dom-profiling.profiling.js | sed 's/.*Scheduler/Scheduler/' | sort | uniq -c | sort -nr; rm -rf "$workdir"
workdir=$(mktemp -d); curl -L --fail --silent --show-error https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -o "$workdir/react-dom.tgz"; mkdir -p "$workdir/extract"; tar -xzf "$workdir/react-dom.tgz" -C "$workdir/extract"; cd "$workdir/extract/package"; rg -n "unstable_setDisableYieldValue|unstable_shouldYield|unstable_scheduleCallback|Scheduler = require\\(\\\"scheduler\\\"\\)" cjs/react-dom-client.development.js | sed -n '1,180p'; rm -rf "$workdir"
workdir=$(mktemp -d); curl -L --fail --silent --show-error https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -o "$workdir/react-dom.tgz"; mkdir -p "$workdir/extract"; tar -xzf "$workdir/react-dom.tgz" -C "$workdir/extract"; cd "$workdir/extract/package"; nl -ba cjs/react-dom-client.development.js | sed -n '900,980p'; nl -ba cjs/react-dom-client.development.js | sed -n '24240,24270p'; rm -rf "$workdir"
```

Workspace/report inspection:

```sh
ls -la worker-progress | sed -n '1,120p'
test -f worker-progress/worker-034-scheduler-package-inventory.md && sed -n '1,120p' worker-progress/worker-034-scheduler-package-inventory.md || true
sed -n '1,260p' worker-progress/worker-034-scheduler-package-inventory.md
sed -n '260,520p' worker-progress/worker-034-scheduler-package-inventory.md
sed -n '520,760p' worker-progress/worker-034-scheduler-package-inventory.md
rg -n '^## (Objective|Summary|Package Identity Evidence|Public Root Entrypoint Inventory|Public Root Behavior Inventory|Auxiliary Entrypoints|React DOM Usage Evidence|Public Scheduler Is Not Internal React Scheduling|Black-Box Probe Results|Delegated Checks|Recommended Follow-Up Workers|Risks Or Blockers|Quality, Maintainability, Performance, And Security Review|Evidence Gathered|Commands Run|Changed Files|Completion Checklist)$' worker-progress/worker-034-scheduler-package-inventory.md
for pat in 'public `scheduler` package behavior' 'React DOM 19.2.6' 'scheduler@0.27.0' 'unstable_scheduleCallback' 'unstable_cancelCallback' 'unstable_shouldYield' 'unstable_requestPaint' 'host callback transport' 'two binary min-heaps' 'continuation' 'didTimeout' 'Public Scheduler Is Not Internal React Scheduling' 'Recommended Follow-Up Workers' 'Delegated Checks' 'Changed Files' 'Commands Run'; do rg -n "$pat" worker-progress/worker-034-scheduler-package-inventory.md >/dev/null || { echo "missing: $pat"; exit 1; }; done; echo 'prompt checklist keywords present'
if rg -n '/private/[v]ar|/[v]ar/folders|/[Tt]mp/|fast-react-runtime-inventor[y]-[A-Za-z0-9]|/[t]mp\.[A-Za-z0-9]+' worker-progress/worker-034-scheduler-package-inventory.md; then exit 1; else echo 'no concrete temp path leaks found'; fi
if rg -n '[ \t]+$' worker-progress/worker-034-scheduler-package-inventory.md; then exit 1; else echo 'no trailing whitespace found'; fi
for pat in 'Quality:' 'Maintainability:' 'Performance:' 'Security:' 'Node `v26.0.0`' 'npm `11.12.1`' 'worker-035-scheduler-package-scaffold' 'worker-038-scheduler-mock-oracle-and-implementation' 'no lane logic'; do rg -n "$pat" worker-progress/worker-034-scheduler-package-inventory.md >/dev/null || { echo "missing: $pat"; exit 1; }; done; echo 'audit keywords present'
wc -l worker-progress/worker-034-scheduler-package-inventory.md
git status --short --untracked-files=all
```

The npm commands printed an existing local warning about unknown user config
`minimum-release-age`; it did not affect successful metadata or tarball
commands.

## Changed Files

- `worker-progress/worker-034-scheduler-package-inventory.md`

## Completion Checklist

- Report-only inventory written: complete.
- Public `scheduler` package baseline tied to React DOM 19.2.6: complete.
- Public exports and priority constants inventoried: complete.
- Task ordering, delayed callbacks, cancellation, continuation callbacks, and
  `didTimeout` inventoried: complete.
- Current-priority APIs, yielding, paint requests, and host callback transport
  inventoried: complete.
- Auxiliary `unstable_mock`, `unstable_post_task`, and native entrypoints
  inventoried at package level: complete.
- Public package compatibility distinguished from internal React lane/root
  scheduling: complete.
- Non-overlapping follow-up workers with concrete write scopes recommended:
  complete.
- Delegated subagent checks summarized and used: complete.
- Exact commands and Node/npm versions recorded: complete.
- Evidence gathered, risks/blockers, changed files, and recommended next tasks
  listed: complete.
- Quality, maintainability, performance, and security review included:
  complete.
- Concrete local temp path leak check passed for this report: complete.
- No implementation code changed: complete.
