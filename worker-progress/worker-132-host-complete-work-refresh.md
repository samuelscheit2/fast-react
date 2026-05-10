# Worker 132 - Host Complete-Work Refresh

## Goal Evidence

- `create_goal` called for objective: "Produce a report-only refresh for the first host component/text render and complete-work slice that should follow HostRoot render-phase processing, writing only worker-progress/worker-132-host-complete-work-refresh.md."
- `get_goal` returned thread `019e0f9e-3d57-7663-bb63-57c3fdad66d1`, status `active`, `tokensUsed: 0`, `timeUsedSeconds: 0`.

## Summary

The next source slice after HostRoot render-phase processing should be a
generic reconciler-only host mount/complete-work slice. It should consume the
HostRoot WIP state produced by worker 129, build HostComponent and HostText
WIP fibers from a narrow host-element source, create detached host instances
and text instances during complete work, append terminal host children to
their detached parent instances, set `state_node` handles, and bubble lanes and
flags.

It should not commit anything. It should not append to root containers, switch
`root.current`, call `prepare_for_commit`, `reset_after_commit`,
`commit_update`, `commit_text_update`, deletion cleanup, public root facades,
DOM attributes, DOM events, hydration, resources, singletons, forms, or
function component/hooks.

The root cause to avoid is making this a DOM renderer slice. React's generic
complete work creates detached host nodes through host-config hooks and leaves
mounted tree mutation to commit. Fast React needs the same split: the
reconciler owns fiber topology, WIP creation, effect flags, host context stack,
host token issuance, detached initial-child assembly, and bubbling; renderer
adapters own concrete type/props interpretation and later DOM-specific
properties or text behavior.

## Evidence Gathered

Required project context:

- `MASTER_PLAN.md` keeps worker 132 report-only and places host
  component/text render after HostRoot render-phase work.
- `MASTER_PROGRESS.md` says core fiber topology, HostRoot queue, and root
  scheduler foundations are accepted through worker 128.
- Worker 072 identified host complete work for mutation renderers as a
  separate slice after the work loop shell, with detached initial children,
  host context, `finalize_initial_children`, host handles on fibers, and
  bubbled flags/lanes.
- Worker 091 keeps DOM mutation in the DOM adapter: owner document,
  namespaces, DOM properties, event maps, hydration, resources, and singletons
  must not enter generic core/reconciler logic.
- Worker 110 splits HostText fibers from element text-content shortcuts and
  keeps `should_set_text_content` and concrete text writes renderer-owned.
- Worker 117's first-root milestone places a host-only work loop and child
  reconciliation before minimal commit and before test-renderer/DOM public
  roots.
- Worker 128 added a data-only root scheduler. It schedules roots and callback
  identity but does not render, commit, process HostRoot queues, mutate hosts,
  or switch current.
- Worker 129's prompt owns HostRoot render-phase queue processing and scheduler
  callback identity/staleness. This report assumes that work lands before the
  host component/text slice starts.

React 19.2.6 source evidence from the pinned reference clone:

- `ReactFiberBeginWork.js` handles HostRoot by processing the update queue into
  root state and then reconciling `nextState.element` into children.
- HostComponent begin work pushes host context, calls
  `shouldSetTextContent`, skips child reconciliation for direct text-content
  leaves, marks content reset when leaving a text shortcut, and reconciles
  children.
- HostText begin work is terminal and returns no child.
- `ReactFiberCompleteWork.js` handles HostComponent mount by getting root
  container and current host context, calling `createInstance`, appending all
  terminal host children to the detached instance, assigning `stateNode`,
  calling `finalizeInitialChildren`, and marking an update only when a
  commit-mount follow-up is needed.
- HostText complete work calls `createTextInstance` during mount and marks an
  update on text changes in mutation mode.
- `appendAllChildren` traverses the WIP subtree and appends terminal
  HostComponent/HostText children to a detached parent; it does not append to
  the root container.

Current local source evidence:

- `fast-react-core` already has `FiberTag::HostComponent`,
  `FiberTag::HostText`, `FiberNode` topology fields, alternates,
  `StateNodeHandle`, `ElementTypeHandle`, `PropsHandle`, flags, deletions,
  and pure `bubble_properties`.
- `FiberArena::create_work_in_progress` is HostRoot-only in the current
  reconciler wrapper, but the core arena can create and link arbitrary fiber
  tags.
- `RootElementHandle` is still opaque. There is no source that can resolve a
  root element handle into host type/props/children/text.
- `FiberRootStore` owns roots, the core fiber arena, HostRoot state store,
  `HostFiberTokenStore`, update queues, concurrent staging, root scheduler,
  and scheduler bridge.
- `HostFiberTokenStore` issues reconciler metadata IDs with phase and target,
  but there is no crate-local materialization path from `HostFiberTokenId` to
  `H::HostFiberToken` for host-config calls.
- Host-config already exposes the hooks this slice needs:
  `root_host_context`, `child_host_context`, `should_set_text_content`,
  `create_instance`, `create_text_instance`, `append_initial_child`, and
  `finalize_initial_children`.
- `HostCommit` and `MutationHost` expose commit/mutation hooks, but those are
  below this slice except for `append_initial_child`, which is a detached
  creation hook, not mounted tree mutation.

## Narrow Source Slice

The narrowest useful implementation slice is:

1. Consume a completed HostRoot render-phase record from worker 129.
2. Resolve only the root's next element handle into host component/text test
   input.
3. Create or reuse WIP HostComponent/HostText fibers under the HostRoot WIP.
4. Run begin work only for HostComponent and HostText.
5. Run complete work only for HostRoot, HostComponent, and HostText.
6. Create detached host instances/text instances through `HostCreation`.
7. Append terminal host children to detached parent instances through
   `append_initial_child`.
8. Store opaque host node handles in `FiberNode::state_node`.
9. Bubble `child_lanes` and `subtree_flags`.
10. Leave finished work available for a future commit worker without changing
    `root.current`.

The initial behavior should be mount-first. It may reserve update branches, but
it should fail closed or mark only generic flags when an update requires a
payload shape that does not exist yet. DOM prop diffing and concrete update
payload construction must stay out of this slice.

## Exact File Scope

Recommended implementation write scope:

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/complete_work.rs`
- `crates/fast-react-reconciler/src/host_children.rs`
- `crates/fast-react-reconciler/src/host_context.rs`
- `crates/fast-react-reconciler/src/host_nodes.rs`
- `crates/fast-react-reconciler/src/host_render_source.rs`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/fiber_store.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs` only for the narrow
  handoff from worker 129's HostRoot render record into host units of work
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- `worker-progress/<future-worker>.md`

Avoid touching:

- `crates/fast-react-core/**` unless a future worker proves existing opaque
  handles cannot represent this slice.
- `crates/fast-react-host-config/**`; the existing creation hooks are enough
  for this slice if token materialization stays in the reconciler.
- `crates/fast-react-test-renderer/**`; test-renderer root canaries are a
  later consumer.
- `packages/react-dom/**`, smoke tests, conformance oracles, scheduler native
  files, lockfiles, or public package entrypoints.

## Data And Host-Token Needs

Host render source:

- Add a reconciler-private source abstraction that resolves
  `RootElementHandle`, `ElementTypeHandle`, and `PropsHandle` into only:
  host element type, host props, child descriptors, and HostText text.
- Do not make `RootElementHandle` mean a DOM node or JS object. It remains an
  opaque handle owned by bindings or tests.
- Reuse `PropsHandle` as the HostText text payload handle for now, matching
  React's "HostText pending props is the text" shape without adding core
  handles.

Host node storage:

- Add a `HostNodeStore<H>` or equivalent under `FiberRootStore<H>` to own
  created `H::Instance` and `H::TextInstance` values and return
  `StateNodeHandle` slots.
- Interpret `state_node` by fiber tag: HostRoot uses a root id handle,
  HostComponent uses an instance slot, and HostText uses a text slot.
- Provide borrow-safe helpers for `append_initial_child` so a mutable parent
  instance and immutable child instance/text can be passed to the host without
  requiring `H::Instance` or `H::TextInstance` to be `Clone` or `Copy`.

Host tokens:

- Issue creation tokens from `HostFiberTokenStore` immediately before
  `create_instance` and `create_text_instance`.
- Use `HostFiberTokenPhase::Creation` with target
  `HostFiberTokenTarget::Instance` for HostComponent and
  `HostFiberTokenTarget::TextInstance` for HostText.
- Add a reconciler-local token materialization trait, for example a
  `HostFiberTokenFactory<H>` in `host_tokens.rs`, so host adapters can turn a
  reconciler token id into their opaque `H::HostFiberToken` without making
  `fast-react-host-config` depend on the reconciler.
- Do not invalidate creation tokens in this slice. Token invalidation belongs
  to deletion/unmount commit work.
- Do not use commit or deletion token phases here.

Flags and WIP topology:

- The root child mounted under an existing HostRoot current should receive
  placement metadata for later commit.
- Descendants under a newly placed HostComponent do not need individual
  placement flags for initial mount; complete work appends them to the
  detached parent instance and the later parent placement inserts the subtree.
- If `finalize_initial_children` returns `CommitMount`, mark the HostComponent
  with `FiberFlags::UPDATE`; do not call `commit_mount`.
- Mark `ContentReset` only for the React shape where a current HostComponent
  had a text-content shortcut and the WIP no longer does.
- Ref lifecycle and passive effects should remain reserved for the ref/passive
  worker. If a future worker sets a generic `REF` flag, tests must not claim
  ref attach/detach behavior.

## Tests For The Future Source Slice

Focused Rust tests should be added under the reconciler crate:

- `cargo test -p fast-react-reconciler --all-features begin_work`
- `cargo test -p fast-react-reconciler --all-features complete_work`
- `cargo test -p fast-react-reconciler --all-features host_children`
- `cargo test -p fast-react-reconciler --all-features host_context`
- `cargo test -p fast-react-reconciler --all-features host_nodes`
- `cargo test -p fast-react-reconciler --all-features host_tokens`
- `cargo test -p fast-react-reconciler --all-features root_work_loop`

Test scenarios:

- HostRoot render record with a host element creates a HostComponent WIP child
  and leaves current HostRoot and `root.current` unchanged.
- Unsupported root child kinds fail as typed reconciler errors before any host
  creation.
- HostComponent begin work calls `should_set_text_content`; a direct
  text-content result produces no HostText child.
- Non-shortcut text children create HostText WIP fibers; HostText begin work
  returns no child.
- HostComponent complete work calls `root_host_context` /
  `child_host_context`, `create_instance`, `append_initial_child`, and
  `finalize_initial_children` in a deterministic order for detached nodes.
- HostText complete work calls `create_text_instance` with root container and
  current host context.
- Created host instance/text handles are stored in `state_node` and can be
  retrieved from the host node store by fiber tag.
- Creation tokens carry the right phase/target, and wrong phase/target
  materialization or validation fails closed.
- `append_initial_child` traverses terminal HostComponent/HostText children
  but skips unsupported portal/singleton/hydration/resource tags with typed
  errors in this slice.
- `finalize_initial_children == CommitMount` marks `UPDATE` without invoking
  any commit hook.
- `bubble_properties` writes expected `child_lanes` and `subtree_flags`.
- Operation logs prove no `append_child_to_container`, `append_child`,
  `insert_before`, `remove_child`, `clear_container`,
  `prepare_for_commit`, `reset_after_commit`, `commit_update`,
  `commit_text_update`, `detach_deleted_instance`, or `root.current` switch
  occurs during this slice.

Regression gates after implementation:

```sh
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features begin_work
cargo test -p fast-react-reconciler --all-features complete_work
cargo test -p fast-react-reconciler --all-features host_children
cargo test -p fast-react-reconciler --all-features host_context
cargo test -p fast-react-reconciler --all-features host_nodes
cargo test -p fast-react-reconciler --all-features host_tokens
cargo test -p fast-react-reconciler --all-features root_work_loop
cargo test -p fast-react-reconciler --all-features work_in_progress
cargo test -p fast-react-reconciler --all-features update_queue
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
```

No JS, DOM, conformance, smoke, or test-renderer-root tests are required for
this generic reconciler slice unless the future implementation deliberately
touches those layers, which it should avoid.

## Conflict Boundaries

- Worker 129 owns HostRoot render-phase processing, scheduler callback
  identity validation, and writing HostRoot memoized state. This slice should
  consume its record and must not reprocess queues independently.
- Worker 130 / future commit work owns root commit, mutation traversal,
  `root.current` switch, container append/insert/remove/clear, text update,
  deletion cleanup, and commit phase ordering.
- Worker 131 owns sync flush and act integration. This slice should be
  invocable by that work later but should not implement public or cross-root
  flushing.
- Worker 133 owns test-renderer root canaries. This slice can use reconciler
  fake hosts in unit tests but should not add public test-renderer roots or
  serialization.
- Worker 134 and DOM-host workers own owner-document, namespace, attributes,
  styles, `dangerouslySetInnerHTML`, update payload diffing, DOM text APIs,
  node maps, events, hydration, resources, singletons, and form behavior.
- Worker 135 owns React DOM root facade bridging and public package entrypoint
  changes.
- Worker 136 owns function component and hooks. Non-host component tags should
  fail closed here.
- Worker 139 owns passive effects and ref lifecycle. This slice should not
  claim ref attach/detach or passive behavior.

## Risks Or Blockers

- Worker 129 is not present in this worktree as source yet. The host slice
  should wait for its `root_work_loop`/render-record shape before finalizing
  function signatures.
- `RootElementHandle` is only an opaque number today. A host render source is
  required before HostRoot children can become HostComponent/HostText fibers.
- `HostFiberTokenStore` has metadata but no materialization path into
  `H::HostFiberToken`; this must be solved before any host creation call.
- `StateNodeHandle` can store opaque host node slots, but the reconciler needs
  a host node store to own actual `H::Instance` and `H::TextInstance` values.
- Borrowing parent and child host nodes from the same store is the likely
  implementation sharp edge; solve it with store helper methods instead of
  adding clone requirements to host types.
- The first slice should stay mount-first. Host update payloads, text update
  commits, and deletion cleanup need commit and DOM/test-renderer follow-up
  workers.

## Recommended Next Tasks

1. After worker 129 lands, implement the reconciler-private host render source,
   host context stack, host node store, and token materialization helper.
2. Add HostComponent/HostText begin and complete work against the fake
   reconciler host, proving detached creation and no commit/container mutation.
3. Follow with a minimal commit worker that consumes the `state_node` handles
   and placement/update flags produced by this slice.
4. Only after generic reconciler tests pass, wire the test-renderer canary and
   then the DOM adapter as separate consumers.

## Commands Run

Tool actions:

- `create_goal`
- `get_goal`
- `update_plan`

Shell commands:

```sh
ls worker-progress/worker-132-host-complete-work-refresh.md 2>/dev/null || true
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '261,620p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,260p' worker-progress/worker-091-dom-mutation-minimum-plan.md
sed -n '261,620p' worker-progress/worker-091-dom-mutation-minimum-plan.md
sed -n '1,320p' worker-progress/worker-110-dom-text-content-host-plan.md
sed -n '321,760p' worker-progress/worker-110-dom-text-content-host-plan.md
sed -n '1,320p' worker-progress/worker-117-root-render-implementation-sequencing-plan.md
sed -n '321,920p' worker-progress/worker-117-root-render-implementation-sequencing-plan.md
sed -n '1,360p' worker-progress/worker-128-reconciler-root-scheduler-foundation.md
sed -n '1,260p' docs/tasks/worker-129-host-root-render-phase-foundation.prompt.md
rg -n "function updateHostRoot|function updateHostComponent|function updateHostText|case HostRoot|case HostComponent|case HostText|shouldSetTextContent|markRef|pushHostContext|reconcileChildren" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js
rg -n "function completeWork|case HostRoot|case HostComponent|case HostText|appendAllChildren|createInstance|createTextInstance|finalizeInitialChildren|prepareUpdate|markUpdate|markRef|bubbleProperties|popHostContext|ContentReset|Update" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCompleteWork.js
sed -n '330,375p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js
sed -n '1780,2025p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js
sed -n '2050,2080p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js
sed -n '180,250p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCompleteWork.js
sed -n '240,345p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCompleteWork.js
sed -n '430,480p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCompleteWork.js
sed -n '650,690p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCompleteWork.js
sed -n '1080,1165p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCompleteWork.js
sed -n '1330,1485p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCompleteWork.js
rg --files crates/fast-react-core/src crates/fast-react-reconciler/src crates/fast-react-host-config/src crates/fast-react-test-renderer/src packages/react-dom | sed -n '1,260p'
sed -n '1,260p' crates/fast-react-core/src/fiber.rs
sed -n '260,620p' crates/fast-react-core/src/fiber.rs
sed -n '1,280p' crates/fast-react-core/src/fiber_arena.rs
sed -n '280,680p' crates/fast-react-core/src/fiber_arena.rs
sed -n '1,420p' crates/fast-react-core/src/fiber_bubbling.rs
sed -n '1,320p' crates/fast-react-core/src/fiber_alternate.rs
sed -n '1,280p' crates/fast-react-core/src/fiber_handles.rs
sed -n '1,260p' crates/fast-react-core/src/fiber_flags.rs
sed -n '1,300p' crates/fast-react-core/src/element.rs
sed -n '1,260p' crates/fast-react-core/src/lib.rs
sed -n '1,320p' crates/fast-react-reconciler/src/work_in_progress.rs
sed -n '1,360p' crates/fast-react-reconciler/src/fiber_root.rs
sed -n '360,820p' crates/fast-react-reconciler/src/fiber_root.rs
sed -n '1,360p' crates/fast-react-reconciler/src/fiber_store.rs
sed -n '1,360p' crates/fast-react-reconciler/src/host_tokens.rs
sed -n '1,420p' crates/fast-react-reconciler/src/update_queue.rs
sed -n '420,900p' crates/fast-react-reconciler/src/update_queue.rs
sed -n '1,360p' crates/fast-react-reconciler/src/root_updates.rs
sed -n '1,420p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '420,900p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1,260p' crates/fast-react-reconciler/src/root_config.rs
sed -n '1,360p' crates/fast-react-reconciler/src/lib.rs
rg -n "pub trait HostTypes|HostFiberToken|HostFiberTokenRef|HostCreation|HostCommit|MutationHost|MutationRenderer|should_set_text_content|create_instance|create_text_instance|append_initial_child|finalize_initial_children|commit_update|commit_text_update|detach_deleted_instance|InitialChildrenFinalization|HostFiberTokenPhase|HostFiberTokenTarget" crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-host-config/src/lib.rs
sed -n '260,620p' crates/fast-react-host-config/src/lib.rs
sed -n '620,1040p' crates/fast-react-host-config/src/lib.rs
sed -n '1000,1135p' crates/fast-react-host-config/src/lib.rs
sed -n '1180,1350p' crates/fast-react-host-config/src/lib.rs
sed -n '1,520p' crates/fast-react-reconciler/src/test_support.rs
git diff --check
git diff --check --no-index /dev/null worker-progress/worker-132-host-complete-work-refresh.md >/tmp/worker132-noindex-diff-check.out 2>&1; rc=$?; cat /tmp/worker132-noindex-diff-check.out; if [ "$rc" -eq 0 ] || [ "$rc" -eq 1 ]; then exit 0; else exit "$rc"; fi
allowed='^worker-progress/worker-132-host-complete-work-refresh\.md$'
files=$( { git diff --name-only; git ls-files --others --exclude-standard; } | grep -v '^\.worker-logs/' || true )
printf '%s\n' "$files" | sed '/^$/d'
bad=$(printf '%s\n' "$files" | sed '/^$/d' | grep -Ev "$allowed" || true)
if [ -n "$bad" ]; then printf 'Unexpected changed paths:\n%s\n' "$bad"; exit 1; fi
git status --short --untracked-files=all
```

Note: an initial no-index diff-check command used `status` as a shell variable
and failed because the active shell treats that name as read-only; it was
rerun with `rc` and passed.

## Verification Results

Final report-only checks:

- `git diff --check` passed.
- `git diff --check --no-index /dev/null
  worker-progress/worker-132-host-complete-work-refresh.md` passed with the
  expected no-index diff status normalized to success.
- Scoped changed-path check passed for only
  `worker-progress/worker-132-host-complete-work-refresh.md`, excluding the
  worker runtime log path `.worker-logs/`.
- `git status --short --untracked-files=all` showed:
  - `?? .worker-logs/worker-132-host-complete-work-refresh.log`
  - `?? worker-progress/worker-132-host-complete-work-refresh.md`

The `.worker-logs/` file is outside this worker's report scope and was left
untouched.

## Changed Files

- `worker-progress/worker-132-host-complete-work-refresh.md`
