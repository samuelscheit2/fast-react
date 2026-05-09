# worker-041-dom-events-priority-plan

## Objective

Produce a report-only DOM events, event priority, and hydration replay plan for Fast React. No project code was implemented.

Write scope honored: only `worker-progress/worker-041-dom-events-priority-plan.md` was changed.

## Summary

React DOM 19.2.6 event compatibility requires a real DOM event subsystem, not direct per-node prop listeners. The root cause is that events drive update lanes, controlled input state restoration, hydration boundary priority, event replay, form actions, and portal bubbling. A thin `addEventListener("click", props.onClick)` implementation would pass trivial click tests while breaking the scheduling and hydration behavior that React DOM users observe.

Fast React should model three separate priority layers:

- Public `scheduler@0.27.0` priority constants and callback queues are JS-observable package behavior.
- Internal React event priorities are lane-backed values: discrete maps to `SyncLane`, continuous to `InputContinuousLane`, default to `DefaultLane`, and idle to `IdleLane`.
- Root scheduling chooses lanes first, then maps lane priority to a public Scheduler callback priority when work must run asynchronously.

The main breaking recommendation is to replace placeholder `EventPriority = ()` usages in host-config/test-renderer scaffolds with a concrete core `EventPriority` newtype backed by `Lane`. This is a deliberate breaking cleanup: preserving unit placeholders or flat enums would hide root-cause mismatches until DOM event scheduling and hydration replay are already coupled to them.

## Prior Worker Evidence

- Worker 007 established that React 19.2.6 must keep lane bitsets, root lane bookkeeping, and public Scheduler task heaps separate. It also documented that sync lanes bypass Scheduler while non-sync work maps `lanesToEventPriority(nextLanes)` to a Scheduler priority.
- Worker 008 established that event/update priority, portals, hydration, microtasks, forms, and diagnostics are host-config capabilities that must stay outside renderer-agnostic core details.
- Worker 030 implemented exact React 19.2.6 lane primitives in `fast-react-core`, including `SyncLane`, `InputContinuousLane`, `DefaultLane`, `IdleLane`, hydration lanes, `SelectiveHydrationLane`, `LaneMap<T>`, and bitset helpers.
- Worker 033 identified React DOM events and update priority as blockers for `react-dom/client`, `hydrateRoot`, portals, hydration replay, forms, and `flushSync`; it explicitly called out delegated root/portal listeners, plugin dispatch, and event replay as DOM behavior surfaces.

## React DOM 19.2.6 Evidence

Version and package evidence:

- The React source tag `v19.2.6` resolves to tag object `2fcbe419ed90f863e6f67ce5b9738f38dbec640b` and peeled commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- `ReactVersions.js` lists `react` and `react-dom` at `19.2.6`, `react-reconciler` at `0.33.0`, and `scheduler` at `0.27.0`.
- `react-dom@19.2.6` package metadata declares `dependencies: { "scheduler": "^0.27.0" }`, `peerDependencies: { "react": "^19.2.6" }`, and the public subpaths inventoried by worker 033.
- The published `react-dom@19.2.6` tarball includes `cjs/react-dom-client.development.js` and `cjs/react-dom-client.production.js`; direct tarball inspection found the same compiled event machinery: `listenToAllSupportedEvents`, `dispatchEventForPluginEventSystem`, `getEventPriority`, `discreteReplayableEvents`, `queueExplicitHydrationTarget`, and root listener setup in `createRoot`/`hydrateRoot`.
- `scheduler@0.27.0` package metadata and tarball evidence show no package `exports` map and public CJS files for root, native, mock, and postTask variants.

Pinned source files used:

- `packages/react-dom/src/client/ReactDOMRoot.js`
- `packages/react-dom/src/shared/ReactDOMFlushSync.js`
- `packages/react-dom/src/ReactDOMSharedInternals.js`
- `packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js`
- `packages/react-dom-bindings/src/client/ReactDOMUpdatePriority.js`
- `packages/react-dom-bindings/src/client/ReactDOMComponentTree.js`
- `packages/react-dom-bindings/src/events/DOMPluginEventSystem.js`
- `packages/react-dom-bindings/src/events/ReactDOMEventListener.js`
- `packages/react-dom-bindings/src/events/ReactDOMEventReplaying.js`
- `packages/react-dom-bindings/src/events/ReactDOMUpdateBatching.js`
- `packages/react-dom-bindings/src/events/ReactDOMControlledComponent.js`
- `packages/react-dom-bindings/src/events/EventRegistry.js`
- `packages/react-dom-bindings/src/events/EventSystemFlags.js`
- `packages/react-dom-bindings/src/events/EventListener.js`
- `packages/react-dom-bindings/src/events/DOMEventNames.js`
- `packages/react-dom-bindings/src/events/DOMEventProperties.js`
- `packages/react-dom-bindings/src/events/SyntheticEvent.js`
- `packages/react-dom-bindings/src/events/plugins/SimpleEventPlugin.js`
- `packages/react-dom-bindings/src/events/plugins/EnterLeaveEventPlugin.js`
- `packages/react-dom-bindings/src/events/plugins/ChangeEventPlugin.js`
- `packages/react-dom-bindings/src/events/plugins/SelectEventPlugin.js`
- `packages/react-dom-bindings/src/events/plugins/BeforeInputEventPlugin.js`
- `packages/react-dom-bindings/src/events/plugins/FormActionEventPlugin.js`
- `packages/react-dom-bindings/src/events/plugins/ScrollEndEventPlugin.js`
- `packages/react-reconciler/src/ReactEventPriorities.js`
- `packages/react-reconciler/src/ReactFiberLane.js`
- `packages/react-reconciler/src/ReactFiberReconciler.js`
- `packages/react-reconciler/src/ReactFiberRootScheduler.js`
- `packages/react-reconciler/src/ReactFiberWorkLoop.js`

## Delegated Checks

Two read-only explorer agents were spawned to test the event-priority/replay and plugin-edge-case hypotheses. Per the continuation constraint for this resumed worker, I did not block report production on nested-agent completion. The report conclusions are therefore based on direct local/source evidence listed above. If those agents later surface additional findings, the orchestrator can treat them as follow-up review notes rather than prerequisites for this report.

## Root And Portal Listener Plan

React DOM installs delegated listeners per root and portal container.

- `ReactDOMRoot.createRoot` creates the reconciler container, marks the DOM container as root, normalizes comment containers to their parent when needed, and calls `listenToAllSupportedEvents(rootContainerElement)`.
- `ReactDOMRoot.hydrateRoot` creates a hydration container, marks the root, and calls `listenToAllSupportedEvents(container)`.
- `ReactDOMHydrationRoot.prototype.unstable_scheduleHydration` calls `queueExplicitHydrationTarget(target)`.
- `ReactFiberConfigDOM.preparePortalMount(portalInstance)` calls `listenToAllSupportedEvents(portalInstance)`, so portals get their own delegated listener set.
- The compiled tarball confirms the same behavior in `cjs/react-dom-client.development.js`.

`DOMPluginEventSystem.listenToAllSupportedEvents`:

- Deduplicates with a randomized `_reactListening...` marker on root containers and owner documents.
- Iterates `allNativeEvents`, attaching bubble and capture listeners for delegated events, and capture-only listeners for non-delegated events.
- Handles `selectionchange` separately because it does not bubble and must be attached to the owner document.
- Uses `createEventListenerWrapperWithPriority`, so root listener registration is already coupled to event-priority selection.

`DOMPluginEventSystem.nonDelegatedEvents` includes `beforetoggle`, `cancel`, `close`, `invalid`, `load`, `scroll`, `scrollend`, `toggle`, and media events such as `abort`, `canplay`, `durationchange`, `ended`, `error`, `pause`, `play`, `progress`, `timeupdate`, and `waiting`. `touchstart`, `touchmove`, and `wheel` are delegated but use passive listener options when passive browser events are supported.

Fast React implication:

- The DOM adapter needs a root-owned listener registry keyed by native event name and capture/bubble phase, not listener attachment on each host instance.
- Portal containers must call the same root listener installation path as roots.
- The adapter must store node-to-fiber, container-to-root, current props, listener-set, event-handle, and scroll-end timer metadata equivalent to `ReactDOMComponentTree`.

## Event Plugin Dispatch Plan

React DOM's dispatch path is:

1. A trapped native listener enters `ReactDOMEventListener.dispatchDiscreteEvent`, `dispatchContinuousEvent`, or `dispatchEvent` depending on `getEventPriority(domEventName)`.
2. Discrete and continuous wrappers clear `ReactSharedInternals.T`, set `ReactDOMSharedInternals.p` to the current update priority, call `dispatchEvent`, then restore previous transition and priority state.
3. `dispatchEvent` calls `findInstanceBlockingEvent`. If no hydration boundary blocks the target, it calls `dispatchEventForPluginEventSystem`.
4. `dispatchEventForPluginEventSystem` retargets across HostRoot/HostPortal boundaries, handles legacy FB click deferral when enabled, and wraps plugin extraction in `batchedUpdates`.
5. `extractEvents` runs `SimpleEventPlugin` first, then polyfill/stateful plugins only when flags allow it: `EnterLeaveEventPlugin`, `ChangeEventPlugin`, `SelectEventPlugin`, `BeforeInputEventPlugin`, `FormActionEventPlugin`, and optionally `ScrollEndEventPlugin`.
6. `processDispatchQueue` invokes capture listeners from root to target and bubble listeners from target to root, respecting `isPropagationStopped`.
7. `ReactDOMUpdateBatching.finishEventHandler` flushes pending controlled component restores after the event batch when needed.

Fast React implication:

- Event dispatch needs a plugin pipeline with ordered extraction and a dispatch queue. Do not call the React prop callback directly from the native listener.
- Synthetic events can be lazily constructed only when listeners exist, matching React's performance model.
- `batchedUpdates` and controlled-state restore are part of event semantics, not separate form code.
- Portal retargeting must walk the fiber return chain and match root containers, otherwise portal bubbling will be wrong.

## Priority Boundaries

React source separates public Scheduler priorities from internal lane-backed event priorities.

Public `scheduler@0.27.0`:

- Priority constants are numeric: Immediate `1`, UserBlocking `2`, Normal `3`, Low `4`, Idle `5`.
- The root package uses `taskQueue` and `timerQueue` binary heaps, delay/start times, expiration times, cancellation tombstones, continuation callbacks, and current-priority context.
- These values are JS-observable through the public `scheduler` package. They must not be represented by React lanes.

Internal `ReactEventPriorities.js`:

- `EventPriority` is an opaque `Lane`.
- `NoEventPriority = NoLane`.
- `DiscreteEventPriority = SyncLane`.
- `ContinuousEventPriority = InputContinuousLane`.
- `DefaultEventPriority = DefaultLane`.
- `IdleEventPriority = IdleLane`.
- `eventPriorityToLane(updatePriority)` returns the lane-backed priority.
- `lanesToEventPriority(lanes)` selects the highest-priority lane, then returns discrete, continuous, default, or idle.

DOM event mapping in `ReactDOMEventListener.getEventPriority`:

- Discrete: click, focusin/focusout, input, keydown/keypress/keyup, mousedown/mouseup, pointerdown/pointerup/pointercancel, touchstart/touchend/touchcancel, submit, reset, change, selectionchange, textInput, composition events, copy/cut/paste, contextmenu, dragstart/dragend/drop, media play/pause/ratechange/seeked/volumechange, and related special cases.
- Continuous: drag/dragenter/dragleave/dragover, mousemove/mouseover/mouseout, pointermove/pointerover/pointerout, scroll, touchmove, wheel, mouseenter/mouseleave, pointerenter/pointerleave.
- `message` maps the current Scheduler priority to event priority: Immediate to discrete, UserBlocking to continuous, Normal/Low to default, Idle to idle.
- All other events default to `DefaultEventPriority`.

Current update priority:

- `ReactDOMSharedInternals.p` stores current update priority and starts as `NoEventPriority`.
- `ReactDOMUpdatePriority.resolveUpdatePriority()` returns the stored priority when set, otherwise maps `window.event.type`, otherwise returns default priority.
- `ReactDOMFlushSync.flushSync` sets current update priority to discrete while the callback runs, then flushes all roots through React DOM internals.
- `ReactFiberWorkLoop.requestUpdateLane` uses `eventPriorityToLane(resolveUpdatePriority())` outside special cases for legacy mode, render-phase updates, and transitions.
- Commit phases temporarily set current update priority to discrete for before-mutation, mutation, layout, recoverable errors, and related synchronous commit work.
- Passive effects use `lowerEventPriority(DefaultEventPriority, lanesToEventPriority(pendingEffectsLanes))`.

Root scheduler boundary:

- `ReactFiberRootScheduler.scheduleTaskForRootDuringMicrotask` chooses lanes with root lane state, then maps `lanesToEventPriority(nextLanes)` to public Scheduler priority.
- Discrete and continuous async work both schedule at `UserBlockingSchedulerPriority`.
- Default work schedules at `NormalSchedulerPriority`.
- Idle work schedules at `IdleSchedulerPriority`.
- Sync work uses microtask/root flushing and does not use a public Scheduler Immediate task in the normal root path.

Fast React implication:

- Add a core `EventPriority` type backed by `Lane`; do not reuse public Scheduler numeric constants.
- DOM adapter code should own `current_update_priority`, `resolve_update_priority`, and event-name-to-priority mapping.
- Reconciler update scheduling should accept lane-backed event priorities and convert to lanes before enqueueing updates.
- Public `scheduler` package work should be implemented and tested independently from lane selection.

## Hydration Replay Plan

React DOM's hydration event behavior is distributed across the DOM listener, event replay queues, DOM host config, and reconciler hydration APIs.

Blocking target detection:

- `findInstanceBlockingTarget(targetNode)` finds the closest fiber from a DOM node, checks nearest mounted fiber, and returns a blocking `SuspenseInstance`, `ActivityInstance`, or root container when the HostRoot is dehydrated.
- It sets a module-level `return_targetInst` when dispatch is not blocked.
- For unmounted or not-yet-committed targets, React dispatches without a target or ignores the event as appropriate.

Discrete hydration events:

- `ReactDOMEventReplaying.discreteReplayableEvents` includes `mousedown`, `mouseup`, touch start/end/cancel, pointer down/up/cancel, drag start/end/drop, composition start/end, key events, `input`, `textInput`, clipboard events, `click`, `change`, `contextmenu`, and `reset`.
- `submit` is intentionally excluded because `stopPropagation` blocks the replay mechanism.
- In capture phase, `dispatchEvent` attempts `attemptSynchronousHydration(fiber)` while blocked for discrete events requiring hydration. If still blocked, it calls `nativeEvent.stopPropagation()`.
- This is not a generic stored discrete-event queue. The implementation attempts synchronous hydration during the native dispatch and stops propagation if the event remains blocked.

Continuous replay queues:

- React stores only the latest replayable continuous focus, drag, and mouse events, plus one latest pointer event per `pointerId` and one pointer-capture event per `pointerId`.
- Queued continuous event types are `focusin`, `dragenter`, `mouseover`, `pointerover`, and `gotpointercapture`.
- Clear paths cover `focusout`, `dragleave`, `mouseout`, `pointerout`, and `lostpointercapture`.
- Queuing attempts `attemptContinuousHydration(fiber)`, which schedules `SelectiveHydrationLane` on Suspense/Activity boundaries.
- Replay clones and dispatches the native event after the target unblocks, then drains one target container at a time.

Explicit hydration targets:

- `hydrateRoot` exposes `unstable_scheduleHydration(target)`, which calls `queueExplicitHydrationTarget`.
- Explicit targets are sorted by `resolveUpdatePriority()` using `isHigherEventPriority`.
- Attempting an explicit hydration target calls `attemptHydrationAtCurrentPriority` inside `runWithPriority(queuedTarget.priority, ...)`.
- `attemptHydrationAtCurrentPriority` can bump the current lane to a matching hydration lane using `getBumpedLaneForHydrationByLane` when hydration lane scheduling is enabled.

Unblocking and commit integration:

- `ReactFiberConfigDOM.commitHydratedContainer`, `commitHydratedActivityInstance`, and `commitHydratedSuspenseInstance` call `retryIfBlockedOn`.
- Clearing Activity/Suspense boundaries also calls `retryIfBlockedOn`.
- `flushHydrationEvents` calls `flushEventReplaying` when the hydration change-event flag is enabled, so replays can be observed before new updates.
- Form actions use the document/root `$$reactFormReplay` queue and replay through `dispatchReplayedFormAction` once form or submitter actions are hydrated.

Fast React implication:

- Hydration replay cannot live only in a DOM package. It needs reconciler hooks for blocked Suspense/Activity/HostRoot detection, `SyncLane`, `SelectiveHydrationLane`, current-priority hydration, and hydration-lane bumping.
- The DOM adapter owns native event cloning/redispatch, target container accumulation, pointer-id maps, form replay queues, and change-event replay.
- The reconciler owns boundary hydration scheduling and `retryIfBlockedOn` calls from hydrated commits and boundary clearing.

## Event Family Requirements

Selection and focus:

- `selectionchange` attaches to the owner document, not the root container.
- `SelectEventPlugin` tracks active focused input/textarea/contentEditable, mouse-down state, and last selection. It fires `onSelect` after focus, keyboard, mouse, context-menu, drag, and selectionchange triggers only when selection changes.
- `focusin` maps to `onFocus`, `focusout` maps to `onBlur`, both at discrete priority.
- `ReactFiberConfigDOM.beforeActiveInstanceBlur` and `afterActiveInstanceBlur` dispatch `beforeblur`/`afterblur` event-handle hooks around hidden/deleted active instances when the create-event-handle feature is enabled.

BeforeInput and composition:

- `BeforeInputEventPlugin` registers `onBeforeInput` from `compositionend`, `keypress`, `textInput`, and `paste`.
- It also owns `onCompositionStart`, `onCompositionUpdate`, and `onCompositionEnd` extraction.
- It maintains fallback composition state, handles IME heuristics, special-cases Korean IME, uses WebKit `textInput`, and tracks the spacebar keypress path to avoid duplicate inserted characters.
- `SyntheticInputEvent` shares the composition event interface.

Scroll and scrollend:

- `scroll` and `scrollend` are non-delegated events.
- `SimpleEventPlugin` intentionally does not bubble `onScroll` or `onScrollEnd` in the non-capture phase.
- `ScrollEndEventPlugin` optionally polyfills `scrollend` with a 200ms debounce and tracks touch/mouse down state; it uses batched manual dispatch.

Pointer, mouse, touch, and wheel:

- Pointer down/up/cancel are discrete; pointer move/over/out are continuous.
- Mouse move/over/out are continuous; mouse down/up/click are discrete.
- `EnterLeaveEventPlugin` synthesizes mouse/pointer enter/leave from over/out, avoids duplicate over events unless replaying, and computes from/to fibers through nearest mounted host fibers.
- `wheel` is continuous priority and uses `SyntheticWheelEvent`; root listeners are passive when supported. It is not one of the continuous event types queued for hydration replay.
- `touchstart` and `touchmove` listeners are passive when supported; touch start/end/cancel are discrete except touchmove is continuous.

Change, input, and controlled state:

- `ChangeEventPlugin` normalizes `onChange` across input, textarea, select, file input, checkbox/radio click, custom elements, and older input-event fallbacks.
- It calls `enqueueStateRestore` before dispatch so controlled nodes can be restored after the event batch.
- For controlled number inputs, `focusout` updates the default value attribute when needed.
- `ReactDOMUpdateBatching.finishEventHandler` flushes sync work and restores controlled state when pending restores exist.

Form events and actions:

- `submit` and `reset` are discrete priority; `reset` is in the discrete hydration list, while `submit` is not.
- `FormActionEventPlugin` only handles native `submit` when the deepest target is the form itself, which avoids parent-root misdispatch.
- It coerces `action` and submitter `formAction`, sanitizes URL action strings, builds `FormData`, calls `preventDefault` for function actions, and starts a host transition with pending form status.
- Replayed form actions call `dispatchReplayedFormAction`, which starts the same host transition once the function action is available.

## Fast React Architecture Plan

Data model additions:

- `fast-react-core`: add `EventPriority(Lane)` with `NO`, `DISCRETE`, `CONTINUOUS`, `DEFAULT`, `IDLE`, `event_priority_to_lane`, `lanes_to_event_priority`, `higher_event_priority`, `lower_event_priority`, and `is_higher_event_priority`.
- `fast-react-reconciler`: add current update priority flow to `request_update_lane`, root scheduling, sync flush, commit phases, passive effects, hydration attempts, and transition interaction. This should depend on core lanes and event priorities, not DOM event names.
- `fast-react-host-config`: replace placeholder priority associated types in test scaffolds with the core priority type or a constrained adapter type. Keep DOM event-name resolution in DOM adapters.
- Future DOM adapter/package: own native event registration, node/fiber mapping, plugin extraction, synthetic event construction, controlled state restoration, replay queues, and form replay.
- Public `packages/scheduler`: implement public `scheduler@0.27.0` as its own package surface and conformance target. Root scheduling may call it, but it is not the lane model.

Breaking changes recommended:

- Break `EventPriority = ()` placeholder implementations in host-config/test-renderer/reconciler scaffolds. They hide a required cross-boundary invariant.
- Break any future or existing assumption that DOM events are normal props attached to individual nodes. React DOM uses root and portal listener delegation plus plugin extraction.
- Break any design that uses public Scheduler priority values as lane/event priorities. It conflates observable package API with internal reconciler scheduling.

## Future Implementation Slices

These scopes are concrete and non-overlapping. Some should be sequenced after package scaffold workers create the relevant directories.

| Slice | Write scope | Task |
| --- | --- | --- |
| Core event priority | `crates/fast-react-core/src/event_priority.rs`, `crates/fast-react-core/src/lib.rs`, `worker-progress/worker-core-event-priority.md` | Add lane-backed `EventPriority` and tests mirroring `ReactEventPriorities.js`. |
| Host scheduling priority boundary | `crates/fast-react-host-config/src/lib.rs`, `crates/fast-react-test-renderer/src/lib.rs`, `worker-progress/worker-host-event-priority-boundary.md` | Replace unit event priority placeholders in host traits/test renderer with concrete or constrained priority types. |
| Reconciler update priority | `crates/fast-react-reconciler/src/update_priority.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-reconciler-update-priority.md` | Implement `requestUpdateLane` priority plumbing, current priority guards, and lane conversion without DOM event names. |
| Public scheduler root package | `packages/scheduler/**`, `tests/conformance/src/scheduler-root-*`, `tests/conformance/scripts/*scheduler-root*`, `tests/conformance/test/scheduler-root-*`, `tests/conformance/oracles/scheduler-0.27.0-root-oracle.json`, `worker-progress/worker-scheduler-root-implementation.md` | Implement public `scheduler@0.27.0` root behavior separately from lanes. Coordinate with already queued scheduler oracle workers. |
| DOM event priority oracle | `tests/conformance/src/react-dom-event-priority-*`, `tests/conformance/scripts/*react-dom-event-priority*`, `tests/conformance/test/react-dom-event-priority-*`, `tests/conformance/oracles/react-19.2.6-react-dom-event-priority-oracle.json`, `worker-progress/worker-react-dom-event-priority-oracle.md` | Generate deterministic event-name to priority evidence, including `message` under Scheduler priorities. |
| DOM listener registry | `packages/react-dom/src/events/registry.*`, `packages/react-dom/src/events/event-listener.*`, `packages/react-dom/src/events/event-system-flags.*`, `packages/react-dom/src/client/component-tree.*`, `worker-progress/worker-dom-listener-registry.md` | Implement root/portal listener registration, listener dedupe, node/fiber metadata, passive flags, and selectionchange document attachment. |
| DOM dispatch pipeline | `packages/react-dom/src/events/plugin-event-system.*`, `packages/react-dom/src/events/synthetic-event.*`, `worker-progress/worker-dom-dispatch-pipeline.md` | Implement dispatch queue, capture/bubble ordering, portal retargeting, batched event dispatch, and synthetic event base classes. |
| Simple and enter/leave events | `packages/react-dom/src/events/plugins/simple-event-plugin.*`, `packages/react-dom/src/events/plugins/enter-leave-event-plugin.*`, `packages/react-dom/src/events/dom-event-properties.*`, `worker-progress/worker-dom-simple-enter-leave-events.md` | Implement basic event mapping, synthetic constructors, scroll target-only behavior, and mouse/pointer enter/leave synthesis. |
| Change/select/controlled events | `packages/react-dom/src/events/plugins/change-event-plugin.*`, `packages/react-dom/src/events/plugins/select-event-plugin.*`, `packages/react-dom/src/events/controlled-component.*`, `worker-progress/worker-dom-change-select-controlled.md` | Implement normalized change/select events and controlled-state restore queue. |
| BeforeInput/composition events | `packages/react-dom/src/events/plugins/before-input-event-plugin.*`, `packages/react-dom/src/events/fallback-composition-state.*`, `worker-progress/worker-dom-beforeinput-composition.md` | Implement composition and beforeInput fallback state, textInput behavior, IME handling, and synthetic input/composition events. |
| ScrollEnd and form actions | `packages/react-dom/src/events/plugins/scroll-end-event-plugin.*`, `packages/react-dom/src/events/plugins/form-action-event-plugin.*`, `packages/react-dom/src/shared/form-actions.*`, `worker-progress/worker-dom-scrollend-form-actions.md` | Implement scrollend polyfill and function form action dispatch without hydration replay. |
| Hydration event replay | `packages/react-dom/src/events/event-replaying.*`, `packages/react-dom/src/events/current-replaying-event.*`, `tests/conformance/src/react-dom-hydration-event-replay-*`, `worker-progress/worker-dom-hydration-event-replay.md` | Implement continuous replay queues, explicit hydration target queue, form replay queue, change-event replay, and DOM-side retry hooks. |
| Reconciler hydration priority hooks | `crates/fast-react-reconciler/src/hydration_priority.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-reconciler-hydration-priority.md` | Implement `attemptSynchronousHydration`, `attemptContinuousHydration`, and `attemptHydrationAtCurrentPriority` lane scheduling. |

## Behavioral Tests Required

- Root listeners: `createRoot`, `hydrateRoot`, and portal containers install root-scoped delegated listeners once; `selectionchange` attaches to owner document.
- Priority mapping: event-name table matches React DOM 19.2.6, including `message` under each public Scheduler current priority.
- Current update priority: discrete/continuous event wrappers set and restore priority, clear transition state, and nested events restore correctly.
- Scheduler separation: public Scheduler priority constants and task ordering remain independent from lane-backed event priorities.
- Dispatch queue: capture and bubble order, propagation stop behavior, lazy synthetic event construction, and portal retargeting match React.
- Controlled inputs: change events enqueue state restore and flush/restore after the event batch.
- Focus/selection: `onFocus`/`onBlur`, `onSelect`, contentEditable selection, mouse-down suppression, and document selectionchange behavior.
- BeforeInput/composition: textInput, paste, spacebar, fallback composition, Korean IME, and custom event data paths.
- Scroll/pointer/wheel: target-only scroll bubbling, scrollend debounce, pointer enter/leave synthesis, wheel passive listener behavior, and pointer-id replay maps.
- Hydration replay: discrete blocked events attempt sync hydration and stop propagation if still blocked; continuous focus/mouse/drag/pointer events replay after unblocking; explicit hydration target priority order is respected.
- Forms: function form actions prevent default and start host transitions; submit is not discrete-replay queued; form replay dispatches once action props hydrate.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan models root causes directly: root listeners, plugin extraction, lane-backed priorities, and hydration replay queues.
- The report separates source-tag evidence from published package evidence and does not infer public behavior from unpublished source-only paths.

Maintainability:

- Future slices isolate core priority, public scheduler behavior, host scheduling, DOM registry, plugin families, hydration replay, and reconciler hydration hooks.
- Keeping React source names near Fast React module names will make conformance diffs easier to audit.

Performance:

- Delegated root listeners avoid per-node native listener churn.
- Lazy synthetic event construction and fixed priority mapping avoid unnecessary allocations on events with no listeners.
- Replay queues intentionally store only the latest continuous events where React does; do not turn these into unbounded queues.

Security:

- Form actions and URL action strings are security-sensitive. Match React DOM's structured coercion/sanitization behavior; do not concatenate HTML or URLs ad hoc.
- Native event replay clones and redispatches browser events. Keep replayed event state scoped, clear `CurrentReplayingEvent`, and avoid exposing stale native event objects after replay.
- JS callbacks, form actions, refs, host instances, and hydration boundary handles need explicit rooting/lifetime handling across any Rust/native boundary.

## Risks And Blockers

- DOM event implementation is blocked on client roots, node-to-fiber mapping, and a DOM mutation host.
- Hydration replay is blocked on Suspense/Activity/HostRoot hydration state and server marker compatibility.
- Form actions are blocked on host transition status, form state hooks, and controlled form behavior.
- `message` event priority requires coordination with public Scheduler current-priority context.
- Browser-specific event behavior needs real DOM or browser automation tests; Node-only probes are insufficient for selection, composition, passive listeners, and event replay.
- The existing host-config event associated types are placeholders. Leaving them as `()` will block correct current update priority propagation.

## Commands Run

Project orientation:

```sh
pwd && rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/worker-041-dom-events-priority-plan.md' -g 'worker-progress/worker-007*' -g 'worker-progress/worker-008*' -g 'worker-progress/worker-030*' -g 'worker-progress/worker-033*' -g 'package.json' -g 'pnpm-lock.yaml' -g 'yarn.lock' -g 'package-lock.json'
git status --short
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,260p' worker-progress/worker-008-renderer-host-config.md
sed -n '1,300p' worker-progress/worker-030-core-lane-model.md
sed -n '1,700p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,240p' docs/tasks/worker-041-dom-events-priority-plan.prompt.md
sed -n '1,260p' worker-progress/worker-034-scheduler-package-inventory.md
```

Package and version evidence:

```sh
node --version
npm --version
npm view react-dom@19.2.6 version dist.tarball dist.integrity dependencies peerDependencies exports --json
npm view scheduler@0.27.0 version dist.tarball dist.integrity main exports --json
git ls-remote --tags https://github.com/facebook/react.git refs/tags/v19.2.6 'refs/tags/v19.2.6^{}'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/ReactVersions.js | sed -n '1,80p'
node tests/conformance/scripts/print-inventory.mjs --format markdown | rg -n "react-dom|scheduler|19\\.2\\.6|0\\.27\\.0" -C 2
node - <<'NODE'
const fs = require('node:fs');
const inv = JSON.parse(fs.readFileSync('tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json', 'utf8'));
for (const name of ['react-dom','scheduler']) {
  const pkg = inv.packages[name];
  console.log(name, JSON.stringify({version: pkg.version, distTarball: pkg.registry?.distTarball, distIntegrity: pkg.registry?.distIntegrity, dependencies: pkg.packageJson?.dependencies, peerDependencies: pkg.packageJson?.peerDependencies, publicSubpaths: pkg.publicSubpaths}, null, 2));
}
NODE
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -tzf - | sort | rg 'cjs/react-dom.*(development|production)|client|index|profiling'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/package.json | sed -n '1,180p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | rg -n "function getEventPriority|function createEventListenerWrapperWithPriority|function dispatchDiscreteEvent|function dispatchContinuousEvent|queueExplicitHydrationTarget|discreteReplayableEvents|listenToAllSupportedEvents|nonDelegatedEvents|function dispatchEventForPluginEventSystem" -C 3
curl -fsSL https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz | tar -tzf - | sort
curl -fsSL https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz | tar -xOzf - package/cjs/scheduler.development.js | rg -n "ImmediatePriority|UserBlockingPriority|NormalPriority|LowPriority|IdlePriority|taskQueue|timerQueue|unstable_scheduleCallback|unstable_getCurrentPriorityLevel" -C 2
```

React source evidence:

```sh
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMEventListener.js | sed -n '1,620p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactDOMUpdatePriority.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMEventReplaying.js | sed -n '1,760p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/DOMPluginEventSystem.js | sed -n '1,820p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactEventPriorities.js | sed -n '1,240p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMRoot.js | rg -n "listenToAllSupportedEvents|hydrateRoot|createRoot|unstable_scheduleHydration|queueExplicitHydrationTarget|markContainerAsRoot" -C 6
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | rg -n "preparePortalMount|setCurrentUpdatePriority|getCurrentUpdatePriority|resolveUpdatePriority|flushHydrationEvents|retryIfBlockedOn|beforeActiveInstanceBlur|afterActiveInstanceBlur|resetFormInstance|startSuspendingCommit|waitForCommitToBeReady" -C 4
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/shared/ReactDOMFlushSync.js | sed -n '1,200p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/ReactDOMSharedInternals.js | sed -n '1,160p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberReconciler.js | rg -n "attemptSynchronousHydration|attemptContinuousHydration|attemptHydrationAtCurrentPriority|createHydrationContainer|queueExplicitHydrationTarget|flushRoot|scheduleUpdateOnFiber" -C 5
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberWorkLoop.js | rg -n "requestUpdateLane|resolveUpdatePriority|eventPriorityToLane|lanesToEventPriority|getCurrentUpdatePriority|setCurrentUpdatePriority|flushSync|DiscreteEventPriority|schedulerPriority" -C 5
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberRootScheduler.js | rg -n "lanesToEventPriority|Scheduler|DiscreteEventPriority|ContinuousEventPriority|DefaultEventPriority|IdleEventPriority|scheduleTaskForRootDuringMicrotask|ensureRootIsScheduled|flushSyncWorkAcrossRoots_impl|scheduleCallback" -C 5
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-reconciler/src/ReactFiberLane.js | rg -n "SyncLane|InputContinuousLane|DefaultLane|IdleLane|SelectiveHydrationLane|getBumpedLaneForHydrationByLane|HydrationLane|TotalLanes|getNextLanes|claimNextTransitionLane|claimNextRetryLane" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/EventRegistry.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/EventSystemFlags.js | sed -n '1,160p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/EventListener.js | sed -n '1,180p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactDOMComponentTree.js | rg -n "precacheFiberNode|markContainerAsRoot|isContainerMarkedAsRoot|getClosestInstanceFromNode|getEventListenerSet|getFiberCurrentPropsFromNode|updateFiberProps|getEventHandlerListeners|getScrollEndTimer" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/plugins/SimpleEventPlugin.js | sed -n '1,340p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/DOMEventProperties.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/SyntheticEvent.js | rg -n "Synthetic.*Event|SyntheticMouseEvent|SyntheticPointerEvent|SyntheticWheelEvent|SyntheticInputEvent|SyntheticKeyboardEvent|SyntheticFocusEvent|SyntheticCompositionEvent|SyntheticClipboardEvent|SyntheticUIEvent" -C 3
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/DOMEventNames.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/plugins/ChangeEventPlugin.js | sed -n '1,360p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/plugins/BeforeInputEventPlugin.js | sed -n '1,620p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/plugins/SelectEventPlugin.js | sed -n '1,320p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/plugins/FormActionEventPlugin.js | sed -n '1,420p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/plugins/EnterLeaveEventPlugin.js | sed -n '1,320p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/plugins/ScrollEndEventPlugin.js | sed -n '1,320p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMUpdateBatching.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMControlledComponent.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMEventReplaying.js | rg -n "queued|discreteReplayableEvents|queue|replay|scheduleCallback|retryIfBlockedOn|submit|change"
```

Local Fast React source checks:

```sh
sed -n '1,260p' crates/fast-react-core/src/lane.rs
sed -n '1,260p' crates/fast-react-host-config/src/lib.rs
sed -n '700,1210p' crates/fast-react-host-config/src/lib.rs
sed -n '180,230p' crates/fast-react-reconciler/src/lib.rs
sed -n '590,630p' crates/fast-react-test-renderer/src/lib.rs
rg -n "CurrentUpdatePriority|EventPriority|Lane|Hydration|Event|Portal|supportsHydration|supportsMutation|flushHydrationEvents|preparePortalMount" crates packages tests -g '!target'
rg --files crates packages tests | sort | sed -n '1,240p'
```

Delegation:

```sh
spawn_agent explorer: verify React DOM event priority and hydration replay boundaries
spawn_agent explorer: verify React DOM plugin edge cases and listener registration
```

## Changed Files

- `worker-progress/worker-041-dom-events-priority-plan.md`

## Completion Checklist

- [x] Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Called `create_goal` for this worker task.
- [x] Wrote only `worker-progress/worker-041-dom-events-priority-plan.md`.
- [x] Used worker 007, worker 008, worker 030, worker 033, and React DOM 19.2.6 source/package evidence.
- [x] Mapped root/portal listeners, plugin dispatch, event priorities, current update priority, hydration replay, special event families, and scheduler/lane boundary implications.
- [x] Kept public Scheduler priorities separate from internal lane bitsets.
- [x] Recommended concrete future worker scopes.
- [x] Reviewed quality, maintainability, performance, and security implications.

## Orchestrator Post-Run Verification

- 2026-05-09: After the worker exited on a usage-limit error, the orchestrator verified this report had no concrete local path leaks, no trailing whitespace, and a clean no-index diff whitespace check. Scoped status showed only this report file.
