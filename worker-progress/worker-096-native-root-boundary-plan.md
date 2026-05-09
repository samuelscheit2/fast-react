# worker-096-native-root-boundary-plan

## Summary

Fast React should add the native root boundary only as a private bridge between
JS-owned React DOM facades and Rust-owned reconciler root state. Public
React DOM values must stay JS-owned: the public root object, DOM containers,
React elements, root option objects, errors, warnings, and callback functions
should not become native objects. The native layer should receive validated,
rooted inputs and return private opaque root handles or coarse operation
results only.

The root cause is that `createRoot`, `root.render`, and `root.unmount` are not
DOM mutation helpers. They are entry points into a reconciler `FiberRoot`,
HostRoot update queues, lane selection, scheduler work, commit ordering,
callback/error delivery, and unmount cleanup. A native boundary that exposes
small public-looking methods such as "render this element now" would bypass the
semantics that earlier workers identified as required for React 19.2.6.

This worker implemented no source behavior. The only intended changed file is
this report.

## Boundary Decision

Use two distinct root identities:

- Public JS root object: owned by `packages/react-dom`, shaped like React DOM's
  public `ReactDOMRoot`, and responsible for public warnings, option parsing,
  DOM container validation, and public error text.
- Private native root handle: owned by `bindings/node` and
  `crates/fast-react-napi`, opaque to application code, associated with one JS
  environment and one Rust reconciler root, and invalidated on unmount or
  environment cleanup.

The private handle must not be enumerable, serializable, accepted as a public
React value, or exposed as the `_internalRoot` value that user code can inspect.
The public root may store a closure or private symbol slot that reaches the
native bridge, but the actual native handle should remain behind package-local
state.

## Coarse JS-to-Rust Root Operations

The native API should start with coarse root operations after the Rust
reconciler root model exists:

1. `create_native_root(config)` creates a Rust `FiberRoot`/HostRoot record and
   returns an opaque handle. Inputs are already JS-validated and include a host
   container token, root kind, identifier prefix, strict mode, scheduler hooks,
   and rooted callback handles.
2. `enqueue_root_update(handle, update)` enqueues a HostRoot update payload,
   such as `{element}` or `null` for unmount. It selects or receives a lane
   through the reconciler boundary and returns scheduling metadata, not DOM
   mutations.
3. `perform_root_work(handle, budget_or_lanes)` runs a bounded work slice or
   sync flush through the root scheduler and returns coarse status such as
   completed, yielded, suspended, errored, or no work.
4. `flush_sync_roots(scope_token)` flushes sync work across all roots owned by
   the same JS environment when the React DOM dispatcher asks for it. It must
   not become a per-root shortcut.
5. `unmount_native_root(handle)` invalidates the handle after the public root
   has set `_internalRoot` to null, enqueues the sync `null` update, flushes,
   disposes callback roots, and releases Rust root storage.
6. `dispose_native_root(handle, reason)` releases a root without claiming React
   lifecycle compatibility for emergency cleanup paths such as environment
   teardown.

Do not expose per-element factory calls, per-host-node mutation calls, or public
React DOM root methods from `@fast-react/native`. Those would move observable
JS behavior into the native package before conformance evidence exists.

## Root Lifecycle

`createRoot` should remain a JS facade until DOM markers, root listener setup,
and reconciler roots exist. The eventual flow should be:

1. JS validates the DOM container and options.
2. JS creates root callback handles for `onUncaughtError`, `onCaughtError`, and
   `onRecoverableError`.
3. JS calls the private native root creation operation.
4. JS marks the container and installs delegated listeners through DOM-owned
   code.
5. JS returns the public root object.

`root.render(children)` should:

- reject calls after unmount from JS before crossing the native boundary;
- warn for unsupported callback/extra arguments in JS;
- pass the JS-owned element value as a rooted payload handle;
- call the coarse enqueue operation;
- let Rust enqueue a HostRoot update and schedule root work;
- return `undefined` from JS.

`root.unmount()` should:

- set the public `_internalRoot` slot to `null` before scheduling;
- enqueue a sync `null` HostRoot update through the native handle;
- flush sync work across roots, not only this root;
- unmark the DOM container after the flush;
- dispose all root-owned JS callback/value handles;
- invalidate the native root handle so later native operations fail with a
  typed disposed-handle error.

Hydration roots should reserve the same handle shape but use a distinct root
kind. The native boundary must not claim `hydrateRoot` compatibility until the
hydration root state, marker matching, event replay, and recoverable error
queues exist.

## Callback Rooting And Disposal

Rust must never store raw `napi_value` values, DOM nodes, JS functions, or
promise/thenable objects across turns. Any JS value that crosses into Rust and
survives the current call needs a package-owned handle table tied to one N-API
environment.

Recommended callback/value handle classes:

- root error callbacks: uncaught, caught, and recoverable callbacks;
- scheduler callbacks: microtask scheduling, Scheduler callback bridge, and
  continuation callbacks;
- root payload handles: React elements, `null` unmount payloads, thenables,
  refs, and future action/form values;
- commit callbacks: class callbacks, ref callbacks, layout/passive callbacks,
  and act/test callbacks.

Rules:

- Handles are created by JS or by the N-API bridge in the current environment.
- Handles carry root id, generation, kind, disposed flag, and whether invocation
  is allowed in render, commit, passive, scheduler, or cleanup phase.
- Disposing a root marks every root-owned handle disposed before dropping the
  native root arena.
- Calling a disposed callback returns a typed native boundary error before any
  JS invocation.
- JS callback errors are mapped back into reconciler error handling or scheduled
  asynchronous rethrows according to the caller phase. They are not converted
  into Rust panics.

This handle table belongs to the private native bridge. It must not be exposed
as a public registry or as a way for users to retain React internals.

## Thread And Reentrancy Rules

All user JS callbacks, host-config JS callbacks, DOM callbacks, refs, effects,
root error callbacks, thenable inspection, and scheduler callbacks must run on
the owning JS thread and N-API environment.

Initial rules:

- No background Rust thread may call user JS.
- Opaque handles are environment-local and must fail if used from another
  worker or N-API environment.
- Rust may compute renderer-agnostic work off-thread only after a future design
  proves no JS values, callbacks, DOM handles, or host-config calls are touched.
- Render and commit reentrancy is tracked at the native boundary. Calls that
  React warns about, such as flushing while already rendering, must report
  through JS-owned warning/error paths.
- Commit is non-interruptible. JS callbacks that schedule more work enqueue
  new updates rather than mutating the in-progress root state directly.
- Passive-effect flushing and `act` queue routing need explicit phase markers
  before callbacks can be invoked from Rust-driven work.

The JS facade remains the event-loop authority at first. Rust can request work
or return scheduling status; JS chooses the actual microtask, Scheduler, timer,
or act-queue transport.

## Native Load Guardrails

The current native loader intentionally imports without loading a `.node`
artifact. That guardrail should remain until real platform packages exist.

Required guardrails for the first root-boundary implementation:

- Keep `loadNativeBinding()` loud and typed until real artifacts exist.
- Preserve the Node engine floor and N-API floor from the accepted native
  strategy: Node `>=22.0.0`, N-API floor `8`.
- Add real N-API dependencies only in the worker that owns native binding and
  lockfile updates.
- Continue blocking install lifecycle scripts and postinstall downloads.
- Keep CJS and ESM entrypoints sharing one singleton loader state.
- Expose private native root operations only from the internal native package,
  not from public `react-dom` entrypoints.
- Add guards that fail if the placeholder or loader starts requiring platform
  packages, `.node` files, child processes, or network modules before the real
  loading worker owns that change.

Native package metadata is useful for release tooling, but metadata alone must
not be treated as native behavior.

## Error Mapping

Use separate error families instead of collapsing all failures into
`UnimplementedReactBehavior`.

Native boundary errors:

- native exports not built;
- native artifact missing or unsupported platform;
- invalid root handle;
- disposed root handle;
- wrong JS environment;
- callback handle disposed;
- callback kind or phase violation;
- reentrant call rejected by boundary policy;
- panic trapped before crossing N-API.

Reconciler errors:

- unsupported host capability;
- host operation error;
- invalid host tree update mode;
- render or commit error captured for React error handling;
- hydration or Suspense-specific root errors when those systems exist.

Public JS errors:

- invalid container;
- render after unmount;
- `react-dom/client` unsupported in React Server Components;
- public option/warning messages from React DOM behavior probes.

Native errors should include stable codes and structured metadata for tests, but
public React DOM errors should be manufactured by the JS facade so message
shape, stack behavior, warning timing, and realm identity stay JS-compatible.
Rust panics must be caught at the native boundary and converted to a fatal
native error or controlled JS exception. They must not unwind through N-API.

## Future Write Scopes

The following scopes are deliberately private and do not claim public React DOM
compatibility.

1. Native root boundary placeholders
   - Write scope: `bindings/node/index.cjs`, `bindings/node/index.mjs`,
     `bindings/node/test/*root*.{cjs,mjs}`,
     `crates/fast-react-napi/src/root.rs`,
     `crates/fast-react-napi/src/lib.rs`,
     `worker-progress/worker-native-root-boundary.md`.
   - Task: define private root handle metadata, typed handle errors, callback
     handle state machines, and tests that handles are opaque and disposed
     correctly. Keep native loading unavailable unless real artifacts are in
     scope.

2. N-API root exports after reconciler roots exist
   - Write scope: `crates/fast-react-napi/src/root.rs`,
     `crates/fast-react-napi/src/error.rs`,
     `crates/fast-react-napi/src/lib.rs`,
     `bindings/node/index.cjs`,
     `bindings/node/index.mjs`,
     `bindings/node/test/*root*.{cjs,mjs}`.
   - Task: add real private exports for create, enqueue update, perform work,
     flush sync roots, unmount, and dispose. Tests should prove the API is not
     public React DOM behavior and rejects stale, wrong-environment, and
     disposed handles.

3. Native callback rooting table
   - Write scope: `crates/fast-react-napi/src/callbacks.rs`,
     `crates/fast-react-napi/src/root.rs`,
     `bindings/node/test/*callback*.{cjs,mjs}`.
   - Task: implement JS callback references, phase/kind validation, root-owned
     disposal, and no-call-after-dispose checks. Add tests for callback throw
     mapping without invoking callbacks from background threads.

4. Loader activation and platform packages
   - Write scope: `bindings/node/**`,
     `crates/fast-react-napi/**`,
     root package lockfiles only if assigned by the orchestrator.
   - Task: add `napi-rs`, build real artifacts, declare per-platform optional
     packages, and preserve typed missing-artifact errors. This should remain
     separate from public React DOM facade work.

5. Public React DOM facade integration
   - Write scope: `packages/react-dom/**` and matching conformance/smoke tests,
     assigned separately after reconciler roots, DOM markers/listeners, and the
     native private root API exist.
   - Task: connect the public JS root object to the private native bridge while
     keeping public values JS-owned. This is the first scope that may make
     public behavior claims, and only with oracle evidence.

## Evidence Gathered

- `worker-progress/worker-006-binding-strategy.md`: accepted N-API first,
  Node `>=22`, N-API floor `8`, JS-owned public values, coarse native
  operations, JS scheduling authority, and no raw `napi_value` storage.
- `worker-progress/worker-015-native-loader-boundary.md`: native loading is a
  typed unavailable placeholder; CJS and ESM share one contract; native errors
  are separate from React behavior errors.
- `worker-progress/worker-032-native-boundary-guardrails.md`: the loader has a
  frozen manifest, target matrix, no lifecycle/download/native load paths, and
  tests guarding against `.node`, platform package, child process, or network
  loads.
- `worker-progress/worker-044-react-dom-client-roots-plan.md`: public roots
  create reconciler roots, enqueue HostRoot updates, use root error callbacks,
  flush sync work across roots, and require explicit callback rooting and
  reentrancy rules.
- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`:
  the native binding should expose private coarse root operations and opaque
  handles only after the Rust root API exists.
- `worker-progress/worker-070-core-update-queue-plan.md`,
  `worker-progress/worker-071-core-fiber-flags-effect-plan.md`,
  `worker-progress/worker-072-reconciler-root-work-loop-plan.md`, and
  `worker-progress/worker-073-test-renderer-update-model-plan.md`: updates,
  effects, scheduling, and test-renderer lifecycle must flow through shared
  reconciler root semantics, not renderer or facade shortcuts.
- Current `bindings/node/index.cjs` and `bindings/node/index.mjs`: loader
  metadata exists, but `loadNativeBinding()` always throws and no root API is
  exported.
- Current `crates/fast-react-napi/src/lib.rs`: native boundary metadata and
  placeholder errors exist, but no N-API dependencies, callback handles, or root
  operations exist.
- Current `crates/fast-react-reconciler/src/lib.rs`: only placeholder
  scheduler/render entry points exist; no `FiberRoot`, HostRoot queue, root
  scheduler, commit loop, or callback dispatch exists.
- `worker-progress/worker-079-reconciler-fiber-root-model-plan.md` is not
  present in this worktree, so this report treats that output as unavailable.

## Delegated Checks

Two nested read-only explorers were launched to test the boundary hypotheses:

- One checked whether private opaque native root handles and JS-owned public
  values are supported by the current native loader, N-API placeholder, and
  client root plans.
- One checked error mapping, thread/reentrancy rules, and native load
  guardrails for the same boundary.

Their final findings should be folded into this report if they return before
handoff. The direct evidence above was sufficient to draft the plan, and no
source edits depend on nested-agent output.

## Risks And Blockers

- Real reconciler roots do not exist yet. Native root exports should not be
  implemented before `FiberRoot`, HostRoot queues, root scheduler, commit
  ordering, and callback dispatch exist.
- Native loading is still deliberately unavailable. A real root boundary
  requires an assigned worker to add N-API dependencies and package artifacts.
- JS callback lifetime rules are easy to get wrong. Raw JS values, wrong-env
  handles, and background-thread callback invocation would be correctness and
  safety bugs.
- Public compatibility must not be claimed from private native tests. Public
  React DOM behavior needs separate React 19.2.6 oracle coverage.
- Hydration roots need a distinct state model and must not be represented as
  plain create-root handles with a boolean flag.
- The JS and Rust target matrices are duplicated today. A future packaging
  worker should generate or parity-check them before release.

## Recommended Next Tasks

1. Merge or regenerate the missing reconciler `FiberRoot`/HostRoot model plan,
   then implement root records before native root exports.
2. Add a private native root-boundary placeholder slice with opaque handle and
   disposed-handle tests, still with native loading unavailable.
3. Add callback rooting/disposal tests in the native package before real JS
   callbacks can be invoked from Rust-controlled phases.
4. Add typed native error variants for invalid root handle, disposed root,
   wrong environment, callback disposed, and callback phase violation.
5. After real N-API dependencies are in scope, implement coarse private root
   exports and keep public `react-dom/client` as JS-owned facade work.

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,240p' worker-progress/worker-006-binding-strategy.md`
- `sed -n '1,240p' worker-progress/worker-015-native-loader-boundary.md`
- `sed -n '1,240p' worker-progress/worker-032-native-boundary-guardrails.md`
- `sed -n '1,260p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`
- `sed -n '1,260p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md` when present; it was missing
- `rg --files bindings/node crates/fast-react-napi crates/fast-react-reconciler crates/fast-react-core crates/fast-react-host-config packages/react-dom worker-progress`
- `sed -n '1,260p' bindings/node/index.cjs`
- `sed -n '1,220p' bindings/node/index.mjs`
- `sed -n '1,620p' crates/fast-react-napi/src/lib.rs`
- `sed -n '1,320p' crates/fast-react-reconciler/src/lib.rs`
- `sed -n '1,320p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '1,260p' packages/react-dom/client.js`
- `sed -n '1,420p' worker-progress/worker-044-react-dom-client-roots-plan.md`
- `sed -n '1,360p' worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `sed -n '1,320p' worker-progress/worker-073-test-renderer-update-model-plan.md`
- `sed -n '1,320p' worker-progress/worker-070-core-update-queue-plan.md`
- `sed -n '1,320p' worker-progress/worker-071-core-fiber-flags-effect-plan.md`
- `sed -n '1,220p' bindings/node/package.json`
- `sed -n '1,220p' bindings/node/README.md`
- `rg -n "native|N-API|callback|handle|root handle|opaque|Threadsafe|thread|reentr|dispose|unmount|loadNativeBinding|NativeBoundaryError|FiberRoot|updateContainer|root\\.render|root\\.unmount" ...`
- `git status --short --branch`
- Ran a scoped local/temp path leak check on the report.
- `git diff --check -- worker-progress/worker-096-native-root-boundary-plan.md`

## Changed Files

- `worker-progress/worker-096-native-root-boundary-plan.md`

## Verification Checklist

- [x] Report-only scope: no source code was modified.
- [x] Public React DOM values remain JS-owned in the plan.
- [x] Private native root handles are opaque and disposable in the plan.
- [x] Root creation, update, work, unmount, and disposal calls are covered.
- [x] JS callback rooting, disposal, thread, and reentrancy rules are covered.
- [x] Native load guardrails and error mapping are covered.
- [x] Future write scopes include `bindings/node` and `fast-react-napi` without
      claiming public compatibility.
- [x] Final verification: scoped status, no concrete local path leaks, no
      trailing whitespace, and diff whitespace check.
