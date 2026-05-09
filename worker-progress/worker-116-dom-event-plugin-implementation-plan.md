# worker-116-dom-event-plugin-implementation-plan

## Objective

Produce a report-only implementation plan for the first DOM event plugin
extraction slice, including listener entry wrappers, target resolution,
capture/bubble dispatch queues, update priority, batching,
controlled-state restore hooks, and portal/root boundaries.

Write scope honored: this report is the only file changed. No source code was
implemented.

## Goal Tool Status

- `create_goal` was available and was called before research, file reads,
  implementation planning, or verification.
- `get_goal` was available immediately after goal setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: `Produce a report-only
  implementation plan for the first DOM event plugin extraction slice,
  including listener entry wrappers, target resolution, capture/bubble dispatch
  queues, update priority, batching, controlled-state restore hooks, and
  portal/root boundaries. Write only
  worker-progress/worker-116-dom-event-plugin-implementation-plan.md; do not
  implement source code.`

## Summary

The first DOM event plugin extraction slice should introduce the extraction
pipeline shape without claiming full React DOM event compatibility. The root
cause to avoid is a direct native-listener-to-prop-callback path. React DOM's
observable event behavior depends on listener-entry priority wrappers, DOM
target-to-fiber resolution, current props lookup, ordered capture/bubble
dispatch queues, event batching, controlled-state restoration hooks, and
root/portal retargeting.

This slice should deliberately stop below controlled input value tracking,
hydration replay, Suspense/Activity boundary scheduling, resources, form action
semantics, and custom plugin expansion beyond the first root event path. It can
create the stable seams for those systems, but must leave their behavior
loudly unsupported or no-op gated until their prerequisite workers land.

Breaking cleanup is recommended before implementation: replace all
`EventPriority = ()` scaffolding with a lane-backed event-priority type before
DOM dispatch is wired. Keeping unit placeholders would hide priority and
controlled-restore bugs behind an apparently working click path.

## Dependency Status

Merged or present evidence:

- Worker 041 is present and establishes the DOM events, event-priority,
  batching, controlled-restore, portal, and hydration-replay architecture.
- Worker 048 is present with the checked React DOM event-name/update-priority
  oracle. It anchors discrete, continuous, default, idle, and `message`
  priority behavior.
- Worker 065 is present with the checked delegated event oracle. It anchors
  root listener side effects for selected events, capture/bubble order,
  propagation, default prevention, synthetic shape, passive `wheel`, and
  `currentTarget` reset.
- Worker 090 is present and makes DOM node maps, latest props maps, public
  instance lookup, root markers, and cleanup prerequisites for event target
  resolution.
- Worker 098 is present and provides the prior DOM event plugin extraction
  plan. This report narrows it into a first implementation slice and completion
  gates.

Provisional or absent dependencies in this worktree:

- Worker 088 root/container marker report and oracle are absent. Any dependency
  on root marker behavior is provisional.
- Worker 089 root/portal listener installation report and oracle are absent.
  Worker 041 and 065 establish enough shape for planning, but exact root and
  portal listener installation evidence remains provisional here.
- Worker 108 React DOM root facade implementation plan is absent. Do not assume
  `createRoot` or root object implementation sequencing beyond the present
  public placeholders.
- Worker 110 DOM text-content host plan is absent. Text-node event target
  resolution should be planned as a hook, not claimed as implemented behavior.

Supporting present evidence:

- Worker 057 portal oracle is present but covers public `createPortal` object
  construction only, not portal rendering, `preparePortalMount`, or portal
  event bubbling.
- Worker 058 flushSync/batching oracle is present but covers public rootless
  facade behavior, not private root scheduling or DOM event batch semantics.
- `packages/react-dom` currently has only placeholder public files and no
  `packages/react-dom/src` implementation tree.
- `crates/fast-react-core/src/lane.rs` has the needed lane constants, but no
  `EventPriority` module.
- `crates/fast-react-host-config/src/lib.rs` has `HostFiberTokenRef`,
  `HostScheduling` priority hooks, and `PortalHost::prepare_portal_mount`, but
  test/reconciler scaffolds still use unit event priority in places.
- `crates/fast-react-reconciler/src/lib.rs` is still placeholder-level and has
  no root scheduler, `requestUpdateLane`, sync flushing, mounted-token
  resolver, or commit traversal.

## First Slice Boundary

The first implementation slice should include:

- Listener entry wrapper functions selected by event priority.
- DOM event target normalization and a call into a node-map resolver.
- Dispatch queue construction for one first root event path, starting with
  SimpleEventPlugin-style two-phase dispatch for `click` and a representative
  continuous example once priority plumbing exists.
- Synthetic event base behavior needed by worker 065: persistent events,
  `target`, callback-scoped `currentTarget`, `stopPropagation`,
  `preventDefault`, and `persist()` no-op.
- Capture and bubble listener accumulation from target to root using latest
  props.
- Event batch entry/exit with a shared controlled-state restore hook queue.
- Portal/root retargeting scaffolding that prevents obvious cross-root leakage
  and flags unimplemented portal bubbling cases rather than double-dispatching.

The first slice should exclude:

- Controlled input value tracking and actual input/select/textarea restoration.
- Hydration replay queues, blocked target replay, Suspense, Activity, and
  `SelectiveHydrationLane` scheduling.
- Form actions, resource APIs, singleton/hoistable resources, and custom event
  handles.
- Full plugin families beyond the first root event path. `ChangeEventPlugin`,
  `SelectEventPlugin`, `BeforeInputEventPlugin`, `FormActionEventPlugin`,
  `ScrollEndEventPlugin`, and full `EnterLeaveEventPlugin` should remain later
  slices, with only integration placeholders where the dispatch queue requires
  them.

## Implementation Plan

### 1. Event Priority Prerequisite

Future source files:

- `crates/fast-react-core/src/event_priority.rs`
- `crates/fast-react-core/src/lib.rs`
- `crates/fast-react-reconciler/src/update_priority.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs`

Plan:

- Add `EventPriority` as a transparent lane-backed core type.
- Define `NO`, `DISCRETE`, `CONTINUOUS`, `DEFAULT`, and `IDLE` from
  `NoLane`, `SyncLane`, `InputContinuousLane`, `DefaultLane`, and `IdleLane`.
- Add `event_priority_to_lane`, `lanes_to_event_priority`,
  `higher_event_priority`, `lower_event_priority`, and
  `is_higher_event_priority`.
- Replace unit `EventPriority = ()` scaffolding in host/test scaffolds with the
  concrete type or a constrained host adapter that cannot silently erase
  priority.
- Keep public Scheduler numeric priorities separate. `message` bridging is a
  DOM update-priority concern, not a public Scheduler implementation detail.

Required tests:

- Core unit tests for exact lane mapping and ordering against worker 048.
- Host/reconciler compile tests proving unit priority cannot satisfy the real
  scheduling boundary.
- Reconciler tests for `resolveUpdatePriority` to lane conversion once
  `requestUpdateLane` exists.

Completion gate:

- No DOM event dispatch source should be enabled while event priority can still
  be represented as `()`.

### 2. React DOM Source Tree Skeleton

Future source files:

- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/client/root-markers.js`
- `packages/react-dom/src/client/update-priority.js`
- `packages/react-dom/src/events/event-listener.js`
- `packages/react-dom/src/events/listener-registry.js`
- `packages/react-dom/src/events/react-dom-event-listener.js`
- `packages/react-dom/src/events/get-event-target.js`
- `packages/react-dom/src/events/get-listener.js`
- `packages/react-dom/src/events/event-registry.js`
- `packages/react-dom/src/events/event-system-flags.js`
- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/events/synthetic-event.js`
- `packages/react-dom/src/events/update-batching.js`
- `packages/react-dom/src/events/controlled-component.js`
- `packages/react-dom/src/events/plugins/simple-event-plugin.js`

Plan:

- Introduce `packages/react-dom/src` as private implementation code while
  keeping public entrypoints in `packages/react-dom/index.js` and
  `packages/react-dom/client.js`.
- Do not change public placeholders until root facade and DOM host
  prerequisites can call these modules through a real root path.
- Export private helpers only within the package. Do not expose listener marker
  names, tokens, or internal queues through public React DOM APIs.

Required tests:

- Smoke tests that importing public React DOM entrypoints still follows the
  current placeholder boundary until the facade workers intentionally change
  it.
- Static import tests for private modules can be added only if the package
  test conventions allow private paths.

Completion gate:

- Creating the private source tree must not by itself claim a supported public
  React DOM event behavior.

### 3. Target Resolution And Latest Props

Future source files:

- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/client/root-markers.js`
- `packages/react-dom/src/events/get-event-target.js`
- `packages/react-dom/src/events/get-listener.js`
- future bridge to `crates/fast-react-reconciler/src/host_tokens.rs`

Plan:

- Follow worker 090: store private `node -> token`, `node -> latest props`,
  container/root markers, listener sets, and root-scoped `token -> node`
  mappings.
- Resolve a native event target by normalizing text-node targets to their
  parent when appropriate, then walking DOM ancestors until a current mounted
  host token or root marker is found.
- Validate tokens through the reconciler rather than trusting a DOM node map.
  Stale, wrong-root, wrong-renderer, wrong-target, and wrong-phase tokens must
  fail explicitly or continue to an ancestor only where React DOM would.
- Read listener props only through the latest-props map during dispatch. Do
  not close over props during native listener registration.
- Ensure deletion cleanup clears tokens, latest props, reverse maps, scroll
  timers, event-handle placeholders, and pending controlled restore entries for
  deleted nodes.

Required tests:

- Node-to-token lookup from element targets and text-node targets.
- Latest props update changes the invoked listener; removed listener props are
  not called.
- Deleted nodes cannot dispatch stale listeners.
- Nested roots do not leak event lookup into the wrong root.
- Root marker behavior is provisional until worker 088 lands in this worktree.

Completion gate:

- Plugin extraction cannot call a prop listener unless target resolution has
  returned a current mounted token and latest props for the owning node.

### 4. Listener Entry Wrappers

Future source files:

- `packages/react-dom/src/events/event-listener.js`
- `packages/react-dom/src/events/listener-registry.js`
- `packages/react-dom/src/events/react-dom-event-listener.js`
- `packages/react-dom/src/client/update-priority.js`
- `packages/react-dom/src/events/event-system-flags.js`

Plan:

- Add `createEventListenerWrapperWithPriority(targetContainer, domEventName,
  eventSystemFlags)` that chooses discrete, continuous, or default wrapper
  based on the worker 048 event-priority table.
- `dispatchDiscreteEvent` should clear current transition state, set current
  update priority to discrete, dispatch, and restore both previous transition
  and priority in a `finally`.
- `dispatchContinuousEvent` should do the same with continuous priority.
- Default `dispatchEvent` should not force priority; it should rely on
  `resolveUpdatePriority` fallback behavior.
- `resolveUpdatePriority` should prefer stored current priority, then map
  `window.event.type` through `getEventPriority`, then return default.
- `message` must bridge from public Scheduler current priority exactly as in
  worker 048, while keeping Scheduler numeric constants out of lanes.
- Root and portal listener installation remain a separate layer. Because
  worker 089 is absent here, exact listener installation claims must be
  provisional and tested when that oracle lands.

Required tests:

- Discrete wrappers set/restore priority through nested dispatch and thrown
  listeners.
- Continuous wrappers set/restore priority through nested dispatch and thrown
  listeners.
- Default events leave previous priority alone.
- `message` mapping matches worker 048 for Immediate, UserBlocking, Normal,
  Low, Idle, and unknown Scheduler priority.
- Listener wrapper selection does not attach native listeners by itself.

Completion gate:

- Every event path entering plugin extraction must pass through one priority
  wrapper or an explicit default dispatch path; no direct callback shortcut is
  allowed.

### 5. Plugin Extraction And Dispatch Queue

Future source files:

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/events/event-registry.js`
- `packages/react-dom/src/events/event-system-flags.js`
- `packages/react-dom/src/events/get-listener.js`
- `packages/react-dom/src/events/synthetic-event.js`
- `packages/react-dom/src/events/plugins/simple-event-plugin.js`

Plan:

- Implement `dispatchEventForPluginEventSystem(domEventName, eventSystemFlags,
  nativeEvent, targetInst, targetContainer)` as the only extraction entry.
- Wrap extraction and dispatch in `batchedUpdates`.
- Build a dispatch queue with entries shaped as `{ event, listeners }`.
- Run `SimpleEventPlugin.extractEvents` first. For this first slice, support
  the smallest conformance-backed root path: selected mouse events from worker
  065, plus the infrastructure to add continuous examples without changing the
  queue shape.
- Lazily construct synthetic events only when at least one listener exists.
- Accumulate two-phase listeners from target to root using current props and
  current public DOM nodes.
- For capture, process root-to-target. For bubble, process target-to-root.
- Assign `syntheticEvent.currentTarget` only while invoking a listener and
  reset it to `null` after each callback.
- Implement `stopPropagation` so later listeners are skipped once propagation
  crosses to a different instance.
- Implement `preventDefault` so synthetic state and native event state follow
  worker 065.
- Validate listener values at dispatch time and throw React-compatible errors
  for non-functions.
- Keep modern event persistence: no pooling, `persist()` is a no-op.

Required tests:

- Worker 065 delegation oracle remains green.
- Capture/bubble order for parent/child `click`.
- Child bubble `stopPropagation` skips parent bubble but preserves prior
  capture listeners.
- `preventDefault` updates synthetic and native state.
- `currentTarget` is callback-scoped and reset after dispatch.
- Event object is retained after dispatch without pooling warnings.
- Non-function listener values throw at dispatch time.
- No listener means no synthetic allocation and no callback invocation.

Completion gate:

- The queue processor must be the only place user event callbacks are invoked.

### 6. Batching And Controlled-Restore Hooks

Future source files:

- `packages/react-dom/src/events/update-batching.js`
- `packages/react-dom/src/events/controlled-component.js`
- `packages/react-dom/src/client/update-priority.js`
- `packages/react-dom/src/shared/flush-sync.js`
- future controlled DOM files below this slice:
  `packages/react-dom/src/client/input-value-tracking.js`,
  `packages/react-dom/src/client/restore-controlled-state.js`

Plan:

- Add event batching state equivalent to React DOM's outermost event handler
  guard.
- `batchedUpdates(fn, a, b)` should call through immediately when already in a
  batch, but only the outermost exit should run controlled restore hooks.
- `finishEventHandler` should call `needsStateRestore()`. If true, flush sync
  work through the root scheduler once available, then call
  `restoreStateIfNeeded()`.
- `controlled-component.js` should own `enqueueStateRestore(targetNode)`,
  `needsStateRestore()`, and `restoreStateIfNeeded()`.
- In this first slice, `restoreStateIfNeeded()` may resolve current props and
  call a loud unsupported `restoreControlledState` hook. It must not implement
  controlled input value tracking.
- `ChangeEventPlugin` may be represented only by a future hook contract in
  this slice. Do not claim `onChange` compatibility until controlled input
  value tracking and worker 064 evidence are merged.

Required tests:

- Nested event batches restore only once after the outer batch exits.
- Throws from listener callbacks restore batching and priority state.
- Pending controlled restore queue is drained after batch exit.
- Deleted or unmounted targets no-op during restore resolution.
- Worker 058 public batching oracle remains separately green; do not use it as
  proof of private DOM event batching.

Completion gate:

- Controlled restore must be queued and drained at the batching boundary, not
  inside an individual plugin's `finally`.

### 7. Portal And Root Boundaries

Future source files:

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/root-markers.js`
- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/events/listener-registry.js`
- host hook: `PortalHost::prepare_portal_mount`

Plan:

- Treat root and portal listener installation as input to this slice, not as
  plugin extraction ownership.
- During extraction, walk the resolved target fiber/token return chain to find
  `HostRoot` and `HostPortal` boundaries.
- If the boundary container matches the current target container, dispatch in
  that root.
- If dispatch crosses a portal boundary, retarget through the container's
  closest host instance so React tree propagation, not DOM ancestry alone,
  determines listener order.
- Prevent double dispatch when both root and portal containers have delegated
  listeners for the same event.
- Because worker 089 is absent and worker 057 does not cover portal event
  bubbling, all portal bubbling compatibility claims must remain provisional.

Required tests:

- Nested roots do not receive events from an inner root unless React DOM would
  propagate there.
- Portal event bubbling follows React owner/fiber ancestry where supported by
  the future portal-event oracle.
- Portal container listener installation is called through
  `prepare_portal_mount` once the listener installation oracle is present.
- No double-dispatch when a portal event can be observed by both portal and
  root container listeners.

Completion gate:

- If portal retargeting cannot be resolved against current mounted tokens, the
  first slice should fail loudly or skip portal bubbling with an explicit
  compatibility gap. It must not silently fall back to DOM-only ancestry.

## Ordering Invariants

- Event priority wrapper entry happens before target resolution and plugin
  extraction.
- Native target normalization happens before node-map lookup.
- Hydration blocked-target checks, when later added, happen before plugin
  extraction.
- Plugin extraction always happens inside `batchedUpdates`.
- `SimpleEventPlugin` extraction runs before later polyfill/stateful plugins.
- Listener props are read from latest-props maps during dispatch, not captured
  at registration time.
- Capture listeners are invoked root-to-target; bubble listeners are invoked
  target-to-root.
- `currentTarget` is set only while a listener runs and reset after the
  listener returns or throws.
- Priority, transition, batching, and current replay state must restore through
  `finally` paths on thrown callbacks.
- Controlled restore drains only after the outermost event batch exits and
  after any required sync flush.
- Root/portal retargeting must follow fiber ownership before DOM ancestry.
- Deleted or stale tokens must never invoke user event callbacks.

## Conformance Gaps

Known gaps that must remain explicit after the first slice:

- Root marker behavior is provisional until worker 088 artifacts are present.
- Full root and portal listener installation behavior is provisional until
  worker 089 artifacts are present.
- React DOM root facade sequencing is provisional until worker 108 is present.
- Text-node host behavior is provisional until worker 110 is present.
- Portal event bubbling lacks a checked oracle; worker 057 only covers public
  portal object construction.
- Hydration replay, Suspense/Activity blocked targets, and
  `SelectiveHydrationLane` scheduling are out of scope.
- Controlled input value tracking and actual input/select/textarea restore are
  out of scope.
- `ChangeEventPlugin`, `SelectEventPlugin`, `BeforeInputEventPlugin`,
  `FormActionEventPlugin`, full `EnterLeaveEventPlugin`, and
  `ScrollEndEventPlugin` are later slices.
- Browser-sensitive focus, selection, IME/composition, passive listener, and
  form behavior need browser or richer DOM-host oracles beyond the minimal DOM
  delegation oracle.

## Completion Gates

The first implementation slice should be considered complete only when all of
these are true:

- `EventPriority = ()` no longer masks host/reconciler event priority paths.
- Private `packages/react-dom/src/events` modules exist for listener wrappers,
  update priority, plugin event system, dispatch queue processing, synthetic
  events, batching, and controlled restore hooks.
- Target resolution reads current mounted tokens and latest props; stale or
  deleted targets cannot invoke callbacks.
- The worker 048 event-priority oracle remains green.
- The worker 065 delegated event oracle remains green for the implemented
  root path.
- Capture/bubble, `stopPropagation`, `preventDefault`, and `currentTarget`
  reset behavior are tested through the dispatch queue, not through direct
  callback shortcuts.
- Batching tests prove priority and batching state restoration on nested calls
  and throws.
- Controlled restore hook tests prove queue/drain timing without claiming
  controlled input value tracking.
- Root/portal boundary tests either pass against present oracles or are marked
  as explicit provisional gaps if worker 088/089/portal-event evidence is not
  merged.
- No public React DOM compatibility claim is made for hydration replay,
  controlled form value tracking, Suspense, resources, or unsupported plugin
  families.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan addresses the root cause: event callbacks are part of scheduling,
  target resolution, batching, and controlled-state semantics. It rejects
  direct prop-callback shortcuts.
- Present and absent worker dependencies are separated so provisional behavior
  is not mistaken for merged evidence.

Maintainability:

- Future files mirror React DOM responsibility names closely enough to compare
  with pinned React source and existing oracles.
- The plan keeps listener installation, plugin extraction, hydration replay,
  controlled restore, and root facade ownership separate.

Performance:

- Root-scoped delegated listeners avoid per-node native listener churn.
- Latest-props lookup and lazy synthetic event construction keep the hot path
  allocation-conscious.
- Controlled restore queues are bounded to event targets observed in a batch
  and cleared at the batch boundary.

Security:

- Internal listener markers, host tokens, and callback handles must remain
  private and must not be serialized in public artifacts.
- Stale DOM nodes and deleted tokens must not retain user callbacks or form
  actions through latest-props maps.
- Any later native or Rust boundary must root JS callback handles explicitly
  and avoid invoking JS callbacks from background threads.

## Delegated Checks

Two read-only nested explorer checks were used:

- Dependency/artifact check: confirmed workers 041, 048, 065, 090, and 098 are
  present; workers 088, 089, 108, and 110 are absent in this worktree; worker
  057 portal evidence is public-object only. The check reinforced the
  provisional labels used above.
- Source-boundary check: confirmed `packages/react-dom` has only placeholder
  public entrypoints and no `src` implementation tree; core lanes exist
  without a concrete event-priority wrapper; host-config has future token,
  scheduling, and portal hooks; the reconciler is still placeholder-level.

The nested checks were read-only and did not change files. `ORCHESTRATOR.md`
was not read by this worker or the delegated checks.

## Completion Audit

Concrete success criteria for this worker:

- Produce a report-only implementation plan.
- Write only `worker-progress/worker-116-dom-event-plugin-implementation-plan.md`.
- Cover listener entry wrappers, target resolution, capture/bubble queues,
  update priority, batching, controlled-state restore hooks, and portal/root
  boundaries.
- Anchor conclusions in present workers 041, 048, 065, 090, and 098; use
  workers 089 and 108 only if present.
- Treat workers 088, 089, 108, and 110 as provisional unless their reports or
  oracles are present.
- Keep the first slice below controlled value tracking, hydration replay,
  Suspense, resources, and custom plugin expansion beyond the first root event
  path.
- Specify future source files, tests, conformance gaps, ordering invariants,
  risks, and completion gates.
- Summarize delegated checks.
- Include handoff sections for summary, changed files, commands, evidence,
  risks, and recommended next tasks.
- Review quality, maintainability, performance, and security.

Prompt-to-artifact checklist:

| Requirement | Evidence in this report | Audit result |
| --- | --- | --- |
| Report-only plan | Objective and summary state no source code was implemented. | Satisfied |
| Scoped write path | Changed files lists only this report; final `git status` showed only this untracked file. | Satisfied |
| Listener entry wrappers | Section `Listener Entry Wrappers` names wrappers, priority entry, tests, and gate. | Satisfied |
| Target resolution | Section `Target Resolution And Latest Props` names maps, token validation, tests, and gate. | Satisfied |
| Capture/bubble queues | Section `Plugin Extraction And Dispatch Queue` and `Ordering Invariants` define queue and order. | Satisfied |
| Update priority | Sections `Event Priority Prerequisite` and `Listener Entry Wrappers` define lane-backed priority and `message` bridge. | Satisfied |
| Batching | Section `Batching And Controlled-Restore Hooks` defines event batch entry/exit and tests. | Satisfied |
| Controlled restore hooks | Same section defines queue hooks while excluding value tracking. | Satisfied |
| Portal/root boundaries | Section `Portal And Root Boundaries` defines retargeting and provisional gates. | Satisfied |
| Anchor in workers 041, 048, 065, 090, 098 | Section `Dependency Status` records each present dependency and its role. | Satisfied |
| Worker 089 if present | Artifact checks found worker 089 absent; report labels listener dependencies provisional. | Satisfied |
| Worker 108 if present | Artifact checks found worker 108 absent; report labels root facade sequencing provisional. | Satisfied |
| Treat 088/089/108/110 as provisional | `Dependency Status`, `Conformance Gaps`, and `Risks Or Blockers` label them absent/provisional. | Satisfied |
| Stay below excluded scopes | `First Slice Boundary` and `Conformance Gaps` explicitly exclude controlled value tracking, hydration replay, Suspense, resources, and later plugin families. | Satisfied |
| Exact future files | Each implementation section lists concrete future source files. | Satisfied |
| Tests and gates | Each implementation section lists required tests and completion gates; global `Completion Gates` consolidates them. | Satisfied |
| Ordering invariants | Dedicated `Ordering Invariants` section. | Satisfied |
| Conformance gaps | Dedicated `Conformance Gaps` section. | Satisfied |
| Delegated checks | Dedicated `Delegated Checks` section summarizes both read-only explorers. | Satisfied |
| Handoff requirements | `Summary`, `Changed Files`, `Commands Run`, `Risks Or Blockers`, and `Recommended Next Tasks` are present. | Satisfied |
| Quality review | `Quality, Maintainability, Performance, And Security Review` is present. | Satisfied |

Audit evidence inspected:

- The report was read back with `sed` after creation.
- `git status --short --untracked-files=all` showed only
  `worker-progress/worker-116-dom-event-plugin-implementation-plan.md`.
- `git diff --check -- worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
  reported no whitespace errors.
- A no-index `git diff --check` against `/dev/null` passed for the untracked
  report.
- Prompt keyword coverage was checked with `rg`.
- Trailing whitespace, conflict marker, and concrete local/temp path scans
  returned no matches.

## Commands Run

- `create_goal` for the worker objective.
- `get_goal`.
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,280p' MASTER_PROGRESS.md`
- `rg --files | rg '^(worker-progress/worker-(041|048|065|088|089|090|098|108|110)|tests/conformance/(src|scripts|test|oracles)/.*(event|portal|root|flush|batch|controlled|text-content|priority))'`
- `find packages -maxdepth 3 -type f | sort`
- `find crates -maxdepth 3 -type f | sort`
- `git status --short --untracked-files=all`
- `sed -n '1,260p' worker-progress/worker-041-dom-events-priority-plan.md`
- `sed -n '1,280p' worker-progress/worker-048-react-dom-event-priority-oracle.md`
- `sed -n '1,300p' worker-progress/worker-065-dom-event-delegation-oracle.md`
- `sed -n '1,300p' worker-progress/worker-090-dom-node-map-public-instance-plan.md`
- `sed -n '261,620p' worker-progress/worker-041-dom-events-priority-plan.md`
- `sed -n '1,360p' worker-progress/worker-098-dom-event-plugin-extraction-plan.md`
- `sed -n '1,220p' tests/conformance/oracles/react-19.2.6-react-dom-event-priority-oracle.json`
- `sed -n '1,220p' tests/conformance/oracles/react-19.2.6-dom-event-delegation-oracle.json`
- `sed -n '361,760p' worker-progress/worker-098-dom-event-plugin-extraction-plan.md`
- `sed -n '1,260p' packages/react-dom/index.js`
- `sed -n '1,260p' packages/react-dom/client.js`
- `sed -n '1,320p' crates/fast-react-core/src/lane.rs`
- `rg -n "trait HostTypes|type EventPriority|trait HostScheduling|set_current_update_priority|current_update_priority|resolve_update_priority|HostFiberToken|prepare_portal_mount|flush_hydration_events|restore|Form|PortalHost|HydrationHost" crates/fast-react-host-config/src/lib.rs -C 4`
- `sed -n '1,260p' package.json`
- `sed -n '1,260p' tests/conformance/package.json`
- `sed -n '1,340p' crates/fast-react-reconciler/src/lib.rs`
- `rg -n "type EventPriority = \\(\\)|HostFiberTokenRef|HostScheduling|set_current_update_priority|current_update_priority|resolve_update_priority|prepare_portal_mount|unstable_batchedUpdates|flushSync|createPortal|createRoot|hydrateRoot|Lane::(SYNC|INPUT_CONTINUOUS|DEFAULT|IDLE)" crates packages tests -g '!target'`
- `rg -n "worker-0(88|89|90|98)|worker-10(8)|worker-110|worker-041|worker-048|worker-065" MASTER_PLAN.md MASTER_PROGRESS.md`
- `rg --files worker-progress tests/conformance | rg '(worker-(088|089|108|110)|root-listener|listener-install|text-content|root-facade|dom-event-plugin|node-map)'`
- `rg --files docs/tasks | rg 'worker-(088|089|090|098|108|110|116)'`
- `rg --files worker-progress tests/conformance | rg '(worker-05[78]|react-dom-portal|react-dom-flush-sync-batching|worker-092|worker-095)'`
- `sed -n '1,220p' worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md`
- `sed -n '1,220p' worker-progress/worker-057-react-dom-portal-oracle.md`
- `sed -n '1,260p' worker-progress/worker-092-react-dom-create-root-facade-plan.md`
- `sed -n '1,260p' docs/tasks/worker-116-dom-event-plugin-implementation-plan.prompt.md`
- `test -f worker-progress/worker-116-dom-event-plugin-implementation-plan.md && sed -n '1,260p' worker-progress/worker-116-dom-event-plugin-implementation-plan.md || true`
- Two `spawn_agent` read-only explorer checks.
- `sed -n '1,320p' worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- `sed -n '321,760p' worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- `git status --short --untracked-files=all`
- `git diff --check -- worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- `rg -n "listener entry|target resolution|capture|bubble|update priority|batching|controlled|portal|root boundaries|worker 041|worker 048|worker 065|worker 089|worker 090|worker 098|worker 108|worker 088|worker 110|hydration replay|Suspense|resources|custom plugin|Future source files|Required tests|Completion gate|Ordering Invariants|Conformance Gaps|Delegated Checks|Commands Run|Changed Files|Risks Or Blockers|Recommended Next Tasks" worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- `rg -n "[ \t]$" worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- Local/temp path leak scan over
  `worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- `git diff --no-index --check /dev/null worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
  - First attempt failed because `status` is a read-only shell variable in the
    active shell.
  - Rerun with a different variable name passed with no whitespace output.
- `sed -n '1,860p' worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- Combined trailing-whitespace, conflict-marker, and local-path scan over
  `worker-progress/worker-116-dom-event-plugin-implementation-plan.md`

## Changed Files

- `worker-progress/worker-116-dom-event-plugin-implementation-plan.md`

## Risks Or Blockers

- No `packages/react-dom/src` implementation scaffold exists yet.
- Event priority is still erased by `()` in current scaffolds.
- Reconciler root scheduling, sync flushing, mounted-token resolution, and
  commit traversal are not implemented.
- DOM node maps and latest props are planned but not implemented.
- Worker 088, 089, 108, and 110 artifacts are absent in this worktree and must
  be treated as provisional dependencies.
- Portal event bubbling has no checked oracle yet.
- Controlled restore can be hooked in this slice, but actual controlled value
  tracking and restoration must wait for a separate controlled input slice.

## Recommended Next Tasks

- Implement lane-backed core `EventPriority` and remove unit event-priority
  placeholders.
- Add DOM node maps and latest-props storage before any event callback can run.
- Add or consume worker 088 and 089 artifacts for root markers and root/portal
  listener installation before compatibility claims.
- Implement listener entry wrappers and plugin dispatch queues for the first
  root event path against workers 048 and 065.
- Add a portal event bubbling oracle before claiming portal event
  compatibility.
- Keep hydration replay and controlled value tracking in separate later slices.
