# worker-077-core-fiber-topology-plan

## Objective

Produce a report-only plan for core fiber topology, stable IDs, alternates,
parent/child/sibling links, and deletion storage.

Goal tool status: `create_goal` and `get_goal` were available. The active goal
reported by `get_goal` was status `active` with objective "Produce a
report-only plan for core fiber topology, stable IDs, alternates, parent/child/
sibling links, and deletion storage."

Write scope honored: this report is the only intended changed file. No Rust,
JavaScript, package, or test implementation is part of this worker.

## Summary

Fast React should put renderer-agnostic fiber topology in `fast-react-core`,
then let `fast-react-reconciler` own root scheduling, render work loops, commit
phase traversal, and host-config calls. The topology layer should provide
stable arena IDs, alternate links, parent/child/sibling structure, local lane
and flag storage, parent-owned deletion lists, and opaque handle slots for
element, state, update queue, dependency, ref, and host state values.

The root cause is dependency direction. `fast-react-core` already owns React
19.2.6 lane primitives and is the only crate that can hold shared
renderer-independent data without depending on host or reconciler behavior.
`fast-react-reconciler` depends on both core and host-config; if the generic
fiber topology lives only in the reconciler, future core update queues, hook
effect rings, lane bubbling helpers, and other renderer-independent structures
would either need to depend on the reconciler or duplicate fiber identity.
That would invert the crate boundary and make alternates, deletion retention,
and queue ownership harder to prove.

The correct split is therefore:

- `fast-react-core`: data model primitives and invariants for fibers, IDs,
  arenas, topology links, alternates, deletion storage, lane fields, and
  flag/hook-effect storage once worker 076 merges.
- `fast-react-reconciler`: `FiberRoot` records, current-root switching,
  work-in-progress creation policy, root lane scheduling, update processing,
  commit traversal, host parent/sibling resolution, phase-scoped host tokens,
  and calls into `MutationRenderer` or future persistence/hydration renderers.
- `fast-react-host-config`: opaque renderer types, phase-scoped
  `HostFiberTokenRef`, capabilities, and host operations. Core must not import
  host-config or know DOM/native types.

Breaking changes are acceptable if needed to remove scaffold shortcuts. In
particular, do not model topology as borrowed Rust references, a single mutable
tree, renderer-local node storage, a direct DOM tree, a global effect list, or
a FIFO root update path.

## Hypothesis Test: Core Versus Reconciler

Hypothesis: core fiber topology belongs in `fast-react-core`, not exclusively
in `fast-react-reconciler`.

Result: accepted with a narrow boundary. The core should own topology records
and invariants; the reconciler should own root work and host integration.

Evidence from merged reports:

- Worker 007 established that React 19.2.6 fibers are double-buffered records
  with `return`, `child`, `sibling`, `index`, `alternate`, `lanes`,
  `childLanes`, `flags`, `subtreeFlags`, and parent-owned `deletions`. It also
  rejected simplified FIFO queues, flat priorities, and global effect lists.
- Worker 030 merged the lane foundation in `fast-react-core`: transparent
  `Lane`, `Lanes`, `LaneIndex`, fixed-width `LaneMap<T>`, and allocation-free
  bit operations. Fiber topology needs those fields directly.
- Worker 070 placed update queue data structures in core and requires stable
  IDs such as `FiberId`, `UpdateId`, and `QueueId` instead of Rust references.
  That points to shared core fiber identity, not reconciler-private identity.
- Worker 071 planned core flag/effect metadata and explicitly put the
  arena-backed fiber topology slice in core after flags. It requires topology
  fields for `flags`, `subtreeFlags`, lanes, alternates, and parent-owned
  deletions.
- Worker 072 planned the reconciler root work loop and needs fiber/root models,
  but its root-specific responsibilities are scheduling, HostRoot, commit
  phases, and host calls. Those consume topology; they should not be the only
  definition of topology.
- Worker 051 merged a host token boundary in host-config. That is evidence
  that host adapters need phase-scoped identity tokens, but not raw fiber
  structs or DOM-aware topology in core.

Evidence from current Rust crate boundaries:

- `crates/fast-react-core/src/lib.rs` exports element metadata and lane
  primitives, with no dependency on host-config or reconciler. That is the
  correct place for renderer-independent node IDs and topology.
- `crates/fast-react-reconciler/src/lib.rs` imports core and host-config and
  currently only validates the mutation-renderer boundary before returning a
  loud unimplemented error. A generic topology model there would be usable by
  the reconciler but not by core update queue or effect-ring modules.
- `crates/fast-react-host-config/src/lib.rs` owns opaque host associated types
  and token views. Since host-config depends on core, core topology must store
  opaque handle slots or generic IDs rather than `H::Instance` values.
- The workspace has no existing `fiber.rs`, `fiber_arena.rs`, `root_lanes.rs`,
  `event_priority.rs`, `fiber_flags.rs`, or `hook_effect_flags.rs` merged in
  this worktree. Active workers 047, 075, and 076 own those adjacent slices and
  must not be preempted here.

Counterevidence considered:

- The reconciler will own `FiberRoot`, current/WIP creation, commit status,
  root lane scheduling, and host effect traversal. That may make a reconciler
  `fiber.rs` attractive.
- However, putting every fiber field in the reconciler would force core update
  queues, hook effects, and complete-work helpers to either duplicate IDs or
  wait for reconciler internals. The maintainable split is a core topology
  model plus reconciler root/work-loop ownership.

Nested-agent hypothesis checks:

- Spawned two read-only explorer subagents: one to challenge the core-versus
  reconciler placement hypothesis against crate boundaries, and one to check
  implementation-scope conflicts with active workers 047, 075, and 076.
- The core-versus-reconciler explorer agreed that renderer-agnostic fiber
  primitives belong in `fast-react-core` while `fast-react-reconciler` owns
  `FiberRoot`, allocation policy, root scheduling, work-loop state, commit
  traversal, host calls, and concrete token generation. It also called out the
  counterargument from worker 072's reconciler-owned fiber/root arena language;
  this report resolves that by keeping root/live work ownership in the
  reconciler while moving shared data primitives to core.
- The scope-conflict explorer agreed that future topology source work should
  wait for workers 047, 075, and 076 or be queued as a post-076 rebase. It
  identified `crates/fast-react-core/src/lib.rs` as the only unavoidable
  export conflict and confirmed that topology must not touch `root_lanes.rs`,
  `event_priority.rs`, `fiber_flags.rs`, or `hook_effect_flags.rs`.

## Evidence Gathered

- Required merged reports support a renderer-agnostic core data model:
  worker 007 for fiber shape, alternates, lanes, flags, and deletions; worker
  030 for the core lane primitives; worker 071 for core flag/topology/effect
  sequencing; and worker 072 for reconciler root-work ownership.
- Additional merged reports sharpen the boundary: worker 070 needs shared core
  fiber identity for update queues, worker 051 put host token concepts in
  host-config, and worker 073 keeps public test-renderer updates on shared
  reconciler root/update semantics.
- Current crate inspection shows `fast-react-core` owns renderer-agnostic
  records and lanes without importing host-config or reconciler, while
  `fast-react-reconciler` already imports both core and host-config and
  remains a placeholder for actual work-loop behavior.
- Nested read-only agents independently supported the core/reconciler split
  and the need to avoid workers 047, 075, and 076 by waiting for or rebasing
  after their adjacent core modules.

## Data Model Invariants

### FiberId

- `FiberId` must be a stable arena handle, not a borrowed reference or pointer.
- Prefer a compact generational ID such as `slot + generation`, scoped to one
  `FiberArena` or root-owned arena. A plain index is acceptable only for the
  earliest non-reclaiming slice, and must be replaceable before deletion
  cleanup can reclaim nodes.
- `FiberId` values are not globally meaningful across roots or arenas.
- Every API that links two fibers must verify same-arena ownership.
- Stale IDs must fail closed in tests and diagnostics once generations exist.
- IDs may remain stable while current and work-in-progress trees coexist; arena
  compaction must not move records behind existing IDs.

### Arena Ownership

- A `FiberArena` owns fiber records, deletion lists, and topology side storage.
- Fiber records store IDs to other fibers, never Rust references to other
  fiber records.
- Reclamation is deferred until commit, layout/passive cleanup, and renderer
  deletion detach work no longer need deleted subtrees.
- Deleted subtrees may be unreachable from the finished child/sibling tree but
  must remain reachable through the parent deletion list until cleanup ends.
- The arena should expose validation helpers for acyclic child/sibling chains,
  same-parent sibling lists, alternate reciprocity, and no cross-root links.
- User callback handles, JS values, and host instances must not be stored as
  raw borrowed values in the arena. Use opaque handle slots pending the native
  and JS rooting model.

### Parent, Child, And Sibling Links

- Each fiber stores `return`, `child`, `sibling`, and `index` as topology
  fields.
- `child` points to the first child; `sibling` is a singly linked list in
  rendered order; `index` is the child's position among siblings.
- Every child and sibling in a list must have the same `return` parent.
- Sibling chains must be acyclic and must not include the parent.
- A fiber has at most one parent in one finished tree. Moves are represented by
  the work-in-progress topology and commit flags, not by multi-parent links.
- Host parent and stable host sibling lookup are reconciler algorithms over
  this topology; they should not be precomputed into a host operation queue.

### Alternates

- A fiber can have zero or one alternate.
- If `a.alternate == Some(b)`, then `b.alternate == Some(a)` and `a != b`.
- Alternate pairs represent current and work-in-progress versions of the same
  conceptual fiber. They must agree on stable identity fields such as tag and
  key unless a future React-specific replacement rule explicitly invalidates
  the pair.
- Render-owned fields may diverge between alternates: pending props,
  memoized props/state, flags, subtree flags, child links, child lanes,
  deletions, and local lanes.
- Shared structures such as update queues must use explicit shared queue IDs or
  clone/rebase semantics. Do not rely on shared Rust references.
- Aborting a work-in-progress render must leave the current tree untouched.

### Deletion Storage

- Deletions are parent-owned and ordered.
- A parent with non-empty deletions must carry the child-deletion flag from the
  merged worker 076 flag type once available.
- Deleted fibers are not expected to appear in the finished child/sibling
  chain; commit traversal must visit them from the parent deletion list.
- Deletion storage must retain whole deleted subtrees through mutation cleanup,
  ref detaches, layout cleanup, passive unmount traversal, and host
  `detach_deleted_instance` calls.
- Deleted subtree passive unmount traversal must be parent-to-child, matching
  worker 007 and worker 071 evidence.
- Clearing a deletion list is a commit cleanup action, not a render-time
  mutation.

### Lanes And childLanes

- Every fiber stores local `lanes` and aggregated `childLanes` using the
  existing core `Lanes` type.
- `lanes` belongs to work scheduled directly on that fiber.
- `childLanes` is the OR of descendant `lanes` and descendant `childLanes` for
  the completed child tree.
- Complete-work bubbling must recompute `childLanes` from child topology; root
  lane bookkeeping remains worker 047's separate `root_lanes.rs` concern.
- `childLanes` is a traversal and bailout aid, not a replacement for root
  pending/suspended/pinged/expired/entangled lane state.
- Updating a fiber and its alternate lanes for eager bailout checks is a
  reconciler/update-queue operation that consumes these fields.

### Flags And subtreeFlags

- Topology stores `flags` and `subtreeFlags`, but worker 076 owns the concrete
  flag and hook-effect bitset modules.
- `flags` is local commit metadata.
- `subtreeFlags` is the OR of each child's local `flags` and `subtreeFlags`.
- Complete-work bubbling must derive `subtreeFlags` from the child/sibling
  topology. Bailout paths must preserve only static flags as specified by the
  worker 076 flag type.
- Commit traversal uses phase masks against `subtreeFlags` to skip clean
  subtrees, then inspects local `flags`.
- Do not add `firstEffect`, `lastEffect`, or `nextEffect` as a global commit
  list. Function-component effects belong to a per-fiber hook effect ring,
  which worker 078 is planning separately.

### Host State Handles

- Core topology must not store DOM nodes, native tags, or host-config
  associated types directly.
- Use opaque host state slots that can represent HostRoot container state, host
  instance state, text state, hydration state, activity/Suspense boundary
  state, or no host state.
- The reconciler should map those slots to renderer-owned storage and
  phase-scoped `HostFiberTokenRef` values when calling host-config traits.
- Host tokens should be derived from stable fiber identity plus renderer-owned
  validation data, not from raw pointers to fiber records.
- Host state cleanup must be coordinated with deletion retention so
  `detach_deleted_instance` cannot observe freed or recycled fiber identity.

## Future Implementation Slices

These slices are designed to avoid active workers 047, 075, and 076:

- Worker 047 owns `crates/fast-react-core/src/root_lanes.rs` and `lib.rs`.
- Worker 075 owns `crates/fast-react-core/src/event_priority.rs` and `lib.rs`.
- Worker 076 owns `crates/fast-react-core/src/fiber_flags.rs`,
  `crates/fast-react-core/src/hook_effect_flags.rs`, and `lib.rs`.

Because every new core module needs `lib.rs`, topology implementation should
start after worker 076 has merged or be queued as a single post-076 rebase. Do
not create competing `fiber_flags`, `hook_effect_flags`, `event_priority`, or
`root_lanes` modules in topology work.

### 1. Core Fiber IDs And Opaque Slots

Write scope:

- `crates/fast-react-core/src/fiber_id.rs`
- `crates/fast-react-core/src/fiber_handles.rs`
- `crates/fast-react-core/src/lib.rs` after active core export workers merge
- `worker-progress/worker-core-fiber-ids.md`

Task:

- Add `FiberId`, `FiberGeneration`, and same-arena validation helpers.
- Add opaque handle-slot enums or newtypes for element type, props, state,
  update queue, dependencies, refs, and host state.
- Keep all handles renderer-agnostic and free of host-config imports.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features fiber_id`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Tests for ID creation, stale-generation rejection, same-arena checks, and
  handle-slot equality/debug behavior.

### 2. Core Fiber Record And Arena

Write scope:

- `crates/fast-react-core/src/fiber.rs`
- `crates/fast-react-core/src/fiber_arena.rs`
- `crates/fast-react-core/src/lib.rs` after active core export workers merge
- `worker-progress/worker-core-fiber-arena.md`

Task:

- Add `FiberTag`, `FiberMode`, `FiberNode`, and `FiberArena`.
- Store `return`, `child`, `sibling`, `index`, `alternate`, `lanes`,
  `childLanes`, `flags`, `subtreeFlags`, deletion storage handles, and opaque
  value/host slots.
- Use worker 030 lane types and worker 076 flag types; do not redefine either.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features fiber`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Tests for parent/child/sibling order, no cycles, same-parent sibling lists,
  arena ownership, and storage of lanes/flags without root lane algorithms.

### 3. Alternate Pair Helpers

Write scope:

- `crates/fast-react-core/src/fiber_alternate.rs`
- `crates/fast-react-core/src/fiber_arena.rs`
- `crates/fast-react-core/src/lib.rs` after active core export workers merge
- `worker-progress/worker-core-fiber-alternates.md`

Task:

- Add `create_work_in_progress`, reciprocal alternate linking, and reset/copy
  rules for topology fields that are safe without a reconciler work loop.
- Keep root current switching out of core.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features alternate`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Tests for reciprocal alternates, current tree immutability after WIP edits,
  copy/reset policy, and invalid cross-arena alternate rejection.

### 4. Parent-Owned Deletion Lists

Write scope:

- `crates/fast-react-core/src/fiber_deletions.rs`
- `crates/fast-react-core/src/fiber_arena.rs`
- `crates/fast-react-core/src/lib.rs` after active core export workers merge
- `worker-progress/worker-core-fiber-deletions.md`

Task:

- Add ordered deletion-list storage owned by parent fibers.
- Set or validate the worker 076 child-deletion flag when a deletion list is
  non-empty.
- Defer reclamation through explicit cleanup APIs.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features deletions`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Tests for deletion order, detached subtree retention, child-deletion flag
  consistency, clearing after cleanup, and stale ID rejection after reclaim.

### 5. Pure Bubbling Helpers

Write scope:

- `crates/fast-react-core/src/fiber_bubbling.rs`
- `crates/fast-react-core/src/fiber_arena.rs`
- `crates/fast-react-core/src/lib.rs` after active core export workers merge
- `worker-progress/worker-core-fiber-bubbling.md`

Task:

- Add pure helpers that recompute `childLanes` and `subtreeFlags` from the
  child/sibling topology.
- Add bailout/static-only helpers after worker 076 defines the stable-mask
  policy.
- Do not implement begin work, complete work, root scheduling, or commit calls.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features bubbling`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Tests for normal bubbling, bailout bubbling, deletion list exclusion from
  finished child traversal, and alternate return-pointer consistency.

### 6. Reconciler Adoption Shell

Write scope:

- `crates/fast-react-reconciler/src/fiber_store.rs`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-core-topology-adoption.md`

Task:

- Wrap the core `FiberArena` for reconciler roots.
- Generate phase-scoped host tokens from core `FiberId` plus reconciler-owned
  token validation metadata.
- Add synthetic tests proving host token generation does not expose raw fiber
  records and that root current switching remains a reconciler responsibility.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features fiber_store`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Tests for token phase/target construction, current/WIP handle ownership, and
  no host-config dependency from core.

## Verification Strategy For Future Work

Data-model unit tests should land before public renderer tests:

- Stable `FiberId` generation and stale-handle rejection.
- Same-arena constraints for parent, child, sibling, deletion, and alternate
  links.
- Parent/child/sibling order and `index` invariants.
- Alternate reciprocity and current tree immutability after WIP edits.
- Ordered parent-owned deletion storage and deferred reclaim.
- `childLanes` bubbling from descendant lanes.
- `subtreeFlags` bubbling from descendant flags.
- Static-flag preservation on bailout after worker 076 merges.
- Opaque host state slots with no DOM/native type leakage.
- Reconciler token generation from fiber IDs without exposing core records.

Conformance-level tests should wait until root update queues and a test
renderer commit path exist. Before then, public DOM/test-renderer scenarios
would mostly exercise placeholders rather than topology.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan models React's actual topology and double-buffering shape instead
  of patching symptoms with a mutable host tree.
- It preserves worker boundaries by consuming lanes from worker 030 and future
  flags from worker 076 rather than redefining adjacent primitives.

Maintainability:

- Keep core topology small and named after React concepts where the behavior is
  pinned by merged reports.
- Keep root scheduling, current switching, and host calls in the reconciler so
  core does not accumulate renderer behavior.
- Keep active worker scopes isolated: no root lane, event priority, fiber flag,
  or hook effect flag implementation in this plan.

Performance:

- Arena IDs and bitsets avoid hot-path hash lookups and reference-counted graph
  structures.
- `childLanes` and `subtreeFlags` enable skip-by-mask and skip-by-lane
  traversal once complete work and commit phases exist.
- Deletion retention should use ordered arena-backed lists rather than
  cloning deleted subtrees into side snapshots.

Security:

- JS callback handles, refs, wakeables, host instances, and tokens must be
  explicit handles with clear lifetimes.
- Generational IDs and phase-scoped host tokens help reject stale deletion or
  host-map access after unmount.
- Core must not store raw host pointers or DOM/native nodes.

## Commands Run

- `create_goal` for objective "Produce a report-only plan for core fiber
  topology, stable IDs, alternates, parent/child/sibling links, and deletion
  storage."
- `get_goal`, which reported the same objective with status `active`.
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md`
- `sed -n '1,260p' worker-progress/worker-030-core-lane-model.md`
- `sed -n '1,260p' worker-progress/worker-071-core-fiber-flags-effect-plan.md`
- `sed -n '1,260p' worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `git status --short --untracked-files=all`
- `rg --files crates worker-progress | sort`
- `sed -n '260,620p' worker-progress/worker-071-core-fiber-flags-effect-plan.md`
- `sed -n '260,700p' worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `sed -n '1,260p' worker-progress/worker-047-core-root-lane-bookkeeping.md`
  failed because that active worker report is not present in this worktree.
- `sed -n '1,260p' worker-progress/worker-075-core-event-priority.md`
  failed because that active worker report is not present in this worktree.
- `sed -n '1,260p' worker-progress/worker-076-core-fiber-flags.md`
  failed because that active worker report is not present in this worktree.
- `sed -n '1,260p' worker-progress/worker-077-core-fiber-topology-plan.md`
  failed before report creation because this report did not exist yet.
- `sed -n '1,260p' crates/fast-react-core/src/lib.rs`
- `sed -n '1,340p' crates/fast-react-core/src/lane.rs`
- `sed -n '1,260p' crates/fast-react-core/src/element.rs`
- `sed -n '1,360p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '1,320p' crates/fast-react-reconciler/src/lib.rs`
- `sed -n '1,220p' crates/fast-react-core/Cargo.toml`
- `sed -n '1,220p' crates/fast-react-reconciler/Cargo.toml`
- `sed -n '1,220p' crates/fast-react-host-config/Cargo.toml`
- `rg -n "^(pub trait HostTypes|pub trait HostIdentityAndContext|pub trait HostCreation|pub trait HostCommit|pub trait HostScheduling|pub trait MutationHost|pub trait MutationRenderer|pub enum HostChild|pub enum HostUpdateResult|pub struct)" crates/fast-react-host-config/src/lib.rs`
- `sed -n '360,760p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '760,1180p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '1180,1470p' crates/fast-react-host-config/src/lib.rs`
- `rg -n "worker-0(47|75|76)|root-lane|event-priority|fiber-flags|hook-effect" MASTER_PLAN.md MASTER_PROGRESS.md worker-progress -g '*.md'`
- `sed -n '620,760p' worker-progress/worker-071-core-fiber-flags-effect-plan.md`
- `sed -n '1,260p' worker-progress/worker-051-dom-host-token-boundary.md`
- `sed -n '1,220p' worker-progress/worker-070-core-update-queue-plan.md`
- `sed -n '1,240p' worker-progress/worker-073-test-renderer-update-model-plan.md`
- `spawn_agent` read-only explorer for core-versus-reconciler topology
  placement.
- `spawn_agent` read-only explorer for active-worker conflict analysis.
- `wait_agent` for both nested explorers.
- `close_agent` for the placement explorer after its result was available.
- `rg` local-path leak guard against home-directory, temp-directory, private
  temp, and file-URI prefixes for this report.
- `rg -n '[[:blank:]]$' worker-progress/worker-077-core-fiber-topology-plan.md`
- `git diff --check -- worker-progress/worker-077-core-fiber-topology-plan.md`
- `git diff --check --no-index /dev/null worker-progress/worker-077-core-fiber-topology-plan.md`
- `rg` heading coverage check for the required report sections after final
  edits.
- Re-ran the scoped status, path-leak, trailing-whitespace, and diff-check
  gates after final edits.

No source tests were run because this is a report-only planning task.

## Scoped Verification

Report-only completion gates:

- `git status --short --untracked-files=all` shows only this worker report as
  an untracked scoped change.
- A local path leak guard checked this report for concrete local paths such as
  home-directory and temp-directory prefixes; it returned no matches.
- A trailing-whitespace guard checked this report; it returned no matches.
- `git diff --check -- worker-progress/worker-077-core-fiber-topology-plan.md`
  passed with no output.
- `git diff --check --no-index /dev/null worker-progress/worker-077-core-fiber-topology-plan.md`
  produced no whitespace errors. The command exited non-zero only because the
  no-index comparison treats the untracked report as an added file.

Source tests were intentionally not run because no source code changed and the
objective is a report-only implementation plan.

## Changed Files

- `worker-progress/worker-077-core-fiber-topology-plan.md`

## Risks Or Blockers

- Worker 047, 075, and 076 outputs are active but not present here. Future
  topology source work should start after those active `lib.rs` export changes
  merge, or be explicitly rebased to avoid trivial export conflicts.
- Worker 076 owns concrete `FiberFlags` and `HookEffectFlags`. This plan
  assumes topology stores those types after they merge, but does not define
  them.
- The JS/native rooting model for values, callbacks, refs, wakeables, and
  reducers remains unsettled. Topology must use opaque handles until that model
  is proven.
- Reclamation policy must account for deferred passive unmounts and host
  deletion detach. Reusing IDs too early would create stale-token risks.
- Reconciler root workers may choose exact root module names. The core topology
  boundary should stay stable even if reconciler file names change.

## Recommended Next Tasks

1. Wait for workers 047, 075, and 076 to merge or explicitly rebase topology
   source work after their `lib.rs` changes.
2. Implement core `FiberId` and opaque handle slots first.
3. Add the core `FiberNode` and `FiberArena` topology record using existing
   `Lanes` and merged flag types.
4. Add alternate-pair helpers and WIP copy/reset rules.
5. Add parent-owned deletion storage and deferred reclaim tests.
6. Add pure bubbling helpers for `childLanes` and `subtreeFlags`.
7. Add a reconciler adoption shell that maps core `FiberId` values to
   phase-scoped host tokens without moving root scheduling or host commits into
   core.
