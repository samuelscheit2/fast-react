# worker-107-core-fiber-topology-implementation-plan

## Objective

Produce a report-only implementation plan for the first `fast-react-core`
fiber topology data structures, including stable fiber IDs, alternates,
parent/child/sibling links, deletion storage, child lane propagation fields,
and tests that prove topology invariants without implementing reconciliation.

Write scope honored: this report is the only file changed. No Rust,
JavaScript, package, conformance, test, DOM, reconciler, or Scheduler source
implementation is part of this worker.

Goal tool state:

- `create_goal` was called before research, file reads, implementation, or
  verification for this worker objective.
- `get_goal` was available immediately after goal setup and returned status
  `active` with the same worker objective.

## Summary

The first fiber topology implementation should add only renderer-agnostic
fiber identity and tree-shape primitives to `fast-react-core`. It should not
implement reconciliation. The root cause is crate ownership: update queues,
hook effect rings, lane bubbling, commit masks, and future renderer-neutral
fiber consumers all need one shared fiber identity model. If the first topology
model lives in the reconciler or a renderer, later core data structures would
either duplicate fiber IDs or depend upward on reconciler internals.

The first source slice should therefore define stable arena-scoped fiber IDs,
opaque handle slots, a fixed-layout `FiberNode`, an owning `FiberArena`,
reciprocal alternate links, parent/child/sibling topology, parent-owned
deletion lists, local `lanes`, aggregated `child_lanes`, and pure validation
or bubbling helpers. It should consume the merged `Lane` and `Lanes` primitives
from worker 030. It should treat worker 047 root lanes, worker 075 event
priority, and worker 076 fiber/hook effect flags as provisional because their
source files are absent in this worktree.

Reconciler work remains out of scope: no `FiberRoot`, no HostRoot update queue
processing, no `update_container`, no `root.current` switching, no begin or
complete work loop, no commit traversal, no host-config calls, no DOM behavior,
no public root objects, no hooks dispatcher, and no public Scheduler package
API.

Breaking changes are acceptable if they remove scaffold shortcuts. In
particular, future implementers should reject borrowed graph references, raw
host instances in core, direct DOM mutation from root APIs, global effect lists,
or a single mutable tree that cannot preserve current/work-in-progress
separation.

## Evidence Gathered

Merged worker anchors:

- Worker 007 established the React 19.2.6 fiber shape: instance fields, tree
  pointers, refs, props/state, update queue, dependencies, mode, `flags`,
  `subtreeFlags`, parent-owned `deletions`, `lanes`, `childLanes`, and
  `alternate`. It also rejected FIFO queues, flat priorities, and a global
  effect list.
- Worker 030 merged the core lane primitives: `Lane`, `Lanes`, `LaneIndex`,
  lane masks, bit operations, and fixed-width `LaneMap<T>`. The topology slice
  should reuse these directly.
- Worker 070 requires stable fiber identity for update queues and concurrent
  queue staging. Queue storage should use IDs, not Rust references.
- Worker 071 requires topology fields for `flags`, `subtreeFlags`, deletions,
  lanes, alternates, and future complete-work bubbling, while keeping commit
  traversal out of core topology.
- Worker 077 already accepted the broader core-versus-reconciler split for
  fiber topology. This worker narrows that plan to the first implementable
  `fast-react-core` source slice.
- Worker 078 confirms hook effect rings are per-fiber data and should consume
  topology and flags later without reviving a global effect list.
- Worker 079 assigns `FiberRoot`, root lifecycle, root scheduling fields,
  HostRoot initialization policy, host containers, and host tokens to the
  reconciler, not to core topology.
- Worker 080 assigns HostRoot update queues and `update_container` APIs to the
  reconciler and keeps them separate from DOM/public roots.
- Worker 082 assigns commit ordering, host mutation calls, `root.current`
  switching, layout/ref/passive ordering, and test-renderer canaries to the
  reconciler and renderer layers.

Current source evidence:

- `crates/fast-react-core/src/lib.rs` currently exports compatibility,
  element, lane, and symbol primitives only.
- `crates/fast-react-core/src/lane.rs` exists and contains the merged lane
  types this plan should consume.
- `crates/fast-react-core/src/root_lanes.rs` is absent.
- `crates/fast-react-core/src/event_priority.rs` is absent.
- `crates/fast-react-core/src/fiber_flags.rs` is absent.
- `crates/fast-react-core/src/hook_effect_flags.rs` is absent.
- `fast-react-core` has no dependency on host-config or reconciler, which is
  the correct dependency direction for shared renderer-agnostic data.

Delegated hypothesis checks:

- Spawned read-only explorer `019e0ef5-b0db-7e40-9859-c7c54ce77b94` to extract
  required topology invariants and verify whether workers 047, 075, and 076
  are present in this worktree.
- Spawned read-only explorer `019e0ef5-b114-7621-93da-e26a8fb0b0d7` to
  challenge the boundary that this slice belongs in core and should not pull in
  reconciler/root/DOM/Scheduler behavior.
- Both checks reported no file modifications.
- The first explorer confirmed the required `FiberId`, arena, topology,
  alternate, deletion, `child_lanes`, `subtree_flags`, opaque-slot, and
  boundary tests, and confirmed that `root_lanes.rs`, `event_priority.rs`,
  `fiber_flags.rs`, and `hook_effect_flags.rs` are absent locally.
- The second explorer accepted the core-only hypothesis only for a narrow
  topology definition and warned that `FiberRoot`, root lanes, `root.current`,
  HostRoot queues, commit traversal, host tokens, public roots, hooks dispatch,
  and Scheduler APIs must stay outside this plan.

Did not read `ORCHESTRATOR.md`.

## First Source Slice

Implement this as a single `fast-react-core` data-structure worker after the
provisional neighboring workers are merged or after an explicit rebase plan is
accepted.

Future write scope:

- `crates/fast-react-core/src/fiber_id.rs`
- `crates/fast-react-core/src/fiber_handles.rs`
- `crates/fast-react-core/src/fiber.rs`
- `crates/fast-react-core/src/fiber_arena.rs`
- `crates/fast-react-core/src/fiber_deletions.rs`
- `crates/fast-react-core/src/fiber_bubbling.rs`
- `crates/fast-react-core/src/lib.rs`
- The implementation worker's progress report

Do not add or modify these files in the topology worker unless their owning
workers have merged and the names are being consumed rather than duplicated:

- `crates/fast-react-core/src/root_lanes.rs` from worker 047
- `crates/fast-react-core/src/event_priority.rs` from worker 075
- `crates/fast-react-core/src/fiber_flags.rs` from worker 076
- `crates/fast-react-core/src/hook_effect_flags.rs` from worker 076

## Planned Rust Types

`fiber_id.rs`:

- `FiberArenaId`: arena/root-local owner token used for same-arena validation.
- `FiberSlot`: compact slot index into `FiberArena`.
- `FiberGeneration`: generation counter for stale ID rejection.
- `FiberId`: stable arena-scoped handle containing arena, slot, and generation
  once reclamation is allowed.
- `FiberIdError`: invalid slot, stale generation, wrong arena, vacant slot,
  and self-link violations.

The first implementation may temporarily prohibit reclamation if it cannot add
generational IDs immediately. If it uses plain indices, that must be an
explicitly documented temporary state with tests proving IDs are never reused.

`fiber_handles.rs`:

- `ElementTypeHandle`
- `FiberTypeHandle`
- `PropsHandle`
- `StateHandle`
- `UpdateQueueHandle`
- `DependenciesHandle`
- `RefHandle`
- `HostStateHandle`
- `RootBackReferenceHandle`

These handles should be opaque newtypes or enums with empty/null sentinels.
They must not store raw JS values, DOM nodes, host-config associated types,
native handles, callback pointers, refs, wakeables, reducers, scheduler
callbacks, or public root objects.

`fiber.rs`:

- `FiberTag`: include at least `HostRoot`, `HostComponent`, `HostText`,
  `FunctionComponent`, `ClassComponent`, `Fragment`, `Portal`, `Suspense`,
  `Offscreen`, and an explicit unsupported/reserved tag path for future React
  tags.
- `FiberMode`: bitset newtype for `NoMode`, `ConcurrentMode`, strict mode
  flags, profiling, and future mode bits. If worker 076 or another worker owns
  mode flags by the time this lands, consume that type instead.
- `FiberNode`: fixed-layout record with stable identity fields, topology
  fields, render data handles, lanes, provisional flags, and deletion storage.
- `FiberLinkFields`: optional internal helper grouping `return`, `child`,
  `sibling`, `index`, and `alternate`.

Required `FiberNode` fields:

- `id: FiberId`
- `tag: FiberTag`
- `key: Option<ReactKey>`
- `mode: FiberMode`
- `element_type: ElementTypeHandle`
- `fiber_type: FiberTypeHandle`
- `state_node: HostStateHandle` or a broader opaque state-node handle
- `return_: Option<FiberId>`
- `child: Option<FiberId>`
- `sibling: Option<FiberId>`
- `index: usize`
- `alternate: Option<FiberId>`
- `pending_props: PropsHandle`
- `memoized_props: PropsHandle`
- `memoized_state: StateHandle`
- `update_queue: UpdateQueueHandle`
- `dependencies: DependenciesHandle`
- `ref_handle: RefHandle`
- `lanes: Lanes`
- `child_lanes: Lanes`
- `flags`: provisional placeholder until worker 076 merges, then `FiberFlags`
- `subtree_flags`: provisional placeholder until worker 076 merges, then
  `FiberFlags`
- `deletions`: parent-owned deletion-list handle or inline small list

`fiber_arena.rs`:

- `FiberArena`: owning storage for `FiberNode` records and deletion lists.
- `FiberArenaValidation`: helper result for whole-arena invariant checks.
- `FiberTopologyError`: wrong arena, stale ID, missing node, self parent,
  sibling cycle, mixed-parent sibling chain, duplicate child ownership,
  nonreciprocal alternate, cross-arena alternate, invalid deletion target,
  deleted child still in finished chain, and invalid index sequence.

`fiber_deletions.rs`:

- `DeletionListId` if deletion lists are arena side storage.
- `DeletionList`: ordered parent-owned list of `FiberId` values.
- Helpers to add, iterate, clear after cleanup, and validate deleted-subtree
  retention without reclaiming too early.

`fiber_bubbling.rs`:

- `bubble_child_lanes(arena, parent) -> Result<Lanes, FiberTopologyError>`
- `bubble_subtree_flags(arena, parent) -> Result<ProvisionalFlags, FiberTopologyError>`
- `bubble_properties(arena, parent)` only as a pure data helper, not complete
  work.
- Static-flag bailout helpers only after worker 076 provides a canonical
  `StaticMask`.

## Topology Invariants

Fiber ID invariants:

- `FiberId` is stable while current and work-in-progress trees coexist.
- `FiberId` is arena-scoped and cannot be used across arenas.
- Every link operation validates same-arena ownership.
- Stale generations fail closed before reading or mutating a reused slot.
- Fiber records store `FiberId` values, never Rust references to other fibers.
- Arena compaction must not move records behind live IDs.

Parent/child/sibling invariants:

- `child` points to the first child.
- `sibling` is a singly linked list in rendered order.
- `index` equals the child's position among siblings.
- Every sibling in a chain has the same `return_` parent.
- Sibling chains are acyclic.
- A fiber cannot be its own parent, child, or sibling.
- A fiber has at most one parent in one finished tree.
- Moves are represented by work-in-progress topology plus flags, not by
  allowing multi-parent links.

Alternate invariants:

- A fiber has zero or one alternate.
- If `a.alternate == Some(b)`, then `b.alternate == Some(a)`.
- Alternate pairs are distinct IDs in the same arena.
- Alternate pairs agree on stable identity fields such as `tag` and `key`
  unless a later replacement rule intentionally discards the pair.
- Render-owned fields may diverge: child links, sibling links, pending props,
  memoized props/state, lanes, child lanes, flags, subtree flags, and
  deletions.
- Work-in-progress edits must not mutate the current tree.
- Aborted work-in-progress can be discarded without losing current topology.

Deletion invariants:

- Deletion lists are parent-owned and ordered.
- Deleted fibers are removed from the finished child/sibling chain.
- Deleted subtrees remain reachable through the parent deletion list until
  mutation cleanup, ref detach, layout cleanup, passive unmount traversal, and
  host detach consumers no longer need them.
- Clearing deletion storage is a commit cleanup action, not a render-time
  topology mutation.
- Once worker 076 lands, a non-empty deletion list must agree with the parent
  `ChildDeletion` flag.
- Reclaiming deleted fibers before passive cleanup is forbidden.

Lane propagation invariants:

- Every fiber stores local `lanes: Lanes` and aggregated
  `child_lanes: Lanes`.
- `lanes` represents work scheduled directly on that fiber.
- `child_lanes` is the OR of every descendant child's `lanes` and
  `child_lanes` over the finished child/sibling tree.
- Deleted fibers in parent deletion lists are not part of normal finished-tree
  `child_lanes` bubbling.
- Root pending/suspended/pinged/expired/entangled lanes remain worker 047's
  root lane state, not topology state.

Flag propagation invariants:

- The topology record reserves `flags` and `subtree_flags` because workers 071,
  077, 078, and 082 all require mask-driven traversal later.
- Concrete `FiberFlags`, masks, aliases, and `HookEffectFlags` are provisional
  until worker 076 source is present.
- `subtree_flags` is the OR of each child fiber's local `flags` and
  `subtree_flags`.
- Bailout static-mask preservation should be added only after worker 076
  defines the canonical static mask.
- Do not add `firstEffect`, `lastEffect`, or `nextEffect` as tree-wide fiber
  fields.

Opaque handle invariants:

- Core topology cannot import `fast-react-host-config` or
  `fast-react-reconciler`.
- Core topology cannot store `H::Instance`, `H::TextInstance`, DOM nodes,
  native tags, JS callback values, or scheduler callback handles.
- Host tokens are reconciler/host-config concerns derived later from stable
  fiber identity plus phase validation.
- JS/native rooting policy remains outside this slice; topology stores typed
  placeholders only.

## Tests For Future Source Work

Core ID tests:

- `fiber_ids_are_unique_within_an_arena`
- `fiber_ids_are_not_valid_across_arenas`
- `stale_fiber_generation_is_rejected`
- `non_reclaiming_index_ids_do_not_reuse_slots_before_generations_exist`
- `missing_or_vacant_slots_fail_closed`

Parent/child/sibling tests:

- `append_children_sets_parent_sibling_order_and_indices`
- `inserted_sibling_chain_preserves_render_order`
- `sibling_cycle_is_rejected`
- `self_parent_child_or_sibling_links_are_rejected`
- `mixed_parent_sibling_chain_is_rejected`
- `cross_arena_child_link_is_rejected`
- `one_child_cannot_have_two_finished_parents`

Alternate tests:

- `create_work_in_progress_links_alternates_reciprocally`
- `alternate_ids_are_distinct_and_same_arena`
- `create_work_in_progress_reuses_existing_alternate`
- `work_in_progress_edits_do_not_mutate_current_tree`
- `cross_arena_alternate_link_is_rejected`
- `alternate_stable_identity_mismatch_is_rejected`

Deletion tests:

- `deletions_are_parent_owned_and_ordered`
- `deleted_children_are_not_in_finished_child_chain`
- `deleted_subtree_remains_reachable_until_cleanup`
- `clearing_deletions_requires_explicit_cleanup`
- `reclaim_after_cleanup_rejects_stale_ids`
- `non_empty_deletions_match_child_deletion_flag_after_worker_076`

Lane and flag propagation tests:

- `child_lanes_bubble_from_descendant_lanes`
- `child_lanes_ignore_parent_deletion_list`
- `child_lanes_recompute_after_wip_child_replacement`
- `subtree_flags_bubble_from_child_flags_after_worker_076`
- `bailout_bubbling_preserves_only_static_flags_after_worker_076`
- `alternate_child_lanes_can_diverge_without_mutating_current`

Opaque boundary tests:

- `core_fiber_modules_do_not_depend_on_host_config_or_reconciler`
- `opaque_handle_slots_store_only_core_newtypes`
- `fiber_topology_does_not_define_root_lanes_or_event_priority`
- `fiber_topology_does_not_duplicate_worker_076_flag_types`
- `no_dom_or_scheduler_public_api_names_in_core_topology_modules`

Report-only planning tests are not run by this worker because no source code is
implemented.

## Implementation Sequence

1. Rebase after workers 047, 075, and 076 if they merge first, or explicitly
   keep all references to their outputs provisional.
2. Add `fiber_id.rs` and `fiber_handles.rs` first. This isolates identity and
   opaque ownership before graph mutation APIs exist.
3. Add `fiber.rs` with `FiberTag`, `FiberMode`, and `FiberNode` fields, using
   `Lanes` from worker 030 and provisional flag placeholders only if worker
   076 is still absent.
4. Add `fiber_arena.rs` with allocation, lookup, same-arena validation, and
   whole-arena topology validation.
5. Add parent/child/sibling mutation helpers and tests.
6. Add alternate helpers and tests for current/work-in-progress separation.
7. Add `fiber_deletions.rs` and tests for ordered parent-owned deletion
   retention.
8. Add `fiber_bubbling.rs` with pure `child_lanes` bubbling first, then
   `subtree_flags` bubbling after worker 076 flags are available.
9. Export only the stable core data types from `lib.rs`; avoid convenience APIs
   that look like reconciliation, scheduling, DOM, or public root behavior.

## Out Of Scope

This implementation plan intentionally excludes:

- `FiberRoot` or root tables
- HostRoot update queue processing
- `update_container` or `update_container_sync`
- concurrent update staging
- begin work, complete work, or child reconciliation
- root scheduler, `get_next_lanes`, event priority, or Scheduler package APIs
- `root.current` switching
- commit traversal or host mutation calls
- DOM node maps, public instance lookup, listener installation, or hydration
- React DOM public root objects
- hooks dispatcher, hook state queues, or effect callback invocation
- JS/native rooting of callbacks, refs, wakeables, reducers, or elements

## Completion Gates For The Future Implementation Worker

Required commands:

```sh
cargo fmt --all --check
cargo test -p fast-react-core --all-features
cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings
git diff --check -- crates/fast-react-core worker-progress/<worker-report>.md
```

Required source guards:

```sh
rg -n "fast-react-host-config|fast-react-reconciler" crates/fast-react-core/src/fiber*.rs
rg -n "update_container|root\\.current|commit|work_loop|begin_work|complete_work" crates/fast-react-core/src/fiber*.rs
rg -n "document|Element|Node|scheduler/|unstable_" crates/fast-react-core/src/fiber*.rs
test ! -f crates/fast-react-core/src/root_lanes.rs || rg -n "worker 047" worker-progress/<worker-report>.md
test ! -f crates/fast-react-core/src/event_priority.rs || rg -n "worker 075" worker-progress/<worker-report>.md
```

The `rg` guards should return no source matches except documented comments or
test names that explicitly assert the absence of these dependencies. The
worker should also include a scoped status check proving only allowed files
changed.

## Migration Risks And Blockers

- Worker 047 root lane bookkeeping is not present here. Any dependency on
  `RootLaneState`, pending lanes, entanglements, hidden updates, or
  `get_next_lanes` is provisional and must not be reimplemented in topology.
- Worker 075 event priority is not present here. Do not add event priority
  conversions or public Scheduler priority behavior in this slice.
- Worker 076 fiber and hook effect flags are not present here. The topology
  slice can reserve fields, but concrete `FiberFlags`, `HookEffectFlags`,
  phase masks, and static-mask bailout behavior must consume worker 076 once
  merged.
- `lib.rs` is a merge hotspot because workers 047, 075, 076, and this future
  topology slice all need exports.
- Plain index IDs are unsafe if reclamation exists. Either implement
  generational IDs immediately or prohibit reuse until a generational layer
  lands.
- Deletion retention must outlive mutation, ref, layout, passive, and host
  detach consumers. Reclaiming too early can create stale public-instance or
  host-token hazards later.
- Opaque handle policy is unresolved for JS/native values. Core must use typed
  placeholders until the binding lifetime model is proven.
- Reconciler root workers may choose exact root module names, but that should
  not change core topology ownership.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan models React's actual topology root cause: double-buffered fibers
  with stable IDs, tree links, parent deletions, and lane/flag propagation.
- It avoids symptom patches such as direct host tree mutation or one mutable
  graph that cannot represent aborted work.

Maintainability:

- File boundaries keep identity, handles, node layout, arena storage,
  deletions, and bubbling separate enough for focused tests.
- React-aligned names are used where merged evidence pins semantics, while
  renderer-specific behavior remains outside core.

Performance:

- Arena IDs and bitsets avoid reference-counted graph structures and hot-path
  hash lookups.
- `child_lanes` and later `subtree_flags` make future traversal skip checks
  cheap.
- Deletion lists should retain IDs, not clone whole subtrees.

Security:

- No raw JS values, callbacks, refs, DOM nodes, native handles, host instances,
  or scheduler callbacks enter core topology.
- Generational IDs and same-arena validation reduce stale-handle and
  cross-root access risks.
- Deletion reclaim must be conservative so later host tokens and public
  instance maps cannot observe reused fiber identity.

## Commands Run

Tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after goal setup.
- `update_plan` to track research, delegation, drafting, and review.
- Spawned read-only explorer `019e0ef5-b0db-7e40-9859-c7c54ce77b94`.
- Spawned read-only explorer `019e0ef5-b114-7621-93da-e26a8fb0b0d7`.
- `wait_agent` for the two explorers.

Shell commands:

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
git status --short
rg --files crates/fast-react-core worker-progress | sort
sed -n '1,240p' crates/fast-react-core/src/lib.rs
sed -n '1,320p' crates/fast-react-core/src/lane.rs
sed -n '1,320p' crates/fast-react-core/src/element.rs
sed -n '1,220p' crates/fast-react-core/Cargo.toml
sed -n '1,260p' worker-progress/worker-077-core-fiber-topology-plan.md
sed -n '260,620p' worker-progress/worker-077-core-fiber-topology-plan.md
sed -n '620,920p' worker-progress/worker-077-core-fiber-topology-plan.md
sed -n '1,240p' worker-progress/worker-070-core-update-queue-plan.md
sed -n '1,300p' worker-progress/worker-071-core-fiber-flags-effect-plan.md
sed -n '300,700p' worker-progress/worker-071-core-fiber-flags-effect-plan.md
sed -n '1,260p' worker-progress/worker-078-hook-effect-ring-plan.md
sed -n '260,620p' worker-progress/worker-078-hook-effect-ring-plan.md
sed -n '1,240p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '240,540p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '540,740p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '740,840p' worker-progress/worker-079-reconciler-fiber-root-model-plan.md
sed -n '1,260p' worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
sed -n '260,620p' worker-progress/worker-080-reconciler-host-root-update-queue-plan.md
sed -n '1,280p' worker-progress/worker-082-reconciler-commit-ordering-plan.md
sed -n '280,680p' worker-progress/worker-082-reconciler-commit-ordering-plan.md
sed -n '100,220p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,260p' worker-progress/worker-030-core-lane-model.md
sed -n '260,560p' worker-progress/worker-030-core-lane-model.md
rg -n "worker-0(47|75|76)|root_lanes|event_priority|fiber_flags|hook_effect_flags" MASTER_PLAN.md MASTER_PROGRESS.md worker-progress crates/fast-react-core/src
git status --short --untracked-files=all
rg -n "^## (Objective|Summary|Evidence Gathered|First Source Slice|Planned Rust Types|Topology Invariants|Tests For Future Source Work|Implementation Sequence|Out Of Scope|Completion Gates For The Future Implementation Worker|Migration Risks And Blockers|Quality, Maintainability, Performance, And Security Review|Commands Run|Report-Only Verification|Changed Files|Recommended Next Tasks|Completion Checklist)$" worker-progress/worker-107-core-fiber-topology-implementation-plan.md
rg -n "[ \t]$" worker-progress/worker-107-core-fiber-topology-implementation-plan.md
rg -n "<local-path-prefix-patterns>" worker-progress/worker-107-core-fiber-topology-implementation-plan.md
git diff --check --no-index /dev/null worker-progress/worker-107-core-fiber-topology-implementation-plan.md
rg -n "worker 007|worker 030|worker 070|worker 071|worker 077|worker 078|worker 079|worker 080|worker 082|worker 047|worker 075|worker 076|fast-react-core|fiber_id.rs|fiber_handles.rs|fiber.rs|fiber_arena.rs|fiber_deletions.rs|fiber_bubbling.rs|FiberId|alternate|deletions|child_lanes|root\.current|update_container|Scheduler|DOM" worker-progress/worker-107-core-fiber-topology-implementation-plan.md
sed -n '1,220p' worker-progress/worker-107-core-fiber-topology-implementation-plan.md
sed -n '220,620p' worker-progress/worker-107-core-fiber-topology-implementation-plan.md
```

No source tests were run because this is a report-only planning task.

## Report-Only Verification

- `git status --short --untracked-files=all` showed only
  `worker-progress/worker-107-core-fiber-topology-implementation-plan.md` as
  an untracked scoped change.
- Required-heading scan found the expected report sections.
- Trailing-whitespace scan returned no matches.
- Local path leak scan for concrete local path prefixes returned no matches.
- `git diff --check --no-index /dev/null
  worker-progress/worker-107-core-fiber-topology-implementation-plan.md`
  emitted no whitespace diagnostics. It returned the expected non-zero
  no-index status because the report is an added file.
- Prompt-keyword coverage scan found the required worker anchors, future file
  names, `fast-react-core` scope, provisional workers, `FiberId`, alternates,
  deletions, `child_lanes`, and explicit exclusions such as `root.current`,
  `update_container`, `Scheduler`, and `DOM`.

## Changed Files

- `worker-progress/worker-107-core-fiber-topology-implementation-plan.md`

## Recommended Next Tasks

1. Merge or rebase after workers 047, 075, and 076, then implement
   `fiber_id.rs` and `fiber_handles.rs`.
2. Implement `FiberNode` and `FiberArena` in `fast-react-core` using existing
   `Lanes` and merged/provisional flag types.
3. Add parent/child/sibling and alternate tests before any reconciler worker
   consumes topology.
4. Add parent-owned deletion storage and conservative reclaim tests.
5. Add pure `child_lanes` bubbling, then `subtree_flags` bubbling after worker
   076 flags are available.
6. Only after topology invariants are green should reconciler workers wire
   `FiberRoot`, HostRoot queues, work loops, commits, DOM roots, hooks, or
   Scheduler integration to these IDs.

## Completion Checklist

- [x] Called `create_goal` before research or file reads.
- [x] Called `get_goal` and recorded active status/objective.
- [x] Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Kept the task report-only.
- [x] Modified only
      `worker-progress/worker-107-core-fiber-topology-implementation-plan.md`.
- [x] Anchored the plan in workers 007, 030, 070, 071, 077, 078, 079, 080,
      and 082.
- [x] Treated workers 047, 075, and 076 as provisional because their source
      files are absent in this worktree.
- [x] Kept the implementation slice in `fast-react-core`.
- [x] Excluded reconciliation, DOM behavior, public roots, hooks dispatch, and
      Scheduler APIs.
- [x] Specified exact future source files.
- [x] Specified Rust types, invariants, tests, migration risks, and completion
      gates.
- [x] Used subagents to test hypotheses and summarized their results.
- [x] Ran report-only status, heading, whitespace, path-leak, and diff-check
      verification.
- [x] Reviewed quality, maintainability, performance, and security concerns.
