# worker-142-native-js-bridge-refresh

## Summary

This is a report-only refresh for the native/JS bridge surface that React,
React DOM, scheduler, and future react-test-renderer facades should use when
they can call Rust internals without claiming unsupported behavior.

The bridge should stay private and slice-based. Current Rust internals now have
more root foundation than worker 096 recorded: `FiberRootStore`,
`FiberRootId`, HostRoot state, root options, HostRoot update queues,
`update_container`, `update_container_sync`, root scheduler records, and
internal scheduler bridge records exist. That is still not enough to expose a
native facade as public React behavior because native loading is unavailable,
`fast-react-napi` has no N-API dependencies or exports, and the reconciler still
does not render, commit, flush effects, invoke JS callbacks, or mutate host
containers.

## Goal Setup Evidence

- `create_goal` was called first for objective: "Produce a report-only refresh
  for worker 142 covering the native/JS bridge needed for React, React DOM,
  scheduler, and test-renderer facades to call Rust internals without claiming
  unsupported behavior."
- `get_goal` returned status `active` for the same objective before file
  inspection or report edits.
- Goal evidence was gathered before reading `WORKER_BRIEF.md`; `WORKER_BRIEF.md`
  was then read before other project context.
- `ORCHESTRATOR.md` was not read.

## Bridge Surface Slices

1. Native loader and manifest slice
   - Keep `@fast-react/native` importable through CJS and ESM.
   - Keep `loadNativeBinding()` loud and typed until platform artifacts exist.
   - Preserve one shared loader contract, the target matrix, Node `>=22.0.0`,
     N-API floor `8`, and no install/download/native-load side effects.
   - No React, React DOM, scheduler, or test-renderer facade should call a real
     native export until this slice has actual N-API dependencies and artifacts.

2. Private environment and handle-table slice
   - Add a native bridge environment record before root integration. It should
     own per-Node-environment stores for roots, rooted JS values, callback
     references, scheduler callback tokens, and host tokens.
   - Handles must carry kind, environment id, generation, root id when
     applicable, phase permissions, and disposed state.
   - Rust must never retain raw `napi_value`, DOM nodes, JS functions, promises,
     thenables, or React elements outside the current call. Persistent values
     must be represented by bridge-owned rooted handles.

3. Root store and HostRoot update slice
   - Map a private native root handle to one Rust `FiberRootId` plus bridge
     generation metadata.
   - Expose private operations only: create client root, enqueue root update,
     enqueue sync unmount payload, schedule root, process root schedule
     microtask, collect sync flush plan, and dispose root.
   - Use current Rust `RootOptions`, `RootElementHandle`,
     `RootUpdateCallbackHandle`, `RootErrorCallbackHandle`, and
     `RootRecoverableErrorCallbackHandle`; do not expose those raw handles to
     application code.
   - Do not claim `root.render`, `root.unmount`, `flushSync`, `act`, or
     hydration compatibility from this slice. Current Rust enqueues and
     schedules records, but does not perform the render/commit work loop.

4. Scheduler transport slice
   - Keep public `scheduler` JS behavior separate from the reconciler's
     internal scheduler bridge.
   - Native root scheduling may return structured microtask and callback
     requests to JS. JS remains responsible for choosing microtask, Scheduler,
     timer, postTask, or act-queue transport.
   - Scheduler callback handles are bridge-owned callback identities, not
     public scheduler task objects.

5. Render/commit result slice
   - Only after render and commit exist, add bounded work operations that return
     coarse statuses such as no work, yielded, completed, suspended, errored,
     committed, passive pending, or fatal native boundary error.
   - Host operations must flow through renderer-owned host config adapters.
     Native bridge calls must not expose per-DOM-node mutation helpers.

6. Test renderer facade slice
   - There is no current JS `react-test-renderer` package entrypoint in
     `packages/*`; only `crates/fast-react-test-renderer` exists as an
     in-memory mutation host-config proof.
   - A future JS facade should use the same private root/update/work surface as
     React DOM, with a test-renderer host adapter and serializer layered on top.
   - `create`, `act`, `toJSON`, `toTree`, `update`, `unmount`,
     `getInstance`, `root`, and error-surface exports must stay placeholder-only
     until the shared Rust root render and commit path is proven.

## Data Ownership Boundaries

- JS facades own public values: React elements, JSX output, public root
  objects, DOM containers, public scheduler task objects, option objects,
  warnings, public error messages, and callback functions.
- The native bridge owns private handles: native root handles, rooted value
  handles, callback handles, scheduler callback handles, microtask request
  handles, host tokens, and environment-local generation checks.
- Rust reconciler owns renderer-agnostic state: `FiberRootStore`, `FiberRootId`,
  fibers, lanes, update queues, HostRoot state, root scheduler state, and
  internal scheduler bridge records.
- Renderer adapters own host behavior: DOM markers/listeners/mutations belong
  to React DOM; in-memory host records and serialization belong to the future
  test renderer; platform scheduler transport belongs to JS until a proven
  native scheduler surface exists.
- Public root objects may store a private symbol or closure that reaches the
  bridge. They must not expose native handles as enumerable, serializable, or
  user-reusable values.
- Hydration must use a distinct root kind and state path. It should not be a
  boolean option on a client-root handle, and `hydrateRoot` should remain
  placeholder-only until marker matching, event replay, recoverable error
  queues, and hydration lanes exist.

## Error Propagation

- Native loader errors stay separate from React behavior errors. Current
  `FastReactNativeBindingUnavailableError` and Rust `NativeBoundaryError` are
  the right family for missing exports/artifacts.
- Add native boundary codes before real root exports for invalid handle,
  disposed handle, stale generation, wrong JS environment, wrong handle kind,
  callback disposed, callback phase violation, reentrant native entry, missing
  native export, unsupported platform/artifact, and panic trapped before N-API.
- Reconciler errors such as `FiberRootStoreError`, `RootUpdateError`,
  `RootSchedulerError`, `UpdateQueueError`, `ConcurrentUpdateError`,
  `WorkInProgressError`, and host operation errors should map to structured
  bridge failures for tests, then to public JS behavior only in the owning
  facade.
- Public React and React DOM messages should be manufactured by JS facades so
  message text, warning timing, stack shape, and realm identity can match React
  19.2.6 oracles.
- JS callback throws must re-enter React error handling, recoverable error
  callbacks, act queues, or async rethrow paths based on phase. They must not be
  converted to Rust panics, swallowed, or invoked from background threads.
- Rust panics must be caught at the native boundary and converted to a fatal
  native boundary error or controlled JS exception. They must not unwind through
  N-API.

## Facade Status And Placeholder Rules

- `@fast-react/react`
  - Can stay JS-owned for element factories, symbols, refs, context, wrappers,
    `Children`, and class placeholders already implemented in JS.
  - Hooks, `act`, `startTransition`, `use`, cache APIs, and dispatcher-backed
    internals should remain placeholder-only until function component render,
    hook queues, effects, dispatcher switching, and act/sync-flush routing are
    proven through Rust root work.

- `@fast-react/react-dom`
  - `unstable_batchedUpdates` may remain JS passthrough behavior.
  - `createPortal`, `flushSync`, form/resource helpers, and profiling entrypoint
    root exports should stay placeholder-only until host mutation, event/node
    mapping, passive/ref lifecycle, forms/resources, and sync flush semantics
    exist.
  - `react-dom/client` `createRoot` may connect to native only after JS
    container validation, container markers/listeners, private root handle
    creation, HostRoot update scheduling, render/commit, unmount cleanup, and
    callback/error delivery are all covered by oracles.
  - `hydrateRoot` must stay placeholder-only longer than `createRoot`.

- `scheduler`
  - Current default scheduler and mock scheduler are JS implementations.
  - `scheduler/index.native.js` has a runtime fallback path for
    `nativeRuntimeScheduler` and deliberately throws `Not implemented.` for
    `unstable_forceFrameRate`, `unstable_next`, `unstable_runWithPriority`, and
    `unstable_wrapCallback` when native runtime support is absent.
  - Do not route public scheduler exports through `@fast-react/native` until the
    internal root scheduler bridge has transport tests proving callback
    identity, priority, cancellation, yielding, time, and reentrancy behavior.

- `react-test-renderer`
  - No JS package entrypoint exists in this checkout.
  - The Rust test-renderer crate is a host-config proof, not a React facade.
  - All public test-renderer APIs should remain absent or placeholder-only until
    the shared root render/commit path can drive a test host, serialize output,
    and reproduce root lifecycle, `act`, and error-surface oracles.

## Test Strategy

- Loader and package tests
  - Keep CJS/ESM parity tests for `@fast-react/native`.
  - Keep no-load guards that fail on `.node`, platform package, child process,
    HTTP/HTTPS, fetch, postinstall, install scripts, or network paths before a
    native-loading worker owns that change.
  - Add JS/Rust target matrix parity once real artifacts are introduced.

- Native bridge unit tests
  - Test handle creation, kind validation, wrong-environment rejection, stale
    generation rejection, dispose idempotence, no-call-after-dispose, and phase
    permissions before exposing root operations.
  - Test structured error codes and metadata without claiming public React
    behavior.

- Reconciler bridge tests
  - Exercise private create-root, enqueue update, enqueue sync unmount,
    `ensure_root_is_scheduled`, microtask processing, callback scheduling,
    callback cancellation, and sync flush plan collection against Rust records.
  - Assert no render, commit, host mutation, callback invocation, or public root
    message occurs in the private bridge slice.

- Public facade tests
  - Keep placeholder smoke tests until each facade has a proven vertical slice.
  - For public behavior, use React 19.2.6 npm/runtime oracles and dual-run
    Fast React comparisons before changing placeholder status.
  - Add facade integration tests only after private native tests pass; they
    should verify JS-owned public errors and warnings, not native error text.

- Conformance gates
  - Add root render/update/unmount canaries only after render and commit exist.
  - Add scheduler-native conformance only after the bridge can prove transport
    semantics beyond current JS fallback behavior.
  - Add react-test-renderer serialization, root lifecycle, `act`, and error
    surface tests only after the shared root path can drive the test host.

## Quality, Maintainability, Performance, And Security Review

- Quality: The report separates private bridge readiness from public
  compatibility claims and updates stale native-root assumptions with current
  Rust root/scheduler evidence.
- Maintainability: The proposed slices keep loader activation, handle tables,
  root operations, scheduler transport, render/commit, and test-renderer facade
  work independently testable.
- Performance: The bridge should use coarse root and scheduler operations so
  hot public APIs do not cross N-API per element, host node, or callback
  bookkeeping step.
- Security: The bridge should continue to fail closed until artifacts exist,
  avoid install/download side effects, reject wrong-environment handles, and
  prevent raw JS value retention or background-thread JS invocation.

## Evidence Gathered

- `WORKER_BRIEF.md`: confirms report-only progress file requirements,
  `create_goal`/`get_goal` ordering, and final report sections.
- `MASTER_PLAN.md`: worker 142 is report-only in the active M3-M8 queue, with
  the project driving toward minimal root render/update/unmount.
- `MASTER_PROGRESS.md`: accepted history now includes FiberRoot/HostRoot,
  update queues, root scheduler foundation, scheduler native entrypoint work,
  and scheduler smoke integration.
- `bindings/node/index.cjs` and `bindings/node/index.mjs`: native loader
  exposes manifest/load-plan metadata but `loadNativeBinding()` always throws.
- `bindings/node/package.json`: current native package exports CJS/ESM loader
  entrypoints and has Node `>=22.0.0`.
- Current package entrypoints:
  - `packages/react/package.json` exports React, JSX runtime, dev JSX runtime,
    compiler runtime, and package metadata.
  - `packages/react-dom/package.json` exports root, client, server/static
    variants, profiling, test-utils, and package metadata.
  - `packages/scheduler/package.json` is private and has no exports map; entry
    files are direct CJS files.
  - No `packages/react-test-renderer/package.json` exists.
- `packages/react/index.js`: dispatcher-backed APIs and `act` are still
  unimplemented placeholders; element/ref/context/wrapper/class helpers are JS.
- `packages/react-dom/client.js` and `packages/react-dom/index.js`: client root,
  hydration, portals, flushSync, forms, and resource APIs are placeholders;
  batched updates is JS passthrough.
- `packages/scheduler/index.js`, `index.native.js`, and CJS variants:
  default/mock/postTask are JS implementations; native entrypoint can use a
  global `nativeRuntimeScheduler` but otherwise falls back or throws for
  unsupported helpers.
- `crates/fast-react-napi/src/lib.rs`: native Rust crate is still placeholder
  metadata and a `NativeBoundaryError`; no N-API dependencies, callbacks, or
  root exports exist.
- `crates/fast-react-reconciler/src/lib.rs`: root, update queue, scheduler, and
  work-in-progress records are exported, while render/mutation entrypoints are
  still placeholders.
- `crates/fast-react-reconciler/src/fiber_store.rs`: `FiberRootStore` creates
  concurrent client roots with HostRoot current fibers and typed root ids.
- `crates/fast-react-reconciler/src/root_updates.rs`: `update_container` and
  `update_container_sync` enqueue HostRoot payloads and mark lanes, but do not
  render, flush, commit, or mutate host containers.
- `crates/fast-react-reconciler/src/root_scheduler.rs` and
  `scheduler_bridge.rs`: root scheduler and internal callback/microtask records
  exist, but remain deterministic records rather than public scheduler behavior.
- `crates/fast-react-test-renderer/src/lib.rs`: Rust test renderer is a
  deterministic in-memory mutation host-config implementation, not a JS
  React test-renderer facade.
- `worker-progress/worker-015-native-loader-boundary.md`: native loading is a
  typed placeholder and native errors are separate from React behavior errors.
- `worker-progress/worker-032-native-boundary-guardrails.md`: loader guardrails
  reject accidental `.node`, optional platform package, child process, and
  network loading.
- `worker-progress/worker-096-native-root-boundary-plan.md`: private native root
  handles, JS-owned public values, callback rooting, thread/reentrancy rules,
  and error families remain the correct boundary direction, but its statement
  that FiberRoot/HostRoot records did not exist is now stale.

No delegated subagents were used.

## Risks Or Blockers

- Native loading and N-API exports do not exist yet. Any facade-to-native call
  would currently have to cross an unavailable binding.
- Root records and scheduling records exist, but render, complete work, commit,
  passive effects, refs, host mutation, callback invocation, and public root
  cleanup are still missing.
- JS callback rooting is a high-risk boundary. Wrong-environment handles,
  stale handles, raw JS value retention, or background-thread JS invocation
  would be correctness and safety bugs.
- Public scheduler behavior and the reconciler scheduler bridge are easy to
  conflate. The public package must not expose internal root scheduling records
  as scheduler tasks.
- Hydration, forms/resources, event/node maps, Suspense/Offscreen, and
  test-renderer serialization all require later slices before public behavior
  claims are safe.
- The root workspace currently has Node `>=26.0.0`, while `@fast-react/native`
  records Node `>=22.0.0`. This may be intentional boundary policy, but release
  owners should keep package/runtime claims synchronized before publishing.

## Recommended Next Tasks

1. Add a private native bridge placeholder module with environment-local handle
   tables and typed errors, still without native loading.
2. Add real N-API dependencies, platform artifacts, and lockfile updates only
   in a worker explicitly scoped to native loading.
3. Implement private native root operations after the handle table exists:
   create client root, enqueue root update, enqueue sync unmount, schedule root,
   process schedule microtask, collect sync flush plan, and dispose root.
4. Add callback rooting/disposal and wrong-environment tests before Rust can
   invoke JS callbacks.
5. Keep `react-dom/client`, `flushSync`, `act`, hydration, scheduler-native,
   and react-test-renderer public facades placeholder-only until a Rust
   render/commit vertical slice is proven by React 19.2.6 oracles.
6. Add package-surface work for a future JS `react-test-renderer` facade only
   after the shared root path can drive `fast-react-test-renderer`.

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,240p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' bindings/node/index.cjs`
- `sed -n '1,260p' bindings/node/index.mjs`
- `rg --files -g 'package.json' -g '!node_modules' -g '!target'`
- `sed -n '1,260p' worker-progress/worker-015-native-loader-boundary.md`
- `sed -n '1,300p' worker-progress/worker-032-native-boundary-guardrails.md`
- `sed -n '1,300p' worker-progress/worker-096-native-root-boundary-plan.md`
- `sed -n '300,430p' worker-progress/worker-096-native-root-boundary-plan.md`
- `sed -n '1,240p' package.json`
- `sed -n '1,220p' bindings/node/package.json`
- `sed -n '1,260p' packages/react/package.json`
- `sed -n '1,260p' packages/react-dom/package.json`
- `sed -n '1,260p' packages/scheduler/package.json`
- `rg --files packages/react packages/react-dom packages/scheduler bindings/node tests -g '!node_modules' -g '!target'`
- `sed -n '1,260p' packages/react/index.js`
- `sed -n '1,240p' packages/react/element-factory.js`
- `sed -n '1,260p' packages/react-dom/client.js`
- `sed -n '1,280p' packages/react-dom/index.js`
- `sed -n '1,260p' packages/scheduler/index.js`
- `sed -n '1,260p' packages/scheduler/index.native.js`
- `find . -path './node_modules' -prune -o -path './target' -prune -o -iname '*test*renderer*' -print`
- `sed -n '1,260p' packages/scheduler/cjs/scheduler.development.js`
- `sed -n '1,260p' packages/scheduler/cjs/scheduler.native.development.js`
- `sed -n '300,395p' packages/scheduler/cjs/scheduler.native.development.js`
- `sed -n '1,260p' packages/scheduler/cjs/scheduler-unstable_mock.development.js`
- `sed -n '1,240p' packages/scheduler/unstable_post_task.js`
- `sed -n '1,240p' packages/scheduler/unstable_mock.js`
- `sed -n '1,220p' crates/fast-react-test-renderer/Cargo.toml`
- `rg --files crates/fast-react-test-renderer`
- `sed -n '1,260p' crates/fast-react-test-renderer/src/lib.rs`
- `sed -n '1,360p' crates/fast-react-napi/src/lib.rs`
- `rg --files crates/fast-react-reconciler crates/fast-react-core crates/fast-react-host-config`
- `rg -n "FiberRoot|HostRoot|update_container|schedule|lane|flush|commit|root" crates/fast-react-reconciler crates/fast-react-core -g '*.rs'`
- `rg -n "native|N-API|napi|bridge|binding|root handle|callback" worker-progress/worker-096-native-root-boundary-plan.md worker-progress/worker-135-react-dom-root-bridge-refresh.md worker-progress/worker-133-test-renderer-root-refresh.md worker-progress/worker-144-scheduler-regression-refresh.md 2>/dev/null`
- `sed -n '1,360p' crates/fast-react-reconciler/src/lib.rs`
- `sed -n '1,360p' crates/fast-react-reconciler/src/root_updates.rs`
- `sed -n '1,360p' crates/fast-react-reconciler/src/fiber_store.rs`
- `sed -n '1,360p' crates/fast-react-reconciler/src/root_scheduler.rs`
- `sed -n '1,320p' crates/fast-react-reconciler/src/scheduler_bridge.rs`
- `sed -n '1,360p' crates/fast-react-reconciler/src/root_config.rs`
- `rg -n "exports\\.unstable|module\\.exports|exports\\.log|exports\\.unstable_yieldValue|unstable_" packages/scheduler/cjs/scheduler.development.js packages/scheduler/cjs/scheduler.native.development.js packages/scheduler/cjs/scheduler-unstable_mock.development.js packages/scheduler/cjs/scheduler-unstable_post_task.development.js`
- `sed -n '1,220p' packages/scheduler/cjs/scheduler-unstable_post_task.development.js`
- `rg -n "unsupported|unimplemented|placeholder|createUnsupportedFunction|createUnimplementedFunction" packages/react packages/react-dom tests/smoke tests/conformance/test -g '!node_modules'`
- `find packages -maxdepth 2 -type f -name 'package.json' -o -type d -name '*test*renderer*'`
- `test -f worker-progress/worker-142-native-js-bridge-refresh.md && sed -n '1,260p' worker-progress/worker-142-native-js-bridge-refresh.md || true`
- `git diff --check`
- `git status --short --untracked-files=all`
- `git diff --name-only`
- `git ls-files --others --exclude-standard`
- `git status --short --untracked-files=all -- worker-progress/worker-142-native-js-bridge-refresh.md`
- `git diff --name-only -- . ':(exclude)worker-progress/worker-142-native-js-bridge-refresh.md'`
- `git status --short --untracked-files=all -- . ':(exclude)worker-progress/worker-142-native-js-bridge-refresh.md'`
- `git diff --check --no-index -- /dev/null worker-progress/worker-142-native-js-bridge-refresh.md`

## Changed Files

- `worker-progress/worker-142-native-js-bridge-refresh.md`

## Verification

- `git diff --check`: passed with no output.
- `git diff --check --no-index -- /dev/null worker-progress/worker-142-native-js-bridge-refresh.md`:
  emitted no whitespace warnings. Exit code was `1` because `--no-index`
  compares an absent file to a real new report file.
- Scoped report status:
  `git status --short --untracked-files=all -- worker-progress/worker-142-native-js-bridge-refresh.md`
  showed only `?? worker-progress/worker-142-native-js-bridge-refresh.md`.
- Tracked changed-path check outside the allowed report:
  `git diff --name-only -- . ':(exclude)worker-progress/worker-142-native-js-bridge-refresh.md'`
  passed with no output.
- Full status also showed
  `?? .worker-logs/worker-142-native-js-bridge-refresh.log`, a session log
  outside the report scope. I did not modify or remove it.
