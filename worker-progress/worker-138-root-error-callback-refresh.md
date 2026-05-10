# Worker 138: Root Error And Callback Refresh

## Goal Evidence

- `create_goal` was called successfully before research or source reads for objective: `Produce a report-only refresh for root update callbacks, recoverable/uncaught root errors, and error-surface sequencing across reconciler, React DOM, and test renderer. Only write worker-progress/worker-138-root-error-callback-refresh.md.`
- `get_goal` immediately after setup confirmed status `active` for thread `019e0f9e-4bc1-7ea0-989c-f25c0a58a1c5` with no explicit token budget.
- `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` were read after goal setup. `ORCHESTRATOR.md` was not read.

## Summary

This is a report-only refresh. No source, tests, manifests, prompts, master docs,
or lockfiles were modified.

Root update callbacks, root error callbacks, public facade warnings, and
test-renderer public errors should stay split. React 19.2.6 does not treat them
as one error path:

- HostRoot update callbacks are stored on updates, collected during update-queue
  processing, and invoked later in commit layout callbacks.
- Uncaught and caught render/commit errors are represented as capture updates
  whose callbacks log through root `onUncaughtError` / `onCaughtError`.
- Recoverable errors are not update callbacks; they are reported near the end of
  commit through `root.onRecoverableError` after the tree has committed.
- React DOM root facade warnings for `createRoot`, `root.render`, and
  `root.unmount` are package-boundary diagnostics and must not enqueue callbacks.
- The test renderer has its own public `.root`, query, update, and act-flushed
  error surfaces. It should consume reconciler semantics later but not import
  React DOM facade behavior.

## Changed Files

- `worker-progress/worker-138-root-error-callback-refresh.md`

Untracked session artifact observed and left untouched:

- `.worker-logs/worker-138-root-error-callback-refresh.log`

## Evidence Gathered

Required local context:

- `WORKER_BRIEF.md`: worker rules, report sections, and goal-tool requirements.
- `MASTER_PLAN.md`: workers 130-139 are report-only, and worker 138 is the
  root error/callback sequencing refresh.
- `MASTER_PROGRESS.md`: workers 123-128 have landed FiberRoot/HostRoot,
  HostRoot update queues, and root scheduler foundation.
- `worker-progress/worker-087-react-test-renderer-error-surface-oracle.md`:
  test-renderer public error oracle is development `act()`-flushed behavior, not
  production/no-act timing.
- `worker-progress/worker-092-react-dom-create-root-facade-plan.md`: React DOM
  facade owns root options, root object shape, and warnings; callback failures
  must follow reconciler logging/rethrow behavior.
- `worker-progress/worker-109-reconciler-commit-minimum-implementation-plan.md`:
  commit order is prepare, before-mutation, mutation/reset, `root.current`
  switch, layout, then deferred passive work.
- `worker-progress/worker-124-host-root-update-queue.md`: callback handles are
  already stored and collected but never invoked in the HostRoot queue slice.

Current local source:

- `crates/fast-react-reconciler/src/root_config.rs` already has inert
  `RootOptions` handles for `on_uncaught_error`, `on_caught_error`, and
  `on_recoverable_error`, plus `RootUpdateCallbackHandle` remains separate from
  root error handles.
- `crates/fast-react-reconciler/src/fiber_store.rs` stores root options in
  `FiberRoot` during `create_client_root`.
- `crates/fast-react-reconciler/src/update_queue.rs` stores HostRoot update
  callbacks, collects visible callbacks during queue processing, and can defer
  hidden callbacks.
- `crates/fast-react-reconciler/src/root_updates.rs` accepts optional root
  update callback handles and tests that they are stored without invocation.
- `crates/fast-react-reconciler/src/root_scheduler.rs` schedules roots but still
  deliberately stops before render, commit, flush, or host mutation.
- `packages/react-dom/client.js` and `packages/react-dom/profiling.js` still
  expose unsupported `createRoot` placeholders.
- `crates/fast-react-test-renderer/src/lib.rs` is an in-memory mutation host,
  not a public `react-test-renderer` package facade or reconciler root API.

React 19.2.6 reference source:

- `ReactDOMRoot.js`: `createRoot` validates containers, warns in development,
  parses root options, calls `createContainer`, marks the container, installs
  root listeners, and returns the public root object.
- `ReactDOMRoot.js`: public `root.render` warns for second arguments and calls
  `updateContainer(children, root, null, null)`. It does not pass the callback
  argument through for concurrent roots.
- `ReactDOMRoot.js`: public `root.unmount` warns for callback arguments, nulls
  `_internalRoot`, schedules `updateContainerSync(null, root, null, null)`,
  flushes sync work, then unmarks the container.
- `ReactFiberReconciler.js`: `updateContainer` chooses a lane; the shared impl
  creates an update with payload `{element}`, normalizes the optional callback,
  enqueues the update, schedules the root, and entangles transitions.
- `ReactFiberClassUpdateQueue.js`: queue processing pushes non-null callbacks
  into `queue.callbacks`; `commitCallbacks` later invokes them with a context.
- `ReactFiberCommitEffects.js`: `commitRootCallbacks` computes the public root
  child instance and runs collected update callbacks during commit.
- `ReactFiberWorkLoop.js`: `root.current` switches after mutation/reset and
  before layout; recoverable errors are reported after commit bookkeeping through
  `root.onRecoverableError`.
- `ReactFiberThrow.js` and `ReactFiberErrorLogger.js`: root and boundary errors
  use capture-update callbacks to call `logUncaughtError` or `logCaughtError`;
  callback failures are deferred with `setTimeout`.
- `ReactTestRenderer.js`: test renderer uses `createContainer` with default root
  error callbacks, passes null update callbacks for create/update/unmount, and
  owns public `.root` and query errors.

Delegated checks:

- Two read-only explorers were spawned for React source and local source
  inspection. They were closed after repeated timeouts without final findings, so
  no delegated conclusions are incorporated in this report. The report evidence
  above comes from direct local inspection.

## React 19.2.6 Ordering Model

The compatible sequence to preserve is:

1. React DOM or test renderer creates a reconciler root with root error callback
   handles and other root options.
2. Public root methods enqueue HostRoot updates. Optional update callbacks are
   update data, not root options.
3. Begin-work/update-queue processing applies eligible updates, sets callback
   flags, and collects update callbacks onto the queue.
4. Commit runs before-mutation work, mutation work, host reset, then switches
   `root.current`.
5. Layout work invokes collected class/root callbacks. Root callbacks use the
   public instance derived from the committed root child.
6. If render error recovery generated a root capture update, its callback logs
   the uncaught root error through `root.onUncaughtError`.
7. If an error boundary captured the error, its update callback logs through
   `root.onCaughtError` and then runs boundary-specific `componentDidCatch` work
   where applicable.
8. Recoverable errors are reported after the commit using `root.onRecoverableError`
   under React's commit-time priority/transition guards.

This ordering means callback collection can land before callback invocation, and
recoverable error reporting should wait until a real commit path has a source of
recoverable errors.

## Source Slices

### 1. Root Options Handle Bridge

Ownership:

- Rust reconciler: `crates/fast-react-reconciler/src/root_config.rs`,
  `fiber_root.rs`, `fiber_store.rs`.
- JS facade bridge later: shared React DOM root option parser and JS callback
  handle registry, likely under `packages/react-dom/src/client/root-options.js`
  and a native/reconciler bridge module.

Gate:

- Preserve current Rust tests proving distinct root option handles.
- Add JS facade tests against the existing client-root oracle for
  `identifierPrefix`, `unstable_strictMode`, `onUncaughtError`,
  `onCaughtError`, and `onRecoverableError` storage.
- Prove callback handles are rooted/disposed without storing raw JS functions in
  Rust.

Non-overlap boundary:

- This slice only parses and stores options. It does not invoke callbacks, create
  capture updates, report recoverable errors, implement DOM mutations, or decide
  public test-renderer behavior.

### 2. HostRoot Update Callback Collection

Ownership:

- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- Future begin-work HostRoot queue processing if worker 129's render foundation
  consumes the queue.

Gate:

- Existing worker 124 tests should remain green for callback storage,
  collection, `NoLane` clone callback dropping, hidden callback deferral, and no
  invocation.
- Future HostRoot begin-work tests must prove queue processing sets callback
  flags on the work-in-progress HostRoot when visible callbacks are collected.

Non-overlap boundary:

- Collection stops at `CollectedRootUpdateCallback` data. It must not call JS,
  compute public instances, handle root error callbacks, log recoverable errors,
  or emit React DOM warnings.

### 3. Commit-Time Update Callback Invocation

Ownership:

- Future commit modules from worker 109's plan, especially
  `crates/fast-react-reconciler/src/commit_layout.rs` and
  `commit_effects.rs`.
- A future JS callback registry/dispatcher bridge owned by the JS package or
  NAPI layer, not by generic host mutation code.

Gate:

- Minimal commit must already switch `root.current` after mutation/reset and
  before layout.
- Public-instance lookup must exist for the committed root child in each
  renderer that enables callbacks.
- Tests must prove callback invocation order, callback context, hidden callback
  deferral, and that callback throws are captured as commit-phase errors rather
  than corrupting commit state.

Non-overlap boundary:

- Invocation consumes callbacks already collected by the queue. It does not
  parse `createRoot` options, install DOM listeners, recover hydration mismatches,
  or own test-renderer `.root`/query messages.

### 4. Uncaught And Caught Root Error Capture

Ownership:

- Future reconciler error modules, likely a Rust analogue to
  `ReactFiberThrow.js` and `ReactFiberErrorLogger.js`.
- Future render/commit error capture hooks in work-loop and commit modules.

Gate:

- A real render path can catch render throws and attach captured values with
  source/component stack information.
- A capture update can be enqueued on the HostRoot with payload `{element: null}`
  for uncaught root failure.
- Class/error-boundary support exists before `onCaughtError` compatibility is
  claimed.
- Callback failures from `onUncaughtError` / `onCaughtError` are deferred out of
  the commit stack, matching React's "must not throw from logger" behavior.

Non-overlap boundary:

- Uncaught root errors are not recoverable errors. Caught boundary errors are not
  React DOM facade warnings. Host operation failures should remain structured
  `HostError` / `ReconcilerError` values unless a defined React recovery path
  converts them into a captured render/commit error.

### 5. Recoverable Root Error Reporting

Ownership:

- Future work-loop/commit error reporting, after commit can carry
  `recoverableErrors`.
- Hydration and Suspense/concurrent recovery slices that actually produce
  recoverable errors.

Gate:

- The commit path can carry a list of captured recoverable errors from render to
  commit completion.
- `onRecoverableError` is invoked after the successful commit, with error info
  carrying component stack/digest-compatible fields.
- Tests prove reporting does not run for ordinary root render/update/unmount and
  does not reuse HostRoot update callback queues.

Non-overlap boundary:

- Do not wire `onRecoverableError` into the first client root render path merely
  because the option is stored. It should be dormant until hydration mismatch,
  Suspense recovery, or concurrent root recovery has source evidence.

### 6. React DOM Facade Warnings And Public Root Errors

Ownership:

- `packages/react-dom/client.js`
- `packages/react-dom/profiling.js`
- Future shared modules under `packages/react-dom/src/client/`.

Gate:

- Client-root oracle coverage from worker 046 and root render e2e oracle coverage
  from worker 121 must be consumed.
- Container marker and listener modules must remain the owners of duplicate root
  detection and listener side effects.
- Public `root.render` after unmount must throw `Cannot update an unmounted root.`

Non-overlap boundary:

- `root.render` second-argument warnings do not enqueue callbacks in concurrent
  roots. `root.unmount` callback warnings do not store callbacks. React DOM
  warning text is package facade work, not reconciler error recovery.

### 7. Test Renderer Error Surfaces

Ownership:

- Future public `react-test-renderer` package facade and bridge.
- `crates/fast-react-test-renderer` only as a host canary until a package facade
  consumes reconciler roots.

Gate:

- Worker 084 root lifecycle, worker 085 serialization, worker 086 act, and worker
  087 error-surface oracles remain the behavioral target.
- Public errors must be observed under development `act()` flushing for
  deterministic behavior.
- A Fast React test-renderer facade should compare against checked oracles before
  claiming compatibility.

Non-overlap boundary:

- Test renderer must not import React DOM container validation, markers,
  listeners, or root option parsing. Its root errors include `.root` after
  unmount, retained `TestInstance` access, query no/multiple match errors, and
  invalid create/update inputs.

## Recommended Sequencing

1. Keep the existing root option and HostRoot update callback storage as inert
   data until a commit layout phase exists.
2. After minimal commit lands, add callback invocation as a layout-only slice
   that consumes collected callbacks and proves callback throw isolation.
3. Add root uncaught error capture only after render can throw, capture values,
   enqueue HostRoot capture updates, and commit callbacks.
4. Add caught boundary error reporting only with class/error-boundary semantics.
5. Add recoverable error reporting only after a hydration/concurrent recovery
   source exists; do not wire it into ordinary root rendering.
6. Implement React DOM facade warnings/errors separately from reconciler callback
   invocation.
7. Implement test-renderer public errors after its root lifecycle and act
   surfaces are wired to the shared reconciler path.

## Future Completion Gates

Rust source gates for callback/error reconciler slices:

```sh
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features update_queue
cargo test -p fast-react-reconciler --all-features root_updates
cargo test -p fast-react-reconciler --all-features commit
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
```

JS facade/test-renderer gates:

```sh
node --test tests/conformance/test/react-dom-client-root-oracle.test.mjs
node --test tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs
node --test tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs
node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
npm test --workspace @fast-react/conformance
git diff --check
```

Merge gates:

- Callback collection tests prove no invocation.
- Commit callback tests prove invocation only after `root.current` switches.
- Root error tests prove uncaught root capture unmounts through a capture update
  and invokes `onUncaughtError` through a commit callback.
- Caught error tests prove `onCaughtError` remains boundary-owned.
- Recoverable tests prove `onRecoverableError` runs after commit and is not a
  HostRoot update callback.
- Facade warning tests prove warnings remain package diagnostics, not scheduler
  or reconciler side effects.
- Test renderer tests prove public messages without DOM marker/listener behavior.

## Risks Or Blockers

- No local render work loop, complete-work host tree, minimal commit, or public
  React DOM/test-renderer root bridge is present yet.
- There is no JS callback registry or main-thread invocation policy for root
  option callbacks or update callbacks.
- Component stack/captured-value modeling is not present, so error callback
  `errorInfo` compatibility cannot be claimed yet.
- `onRecoverableError` is especially easy to wire too early. It should stay
  option data until recoverable render/hydration paths exist.
- Public React DOM warnings and test-renderer public errors already have oracles;
  implementation should compare to them instead of inventing local messages.

## Recommended Next Tasks

1. After worker 129/root render foundation is accepted, add a narrow HostRoot
   queue processing check that sets callback flags without invocation.
2. Land minimal commit/root-current switching before any callback invocation
   implementation.
3. Add a JS callback handle registry design before invoking root error/update
   callbacks from Rust or NAPI.
4. Build root uncaught error capture as a separate slice from recoverable error
   reporting.
5. Keep React DOM facade warnings and test-renderer public error surfaces in
   package-specific workers with oracle comparisons.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The slice boundaries mirror React's sequencing instead of treating all errors
  and callbacks as a single callback bus.
- Recoverable errors are deliberately gated behind real recovery sources.

Maintainability:

- Root options, update callback collection, commit callback invocation, root
  error capture, recoverable reporting, React DOM warnings, and test-renderer
  messages can move independently.

Performance:

- Callback storage remains handle-based and queue-owned until commit. There is no
  per-update JS invocation or facade-level synchronous rendering shortcut.

Security:

- Rust should store opaque JS callback handles only. Actual JS invocation needs a
  main-thread registry/disposal policy and must not happen from background
  scheduler work.

## Commands Run

```sh
create_goal
get_goal
if [ -f worker-progress/worker-138-root-error-callback-refresh.md ]; then sed -n '1,120p' worker-progress/worker-138-root-error-callback-refresh.md; else printf 'MISSING\n'; fi
nl -ba WORKER_BRIEF.md
nl -ba MASTER_PLAN.md
nl -ba MASTER_PROGRESS.md
nl -ba worker-progress/worker-087-react-test-renderer-error-surface-oracle.md
nl -ba worker-progress/worker-092-react-dom-create-root-facade-plan.md
nl -ba worker-progress/worker-109-reconciler-commit-minimum-implementation-plan.md
nl -ba worker-progress/worker-124-host-root-update-queue.md
spawn_agent react_error_callback_source
spawn_agent local_error_callback_state
wait_agent
close_agent react_error_callback_source
close_agent local_error_callback_state
rg --files crates packages tests worker-progress
git status --short --untracked-files=all
rg -n "callback|recoverable|uncaught|caught|onRecoverableError|onUncaughtError|onCaughtError|RootUpdateCallback|createRoot|root\\.render|root\\.unmount|error" crates packages tests worker-progress -g '!worker-progress/worker-138-root-error-callback-refresh.md' -g '!ORCHESTRATOR.md'
nl -ba crates/fast-react-reconciler/src/root_config.rs
nl -ba crates/fast-react-reconciler/src/fiber_root.rs
nl -ba crates/fast-react-reconciler/src/update_queue.rs
nl -ba crates/fast-react-reconciler/src/root_updates.rs
nl -ba crates/fast-react-reconciler/src/root_scheduler.rs
nl -ba crates/fast-react-reconciler/src/lib.rs
nl -ba crates/fast-react-reconciler/src/fiber_store.rs
nl -ba packages/react-dom/client.js
nl -ba packages/react-dom/profiling.js
nl -ba packages/react-dom/src/client/dom-container.js
nl -ba packages/react-dom/src/client/root-markers.js
nl -ba packages/react-dom/src/events/root-listeners.js
nl -ba crates/fast-react-test-renderer/src/lib.rs
rg --files packages crates tests | rg 'test-renderer|react-test-renderer'
rg -n "onUncaughtError|onCaughtError|onRecoverableError|defaultOnUncaughtError|defaultOnCaughtError|defaultOnRecoverableError|createContainer|updateContainer|updateContainerSync|callback" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src /Users/user/Developer/Developer/react-reference/packages/react-dom/src /Users/user/Developer/Developer/react-reference/packages/react-test-renderer/src
rg -n "logUncaughtError|logCaughtError|onRecoverableError|recoverableErrors|firstUncaughtError|ReactFiberErrorLogger|queue.*callback|commit.*callback|callCallback" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src /Users/user/Developer/Developer/react-reference/packages/react-dom/src /Users/user/Developer/Developer/react-reference/packages/react-test-renderer/src
rg -n "does not support the second callback argument|render\\(|unmount\\(|createRoot\\(|hydrateRoot\\(|options" /Users/user/Developer/Developer/react-reference/packages/react-dom/src/client /Users/user/Developer/Developer/react-reference/packages/react-test-renderer/src
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMRoot.js | sed -n '105,260p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-dom/src/client/ReactDOMRoot.js | sed -n '274,380p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberReconciler.js | sed -n '1,220p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberReconciler.js | sed -n '320,475p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRoot.js | sed -n '1,220p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-test-renderer/src/ReactTestRenderer.js | sed -n '288,650p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberErrorLogger.js | sed -n '1,230p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberThrow.js | sed -n '80,180p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '1480,1620p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '3400,3605p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '3670,3905p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js | sed -n '4070,4115p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberClassUpdateQueue.js | sed -n '620,770p'
nl -ba /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitEffects.js | sed -n '500,620p'
nl -ba tests/conformance/src/react-dom-client-root-scenarios.mjs | sed -n '1,260p'
nl -ba tests/conformance/src/react-dom-root-render-e2e-scenarios.mjs | sed -n '1,260p'
nl -ba tests/conformance/src/react-test-renderer-error-surface-scenarios.mjs | sed -n '1,260p'
nl -ba tests/conformance/src/react-test-renderer-root-lifecycle-scenarios.mjs | sed -n '1,240p'
nl -ba worker-progress/worker-121-root-render-e2e-oracle.md | sed -n '1,240p'
nl -ba worker-progress/worker-046-react-dom-client-root-oracle.md | sed -n '1,260p'
git diff --check
out=$(git diff --no-index --check /dev/null worker-progress/worker-138-root-error-callback-refresh.md 2>&1); rc=$?; if [ -n "$out" ]; then printf '%s\n' "$out"; exit 1; fi; if [ "$rc" -gt 1 ]; then exit "$rc"; fi
allowed='^worker-progress/worker-138-root-error-callback-refresh\.md$'; files=$( { git diff --name-only; git ls-files --others --exclude-standard; } | grep -v '^\.worker-logs/' || true ); bad=$(printf '%s\n' "$files" | sed '/^$/d' | grep -Ev "$allowed" || true); if [ -n "$bad" ]; then printf '%s\n' "$bad"; exit 1; fi; printf '%s\n' "$files"
git status --short --untracked-files=all
```

## Verification

Passed:

```sh
git diff --check
git diff --no-index --check /dev/null worker-progress/worker-138-root-error-callback-refresh.md
scoped changed-path check allowing only worker-progress/worker-138-root-error-callback-refresh.md, excluding .worker-logs/
```

Final status showed only the assigned report and the untracked session log:

```sh
?? .worker-logs/worker-138-root-error-callback-refresh.log
?? worker-progress/worker-138-root-error-callback-refresh.md
```
