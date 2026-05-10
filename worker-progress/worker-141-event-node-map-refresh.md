# Worker 141 Event Node Map Refresh

## Goal Evidence

- `create_goal` called for objective: "Produce a report-only refresh for DOM event plugin extraction, host node maps, public instance lookup, and host fiber token interactions in worker-progress/worker-141-event-node-map-refresh.md."
- `get_goal` confirmed status `active` for thread `019e0f9f-39a7-7bc3-8696-cc9dbcd7f7c0`.

## Summary

This is a report-only refresh. No source, tests, package files, prompts,
master docs, or lockfiles were modified.

The correct next shape is still: generic root render/complete/commit and DOM
mutation first, DOM node maps/public instance lookup second, then DOM event
priority wrappers and plugin extraction. The reason is concrete in the current
source: React DOM event dispatch needs committed host nodes, latest props,
root/container ownership, and mounted host token validation before any user
event callback can run.

Current source has advanced beyond workers 090, 098, and 116:

- `crates/fast-react-core/src/event_priority.rs` now implements lane-backed
  `EventPriority`.
- `crates/fast-react-reconciler/src/host_tokens.rs` now has a reconciler-owned
  `HostFiberTokenStore`.
- `crates/fast-react-reconciler/src/root_scheduler.rs` maps lanes back to
  scheduler priority through `lanes_to_event_priority`.
- `packages/react-dom/src/client/root-markers.js` and
  `packages/react-dom/src/events/root-listeners.js` now provide private root
  marker and listener shell modules.
- `packages/react-dom/client.js` still exports unsupported `createRoot` and
  `hydrateRoot` placeholders, and `packages/react-dom/index.js` still keeps
  public React DOM mostly placeholder-backed.

The remaining blocker is not listener installation. It is the missing committed
DOM identity layer: current maps do not associate DOM nodes with opaque mounted
host tokens or latest props, and the public root facade still cannot produce a
real committed DOM tree.

## Current Source Refresh

Merged foundations now present:

| Area | Current source | Refresh finding |
| --- | --- | --- |
| Core event priority | `crates/fast-react-core/src/event_priority.rs` | Lane-backed constants and helpers are implemented. Future reports should stop treating this as wholly absent. |
| Host token boundary | `crates/fast-react-host-config/src/lib.rs` | `HostFiberTokenRef` is threaded through creation, commit, hydration, and deletion hooks. Target and phase diagnostics exist. |
| Reconciler token store | `crates/fast-react-reconciler/src/host_tokens.rs` | Tokens are issued, validated, invalidated, and store root/fiber/phase/target metadata. They are not yet mounted-current public/event resolvers. |
| HostRoot/root scheduler | `crates/fast-react-reconciler/src/root_updates.rs`, `crates/fast-react-reconciler/src/root_scheduler.rs` | Root updates and task selection exist, but there is still no render work loop, generic complete work, commit traversal, host mutation, or root current switch. |
| React DOM root markers | `packages/react-dom/src/client/root-markers.js` | Randomized `__reactContainer$` root marker helpers exist. They store a root owner value and support duplicate/legacy diagnostics. |
| React DOM listener shell | `packages/react-dom/src/events/root-listeners.js` | Root/portal listener installation, passive flags, non-delegated capture-only paths, and owner-document `selectionchange` shell behavior exist. Listener shells return `undefined` and do not dispatch. |
| React DOM public roots | `packages/react-dom/client.js` | `createRoot` and `hydrateRoot` remain loud unsupported placeholders. |
| Host event priority wiring | `crates/fast-react-reconciler/src/lib.rs`, `crates/fast-react-reconciler/src/fiber_root.rs`, `crates/fast-react-reconciler/src/test_support.rs`, `crates/fast-react-test-renderer/src/lib.rs` | Test/fake hosts still set `type EventPriority = ()`. This still masks DOM update-priority integration even though core `EventPriority` exists. |

Worker 130 and worker 134 refresh reports are not present in this worktree.
Sequencing below therefore uses merged source plus accepted reports 122, 123,
124, and 128 as the current baseline.

## Required Sequencing

1. Finish generic render, complete work, and commit mutation before node maps.

   Required source ownership:
   - `crates/fast-react-reconciler/src/begin_work.rs` or equivalent HostRoot
     render slice: process HostRoot queues into child work.
   - `crates/fast-react-reconciler/src/complete_work.rs` or equivalent host
     complete slice: create host/text instances with `HostFiberTokenRef` and
     prepare update payloads.
   - `crates/fast-react-reconciler/src/commit.rs` or equivalent commit slice:
     run mutation effects, switch `root.current`, attach refs at reconciler
     timing, call deletion cleanup, and call `prepare_for_commit` /
     `reset_after_commit`.
   - DOM mutation adapter files under a private React DOM host boundary,
     not `fast-react-core`.

   Gate: a root render/update/unmount path can create, update, remove, and
   delete host instances without any event plugin callback path.

2. Convert host-token storage into mounted-current resolver APIs.

   Current `HostFiberTokenStore` is phase scoped. DOM maps need a mounted
   resolver that can answer event/public-instance questions without returning
   raw fibers or DOM nodes from core.

   Required reconciler APIs:
   - `resolve_for_event(token, expected_root)` returns a narrow mounted host
     target record or a structured stale/wrong-root/wrong-renderer result.
   - `resolve_for_public_instance(token)` returns enough host identity for the
     renderer to produce a public instance, not the DOM node itself.
   - `resolve_for_commit(token, phase, target)` remains phase/target checked.
   - deletion/root disposal invalidates token generations before stale retained
     DOM nodes can resolve callbacks.

   Gate: deleted, wrong-root, wrong-target, and stale tokens are rejected by
   internal Rust tests before any JS event dispatch uses them.

3. Add DOM component-tree maps after committed host instances exist.

   Required DOM-private source boundaries:
   - `packages/react-dom/src/client/component-tree.js`
   - `packages/react-dom/src/client/node-maps.js`
   - `packages/react-dom/src/client/root-markers.js`
   - `packages/react-dom/src/client/dom-container.js`
   - bridge files for the DOM mutation adapter to publish token/node/props
     associations after successful host operations.

   Map ownership stays in React DOM:
   - `node -> host token`
   - `node -> latest props`
   - `container -> root owner`
   - root-scoped `token -> node` for public host instances
   - boundary marker maps for hydration later
   - listener-set and scroll/end/event-handle metadata

   Gate: map writes happen from host creation, hydration, commit update, and
   deletion cleanup hooks. Core and reconciler never store JS DOM nodes.

4. Add public instance lookup over tokens and maps.

   Required source ownership:
   - DOM adapter public-instance bridge under `packages/react-dom/src/client`
     or `packages/react-dom/src/dom-host`.
   - `HostIdentityAndContext::get_public_instance` remains the host-config
     boundary for public instance conversion.
   - Reconciler ref timing owns when refs attach/detach.

   Gate: host component refs receive DOM elements after commit and detach on
   deletion/unmount. Text-node public behavior needs a React DOM oracle before
   compatibility is claimed.

5. Wire event/update priority before event callbacks.

   Required source ownership:
   - Keep `crates/fast-react-core/src/event_priority.rs` as the lane-backed
     internal priority model.
   - Replace remaining `EventPriority = ()` fake/test host scaffolds with
     `fast_react_core::EventPriority` or an adapter that cannot erase priority.
   - Add DOM-private update priority under
     `packages/react-dom/src/client/update-priority.js`.
   - Add listener-entry wrappers under
     `packages/react-dom/src/events/react-dom-event-listener.js` or equivalent.

   Gate: every event path entering extraction goes through discrete,
   continuous, or default dispatch entry. `message` bridges from public
   Scheduler priority without making Scheduler numeric constants into lanes.

6. Add plugin extraction after node maps, latest props, and root listeners.

   Required DOM-private source boundaries:
   - `packages/react-dom/src/events/plugin-event-system.js`
   - `packages/react-dom/src/events/event-registry.js`
   - `packages/react-dom/src/events/event-system-flags.js`
   - `packages/react-dom/src/events/get-event-target.js`
   - `packages/react-dom/src/events/get-listener.js`
   - `packages/react-dom/src/events/synthetic-event.js`
   - `packages/react-dom/src/events/update-batching.js`
   - `packages/react-dom/src/events/controlled-component.js`
   - `packages/react-dom/src/events/plugins/simple-event-plugin.js`
   - later plugin files for enter/leave, change, select, beforeInput,
     form actions, and scrollend.

   `packages/react-dom/src/events/root-listeners.js` should stop at native
   listener installation and wrapper creation. It should not learn plugin
   extraction, latest props, controlled restore, or hydration replay.

   Gate: user callbacks are invoked only by dispatch queue processing, never
   directly from `addEventListener` shells or from `nodeToLatestProps`.

7. Add portal and hydration behavior as separate follow-up layers.

   Portal listener installation can use the existing
   `listenToPortalContainerEvents` shell and `PortalHost::prepare_portal_mount`,
   but portal bubbling requires fiber-return/root-container retargeting after
   token resolution exists.

   Hydration replay must stay separate from base plugin extraction. It needs
   blocked-boundary tokens, `SelectiveHydrationLane`, explicit hydration target
   queues, native event replay, and commit `retryIfBlockedOn` style hooks.

## Source Boundary Rules

- `crates/fast-react-core/**`: lanes, event priority, fiber IDs, flags,
  topology, and generic React data only. No DOM nodes, event names, listener
  markers, or public React DOM objects.
- `crates/fast-react-reconciler/**`: fiber/root/update/commit/token state and
  narrow resolver APIs. It may store opaque host handles through associated
  types, but it must not inspect DOM node shape or call JS event callbacks.
- `crates/fast-react-host-config/src/lib.rs`: opaque renderer boundary only.
  Keep `HostFiberTokenRef`, mutation/hydration/portal/commit hooks here; do
  not add DOM component-tree maps here.
- `packages/react-dom/src/client/**`: DOM containers, root markers,
  component-tree maps, latest props, public instance bridge, update priority,
  and DOM host mutation glue.
- `packages/react-dom/src/events/**`: listener registry, listener entry
  wrappers, event target normalization, plugin extraction, synthetic events,
  batching, controlled restore hooks, and future replay glue.
- `packages/react-dom/client.js` and `packages/react-dom/index.js`: public
  entrypoints should remain placeholders until the root facade has a committed
  render/update/unmount path to call.

## Host Token And Root Marker Dependencies

Host token dependencies:

- DOM maps store reconciler-issued opaque token values, not fibers.
- Tokens must survive current/work-in-progress alternate swaps for the same
  host node.
- Token generations must retire on deletion and root disposal; stale retained
  DOM nodes must not resolve old props or callbacks.
- `HostFiberTokenTarget` must cover every mapped target category used by DOM
  maps: instance, text instance, hydratable instance, Activity boundary, and
  Suspense boundary.
- `HostFiberTokenPhase` remains useful for commit hooks, but event/public
  lookup also needs a mounted-current validation mode rather than a creation or
  commit phase token.

Root marker dependencies:

- Root container markers from `packages/react-dom/src/client/root-markers.js`
  are the correct DOM-side ownership anchor for duplicate root warnings,
  nested-root event stop points, and root unmount cleanup.
- The value stored by `markContainerAsRoot` should be a root owner handle or
  token bridge, not a raw fiber visible to JS code.
- `unmarkContainerAsRoot` must run only after the sync unmount update has
  committed host deletion cleanup.
- Listener dedupe markers from `listener-registry.js` are separate from root
  ownership markers and should not retain roots, fibers, props, or callbacks.

## Required Tests And Gates

Existing tests/oracles that must stay green when implementation starts:

- `cargo test -p fast-react-core --all-features event_priority`
- `cargo test -p fast-react-reconciler --all-features host_tokens`
- `cargo test -p fast-react-reconciler --all-features root_updates`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `node tests/smoke/react-dom-container-listener-shell.mjs`
- `node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-event-priority-oracle.test.mjs`
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs`

Future focused tests required before event extraction is enabled:

- Rust commit tests: create/update/delete host component and text instances,
  call token-aware host hooks in phase order, switch `root.current` only after
  mutation success, and invalidate tokens on deletion.
- DOM mutation tests: root render/update/unmount mutates a deterministic DOM
  host without event callbacks.
- DOM map tests: creation registers `node -> token` and latest props; commit
  update replaces latest props after successful update; deletion clears all
  node/token/props/reverse entries.
- Public instance tests: host component refs receive DOM elements and detach in
  reconciler order; text-rendering components remain oracle-gated.
- Event target tests: text-node targets, nested roots, stale deleted nodes,
  portal containers, and wrong-root tokens resolve or reject explicitly.
- Event priority tests: discrete/continuous wrappers set and restore current
  update priority through nested dispatch and thrown callbacks; `message`
  cases match worker 048.
- Dispatch tests: capture/bubble order, propagation stop, preventDefault,
  synthetic `currentTarget` reset, persistent events, listener type errors,
  disabled interactive listeners, and no allocation when no listeners exist.
- Batching/controlled hook tests: event dispatch runs inside batching; outermost
  batch drains controlled restore after sync flush; deleted restore targets
  no-op.
- Portal tests: portal events follow React ownership rather than DOM ancestry
  and do not double-dispatch from root and portal container listeners.

## Evidence Gathered

- `MASTER_PLAN.md` keeps worker 141 report-only and sequences this area after
  root render/commit, DOM mutation, and React DOM root work.
- `MASTER_PROGRESS.md` records accepted host-token compile alignment, root
  model, HostRoot queues, root scheduler, and root listener shell work.
- Worker 041 establishes that DOM events are root/portal delegated,
  lane-prioritized, plugin-extracted, batched, and hydration-aware.
- Worker 065 provides the checked delegated event oracle for listener
  registration, capture/bubble order, stop/prevent behavior, and synthetic
  event shape.
- Worker 089 is now present and provides the checked root/portal listener
  installation oracle. This removes worker 116's provisional listener
  dependency.
- Worker 090 establishes node maps/latest props/public instance cleanup as DOM
  adapter concerns keyed by opaque host tokens.
- Worker 098 establishes event plugin extraction, update priority, batching,
  portal retargeting, and controlled restore boundaries.
- Worker 116 narrows the first event plugin extraction implementation slice.
  This refresh updates it for the now-merged core event priority, host token
  store, root marker, and listener shell source.
- Worker 118 confirms test/reconciler hosts were aligned with token-aware
  lifecycle signatures, but current source still leaves `EventPriority = ()`
  in fake/test host scaffolds.
- Worker 122 confirms current React DOM private root marker and root listener
  shell modules intentionally do not dispatch.
- Current oracle summary:
  - Event priority oracle covers 53 discrete, 18 continuous, and 22 default
    event names plus 6 `message` Scheduler cases.
  - Delegation oracle covers 6 scenarios and the selected dispatch behavior
    surface.
  - Root listener oracle covers 8 scenarios, root/hydration/portal listener
    installation, passive options, non-delegated capture-only events, and
    dedupe.
  - Container marker oracle covers 3 valid and 6 invalid container cases,
    duplicate/legacy diagnostics, and unmount marker cleanup.
- React source reference inspected:
  - `ReactDOMComponentTree.js`
  - `ReactFiberConfigDOM.js`
  - `ReactDOMEventListener.js`
  - `ReactDOMUpdatePriority.js`
  - `ReactEventPriorities.js`
  - `DOMPluginEventSystem.js`

## Risks Or Blockers

- Generic commit and DOM mutation are still absent in the current source, so
  node maps would have no safe committed host lifecycle to attach to yet.
- `HostFiberTokenStore` validates issued phase tokens, but event/public lookup
  still needs mounted-current resolver APIs and generation retirement semantics.
- `EventPriority` exists in core, but fake/test host scaffolds still erase host
  event priority as `()`.
- Public `createRoot` and `hydrateRoot` remain placeholders, so public React
  DOM root behavior cannot yet call private root markers or listener shells.
- DOM maps can retain user callbacks and form actions through latest props; no
  event work should land without deterministic deletion cleanup tests.
- Hydration replay, controlled value tracking, portal bubbling, form actions,
  focus/selection/IME behavior, and browser passive-listener behavior remain
  separate compatibility surfaces.

## Recommended Next Tasks

1. Finish a generic complete-work plus commit-mutation slice that creates,
   updates, deletes, and switches roots without DOM event dispatch.
2. Extend reconciler host tokens from phase-scoped records into mounted-current
   resolver APIs with generation retirement on deletion/root disposal.
3. Add DOM component-tree maps and latest-props storage behind the DOM mutation
   adapter, with deterministic cleanup tests.
4. Add public instance/ref lookup over DOM reverse maps and host tokens.
5. Remove remaining `EventPriority = ()` scaffolds and wire DOM update
   priority wrappers against the worker 048 oracle.
6. Convert listener shells into priority wrappers only after node maps and
   latest props exist; then add the first SimpleEventPlugin-backed dispatch
   queue against workers 065 and 089.
7. Keep hydration replay, portal bubbling expansion, controlled value tracking,
   and later plugin families as follow-up slices with their own oracles.

## Commands Run

- `create_goal`
- `get_goal`
- `ls worker-progress/worker-141-event-node-map-refresh.md 2>/dev/null || true`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-041-dom-events-priority-plan.md`
- `sed -n '261,520p' worker-progress/worker-041-dom-events-priority-plan.md`
- `sed -n '1,260p' worker-progress/worker-065-dom-event-delegation-oracle.md`
- `sed -n '1,320p' worker-progress/worker-090-dom-node-map-public-instance-plan.md`
- `sed -n '321,680p' worker-progress/worker-090-dom-node-map-public-instance-plan.md`
- `sed -n '1,320p' worker-progress/worker-098-dom-event-plugin-extraction-plan.md`
- `sed -n '321,760p' worker-progress/worker-098-dom-event-plugin-extraction-plan.md`
- `sed -n '1,320p' worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- `sed -n '321,760p' worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- `rg --files crates packages tests worker-progress | sort | rg '(^crates/fast-react-(core|host-config|reconciler|test-renderer)/src|^packages/react-dom|react-dom-event|dom-event|root-listener|container-marker|node-map|host-token)'`
- `sed -n '1,320p' crates/fast-react-host-config/src/lib.rs`
- `rg -n "trait HostTypes|type EventPriority|HostFiberToken|HostFiberTokenRef|HostFiberTokenPhase|HostFiberTokenTarget|HostFiberTokenViolation|invalid_fiber_token|trait HostScheduling|set_current_update_priority|current_update_priority|resolve_update_priority|trait PortalHost|prepare_portal_mount|trait HydrationHost|flush_hydration_events|trait MutationHost|create_instance|commit_update|detach_deleted_instance" crates/fast-react-host-config/src/lib.rs -C 3`
- `sed -n '1,260p' crates/fast-react-core/src/event_priority.rs`
- `sed -n '1,260p' crates/fast-react-reconciler/src/host_tokens.rs`
- `sed -n '261,560p' crates/fast-react-reconciler/src/host_tokens.rs`
- `sed -n '1,260p' crates/fast-react-reconciler/src/update_priority.rs`
- `rg -n "type EventPriority = \\(\\)|type EventPriority = EventPriority|type EventPriority = fast_react_core::EventPriority|current_update_priority|resolve_update_priority|HostFiberTokenId|HostFiberTokenStore" crates/fast-react-reconciler crates/fast-react-test-renderer crates/fast-react-host-config crates/fast-react-core -g '!target'`
- `sed -n '1,340p' crates/fast-react-reconciler/src/lib.rs`
- `sed -n '1,320p' crates/fast-react-reconciler/src/fiber_root.rs`
- `sed -n '1,760p' crates/fast-react-reconciler/src/root_scheduler.rs`
- `sed -n '1,360p' crates/fast-react-reconciler/src/root_updates.rs`
- `sed -n '140,280p' crates/fast-react-reconciler/src/fiber_store.rs`
- `sed -n '600,760p' crates/fast-react-test-renderer/src/lib.rs`
- `sed -n '1,120p' crates/fast-react-reconciler/src/test_support.rs && sed -n '260,320p' crates/fast-react-reconciler/src/test_support.rs`
- `sed -n '1,260p' packages/react-dom/client.js`
- `sed -n '1,260p' packages/react-dom/index.js`
- `sed -n '1,260p' packages/react-dom/src/client/dom-container.js`
- `sed -n '1,260p' packages/react-dom/src/client/root-markers.js`
- `sed -n '1,360p' packages/react-dom/src/events/event-names.js`
- `sed -n '1,260p' packages/react-dom/src/events/listener-registry.js`
- `sed -n '1,320p' packages/react-dom/src/events/root-listeners.js`
- `sed -n '1,220p' worker-progress/worker-118-host-token-compile-alignment.md`
- `sed -n '1,220p' worker-progress/worker-089-dom-root-listener-installation-oracle.md`
- `sed -n '1,220p' worker-progress/worker-048-react-dom-event-priority-oracle.md`
- `rg --files worker-progress | sort | rg 'worker-(130|132|134|135|129|122|123|124|128)'`
- `sed -n '1,260p' worker-progress/worker-122-dom-container-listener-shell.md`
- `sed -n '1,220p' worker-progress/worker-123-reconciler-fiber-root-host-root.md`
- `sed -n '1,220p' worker-progress/worker-124-host-root-update-queue.md`
- `sed -n '1,220p' worker-progress/worker-128-reconciler-root-scheduler-foundation.md`
- Node oracle summary script over event-priority, delegation, root-listener,
  and container-root-marker JSON artifacts.
- `find tests/smoke tests/conformance/test -maxdepth 1 -type f | sort | rg '(container-listener-shell|dom-event-delegation|event-priority|root-listener|container-root-markers)'`
- `sed -n '1,240p' package.json && sed -n '1,220p' tests/conformance/package.json`
- `sed -n '1,260p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMComponentTree.js`
- React source `rg` over `listenToAllSupportedEvents`,
  `dispatchEventForPluginEventSystem`, `extractEvents`,
  `processDispatchQueue`, `preparePortalMount`,
  `getClosestInstanceFromNode`, `markContainerAsRoot`,
  `precacheFiberNode`, `updateFiberProps`, and `detachDeletedInstance`.
- `sed -n '1,220p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/ReactDOMEventListener.js`
- `sed -n '1,180p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMUpdatePriority.js`
- `sed -n '1,120p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactEventPriorities.js`
- `git diff --check`
- `git status --short --untracked-files=all`
- Strict scoped changed-path check including untracked files:
  `.worker-logs/worker-141-event-node-map-refresh.log` and this report were
  present, so the check failed because the tmux worker session log is outside
  project write scope.
- Scoped changed-path check excluding generated `.worker-logs/*`: passed with
  only `worker-progress/worker-141-event-node-map-refresh.md`.
- `git diff --no-index --check /dev/null worker-progress/worker-141-event-node-map-refresh.md`
  treated the expected no-index difference exit as success and produced no
  whitespace output.
- `rg -n "[ \t]$|^(<<<<<<<|=======|>>>>>>>)" worker-progress/worker-141-event-node-map-refresh.md`
  produced no matches.

## Verification

- `git diff --check` passed.
- The report-only path check passed when excluding generated worker logs:
  `worker-progress/worker-141-event-node-map-refresh.md` is the only changed
  project file.
- The untracked session artifact
  `.worker-logs/worker-141-event-node-map-refresh.log` is present and was not
  modified or removed.
- No trailing whitespace or conflict markers were found in this report.

## Changed Files

- `worker-progress/worker-141-event-node-map-refresh.md`
