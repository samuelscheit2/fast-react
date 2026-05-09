# worker-090-dom-node-map-public-instance-plan

## Objective

Produce a report-only plan for DOM node maps, public instance lookup, latest
props maps, and cleanup.

Write scope honored so far: this report is the only intended changed file. No
source code or test implementation was added.

## Summary

Fast React should model React DOM's component-tree metadata as a DOM adapter
concern keyed by reconciler-issued opaque host fiber tokens. The root cause to
avoid is exposing raw fibers to JavaScript or treating DOM nodes as the source
of reconciler identity. DOM nodes need enough private metadata for event target
lookup, latest props, public instance resolution, hydration boundaries,
diagnostics, refs, and deletion cleanup; the reconciler must still own whether
a token is current, stale, mounted, deleted, or from the wrong renderer/root.

The recommended architecture is:

- Keep raw fiber storage inside `crates/fast-react-reconciler`.
- Let the reconciler issue opaque, generational host tokens and validate them
  through a narrow resolver API.
- Let the DOM adapter own weak or private DOM-node maps:
  `node -> token`, `node -> latest props`, container/root markers, listener
  marker sets, hydration boundary markers, and root-scoped `token -> node`
  lookup for public instance bridges.
- Make deletion and unmount cleanup part of the mutation commit contract, not a
  best-effort event-system cleanup pass.
- Reject stale, wrong-target, wrong-phase, wrong-root, and wrong-renderer
  tokens explicitly; do not return a nearest stale fiber as a fallback.

This remains report-only. The future implementation should be split across the
reconciler token registry, host-config cleanup hooks, the DOM component-tree
module, event target resolution, public instance/ref lookup, and deletion
cleanup tests.

## Evidence Gathered

Required files read:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-040-dom-mutation-renderer-plan.md`
- `worker-progress/worker-041-dom-events-priority-plan.md`
- `worker-progress/worker-044-react-dom-client-roots-plan.md`
- `worker-progress/worker-051-dom-host-token-boundary.md`
- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`
- `worker-progress/worker-072-reconciler-root-work-loop-plan.md`

Current local source checked:

- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `packages/react-dom/client.js`
- `packages/react-dom/placeholder-utils.js`

Key evidence:

- Worker 040 identified DOM node-to-fiber maps, latest props maps, public
  instance lookup, focus/test-selector helpers, and deletion cleanup as DOM
  mutation blockers, with DOM-specific behavior outside core.
- Worker 041 showed root and portal events require delegated event target
  lookup and current props reads, not direct per-node listener props.
- Worker 044 showed root container markers and `getClosestInstanceFromNode`
  style lookup are part of React DOM client-root behavior.
- Worker 051 merged the first host token boundary: `HostFiberTokenRef`,
  token phases, token target categories, and explicit invalid/stale/wrong
  renderer/wrong phase/wrong target diagnostics.
- Worker 055 already names DOM node maps and public instances as a future
  mergeable slice, dependent on host token generation and DOM root markers.
- Worker 072 ties token cleanup to real mutation commit traversal and warns
  that host tokens must not expose raw fiber memory or retain deleted nodes.
- Current `fast-react-reconciler` still has only placeholder rendering and no
  token generation, root records, commit traversal, or mounted-fiber resolver.
- Current `react-dom/client` remains a loud unsupported placeholder, so no DOM
  component-tree behavior exists yet.

## Root-Cause Plan

### Token Ownership

The reconciler should issue host tokens from a root-scoped token registry. A
token should be a compact opaque value, not a fiber pointer and not a JS object
that owns a fiber. Internally it needs enough identity to validate:

- renderer brand
- root id or root slot
- fiber id or host-fiber slot
- generation/version
- host target kind: instance, text instance, hydratable instance, Activity
  boundary, or Suspense boundary
- lifecycle state: pending creation, mounted/current, deleted, or root disposed

The DOM adapter may store the token value, but it must resolve the token by
calling back into the reconciler when it needs mounted fiber data. Resolution
should return only the narrow data needed for the caller, for example a mounted
host record, public instance handle, or event dispatch target. It must not hand
raw fiber structs to the DOM package.

Stable host nodes should keep a stable token across current/work-in-progress
alternate swaps. The reconciler should update the token registry to point at
the current fiber during commit. Deletion or root unmount increments or retires
the generation so retained DOM nodes cannot resolve old tokens.

### DOM Component-Tree Maps

The DOM adapter should own a component-tree module similar in responsibility
to React DOM's private component tree helpers, but with token values instead of
fiber objects in JS.

Recommended private maps:

| Map | Owner | Purpose | Cleanup |
| --- | --- | --- | --- |
| `nodeToToken` | DOM adapter | Find closest host token from event targets, hydration nodes, diagnostics, and refs. | Delete during deletion traversal, hydration mismatch deletion, and root unmount. |
| `nodeToLatestProps` | DOM adapter | Read current host props for event plugin extraction and controlled-state logic. | Replace after successful commit update; delete on deletion/unmount. |
| `containerToRootToken` | DOM adapter | Root marker for duplicate-root checks, HostRoot event lookup, and root cleanup. | Clear after `root.unmount()` sync flush, not before. |
| `eventTargetToListenerSet` | DOM events | Deduplicate root/portal listener installation. | Must not retain roots or fibers; listener marker may remain as a dedupe marker. |
| `tokenToNode` | DOM adapter/root scoped | Resolve public host instances when Rust/reconciler state only has a token. | Delete on host deletion, hydration replacement, and root disposal. |
| boundary maps | DOM hydration | Map Suspense/Activity/hydration marker nodes to boundary tokens. | Clear when boundary hydrates, is deleted, or is replaced. |

Use `WeakMap` for node-keyed maps where possible. If private expandos are used
for parity or performance, store only lightweight token ids and latest props,
never owning fiber handles. Root-scoped reverse maps may be strong while the
root is mounted, but deletion traversal must remove entries synchronously.

### Latest Props

Latest props are not the same data as the token map. The event system needs
the current props for a DOM node after updates, including changed event
handlers, removed handlers, controlled form props, and form action props.

Recommended update rules:

- Creation/hydration registers the `node -> token` association before the node
  can participate in event targeting.
- Initial latest props should be published only after initial property setup
  succeeds for the created or hydrated host instance.
- `commit_update` applies the DOM update payload and then replaces
  `nodeToLatestProps` with `newProps` after success.
- If a DOM update fails, do not publish `newProps`; surfacing the host error is
  better than letting events observe props that were not committed.
- Text nodes generally do not need latest props for event extraction, but if
  text nodes are tokenized they still need token cleanup.
- Deleted nodes must have latest props cleared even if a user still holds the
  DOM node, because props can retain callbacks, form actions, and large user
  objects.

Commit-time event gating from `prepare_for_commit` / `reset_after_commit`
should prevent native events from observing half-updated props during mutation
work. If a future DOM environment cannot gate events, update publication needs
a per-root commit epoch so event dispatch can reject in-progress tokens.

### Event Target Lookup

Event target lookup should start with the native event target and climb DOM
parents until it finds a mapped host token or a root container marker. The DOM
adapter should return a token and target category; the reconciler should then
validate that token and resolve the nearest current mounted host fiber.

Required behavior:

- Text-node native targets should resolve through the text token if present or
  through their parent element if the text token is not public/event-capable.
- Deleted/stale tokens must be ignored or rejected, then lookup may continue
  to an ancestor if React DOM would find an ancestor host target.
- Nested roots must stop at the correct root marker so events do not leak into
  an unrelated root.
- Portal containers need their own listener installation, but event target
  resolution still starts from the DOM node and then portal bubbling is handled
  by the fiber return path.
- Hydration lookup must be able to return a blocking Suspense, Activity, or
  dehydrated HostRoot token so replay code can schedule hydration instead of
  dispatching to a stale host instance.

The event plugin pipeline should consume latest props only after token
resolution succeeds. A direct `nodeToLatestProps.get(target).onClick()` path
would skip priority, portal retargeting, propagation, batching, and hydration
replay.

### Public Instance Lookup

For host component refs, the DOM public instance should be the DOM element
returned by the DOM host adapter's `get_public_instance`. The reconciler owns
ref timing; the DOM adapter owns DOM node identity.

The implementation should support two lookup directions:

- Fiber or host handle to public instance, used for ref attach, layout work,
  diagnostics, and future `findDOMNode`-style behavior if supported.
- DOM node to token to mounted fiber, used by events and hydration.

Text-node public instance behavior should be locked by a React DOM oracle
before Fast React claims compatibility. Host component refs should not expose
raw text nodes. Any future `findDOMNode` support must test components that
render text, fragments, portals, hidden subtrees, and deleted roots before
choosing whether to return a text node, parent element, or `null`.

### Deletion And Unmount Cleanup

Deletion cleanup must be part of the commit mutation phase. The reconciler
already has token-aware `detach_deleted_instance`; a future implementation
needs to guarantee every mapped host node category has a cleanup hook. If text
instances, hydratable boundaries, Activity boundaries, or Suspense boundaries
are registered in node maps, the host-config/reconciler boundary must either
add dedicated detach hooks or replace `detach_deleted_instance` with a generic
token-targeted cleanup hook.

Cleanup responsibilities:

- Clear `nodeToToken` and `nodeToLatestProps`.
- Remove `tokenToNode` reverse entries.
- Invalidate the token generation in the reconciler registry.
- Clear controlled input value trackers, pending controlled restore entries,
  form action queues, scroll-end timers, event-handle responders, diagnostics
  observers, and hydration boundary replay references for the deleted subtree.
- Detach refs at reconciler-defined timing; do not let the DOM cleanup module
  call ref callbacks directly.
- On root unmount, enqueue and flush the sync null update first, then unmark
  the root container after host deletion cleanup has run.

The listener dedupe marker is separate from the root marker. Native listeners
may remain installed after unmount for dedupe parity, but they must not retain
root, fiber, token, props, or callback objects.

### Stale Token Rejection

Stale token rejection should be observable in internal tests as a structured
failure, not as a null pointer or silent event drop. The existing
`HostFiberTokenViolation` cases are a good base, but the reconciler needs to
own the actual validation path.

Recommended resolver behavior:

- `resolve_for_event(token, root)` returns mounted current host target or a
  stale/wrong-root/wrong-renderer result.
- `resolve_for_public_instance(token)` returns public host node information
  only for mounted current host nodes.
- `resolve_for_commit(token, expected_phase, expected_target)` rejects wrong
  phase or wrong target before host calls mutate maps.
- `invalidate_subtree_tokens(deleted_fiber)` retires generations before or
  during deletion cleanup so reentrant code cannot resolve deleted nodes.

Do not reuse token ids without a generation bump. Do not expose token strings
or ids through public React DOM APIs.

## Future Write Scopes

| Slice | Write scope | Purpose |
| --- | --- | --- |
| Reconciler host token registry | `crates/fast-react-reconciler/src/host_tokens.rs`, `crates/fast-react-reconciler/src/commit.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-reconciler-host-token-registry.md` | Generate, version, resolve, and invalidate opaque host tokens without exposing fibers. |
| Host cleanup hook tightening | `crates/fast-react-host-config/src/lib.rs`, `worker-progress/worker-host-token-cleanup-hooks.md` | Add generic or text/boundary-specific detach cleanup if mapped non-instance targets need deletion cleanup. |
| Test renderer token verifier | `crates/fast-react-test-renderer/**`, `worker-progress/worker-test-renderer-token-cleanup.md` | Prove token generation, commit, and deletion cleanup remain renderer-neutral. |
| DOM component-tree maps | `packages/react-dom/src/client/dom-component-tree.js`, `packages/react-dom/src/client/node-maps.js`, `packages/react-dom/src/client/root-markers.js`, `worker-progress/worker-dom-component-tree-maps.md` | Implement private node/token/root/latest-props map helpers with no event plugin behavior. |
| DOM latest props and event target bridge | `packages/react-dom/src/events/target-resolution.js`, `packages/react-dom/src/events/current-props.js`, `packages/react-dom/src/client/dom-component-tree.js`, `worker-progress/worker-dom-event-target-lookup.md` | Resolve native event targets to current mounted tokens and read latest props through the plugin pipeline. |
| DOM public instance bridge | `packages/react-dom/src/dom-host/public-instance.js`, `packages/react-dom/src/client/dom-component-tree.js`, `worker-progress/worker-dom-public-instance-lookup.md` | Return DOM public instances for host refs and future public lookup APIs without exposing fibers. |
| DOM deletion cleanup integration | `packages/react-dom/src/dom-host/deletion-cleanup.js`, `packages/react-dom/src/events/controlled-component.js`, `packages/react-dom/src/client/node-maps.js`, `worker-progress/worker-dom-deletion-cleanup.md` | Clear maps, props, controlled state, replay queues, diagnostics observers, and reverse lookups during mutation deletion. |
| Hydration boundary maps | `packages/react-dom/src/hydration/component-tree.js`, `packages/react-dom/src/hydration/event-replay.js`, `worker-progress/worker-dom-hydration-node-maps.md` | Attach and clear hydratable instance, Suspense, Activity, and root boundary tokens for replay and mismatch handling. |

## Required Tests

Rust/reconciler tests:

- Token ids are unique per root and generation.
- Tokens stay stable across current/work-in-progress alternate swaps for the
  same host node.
- Deleted tokens reject as stale after deletion cleanup and root unmount.
- Wrong renderer, wrong root, wrong target, and wrong phase return structured
  diagnostics.
- Token resolution never exposes raw fiber structs to host adapters.
- Commit traversal invalidates tokens and calls host cleanup for every mapped
  host target category.

DOM adapter tests:

- Initial host node creation registers token and latest props.
- Commit update replaces latest props so events use new handlers and removed
  handlers disappear.
- Deleted and unmounted nodes no longer resolve event targets or public
  instances.
- Retained deleted DOM nodes do not retain old props through private maps.
- Root unmount clears root markers after sync deletion cleanup.
- Nested roots and portals resolve event targets to the correct root.
- Portal listener installation and portal event bubbling use token lookup but
  do not conflate DOM ancestry with React ancestry.
- Hydration blocked targets resolve to Suspense/Activity/HostRoot boundary
  tokens for replay.
- Host component refs receive DOM elements and detach in reconciler order.
- Text-node public lookup behavior is compared against a React DOM oracle
  before being claimed.

Memory-retention tests:

- Internal map-size or debug hooks prove reverse maps are empty after deletion
  and root disposal.
- Node-keyed maps use `WeakMap` or equivalent weak/private storage.
- Latest props clearing removes references to old event callbacks and form
  action functions after update and deletion.
- Optional `WeakRef` / `FinalizationRegistry` tests may be gated behind an
  explicit GC-enabled test mode, but deterministic cleanup tests should not
  depend on garbage collection timing.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan ties DOM node maps to the existing host token boundary instead of
  adding ad hoc side channels.
- It separates private implementation maps from public React DOM behavior and
  names the oracles still needed before compatibility claims.

Maintainability:

- Core and reconciler stay DOM-neutral.
- DOM component-tree helpers concentrate root markers, node maps, latest props,
  and listener dedupe in one package-owned area.
- Explicit stale-token diagnostics make future event, hydration, and ref bugs
  easier to localize.

Performance:

- Node-keyed weak maps or private expandos keep event target lookup O(depth of
  DOM ancestry) without scanning fiber trees.
- Latest props replacement is a direct map write during commit, avoiding event
  listener churn on every prop change.
- Token resolver calls should happen at event/public-lookup boundaries, not on
  every DOM property write.

Security:

- Tokens must not expose fiber memory, native pointers, root internals, or
  stable public ids.
- Latest props can retain user callbacks and sensitive form actions, so they
  must be cleared on deletion and replaced on update.
- Hydration and event replay must not dispatch through stale tokens after DOM
  replacement or mismatch deletion.
- JS callbacks and DOM handles crossing any future native boundary need
  explicit rooting and disposal rules.

## Risks And Blockers

- The reconciler has no root records, host token registry, mounted-fiber
  resolver, or commit traversal yet.
- Current host-config cleanup is instance-oriented; mapping text or boundary
  nodes may require a breaking cleanup-hook refinement.
- No DOM adapter implementation exists under `packages/react-dom/src/**`.
- Event target lookup depends on future root and portal listener installation.
- Public instance behavior for text-rendering components needs oracle evidence.
- Memory-retention behavior is hard to prove with GC timing alone; deterministic
  cleanup assertions are required.

## Recommended Next Tasks

1. Implement a reconciler host token registry with generation and stale-token
   validation.
2. Tighten host cleanup hooks so every mapped host target category can be
   cleaned during deletion.
3. Add DOM component-tree map helpers for node tokens, latest props, root
   markers, listener dedupe markers, and root-scoped reverse lookup.
4. Add internal tests for stale token rejection and deterministic cleanup before
   wiring event dispatch.
5. Add public React DOM oracles for ref/public-instance behavior, latest event
   props after update, portal target lookup, nested roots, and unmount cleanup.

## Commands Run

```sh
pwd && rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/worker-040-dom-mutation-renderer-plan.md' -g 'worker-progress/worker-041-dom-events-priority-plan.md' -g 'worker-progress/worker-044-react-dom-client-roots-plan.md' -g 'worker-progress/worker-051-dom-host-token-boundary.md' -g 'worker-progress/worker-055-react-dom-client-roots-implementation-plan.md' -g 'worker-progress/worker-072-reconciler-root-work-loop-plan.md' -g 'worker-progress/worker-090-dom-node-map-public-instance-plan.md'
git status --short
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-040-dom-mutation-renderer-plan.md
sed -n '1,260p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '261,620p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '1,260p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '261,620p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,260p' worker-progress/worker-051-dom-host-token-boundary.md
sed -n '1,320p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,360p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '361,760p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '760,880p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
rg -n "worker-090|worker-088|worker-089|worker-091|worker-092|worker-093|worker-094|worker-095|dom-node|node map|public instance|latest props|HostFiberToken|event target|stale token|cleanup" MASTER_PLAN.md MASTER_PROGRESS.md worker-progress/worker-040-dom-mutation-renderer-plan.md worker-progress/worker-041-dom-events-priority-plan.md worker-progress/worker-044-react-dom-client-roots-plan.md worker-progress/worker-051-dom-host-token-boundary.md worker-progress/worker-055-react-dom-client-roots-implementation-plan.md worker-progress/worker-072-reconciler-root-work-loop-plan.md
rg --files crates packages tests worker-progress | sort | sed -n '1,260p'
find worker-progress -maxdepth 1 -type f -name 'worker-090-dom-node-map-public-instance-plan.md' -print -exec sed -n '1,260p' {} \;
rg -n "HostFiberToken|HostFiberTokenRef|HostFiberTokenPhase|HostFiberTokenTarget|HostFiberTokenViolation|invalid_fiber_token|detach_deleted_instance|commit_update|create_instance|HydrationHost|HostScheduling|MutationRenderer" crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-host-config/src/lib.rs
sed -n '260,620p' crates/fast-react-host-config/src/lib.rs
sed -n '600,950p' crates/fast-react-host-config/src/lib.rs
sed -n '1000,1130p' crates/fast-react-host-config/src/lib.rs
sed -n '1260,1345p' crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,220p' packages/react-dom/client.js
sed -n '1,220p' packages/react-dom/placeholder-utils.js
```

Nested read-only agents were spawned to test the token-map hypothesis and
React DOM component-tree/event-target lookup risks. Their findings will be
merged into this report if available before handoff.

## Changed Files

- `worker-progress/worker-090-dom-node-map-public-instance-plan.md`

## Completion Checklist

- [x] Called `create_goal` for this worker objective before research.
- [x] Read the required worker brief, master files, and dependency reports.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Kept work report-only.
- [x] Covered reconciler-issued host tokens without exposing raw fibers.
- [x] Covered latest props, event target lookup, deletion cleanup, stale token
  rejection, and memory retention risks.
- [x] Included future write scopes and tests.
- [x] Nested-agent results did not return before final handoff; direct evidence
  above supports the plan.
- [x] Verified report-only scope with standard report checks.
