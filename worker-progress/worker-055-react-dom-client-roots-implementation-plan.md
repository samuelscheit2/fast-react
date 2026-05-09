# worker-055-react-dom-client-roots-implementation-plan

## Summary

React DOM client roots should be implemented as a cross-layer root system, not as a package-level placeholder and not as direct DOM mutation from `root.render`. In React DOM 19.2.6, `createRoot` and `hydrateRoot` validate and mark a DOM container, create a reconciler `FiberRoot`, install delegated root events, and return a small public root object. `root.render(children)` and `root.unmount()` only enqueue HostRoot updates; render work is selected by lane priority, scheduled through the root scheduler, and committed through host-config operations.

The implementation sequence should therefore start below the public facade: core lane/root bookkeeping, lane-backed event priorities, reconciler root records, HostRoot update queues, root scheduling, commit hooks, and host token/root lifecycle support. DOM container validation, root markers, node maps, and listener installation should then land in the DOM adapter. Only after those pieces exist should `packages/react-dom/client.js` expose behavior-compatible `createRoot`, `hydrateRoot`, `root.render`, and `root.unmount`.

No code was implemented in this worker. The only intended changed file is this report.

## Current Local State

- `packages/react-dom/client.js` currently exports loud unsupported placeholders for `createRoot` and `hydrateRoot`.
- `packages/react-dom/profiling.js` also exposes placeholder `createRoot`, `hydrateRoot`, and `flushSync`, so profiling roots must wait for normal client roots.
- `crates/fast-react-core/src/lane.rs` already provides React 19.2.6 `Lane`, `Lanes`, `LaneIndex`, and `LaneMap<T>` primitives.
- `crates/fast-react-reconciler/src/lib.rs` still has only placeholder render/scheduler entry points and no `FiberRoot`, HostRoot fiber, update queue, root scheduler, or commit work loop.
- `crates/fast-react-host-config/src/lib.rs` has the capability-grouped host boundary and token-aware lifecycle hooks from the merged DOM host token boundary work.
- Worker 046 is marked `running` in `MASTER_PLAN.md` and `MASTER_PROGRESS.md`, and no `worker-progress/worker-046-react-dom-client-root-oracle.md` exists in this worktree. I treated worker 046 as unavailable and did not use its output.

## Evidence Used

Required merged worker reports:

- `worker-progress/worker-007-scheduler-fiber.md`: React 19.2.6 requires lane bitsets, explicit `FiberRoot` scheduling state, Scheduler task heaps, circular/rebased update queues, and flag/subtreeFlag commit traversal. This rules out FIFO root queues, flat priority enums, and global effect lists.
- `worker-progress/worker-008-renderer-host-config.md`: the host boundary must use opaque host handles and explicit capability traits. Event/update priority, hydration, portals, microtasks, resources, singletons, forms, and diagnostics are host capabilities, not renderer-agnostic core details.
- `worker-progress/worker-030-core-lane-model.md`: the core already has the lane constants and `LaneMap<T>` storage needed by root bookkeeping, but root lane algorithms and scheduling are explicitly unimplemented.
- `worker-progress/worker-033-react-dom-inventory.md`: `react-dom/client` exports `createRoot`, `hydrateRoot`, and `version`; `react-dom/profiling` exports client roots too; client roots are blocked on reconciler roots, lane/update semantics, DOM mutation host operations, event setup, and hydration infrastructure.
- `worker-progress/worker-044-react-dom-client-roots-plan.md`: `createRoot` creates a concurrent root, marks the container, installs delegated events, and returns a root object. `root.render` enqueues `updateContainer(children, root, null, null)`. `root.unmount` clears the public handle, enqueues a sync `null` update, flushes sync work across roots, then unmarks the container.

Supporting merged worker reports consulted:

- `worker-progress/worker-040-dom-mutation-renderer-plan.md`: DOM mutation needs a DOM-owned adapter for namespaces, properties, controlled forms, node maps, and root markers. The core must not know DOM node types.
- `worker-progress/worker-041-dom-events-priority-plan.md`: root and portal listeners are delegated and deduplicated; event priority is lane-backed and separate from public Scheduler priorities; hydration replay requires event-system and reconciler hooks.
- `worker-progress/worker-043-react-dom-hydration-plan.md`: `hydrateRoot` is a distinct root mode with dehydrated root state, hydratable cursors, Fizz marker compatibility, event replay, and `unstable_scheduleHydration`.
- `worker-progress/worker-051-dom-host-token-boundary.md`: host fiber tokens are now the accepted way to let DOM maps associate host nodes with reconciler-owned identity without exposing raw fibers.
- `worker-progress/worker-006-binding-strategy.md`: public React-compatible values should remain JS-owned while Rust owns internal roots, lanes, queues, work slices, and opaque handles across the N-API boundary.

Current source files inspected:

- `packages/react-dom/client.js`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/package.json`
- `packages/react-dom/placeholder-utils.js`
- `crates/fast-react-core/src/lane.rs`
- `crates/fast-react-core/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-host-config/src/lib.rs`
- `bindings/node/index.cjs`
- `bindings/node/index.mjs`
- `crates/fast-react-napi/src/lib.rs`

Nested read-only agents were started to test two hypotheses: the Rust core/reconciler dependency chain and the React DOM facade/event-marker contract. They were not given write access or permission to read `ORCHESTRATOR.md`. They had not returned before the direct local evidence was sufficient to draft this report; if they return before handoff, their findings should be merged below.

## Root Cause Conclusions

### Client Roots Are Reconciler Roots

The public `ReactDOMRoot` is intentionally tiny. Its `_internalRoot` slot points to a reconciler root. `render` and `unmount` enqueue root updates. Implementing a root object that owns a DOM tree directly would bypass:

- lane selection from transition or DOM update priority
- HostRoot circular pending/base update queues
- root lane bookkeeping and entanglement
- Scheduler callback reuse and cancellation
- cross-root sync flushing
- passive effect flushing and reentrancy guards
- root-level error callbacks and recoverable error delivery

This is the main root cause behind the implementation order. The facade should be last, not first.

### Event Setup Is Root Lifecycle, Not Render Behavior

`createRoot` and `hydrateRoot` install delegated listeners immediately after the container is marked as a root. Listener installation is separate from dispatch:

- root containers get a marker-deduped listener set
- `selectionchange` is installed on the owner document
- portals call the same listener installation path through `preparePortalMount`
- listener wrappers set event priority before dispatch

Per-node DOM listeners would pass small click tests but miss update priority, portal bubbling, batching, controlled-state restore, and hydration replay.

### Container And Node Markers Belong To The DOM Adapter

React DOM uses private container and node markers for root lookup, node-to-fiber lookup, latest props, and listener dedupe. Fast React should model this with DOM-owned maps keyed by DOM nodes and reconciler-issued host fiber tokens. The Rust core should never store DOM node types or private DOM marker names.

Root lifecycle markers have separate responsibilities:

- container root marker: records the HostRoot token/fiber identity for duplicate-root warnings and event target lookup
- listener marker: deduplicates `listenToAllSupportedEvents` on root or portal event targets
- node token map: maps DOM elements/text/boundaries to host fiber tokens for events, refs, hydration, diagnostics, and deletion cleanup
- current props map: stores latest host props for event plugin extraction and controlled state

### Hydration Is A Separate Root Kind

`hydrateRoot` is not `createRoot` with an option flag. It must create a hydration root with root `is_dehydrated` state, schedule initial hydration work, install events before hydration completes, and expose `unstable_scheduleHydration`. It also depends on Fizz marker matching, hydratable traversal, mismatch/recoverable error queues, Suspense/Activity dehydrated boundary state, form markers, and hydration event replay.

The first `createRoot` implementation should reserve hydration root shapes and error callback plumbing, but it should not claim `hydrateRoot` compatibility until hydration state and DOM marker/replay infrastructure exist.

### The JS/Rust Boundary Must Preserve JS Ownership Of Public Values

The Rust core/reconciler should own internal root state, lane maps, update queues, work scheduling, and host effect instructions. The JS facade should own public root objects, public errors/warnings, options parsing, DOM values, and user callback handles. JS callbacks crossing into Rust need explicit rooting and reentrancy rules; Rust should not store raw JS values or call user JS from background threads.

## Layer Contract

Public package facade, `packages/react-dom`:

- owns export maps, condition branches, `version`, public root object shape, option parsing, entrypoint warnings, and unsupported React Server Component errors
- should not directly mutate DOM children or implement scheduler semantics

DOM adapter inside `packages/react-dom/src/**` or a future DOM host package:

- owns container validation, root/listener markers, node maps, current props maps, event name mapping, delegated listener installation, DOM mutation, DOM hydration matching, resources, forms, and diagnostics
- reports event priority through a host scheduling boundary without exposing lane internals

Rust core, `crates/fast-react-core`:

- owns renderer-agnostic primitives: lanes, lane maps, event priority newtype, root lane bookkeeping data, fiber flags/modes, update payload handles, and root/error data structures that do not contain DOM objects

Rust reconciler, `crates/fast-react-reconciler`:

- owns `FiberRoot`, HostRoot fibers, update queues, transition/retry lane claiming, `request_update_lane`, `update_container`, `update_container_sync`, root scheduler, work loop, commit phase ordering, `flush_sync_work`, error callback dispatch, and host token generation

Host-config boundary, `crates/fast-react-host-config`:

- owns opaque associated host types, token-aware lifecycle hooks, `HostScheduling`, `MutationHost`, `PortalHost`, `HydrationHost`, and explicit capability failures
- should remain DOM-neutral

Native binding, `bindings/node` and `crates/fast-react-napi`:

- should expose private coarse root operations and opaque handles only after the Rust root API exists
- should keep public React DOM values JS-owned and validate callback/value lifetimes

## Recommended Implementation Sequence

1. Lock the public behavior with a client-root oracle. If worker 046 lands first, consume it; otherwise add equivalent probes before implementation.
2. Finish core scheduling primitives: lane-backed `EventPriority` and root lane bookkeeping on top of the existing `LaneMap<T>`.
3. Add reconciler root data structures: `FiberRoot`, HostRoot fiber, root options, JS callback handle abstractions, and root lifecycle state.
4. Implement HostRoot update queues and `update_container` / `update_container_sync` using circular pending queues and lane-based rebase semantics.
5. Implement root scheduling and `flush_sync_work`: root linked list, microtask scheduling, callback reuse/cancellation, Scheduler priority mapping, cross-root sync flush, and reentrancy guards.
6. Add commit skeleton and token generation so host creation/commit/deletion can maintain node maps without exposing raw fibers.
7. Add DOM container validation, root marker storage, listener marker storage, node-to-token maps, and current props maps.
8. Add delegated root and portal listener installation only. Keep plugin dispatch and hydration replay in their own event slices.
9. Add a minimal DOM mutation host path, then wire `createRoot` and public root object methods to the reconciler.
10. Implement `root.render` and `root.unmount` only when they enqueue real root updates and can flush through the root scheduler.
11. Add `flushSync` after the root scheduler can support current priority overrides and cross-root sync flushing.
12. Implement `hydrateRoot` after hydration root state, DOM hydratable matching, marker compatibility, and event replay hooks exist.

## Future Mergeable Worker Slices

These slices are intentionally concrete and non-overlapping. Names are descriptive; the orchestrator can assign final worker numbers. Active workers may already cover some scopes. If an active worker lands first, the corresponding slice should consume the merged result instead of duplicating it.

| Slice | Write scope | Prerequisites | Verification |
| --- | --- | --- | --- |
| Client-root public oracle | `tests/conformance/src/react-dom-client-root-*.mjs`, `tests/conformance/scripts/*react-dom-client-root*.mjs`, `tests/conformance/test/react-dom-client-root-oracle.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-client-root-oracle.json`, `worker-progress/worker-react-dom-client-root-oracle.md` | Worker 036 export oracle, worker 044 plan. Worker 046 may satisfy this when merged. | `npm test --workspace @fast-react/conformance`, oracle regeneration byte-compare, local path leak guard, `git diff --check --no-index /dev/null <new files>`. |
| Core event priority | `crates/fast-react-core/src/event_priority.rs`, `crates/fast-react-core/src/lib.rs`, `worker-progress/worker-core-event-priority.md` | Worker 030 lanes, worker 041 event plan. | `cargo fmt --all --check`, `cargo test -p fast-react-core --all-features`, `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`. Unit tests should cover discrete, continuous, default, idle, lane conversion, and higher/lower priority helpers. |
| Core root lane bookkeeping | `crates/fast-react-core/src/root_lanes.rs`, `crates/fast-react-core/src/lib.rs`, `worker-progress/worker-core-root-lane-bookkeeping.md` | Worker 030 lanes. Consume worker 047 if merged first. | Core tests for `mark_root_updated`, suspended/pinged/warm/expired lanes, entanglements, hidden updates, transition/retry claiming, `get_next_lanes`, `get_next_lanes_to_flush_sync`, and fixed `LaneMap` behavior. |
| Reconciler root and fiber records | `crates/fast-react-reconciler/src/fiber.rs`, `crates/fast-react-reconciler/src/fiber_root.rs`, `crates/fast-react-reconciler/src/root_config.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-reconciler-root-records.md` | Core root lanes and host token boundary. | Rust unit tests for root creation defaults, concurrent root tag, host container handle storage, root option storage, callback handle placeholders, current HostRoot fiber creation, alternate placeholders, and lifecycle state transitions. |
| JS callback/root handle boundary | `crates/fast-react-napi/src/root.rs`, `crates/fast-react-napi/src/lib.rs`, `bindings/node/index.cjs`, `bindings/node/index.mjs`, `bindings/node/test/*root*.{cjs,mjs}`, `worker-progress/worker-native-root-boundary.md` | Reconciler root records. | Native boundary tests should prove root APIs remain private, root handles are opaque, unimplemented native loads fail loudly until artifacts exist, and callback handles cannot be called after disposal. No public React DOM behavior claims in this slice. |
| HostRoot update queue | `crates/fast-react-reconciler/src/update_queue.rs`, `crates/fast-react-reconciler/src/root_updates.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-host-root-update-queue.md` | Reconciler root records, core lanes. | Unit tests for circular pending queues, base queue rebase after skipped lanes, payload key `element`, callback validation/storage, enqueue during processing, sync `null` unmount update shape, and transition entanglement hooks. |
| Reconciler update priority | `crates/fast-react-reconciler/src/update_priority.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-reconciler-update-priority.md` | Core event priority, HostRoot update queue. | Unit tests for `request_update_lane`: transition lane reuse in one event, render-phase lane reuse placeholders, event priority to lane conversion, default priority fallback, and `flushSync` priority override hooks without DOM event names. |
| Root scheduler and work loop skeleton | `crates/fast-react-reconciler/src/root_scheduler.rs`, `crates/fast-react-reconciler/src/work_loop.rs`, `crates/fast-react-reconciler/src/scheduler_bridge.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-root-scheduler-work-loop.md` | Core root lanes, update priority, HostRoot update queue. | Unit tests with fake scheduler/microtask hooks for root linked-list scheduling, stale callback cancellation, sync lanes bypassing Scheduler tasks, non-sync lanes mapping to Scheduler priorities, continuation reuse, passive effect preflush hooks, cross-root sync flush, and render/commit reentrancy guards. |
| Commit skeleton and host token generation | `crates/fast-react-reconciler/src/commit.rs`, `crates/fast-react-reconciler/src/host_tokens.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-commit-host-token-skeleton.md` | Reconciler root records, host token boundary. | Fake-host tests for token generation/versioning, token invalidation after deletion, `prepare_for_commit` / mutation / `reset_after_commit` ordering, `root.current` switch point, deletion cleanup calls, and capability errors. |
| DOM container validation and root markers | `packages/react-dom/src/client/dom-container.js`, `packages/react-dom/src/client/dom-component-tree.js`, `packages/react-dom/src/client/root-markers.js`, `tests/conformance/src/react-dom-container-*.mjs`, `tests/conformance/test/react-dom-container-*.test.mjs`, `worker-progress/worker-dom-container-root-markers.md` | Client-root oracle, package scaffold. | DOM shim or jsdom-style probes for valid/invalid containers, duplicate root warnings, legacy `_reactRootContainer` warning distinction, mark/unmark ordering, comment-container feature gate, container-to-root lookup, and no DOM child mutation. |
| DOM node maps and public instances | `packages/react-dom/src/client/dom-component-tree.js`, `packages/react-dom/src/client/node-maps.js`, `tests/conformance/src/react-dom-node-map-*.mjs`, `worker-progress/worker-dom-node-maps.md` | Host token generation, DOM container markers. | Tests for node-to-token/current-props maps, cleanup after deletion/unmount, public instance lookup, stale token rejection, and absence of strong references that keep deleted nodes/root handles alive. |
| Root and portal listener installation | `packages/react-dom/src/events/root-listeners.js`, `packages/react-dom/src/events/event-names.js`, `packages/react-dom/src/events/event-priority.js`, `packages/react-dom/src/client/dom-component-tree.js`, `tests/conformance/src/react-dom-root-listeners-*.mjs`, `worker-progress/worker-dom-root-listener-installation.md` | DOM container markers, core event priority. | DOM event-target probes for one capture/bubble registration per supported event, non-delegated event handling, `selectionchange` owner-document registration, listener marker dedupe, portal container listener setup, passive listener flags, and no plugin dispatch yet. |
| DOM mutation host minimum | `packages/react-dom/src/dom-host/creation.js`, `packages/react-dom/src/dom-host/mutation.js`, `packages/react-dom/src/dom-host/properties.js`, `packages/react-dom/src/dom-host/context.js`, `tests/conformance/src/dom-mutation-minimum-*.mjs`, `worker-progress/worker-dom-mutation-host-minimum.md` | Commit skeleton, DOM node maps, root listener setup. | Tests for owner document, namespace context, element/text creation, append/insert/remove/clear, text update, hide/unhide, `dangerouslySetInnerHTML` guardrails, and single-parent moves. Do not claim controlled inputs, resources, singletons, or hydration. |
| `createRoot` facade and root object | `packages/react-dom/client.js`, `packages/react-dom/src/client/create-root.js`, `packages/react-dom/src/client/root-object.js`, `packages/react-dom/src/client/root-options.js`, `tests/smoke/react-dom-client-root.mjs`, `tests/conformance/src/react-dom-client-root-fast-*.mjs`, `worker-progress/worker-create-root-facade.md` | Root scheduler, DOM markers, root listeners, minimal DOM mutation host, client-root oracle. | Conformance comparison for exports, invalid container throw, duplicate warnings, options ingestion, root object own/prototype shape, second-argument warnings, unmounted-root render throw, and listener/marker side effects. |
| `root.render` integration | `packages/react-dom/src/client/root-object.js`, `packages/react-dom/src/client/update-container.js`, `tests/conformance/src/react-dom-root-render-*.mjs`, `worker-progress/worker-root-render-integration.md` | `createRoot` facade, HostRoot update queue, root scheduler, DOM mutation host. | Tests should prove `render` returns `undefined`, enqueues `{element}` HostRoot updates rather than mutating synchronously, selects lanes from event/transition priority, handles render-after-unmount throw, preserves callback rejection warnings, and commits through host operations. |
| `root.unmount` and `flushSync` boundary | `packages/react-dom/src/client/root-object.js`, `packages/react-dom/src/shared/flush-sync.js`, `packages/react-dom/index.js`, `packages/react-dom/profiling.js`, `tests/conformance/src/react-dom-unmount-flush-sync-*.mjs`, `worker-progress/worker-root-unmount-flush-sync.md` | Root scheduler with cross-root sync flush, `createRoot` facade. | Tests for idempotent unmount, `_internalRoot = null` before scheduling, sync `null` update, cross-root sync flushing, marker unmark after flush, callback argument warning, `flushSync` current-priority override and reentrancy warning. |
| Hydration root state | `crates/fast-react-reconciler/src/hydration.rs`, `crates/fast-react-reconciler/src/fiber_root.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-reconciler-hydration-root-state.md` | Reconciler root records, root scheduler, worker 043 hydration plan. | Rust tests for `RootKind::Hydration`, `is_dehydrated`, hydration callbacks/form state storage, initial hydration update scheduling, dehydrated boundary placeholders, recoverable hydration error queue, and explicit hydration target hooks. |
| DOM hydration markers and replay hooks | `packages/react-dom/src/hydration/markers.js`, `packages/react-dom/src/hydration/event-replay.js`, `packages/react-dom/src/events/event-replaying.js`, `tests/conformance/src/react-dom-hydration-marker-*.mjs`, `tests/conformance/src/react-dom-hydration-event-replay-*.mjs`, `worker-progress/worker-dom-hydration-markers-replay.md` | Hydration root state, root listener installation, worker 043 hydration plan. | DOM fixture probes for Fizz marker recognition, Suspense/Activity/form markers, boundary clear/hide/unhide, explicit hydration target priority sorting, blocked-target retry, and continuous/discrete replay hooks. |
| `hydrateRoot` facade | `packages/react-dom/client.js`, `packages/react-dom/src/client/hydrate-root.js`, `packages/react-dom/src/client/hydration-root-object.js`, `tests/conformance/src/react-dom-hydrate-root-*.mjs`, `worker-progress/worker-hydrate-root-facade.md` | Hydration root state, DOM hydration markers/replay, DOM markers/listeners, client-root oracle or equivalent. | Conformance comparison for required `initialChildren`, option parsing, root error/recoverable callbacks, `formState`, container marking, listener installation, hydration root object shape, `unstable_scheduleHydration`, render/unmount sharing, and React Server Component throw behavior. |

## Verification Strategy

Implementation workers should not claim compatibility from smoke tests alone. Each behavior slice should have one of:

- deterministic React 19.2.6 oracle evidence
- Rust unit tests for renderer-agnostic algorithms
- DOM fixture probes that compare React DOM and Fast React under the same DOM environment
- focused smoke tests proving package routing and unsupported paths still fail loudly

Minimum cross-slice checks before public root compatibility is claimed:

- `react-dom/client` export descriptors and blocked physical subpaths still match the export oracle
- `createRoot` invalid containers, duplicate warnings, options, and root object shape match the client-root oracle
- `root.render` enqueues HostRoot updates through lanes and returns `undefined`
- `root.unmount` flushes sync work across roots and unmarks containers after the flush
- delegated root listener installation is deduped and `selectionchange` installs on the owner document
- event priority maps to lanes and is not confused with public Scheduler numeric priorities
- hydration roots expose `unstable_scheduleHydration` only on hydration root objects
- DOM mutation runs only through host operations and token-aware node maps
- callback/error handles are rooted and disposed safely across the JS/Rust boundary

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan keeps published React DOM behavior separate from source-only feature-gated behavior. Stable 19.2.6 should not expose transition callbacks or default transition indicators without oracle proof.
- The plan does not propose a thin `createRoot` placeholder that pretends to render. Every public behavior claim is tied to root scheduling, DOM adapter, or hydration dependencies.

Maintainability:

- Core, reconciler, host-config, DOM adapter, native binding, and public facade ownership are separated so DOM details do not leak into native/custom renderers.
- Future slices have concrete write scopes and verification gates. Active worker outputs can be consumed when merged without changing the layer plan.

Performance:

- Root scheduling should stay on lane bitsets and fixed `LaneMap<T>` storage.
- DOM event setup should stay delegated and marker-deduped instead of per-node listeners.
- The native boundary should expose batched root operations and opaque handles, not per-element or per-event hot-path calls across N-API.
- Scheduler callback reuse/cancellation and cross-root sync flushing are part of correctness and also prevent over-flushing.

Security:

- DOM writes should use structured DOM APIs and DOM-owned property/style rules, not HTML string concatenation.
- JS callback handles for error callbacks, refs, lifecycle methods, and user components must be explicitly rooted and invalidated when roots unmount.
- DOM node maps should use weak or expando-style storage that does not keep deleted nodes and roots alive accidentally.
- Hydration must inspect DOM nodes and recognized Fizz markers; it must not parse serialized HTML in the client path.
- Native code must not store raw JS values across turns or call user JS from background threads.

## Risks And Blockers

- No merged client-root behavior oracle is available in this worktree; worker 046 is active but unavailable for this report.
- `createRoot` cannot be behavior-compatible until the reconciler has root records, HostRoot update queues, root scheduling, commit traversal, and a DOM mutation host.
- `root.unmount` and `flushSync` require cross-root sync flushing and render/commit reentrancy detection. A per-root shortcut would diverge from React.
- Event setup can be implemented before event dispatch, but behavior compatibility depends later on plugin dispatch, batching, controlled-state restore, and hydration replay.
- `hydrateRoot` is blocked on hydration root state, DOM hydratable matching, Fizz marker compatibility, and event replay hooks.
- The native binding is still a placeholder. Public roots can remain JS-owned initially, but real Rust reconciler integration eventually needs private root handle APIs.
- Feature-gated source options such as transition callbacks and default transition indicators need oracle evidence before they are accepted in stable package behavior.
- A reliable DOM test environment or controlled DOM shim is needed for root markers, listener installation, and hydration probes.

## Commands Run

Tool actions:

- `create_goal` for this worker objective.
- Spawned two read-only explorer agents for hypothesis checks.
- `wait_agent` for both explorers with a short timeout.

Shell commands:

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files -g 'worker-007-scheduler-fiber.md' -g 'worker-008-renderer-host-config.md' -g 'worker-030-core-lane-model.md' -g 'worker-033-react-dom-inventory.md' -g 'worker-044-react-dom-client-roots-plan.md' -g 'worker-055-react-dom-client-roots-implementation-plan.md' worker-progress
git status --short
sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,280p' worker-progress/worker-008-renderer-host-config.md
sed -n '260,620p' worker-progress/worker-008-renderer-host-config.md
sed -n '1,260p' worker-progress/worker-030-core-lane-model.md
sed -n '1,320p' worker-progress/worker-033-react-dom-inventory.md
sed -n '320,760p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,360p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '360,760p' worker-progress/worker-044-react-dom-client-roots-plan.md
rg -n "createRoot|hydrateRoot|root\\.render|root\\.unmount|listenToAllSupportedEvents|markContainerAsRoot|FiberRoot|updateContainer|flushSync|RootOptions|root object|event" worker-progress/worker-033-react-dom-inventory.md worker-progress/worker-044-react-dom-client-roots-plan.md worker-progress/worker-007-scheduler-fiber.md worker-progress/worker-008-renderer-host-config.md worker-progress/worker-030-core-lane-model.md
rg --files packages/react-dom crates/fast-react-core/src crates/fast-react-reconciler/src crates/fast-react-host-config/src tests/conformance | sed -n '1,260p'
sed -n '1,260p' packages/react-dom/client.js
sed -n '1,300p' packages/react-dom/index.js
sed -n '1,320p' packages/react-dom/placeholder-utils.js
sed -n '1,760p' crates/fast-react-core/src/lane.rs
sed -n '1,360p' crates/fast-react-core/src/lib.rs
sed -n '1,420p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,760p' crates/fast-react-host-config/src/lib.rs
rg -n "trait Host|HostScheduling|EventPriority|Microtasks|MutationRenderer|Hydration|Portal|HostFiberToken|Container" crates/fast-react-host-config/src/lib.rs
sed -n '760,1320p' crates/fast-react-host-config/src/lib.rs
sed -n '1,220p' packages/react-dom/package.json
sed -n '1,220p' packages/react-dom/profiling.js
sed -n '1,120p' packages/react-dom/client.react-server.js
rg --files worker-progress | rg 'worker-046|worker-048|worker-049|worker-050|worker-051|worker-052|worker-054|worker-055'
rg -n "worker-046-react-dom-client-root-oracle|worker-046" MASTER_PLAN.md MASTER_PROGRESS.md
rg -n "Root|createRoot|hydrateRoot|version|react-dom/client|root object|render\\(|unmount|RootOptions" tests/conformance/oracles tests/conformance/src packages/react-dom worker-progress/worker-036-react-dom-export-oracle.md worker-progress/worker-037-react-dom-type-inventory.md
sed -n '1,260p' worker-progress/worker-051-dom-host-token-boundary.md
find docs -maxdepth 3 -type f | sort | sed -n '1,200p'
find . -maxdepth 3 -type d \( -path './.git' -o -path './node_modules' -o -path './target' \) -prune -o -type f -name '*worker-055*' -print
sed -n '1,260p' docs/tasks/worker-055-react-dom-client-roots-implementation-plan.prompt.md
sed -n '1,300p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '1,340p' worker-progress/worker-043-react-dom-hydration-plan.md
sed -n '1,260p' worker-progress/worker-040-dom-mutation-renderer-plan.md
rg --files bindings crates/fast-react-napi packages/react | sed -n '1,240p'
sed -n '1,260p' bindings/node/index.cjs
sed -n '1,260p' bindings/node/index.mjs
sed -n '1,240p' bindings/node/package.json
sed -n '1,320p' crates/fast-react-napi/src/lib.rs
sed -n '1,260p' worker-progress/worker-006-binding-strategy.md
```

No source tests were run.

## Changed Files

- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`

## Completion Checklist

- [x] Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Called `create_goal` for this worker task.
- [x] Wrote only the assigned report file.
- [x] Used merged evidence from workers 007, 008, 030, 033, and 044.
- [x] Treated worker 046 as unavailable because it is active/running and not merged in this worktree.
- [x] Identified root causes and implementation dependencies instead of thin placeholders.
- [x] Split future work into independently mergeable slices with concrete scopes and verification.
- [x] Reviewed quality, maintainability, performance, and security.
- [ ] Checked the final report for concrete local path leaks.
- [ ] Checked the final report for trailing whitespace.
