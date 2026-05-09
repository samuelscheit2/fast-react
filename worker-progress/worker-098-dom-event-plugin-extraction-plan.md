# worker-098-dom-event-plugin-extraction-plan

## Objective

Produce a report-only plan for DOM event plugin extraction, update priority,
batching, propagation, and controlled-state restore.

Write scope honored: this report only. No source code was modified.

Goal setup: `create_goal` was set for this exact worker objective before any
research, file reads, implementation, or verification in this continuation.
`get_goal` then reported status `active` with objective `Produce a report-only
plan for DOM event plugin extraction, update priority, batching, propagation,
and controlled-state restore.`

## Summary

Fast React should not implement DOM events as direct per-node prop listeners.
The root cause is that React DOM event dispatch is a coupled pipeline:

- DOM node maps resolve a native event target to the closest mounted host
  fiber and current props.
- The root listener wrapper sets lane-backed current update priority before
  entering dispatch.
- The plugin system extracts synthetic events into capture/bubble dispatch
  queues, retargets across root and portal boundaries, and wraps extraction in
  event batching.
- Change/select/form plugins enqueue controlled state restoration before
  listeners run, and the event batch flushes pending work before restoring DOM
  state.

The breaking recommendation is to replace the current `EventPriority = ()`
placeholder boundary with a concrete lane-backed event-priority type before
building DOM plugin extraction. Keeping unit placeholders would hide priority
and controlled-restore bugs until the event system is already wired through
client roots.

Root listener installation and hydration replay should stay separate layers.
The plugin extraction layer needs hooks into them, but should not own listener
dedupe, `addEventListener` attachment, Suspense hydration scheduling, or native
event replay queues.

## Prior Evidence

- Worker 041 established the event architecture: delegated root and portal
  listeners, lane-backed event priorities, plugin extraction, event batching,
  controlled restore, and hydration replay are distinct but connected layers.
- Worker 048 added the checked React DOM 19.2.6 event-priority oracle. It
  records 53 discrete events, 18 continuous events, default fallbacks,
  `message` Scheduler bridging, lane-backed constants, and
  `resolveUpdatePriority` fallback cases.
- Worker 065 added the checked delegated event oracle. It records root
  listener installation evidence, owner-document `selectionchange`, passive
  `wheel`, capture/bubble order, `stopPropagation`, `preventDefault`, and
  selected synthetic event shape.
- Worker 058 added the checked root/profiling `flushSync` and
  `unstable_batchedUpdates` public behavior oracle. It is rootless by design
  and does not claim DOM root scheduling or private lane behavior.
- Worker 089's root listener installation report is absent from this worktree,
  but the sibling worker report was inspected. It records root/portal listener
  installation side effects, passive option evidence, `selectionchange`
  owner-document installation, non-delegated capture-only examples, and dedupe
  behavior. This report consumes that listener contract without moving listener
  installation into plugin extraction.

## Local State

- `packages/react-dom/index.js` still exposes loud placeholders for
  `createPortal`, `flushSync`, `unstable_batchedUpdates`, form APIs, and
  resource hint APIs.
- `packages/react-dom/client.js` still exposes loud placeholders for
  `createRoot` and `hydrateRoot`.
- `packages/scheduler/cjs/scheduler.development.js` contains a real public
  Scheduler implementation with numeric public priorities and callback heaps.
- `crates/fast-react-core/src/lane.rs` already contains React 19.2.6 lane
  constants and bitset helpers, including `SyncLane`,
  `InputContinuousLane`, `DefaultLane`, `IdleLane`, hydration lanes, and
  `SelectiveHydrationLane`.
- `crates/fast-react-host-config/src/lib.rs` reserves
  `HostTypes::EventPriority`, `HostScheduling::set_current_update_priority`,
  `current_update_priority`, and `resolve_update_priority`, but concrete hosts
  and test renderer implementations still use `()`.
- `crates/fast-react-host-config/src/lib.rs` also already reserves
  `HostFiberToken`, `HostFiberTokenRef`, `PortalHost::prepare_portal_mount`,
  `HydrationHost::flush_hydration_events`, and form hooks. These are the right
  integration points for DOM node maps, portals, hydration, and controlled
  state, but behavior is not implemented.
- Current host implementations are not fully aligned with the token boundary:
  the test renderer and reconciler test hosts still use unit event priority and
  older token-less creation/commit signatures in this worktree. Future source
  work must align those hosts before a DOM node map relies on
  `HostFiberTokenRef`.
- `crates/fast-react-reconciler/src/lib.rs` is still a scheduler/reconciler
  placeholder; root scheduling, `requestUpdateLane`, event-priority conversion,
  and sync flushing do not exist yet.

## Delegated Hypothesis Checks

Two read-only explorer agents were spawned:

- One checked that the event plugin extraction plan matches the event-priority
  and delegation oracle boundaries.
- One checked current repo boundaries for DOM events, node maps, batching,
  update priority, and controlled restore.

No nested agent was given write authority. Their results were used only to
challenge whether this report missed a requirement or mixed layer ownership.
The oracle-boundary check found no blocking issue, but it corrected the
priority-wrapper sequence: priority wrapper selection belongs at listener
entry, before target/hydration dispatch work. The repo-boundary check found
that `HostFiberTokenRef` is reserved but not yet consistently implemented by
current hosts, so this report now treats token alignment as a prerequisite.

## Evidence Gathered

- Direct source inspection confirmed React DOM and React DOM client are still
  loud placeholders, so this worker must remain report-only and cannot claim
  Fast React event compatibility.
- Direct source inspection confirmed public Scheduler is already implemented
  with numeric public priorities and callback queues, while internal DOM event
  priority must remain lane-backed and separate.
- Direct source inspection confirmed core lane constants exist for discrete,
  continuous, default, idle, hydration, and selective hydration mappings.
- Direct source inspection confirmed host-config reserves event-priority,
  scheduling, portal, hydration, form, and host-token hooks, but current hosts
  still need token-boundary and unit-priority cleanup.
- Checked reports/oracles from workers 041, 048, 058, 065, 057, and sibling
  worker 089 provided the behavior boundaries used in this plan.
- Nested read-only agents challenged oracle and repository-boundary hypotheses;
  their findings were folded into the report without granting write authority.

## Layer Boundaries

### Root Listener Installation

This is a separate layer.

Owned responsibilities:

- Per-root and per-portal listener dedupe.
- Native `addEventListener` calls for capture/bubble phases.
- `selectionchange` attachment to the owner document.
- Passive option selection for `touchstart`, `touchmove`, and `wheel`.
- Non-delegated event attachment on target nodes where React does not delegate.

Hooks exported to plugin extraction:

- A native listener wrapper calls `dispatchEvent(domEventName, flags,
  targetContainer, nativeEvent)`.
- Listener flags must identify capture phase, non-delegated events, legacy
  deferral, and event-handle non-managed nodes.
- Portal mount must call the same listener installation path, but extraction
  must still retarget across `HostRoot` and `HostPortal`.

Do not put plugin extraction logic in the listener registry. The registry
should install wrappers and pass flags; extraction should own synthetic event
queues and propagation.

### Hydration Replay

This is a separate layer.

Owned responsibilities:

- `findInstanceBlockingTarget` blocked-boundary checks.
- Synchronous hydration attempts for blocked discrete events.
- Continuous replay queues and explicit hydration target queues.
- Native event cloning/redispatch.
- Commit hooks such as `retryIfBlockedOn` and `flushHydrationEvents`.

Hooks required by plugin extraction:

- Dispatch must ask hydration whether the target is blocked before extracting.
- If unblocked, dispatch receives the resolved `targetInst`.
- Replayed events must be marked so enter/leave and portal logic can avoid
  duplicate behavior.

Do not build replay queues inside the plugin system. The plugin system should
be callable by both live native dispatch and replay dispatch once hydration
has produced a dispatchable target.

## Event Target Resolution Plan

Implement a DOM component tree map equivalent before plugin extraction:

- `precacheFiberNode(token, node)` stores the reconciler-issued host fiber
  token on instances, text nodes, hydratable instances, Suspense/Activity
  markers, and related boundary nodes.
- `markContainerAsRoot(rootToken, container)` and `unmarkContainerAsRoot`
  maintain root ownership separately from host instance ownership.
- `getClosestInstanceFromNode(targetNode)` walks DOM ancestors until it finds
  the closest mapped host fiber, while preserving the React distinction between
  HostRoot/Suspense/Activity boundaries and host components.
- `getInstanceFromNode(node)` resolves an exact host/root mapping for
  controlled restoration and public instance lookups.
- `getNodeFromInstance(token)` returns the host DOM node for host component,
  text, hoistable, and singleton fibers only.
- `updateFiberProps(node, props)` stores current props on the DOM node; event
  extraction must always read current props through this map, not close over
  props at listener registration time.
- `detachDeletedInstance(node)` clears fiber, props, event-handle, hoistable,
  and scroll-end metadata so deleted nodes cannot receive stale React events.

Fast React already reserves `HostFiberToken` and `HostFiberTokenRef` boundary
types, but current hosts still need alignment before those tokens can be used
as the DOM event identity boundary. Use those tokens for instance and boundary
node maps instead of exposing raw fiber pointers to the DOM package. Keep root
containers in a separate container-to-root map unless a future host-boundary
change intentionally adds a root-container token target.

## Plugin Extraction Plan

The native listener layer should select and enter the wrapper by event
priority before plugin dispatch. From that wrapper, plugin dispatch should flow
through this sequence:

1. Temporarily set current update priority and clear the current transition
   while dispatching discrete or continuous wrappers.
2. Map `nativeEvent.target` to a target DOM node using DOM event target rules.
3. Ask the node map and hydration hook for the closest dispatchable target
   fiber. If hydration blocks the event, hand off to hydration replay and stop
   before extraction.
4. Call `dispatchEventForPluginEventSystem` with `domEventName`, flags,
   native event, target fiber, and target container.
5. Retarget across root and portal boundaries until the event is associated
   with the matching root container.
6. Run `extractEvents` into a dispatch queue.
7. Process the dispatch queue in capture or bubble order.
8. Exit `batchedUpdates`; if controlled state restore is pending, flush sync
   work and restore controlled DOM nodes.

Plugin extraction should be ordered like React DOM 19.2.6:

- Register and run `SimpleEventPlugin` first. It owns common DOM-to-React
  event names, synthetic event constructor selection, lazy synthetic event
  creation, target-only `scroll` and `scrollend` bubbling behavior, and
  unknown event fallback for event handles.
- Run polyfill/stateful plugins only when flags allow them:
  `EnterLeaveEventPlugin`, `ChangeEventPlugin`, `SelectEventPlugin`,
  `BeforeInputEventPlugin`, and `FormActionEventPlugin`.
- Run `ScrollEndEventPlugin` only when the scrollend polyfill flag requires
  it.
- Keep plugin registration side effects centralized so the event registry can
  derive `allNativeEvents` and registration names deterministically.

The extraction layer should not know how native listeners are attached. It
should receive event flags and target containers from the listener layer.

## Dispatch Queue And Propagation Plan

Model the dispatch queue as an array of entries:

- `event`: the lazily constructed synthetic event.
- `listeners`: ordered dispatch listeners with fiber token, callback, and
  current target DOM node.

For single-phase events:

- Walk from target fiber toward the root, reading current props with
  `getFiberCurrentPropsFromNode`.
- For capture, collect capture listeners and process them from root to target.
- For bubble, collect bubble listeners and process them from target to root.
- Support `accumulateTargetOnly` for non-bubbling React behavior such as
  `scroll` and `scrollend`.
- Skip disabled interactive mouse listeners for `button`, `input`, `select`,
  and `textarea`.

For two-phase emulation plugins:

- `ChangeEventPlugin`, `SelectEventPlugin`, `BeforeInputEventPlugin`, and
  `ScrollEndEventPlugin` need capture listeners unshifted and bubble listeners
  pushed into one queue because they run from the bubble-phase plugin path.
- `EnterLeaveEventPlugin` needs its own from/to target calculation and
  two-phase accumulation.

Processing rules:

- Synthetic event `currentTarget` is assigned only for the active callback and
  reset to `null` after the callback.
- `stopPropagation` stops later listeners once the propagation crosses to a
  different instance; earlier capture listeners already invoked remain
  invoked.
- `preventDefault` updates synthetic state and delegates to the native event.
- Listener values must be functions; non-functions throw the React-compatible
  listener type error at dispatch time.
- Modern synthetic events are persistent; `persist()` is a no-op and there is
  no pooling.

## Update Priority Plan

Fast React must keep public Scheduler priority separate from internal event
priority.

Internal event priority should be a lane-backed type:

- `NoEventPriority = NoLane`
- `DiscreteEventPriority = SyncLane`
- `ContinuousEventPriority = InputContinuousLane`
- `DefaultEventPriority = DefaultLane`
- `IdleEventPriority = IdleLane`

Required operations:

- `eventPriorityToLane(priority)` returns the lane-backed priority.
- `lanesToEventPriority(lanes)` reads the highest-priority lane and returns
  discrete, continuous, default, or idle.
- `higherEventPriority`, `lowerEventPriority`, and
  `isHigherEventPriority` should match React lane ordering where lower
  non-zero bits are higher priority.

DOM update-priority state:

- Store `current_update_priority` in React DOM shared internals or the DOM
  root/event runtime, not in public Scheduler.
- `dispatchDiscreteEvent` sets current update priority to discrete and
  restores it after dispatch.
- `dispatchContinuousEvent` sets current update priority to continuous and
  restores it after dispatch.
- `dispatchEvent` for default events does not force a priority.
- `resolveUpdatePriority` returns the stored priority when non-empty, otherwise
  maps `window.event.type` through `getEventPriority`, otherwise returns
  default.
- `message` event priority bridges from public Scheduler current priority:
  Immediate to discrete, UserBlocking to continuous, Normal/Low to default,
  Idle to idle, and unknown to default.

Reconciler integration:

- `requestUpdateLane` should convert `resolveUpdatePriority()` through
  `eventPriorityToLane()` outside render-phase updates, transitions, and
  legacy/special cases.
- Root scheduling should later map lanes back to public Scheduler callback
  priority; plugin extraction should not schedule Scheduler callbacks itself.
- `flushSync` should temporarily set current update priority to discrete and
  flush roots through reconciler internals, while preserving the public
  Scheduler behavior recorded by worker 058.

## Batching Plan

`dispatchEventForPluginEventSystem` should wrap plugin extraction and dispatch
in `batchedUpdates`.

Batching state:

- Track whether the runtime is already inside an event handler batch.
- Nested event batches should call through immediately and defer controlled
  restore until the outer batch exits.
- The public `unstable_batchedUpdates(fn, arg)` contract should remain aligned
  with worker 058: callback return forwarding, first-argument forwarding,
  nested calls, error propagation, and priority restoration.

Batch exit:

- On outermost event-batch exit, call `needsStateRestore()`.
- If restore is pending, flush synchronous work before restoring DOM state.
- Then call `restoreStateIfNeeded()` to restore queued controlled targets.

Do not implement controlled restore as a plugin-local finally block. It must be
owned by event batching so all plugins and nested events share one consistent
restore point.

## Portal Plan

Portal support needs both listener and extraction behavior.

Listener layer:

- `preparePortalMount(container)` must install the root-scoped listener set on
  the portal container. This remains part of root listener installation.

Extraction layer:

- When dispatching, walk the target fiber return chain looking for `HostRoot`
  or `HostPortal` boundaries.
- If the boundary container matches the current target container, dispatch
  within that root.
- If the target is inside another portal, determine whether that portal belongs
  to the current root. If it does, let the portal's own listener handle the
  event and avoid double-dispatch.
- When crossing from one root tree to another container, use
  `getClosestInstanceFromNode(container)` and DOM ancestor traversal to find
  the matching host fiber in the other tree.

Tests must assert propagation follows the React fiber tree, not only the DOM
parent chain.

## Passive Flags Plan

Passive flags belong to root listener installation, but extraction and tests
must account for them.

Required listener behavior:

- If passive listener options are supported, `touchstart`, `touchmove`, and
  `wheel` attach with passive `true` for both capture and bubble delegated
  root listeners.
- Other delegated events attach with ordinary capture/bubble listeners.
- Non-delegated events attach according to their own target-node rules.

Extraction behavior:

- Synthetic `preventDefault()` should still update synthetic event state and
  call the native event's `preventDefault` method if present.
- Browser behavior for passive listeners may ignore native default prevention;
  browser-backed tests should verify observable behavior separately from
  Node/minimal-DOM oracle tests.

## Controlled State Restore Plan

Controlled restoration depends on node maps, batching, and plugin extraction.

Queue ownership:

- `ReactDOMControlledComponent` equivalent owns `restoreTarget` and
  `restoreQueue`.
- `enqueueStateRestore(targetNode)` records the first target and appends
  additional targets during the same batch.
- `needsStateRestore()` returns true when either queue slot is populated.
- `restoreStateIfNeeded()` snapshots the queue, clears it, resolves each node
  through `getInstanceFromNode`, reads current props from the node map, and
  calls `restoreControlledState(node, type, props)`.

Plugin hooks:

- `ChangeEventPlugin` calls `enqueueStateRestore(nativeEventTarget)` before
  creating and accumulating `onChange`.
- Select and input plugins must normalize event sources first, then enqueue
  restore for the actual controlled target.
- Form action behavior must coordinate with controlled form reset and host
  transition state, but form action replay remains outside this slice.

Restore implementation prerequisites:

- DOM component code must implement controlled input, textarea, and select
  property restoration.
- Input value tracking must identify real value changes without depending on
  stale props.
- Deleted or unmounted nodes must no-op after `getInstanceFromNode` fails.

## Future Write Scopes

| Slice | Proposed write scope | Purpose |
| --- | --- | --- |
| Core event priority | `crates/fast-react-core/src/event_priority.rs`, `crates/fast-react-core/src/lib.rs`, focused core tests, worker report | Add lane-backed `EventPriority` and React-compatible priority helpers. |
| Host/reconciler priority and token boundary | `crates/fast-react-host-config/src/lib.rs`, `crates/fast-react-test-renderer/src/lib.rs`, `crates/fast-react-reconciler/src/update_priority.rs`, worker report | Replace `EventPriority = ()`, align current hosts with `HostFiberTokenRef`, add update-priority guards, and connect `requestUpdateLane` to event priority. |
| DOM node map and public instance lookup | `packages/react-dom/src/client/component-tree.*`, DOM host token bridge files, conformance tests, worker report | Implement node-to-token, separate container-to-root, props, listener-set, event-handle, scroll-timer, and deletion cleanup maps. |
| Root listener installation | `packages/react-dom/src/events/event-listener.*`, `packages/react-dom/src/events/listener-registry.*`, root/portal integration files, conformance tests, worker report | Install delegated and non-delegated native listeners, passive flags, selectionchange document listener, and portal listener hook. |
| Plugin event system | `packages/react-dom/src/events/plugin-event-system.*`, `event-system-flags.*`, `event-registry.*`, `get-listener.*`, `synthetic-event.*`, tests, worker report | Implement extraction boundaries, dispatch queues, propagation, synthetic events, listener validation, and portal retargeting. |
| Simple and enter/leave plugins | `packages/react-dom/src/events/plugins/simple-event-plugin.*`, `enter-leave-event-plugin.*`, `dom-event-properties.*`, tests, worker report | Implement common event mapping, synthetic constructors, target-only scroll, and mouse/pointer enter/leave synthesis. |
| Change/select/beforeinput plugins | `packages/react-dom/src/events/plugins/change-event-plugin.*`, `select-event-plugin.*`, `before-input-event-plugin.*`, fallback composition files, tests, worker report | Implement normalized change/select/beforeInput/composition behavior and controlled restore enqueue points. |
| Controlled DOM restoration | `packages/react-dom/src/events/controlled-component.*`, `packages/react-dom/src/client/input-value-tracking.*`, controlled input/select/textarea component files, tests, worker report | Restore controlled node state after batches using current props and DOM value tracking. |
| React DOM batching and flushSync | `packages/react-dom/src/events/update-batching.*`, `packages/react-dom/src/client/update-priority.*`, `packages/react-dom/src/shared/flush-sync.*`, root scheduler integration files, tests, worker report | Implement event batching, public `unstable_batchedUpdates`, `flushSync`, priority restoration, and sync root flushing. |
| Portal event retargeting oracle | `tests/conformance/src/react-dom-portal-event-*`, scripts, test, oracle JSON, worker report | Add React DOM 19.2.6 evidence for portal capture/bubble retargeting before implementation claims compatibility. |
| Hydration replay hooks | `packages/react-dom/src/events/event-replaying.*`, reconciler hydration-priority hooks, hydration tests, worker report | Implement blocked-target hooks and replay separately from plugin extraction. |

## Required Tests

- Node map tests: target-to-fiber lookup through host/text/container nodes,
  current props updates, deletion cleanup, stale node no-ops, and disabled
  interactive listener suppression.
- Priority tests: worker 048 oracle stays green; core event priority maps to
  lanes; nested discrete/continuous wrappers restore previous priority and
  transition state; `message` respects public Scheduler priority.
- Dispatch tests: worker 065 oracle stays green; capture/bubble order,
  `stopPropagation`, `preventDefault`, lazy synthetic event construction,
  `currentTarget` reset, listener type errors, and target-only scroll behavior.
- Batching tests: worker 058 oracle stays green; event dispatch calls through
  `batchedUpdates`; nested batches restore controlled state only once after
  the outer batch; thrown callbacks restore priority and batching flags.
- Portal tests: events fired inside portals bubble through React owners where
  React does, do not double-dispatch through both container listeners, and
  retarget correctly when DOM and fiber ancestry differ.
- Passive flag tests: `wheel`, `touchstart`, and `touchmove` root listeners use
  passive options when supported; synthetic `preventDefault` state is still
  updated.
- Controlled restore tests: change/input/click/select paths enqueue restore
  before dispatch; flush happens before restore; unmounted targets no-op;
  input, textarea, select, checkbox, radio, file input, and custom element
  cases match React DOM evidence.
- Browser-backed tests: focus/blur, selectionchange, select events,
  composition/beforeInput, IME, passive listener browser behavior, and form
  actions need real browser or jsdom-like coverage beyond minimal DOM probes.
- Hydration tests: blocked target hooks and replay behavior are covered by a
  separate hydration replay oracle, not by the base plugin extraction tests.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan addresses root causes: node maps, plugin extraction, batching,
  controlled restoration, and lane-backed priority, not only click dispatch.
- It keeps root listener installation and hydration replay separate while
  naming the hooks extraction needs from each layer.

Maintainability:

- Future scopes are split by stable ownership boundaries: core priority,
  host/reconciler priority, node maps, listener installation, plugin system,
  plugin families, controlled restore, batching, portals, and hydration.
- React source names are intentionally mirrored where useful so future workers
  can compare behavior against pinned React files and existing oracles.

Performance:

- Root-scoped listeners avoid per-node native listener churn.
- Lazy synthetic event construction avoids allocations when no listeners are
  present.
- Controlled restore queues are bounded by event targets seen in a batch and
  cleared after restoration.

Security:

- Event callbacks and form actions cross the JS/native boundary later; keep
  explicit lifetime/rooting rules for callbacks, DOM nodes, and fiber tokens.
- Do not serialize or expose randomized internal listener marker names or
  concrete local temporary paths in artifacts.
- Native event replay and controlled restore must avoid using stale DOM nodes
  after deletion cleanup.

## Risks Or Blockers

- Client roots, DOM mutation, and node maps are prerequisites for observable
  plugin extraction behavior.
- Host/test-renderer token-boundary alignment is still needed before DOM maps
  can rely on `HostFiberTokenRef` consistently.
- Reconciler root scheduling and sync flushing are prerequisites for correct
  event priority, `flushSync`, and controlled restore.
- Controlled input/select/textarea DOM component behavior is not implemented.
- Portal event propagation cannot be claimed until portal creation and
  `preparePortalMount` are implemented.
- Hydration replay must be implemented separately; coupling it into plugin
  extraction would make blocked-target semantics hard to test and maintain.
- Minimal DOM conformance probes are insufficient for selection, IME,
  focus/blur, passive listener browser behavior, and form actions.

## Commands Run

Initial required reads and orientation:

```sh
pwd && rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/worker-041-dom-events-priority-plan.md' -g 'worker-progress/worker-048-react-dom-event-priority-oracle.md' -g 'worker-progress/worker-065-dom-event-delegation-oracle.md' -g 'worker-progress/worker-089-dom-root-listener-installation-oracle.md' -g 'worker-progress/worker-098-dom-event-plugin-extraction-plan.md'
git status --short
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '1,300p' worker-progress/worker-048-react-dom-event-priority-oracle.md
sed -n '1,300p' worker-progress/worker-065-dom-event-delegation-oracle.md
test -f worker-progress/worker-089-dom-root-listener-installation-oracle.md; printf 'worker-089 exists: '; if test -f worker-progress/worker-089-dom-root-listener-installation-oracle.md; then echo yes; else echo no; fi
```

Local source and oracle inspection:

```sh
rg --files | sort | rg 'react-dom|scheduler|lane|host-config|reconciler|conformance/oracles|flush-sync|dom-controlled|dom-event|portal|worker-05[78]|worker-064|worker-090|worker-091|worker-092|worker-093|worker-094|worker-095|worker-098'
sed -n '1,220p' packages/react-dom/index.js
sed -n '1,220p' packages/react-dom/client.js
sed -n '1,260p' packages/scheduler/cjs/scheduler.development.js
sed -n '1,240p' crates/fast-react-core/src/lane.rs
rg -n 'trait HostTypes|type EventPriority|trait HostScheduling|set_current_update_priority|current_update_priority|resolve_update_priority|HostFiberToken|prepare_portal_mount|flush_hydration_events|restore|Form' crates/fast-react-host-config/src/lib.rs -C 3
sed -n '1,320p' crates/fast-react-reconciler/src/lib.rs
sed -n '560,660p' crates/fast-react-test-renderer/src/lib.rs
rg -n "type EventPriority = \\(\\)|createUnsupportedFunction\\(entrypoint, '(createRoot|hydrateRoot|flushSync|unstable_batchedUpdates|createPortal)'\\)|Lane::(SYNC|INPUT_CONTINUOUS|DEFAULT|IDLE|SELECTIVE_HYDRATION)|schedule_update_placeholder|render_mutation_placeholder" crates packages -g '!target'
```

Delegation:

```sh
spawn_agent explorer: oracle-boundary hypothesis check
spawn_agent explorer: repo-boundary hypothesis check
wait_agent for both agents
```

Continuation checks:

```sh
get_goal
sed -n '1,280p' sibling worker-089 root listener report
node -e "<summarize checked event priority, delegation, batching, and portal oracle claims>"
sed -n '588,735p' crates/fast-react-test-renderer/src/lib.rs
sed -n '180,310p' crates/fast-react-reconciler/src/lib.rs
rg -n "<local-path-leak-patterns>" worker-progress/worker-098-dom-event-plugin-extraction-plan.md
git status --short
rg -n "[ \t]$" worker-progress/worker-098-dom-event-plugin-extraction-plan.md
git diff --check -- worker-progress/worker-098-dom-event-plugin-extraction-plan.md
rg -n "<required-section-and-keyword-patterns>" worker-progress/worker-098-dom-event-plugin-extraction-plan.md
```

## Verification

Final report-only checks:

- `git status --short` shows only this report plus the pre-existing
  regenerable root `Cargo.lock`.
- Local path leak scan over this report found no concrete local or temporary
  paths.
- Trailing whitespace scan over this report found no matches.
- `git diff --check --
  worker-progress/worker-098-dom-event-plugin-extraction-plan.md` passed.
  Because the report is untracked, a no-index check against `/dev/null` was
  also run and produced no whitespace-error output.
- Required prompt keywords and section headings are present.

## Changed Files

- `worker-progress/worker-098-dom-event-plugin-extraction-plan.md`

## Recommended Next Tasks

- Implement lane-backed core `EventPriority` and replace unit placeholder
  host/test-renderer event-priority types.
- Align current host implementations with the `HostFiberTokenRef` boundary
  before DOM maps depend on reconciler-issued host fiber tokens.
- Add the DOM node map and current-props storage before event dispatch.
- Add the root listener installation layer using worker 089's listener oracle
  evidence when that worker's files are available on the mainline.
- Implement plugin extraction and dispatch queues against the existing
  event-priority and delegated-dispatch oracles.
- Add controlled-input/select/textarea restore oracles before claiming
  controlled form compatibility.

## Completion Audit

Prompt-to-artifact checklist:

- Report-only plan written to the scoped file: satisfied by this file under
  `worker-progress/worker-098-dom-event-plugin-extraction-plan.md`.
- No source code changes: verified by scoped status; only this report and a
  pre-existing regenerable root `Cargo.lock` are untracked.
- Required prior reads: satisfied for `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, workers 041, 048, and 065; worker 089 was absent in
  this worktree and the sibling worker report was inspected.
- No orchestrator-only read: satisfied; `ORCHESTRATOR.md` was not read.
- Event target resolution from DOM node maps: covered in
  `Event Target Resolution Plan`.
- Plugin extraction boundaries: covered in `Layer Boundaries` and
  `Plugin Extraction Plan`.
- Capture/bubble dispatch queues and propagation: covered in
  `Dispatch Queue And Propagation Plan`.
- Update priority: covered in `Update Priority Plan`.
- Batching and controlled restore: covered in `Batching Plan` and
  `Controlled State Restore Plan`.
- Portals and passive flags: covered in `Portal Plan` and
  `Passive Flags Plan`.
- Root listener and hydration replay kept separate: covered in
  `Layer Boundaries` and checked by nested oracle-boundary review.
- Future write scopes and tests: covered in `Future Write Scopes` and
  `Required Tests`.
- Standard report checks: tracked in `Verification`.

## Completion Checklist

- [x] Called `create_goal` before research, file reads, implementation, or
  verification.
- [x] Read the required worker brief, master plan/progress, and prior reports.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Confirmed worker 089 report is absent in this worktree and inspected the
  sibling worker-089 report as listener-installation evidence.
- [x] Used nested read-only agents to test hypotheses.
- [x] Kept root listener installation and hydration replay as separate layers.
- [x] Covered target resolution, plugin extraction, capture/bubble queues,
  update priority, batching, portals, passive flags, and controlled restore.
- [x] Included future write scopes and tests.
- [x] Ran final report-only verification checks.
