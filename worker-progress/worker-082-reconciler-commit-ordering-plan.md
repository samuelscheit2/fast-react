# worker-082-reconciler-commit-ordering-plan

## Objective

Produce a report-only implementation plan for commit ordering, host mutation
phase calls, and `root.current` switching.

Write scope honored: only
`worker-progress/worker-082-reconciler-commit-ordering-plan.md` was written.
No Rust, JavaScript, package, conformance, or source test implementation was
added.

## Summary

Fast React should implement commit as an explicit root phase machine:

1. Finish render into a `finishedWork` tree without mutating mounted host
   containers.
2. Prepare pending commit state on the root.
3. Run before-mutation effects, bracketed by host `prepare_for_commit` state.
4. Run mutation effects, including host insert/remove/update calls, deletion
   effects, layout and ref detaches, insertion effects, text resets, visibility
   changes, and deleted-instance detach.
5. Call host `reset_after_commit` only after mutation work is complete.
6. Switch `root.current = finishedWork` after mutation and before layout.
7. Run layout work, callbacks, and ref attaches against the new current tree.
8. Schedule passive work after layout; flush passive unmounts before passive
   mounts in a later passive phase.

The root cause to avoid is a shortcut that commits host operations from
`root.render`, from update queue processing, or from a renderer-owned direct
tree mutation API. Commit ordering belongs to the shared reconciler. Renderer
adapters own host storage and platform rules only after the reconciler calls
their phase-scoped host traits.

The in-memory test renderer should be the first operation-order canary. It is
generic, mutation-only, and already validates single-parent moves, missing
target errors, deletion detach, snapshots, and structured host operation
errors. Because worker 051 added token-aware host-config lifecycle signatures,
the first canary-enabling implementation slice must migrate the test renderer
and reconciler test skeletons to pass `HostFiberTokenRef` values before adding
commit-order assertions.

This report does not claim DOM behavior compatibility. React DOM evidence is
used only to validate generic reconciler ordering. DOM selection restore,
focus, property diffing, event maps, resources, hydration, singletons, forms,
and security-sensitive writes remain DOM adapter work.

## Evidence Gathered

Required merged reports:

- `worker-progress/worker-018-test-renderer-mutation-host.md`: the test
  renderer is a canonical mutation host with opaque handles, snapshots,
  append/insert/remove/clear operations, update/text/reset/visibility hooks,
  deletion detachment, and single-parent move behavior. It is not a
  reconciler.
- `worker-progress/worker-019-reconciler-host-boundary-migration.md`: the
  reconciler exposes a `MutationRenderer`-bounded placeholder and validates the
  mutation capability, but it has no real fiber tree, root model, or commit
  traversal yet.
- `worker-progress/worker-022-host-operation-errors.md`: unsupported host
  capabilities and ordinary renderer operation failures are separate structured
  errors. Future commit code should propagate `HostResult` with `?`, not panic
  or collapse host failures into generic reconciler placeholders.
- `worker-progress/worker-071-core-fiber-flags-effect-plan.md`: React 19.2.6
  commit metadata requires fiber `flags`, `subtreeFlags`, parent-owned
  deletions, phase masks, and per-fiber hook effect rings. It explicitly
  rejects a global effect list.
- `worker-progress/worker-072-reconciler-root-work-loop-plan.md`: real roots
  need lane scheduling, HostRoot updates, work-in-progress fibers, complete
  work, commit phases, a stronger real-root host aggregate, and test-renderer
  integration before DOM roots depend on the path.
- `worker-progress/worker-073-test-renderer-update-model-plan.md`:
  test-renderer create/update/unmount must route through shared reconciler
  root semantics. The test renderer should validate host operation ordering
  but must not own a parallel scheduler or direct update queue.

Additional local evidence:

- `worker-progress/worker-051-dom-host-token-boundary.md` documents the merged
  token-aware host-config break. Current `fast-react-host-config` requires
  `HostFiberTokenRef` for host creation, `commit_mount`, `commit_update`, and
  `detach_deleted_instance`; current test-renderer and reconciler skeletons
  still show pre-token method shapes and are listed as follow-up migrations.
- `crates/fast-react-host-config/src/lib.rs` currently defines
  `HostCreation`, `HostCommit`, `MutationHost`, `HostScheduling`,
  `HostFiberTokenRef`, `HostError`, and `HostOperationError`.
- `crates/fast-react-reconciler/src/lib.rs` remains a placeholder with
  `validate_mutation_renderer_boundary`, `render_mutation_placeholder`, and no
  root or commit module.
- `crates/fast-react-test-renderer/src/lib.rs` contains useful mutation-host
  storage and tests, but it has no operation log and no reconciler-driven root.

Exact package probes:

- `npm view react-dom@19.2.6 dist.tarball dist.integrity --json`
- `npm view react-test-renderer@19.2.6 dist.tarball dist.integrity --json`
- The React DOM 19.2.6 development bundle shows `commitRoot` first drains
  pending effects, records pending finished work, runs before-mutation work,
  sets `PENDING_MUTATION_PHASE`, flushes mutation effects, then assigns
  `root.current = finishedWork` before the layout phase.
- The same bundle shows mutation traversal processes parent-owned deletions,
  calls ref detaches during mutation/deletion work, performs host removals, and
  later calls `detachDeletedInstance` during after-effects cleanup.
- The React test renderer 19.2.6 bundle creates a reconciler container and
  implements public `update` and `unmount` by calling `updateContainer`, not by
  directly mutating host storage.

Nested-agent hypothesis checks:

- Spawned one read-only explorer to cross-check commit phase ordering and
  React/Fast React assumptions. It had not returned by initial drafting, so no
  conclusions from it were used before the first report draft.
- Spawned one read-only explorer to inspect current Fast React host-config,
  reconciler, test-renderer APIs, and standard report checks. It had not
  returned by initial drafting, so no conclusions from it were used before the
  first report draft.

Did not read `ORCHESTRATOR.md`.

## Commit Order Contract

### 1. Preconditions

`commit_root` should only run with:

- a root whose `finished_work` is not `root.current`;
- render lanes and remaining lanes recorded on pending commit state;
- no active render or commit execution context;
- pending passive effects from older commits flushed when React would flush
  them before new work;
- a finished tree whose `flags`, `subtree_flags`, and parent-owned
  `deletions` are complete.

The commit path must not yield. Concurrent rendering may yield between fiber
units, but the commit phase is atomic.

### 2. Before-Mutation

Before-mutation work should run before any mounted host mutation.

Required work:

- set commit execution context and the discrete/current commit priority;
- call host `prepare_for_commit(container)` once for the root and retain the
  returned `CommitState`;
- run snapshot-style effects and before-mutation phase traversals using the
  `BeforeMutationMask`;
- visit parent-owned deletion lists only for before-mutation work that belongs
  in this phase;
- keep `root.current` pointing at the old current tree.

Do not perform append, insert, remove, text update, visibility, ref attach, or
layout create work in this phase.

### 3. Mutation

Mutation work should apply all host tree changes and cleanup that must happen
before the new tree is current.

Required work:

- traverse by `MutationMask`, skipping clean subtrees with `subtree_flags`;
- process each fiber's parent-owned `deletions` before normal child traversal
  where React's mutation traversal requires it;
- detach refs for updated/deleted fibers during mutation before layout ref
  attach can run;
- run layout effect destroys for function-like fibers before layout creates;
- run insertion-effect unmount/mount work in the mutation partition;
- apply placement by resolving the nearest host parent and stable host sibling;
- call `append_child`, `append_child_to_container`, `insert_before`, or
  `insert_in_container_before` only for mounted tree placement;
- call `remove_child` or `remove_child_from_container` while processing
  deletions and unmounts;
- call `commit_update` for host instance updates with a commit-phase
  `HostFiberTokenRef`;
- call `commit_text_update` for host text changes;
- call `reset_text_content` for `ContentReset`;
- call `hide_instance`, `unhide_instance`, `hide_text_instance`, or
  `unhide_text_instance` for visibility changes;
- call `reset_form_instance` only when the forms capability and data model are
  present; otherwise fail closed as unsupported;
- call `detach_deleted_instance` with a deletion-phase `HostFiberTokenRef`
  after deleted host subtree cleanup reaches the detach point;
- preserve `HostResult` errors as `ReconcilerError::HostOperation` or
  `UnsupportedHostCapability`.

Mounted tree mutation calls must not happen during complete work. Complete work
may create detached instances/text and call `append_initial_child` only for
detached initial children.

### 4. Host Reset

Host `reset_after_commit(container, commit_state)` should run after mutation
work is finished and before layout effects can observe the new current tree.
It must run with the same container and commit state produced by
`prepare_for_commit`.

If a host mutation operation fails, the first implementation should fail the
commit with a structured reconciler error and should not silently run layout or
passive work for a partially committed root. Later recovery policy can be
expanded after root error handling exists.

### 5. Root Current Switch

`root.current = finishedWork` must happen after mutation and host reset, and
before layout.

This switch point is non-negotiable:

- before it, old refs and layout observations still refer to the old tree;
- host mutations have already changed the mounted host tree;
- after it, layout effects, class lifecycles/callbacks, and ref attaches
  observe the finished tree as current;
- passive scheduling can use finished-tree metadata without changing current.

No render or update queue processing should mutate `root.current`.

### 6. Layout

Layout work should run only after the root switch.

Required work:

- traverse by `LayoutMask`, skipping clean subtrees;
- run class lifecycles, callbacks, and layout effect creates;
- attach refs for fibers whose `Ref` flag survives into layout;
- call `commit_mount` for host instances whose `finalize_initial_children`
  requested a follow-up mount hook;
- report recoverable/caught errors through the future root error callback
  policy without treating host operation errors as React boundary captures;
- collect or mark passive work for later scheduling, but do not run passive
  mounts during layout.

### 7. Passive Scheduling And Flush

Passive work is not part of the synchronous mutation/layout commit.

Required work:

- after layout, set root pending passive state when the finished tree has
  `PassiveMask` work or deleted subtrees with passive effects;
- schedule passive flush through the root scheduler or a deterministic test
  hook until the scheduler bridge lands;
- flush passive unmounts before passive mounts;
- traverse deleted subtrees parent-to-child for passive unmounts;
- detach alternate sibling links and after-effects fields only after passive
  deleted-subtree traversal no longer needs them;
- keep updates scheduled during passive flush phase-safe and routed through
  root scheduling.

## Host Mutation Call Map

| Fiber condition | Commit phase | Host calls |
| --- | --- | --- |
| Root has any mutation/before-mutation work | Before mutation | `prepare_for_commit(container)` |
| New detached host instance/text during complete work | Render complete | `create_instance`, `create_text_instance`, `append_initial_child`, `finalize_initial_children`; no mounted tree mutation |
| `Placement` under host instance | Mutation | `append_child` or `insert_before` |
| `Placement` under host root/container/portal | Mutation | `append_child_to_container` or `insert_in_container_before` |
| Host instance `Update` | Mutation | `commit_update` with commit-phase token |
| Host text `Update` | Mutation | `commit_text_update` |
| `ContentReset` | Mutation | `reset_text_content` |
| `Visibility` | Mutation | hide/unhide instance or text hooks |
| Parent `ChildDeletion` | Mutation | deletion traversal, ref detach, host remove calls, `detach_deleted_instance` with deletion-phase token |
| `Ref` on changed/deleted fiber | Mutation | detach old ref |
| Mutation work finished | Between mutation and current switch | `reset_after_commit(container, commit_state)` |
| `root.current` switch | Between mutation and layout | no host call; assign current pointer |
| `Ref` on mounted/updated fiber | Layout | attach new ref after current switch |
| `CommitMount` finalization | Layout | `commit_mount` with commit-phase token |
| `Passive` on current/deleted tree | Deferred passive | no host mutation by default; run passive destroy/create callbacks through effect storage |

## Test Renderer Canary Plan

Use the test renderer before DOM for operation-order tests because it avoids
DOM-specific behavior while exercising the canonical mutation boundary.

First canary-enabling slice:

- migrate `fast-react-test-renderer` to `HostTypes::HostFiberToken` and the
  token-aware `HostCreation` and `HostCommit` signatures;
- migrate reconciler test hosts in `fast-react-reconciler` to the same token
  API;
- add an optional operation log to `TestRenderer` that records method names,
  handle categories, token phase/target, and coarse parent/child operation
  order without exposing raw storage indexes;
- keep existing snapshots and structured host operation errors;
- verify existing direct host-operation tests still pass after token migration.

First commit-order canary tests:

- `prepare_for_commit` occurs before any mounted tree mutation and exactly once
  per committing root.
- All placement/update/delete operations occur before `reset_after_commit`.
- `reset_after_commit` occurs before `root.current` switches.
- `root.current` switches before layout callbacks, `commit_mount`, and ref
  attach events in the log.
- Ref detach events happen in mutation before host removal for deleted/updated
  refs, while ref attach events happen in layout.
- Deletion traversal removes host children and calls `detach_deleted_instance`
  after deleted host subtree cleanup.
- Passive scheduling is recorded after layout, and passive flush logs unmounts
  before mounts.
- Missing insertion/removal targets still return structured `HostOperation`
  errors before detaching the moving child.

The canary should assert generic ordering only. It must not assert DOM focus,
selection restoration, event listener installation, attribute/property/style
serialization, hydration marker behavior, resource hoisting, singleton
semantics, or form control behavior.

## Implementation Slices

### 1. Token-aware test renderer migration

Write scope:

- `crates/fast-react-test-renderer/**`
- `crates/fast-react-reconciler/src/lib.rs` test skeletons if needed for
  compile-only migration
- `worker-progress/worker-test-renderer-host-token-migration.md`

Task:

- Add test-renderer `HostFiberToken` storage or a minimal opaque token type.
- Update `create_instance`, `create_text_instance`, `commit_mount`,
  `commit_update`, and `detach_deleted_instance` to accept and validate token
  phase/target.
- Update direct host-operation tests and helper constructors to pass
  phase-correct `HostFiberTokenRef` values.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo test -p fast-react-reconciler --all-features` if the skeleton is
  touched
- targeted clippy for touched crates with warnings denied
- scoped `git diff --check`

### 2. Reconciler commit state and phase log skeleton

Write scope:

- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/commit_log.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-commit-state-phase-log.md`

Task:

- Add pending commit state fields: root, finished work, lanes, remaining lanes,
  commit status, commit state, and pending passive markers.
- Implement phase functions that traverse synthetic trees by masks and record
  phase events without calling user callbacks.
- Enforce the phase order and `root.current` switch point with synthetic root
  fixtures.

Verification:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features commit`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- tests for before-mutation, mutation, reset, current switch, layout, and
  passive scheduling order.

### 3. Host parent and sibling resolution

Write scope:

- `crates/fast-react-reconciler/src/host_parent.rs`
- `crates/fast-react-reconciler/src/commit_mutation.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-reconciler-host-parent-sibling-plan.md`

Task:

- Implement nearest host parent lookup for host roots, host instances, and
  portals.
- Implement stable host sibling lookup that skips newly placed fibers and
  unsupported/non-host nodes.
- Add typed unsupported errors for unimplemented tags instead of appending
  blindly.

Verification:

- focused reconciler unit tests over synthetic fiber trees;
- no DOM types in public reconciler APIs;
- targeted clippy and scoped diff checks.

### 4. Mutation host effect calls

Write scope:

- `crates/fast-react-reconciler/src/commit_mutation.rs`
- `crates/fast-react-reconciler/src/host_effects.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-test-renderer/**` only for operation-log canary support
- `worker-progress/worker-reconciler-mutation-host-calls.md`

Task:

- Map `Placement`, `Update`, `ChildDeletion`, `ContentReset`, `Visibility`,
  and `CommitMount` metadata to canonical host calls.
- Use token phases `Commit` and `Deletion` where the host-config boundary
  requires them.
- Propagate `HostResult` into `ReconcilerError` without panics.
- Use the test renderer operation log as the first canary for call order.

Verification:

- reconciler operation-order tests with the logging test renderer;
- focused test-renderer tests if logging support changes;
- targeted clippy and scoped diff checks.

### 5. Ref detach and attach data flow

Write scope:

- `crates/fast-react-reconciler/src/refs.rs`
- `crates/fast-react-reconciler/src/commit_mutation.rs`
- `crates/fast-react-reconciler/src/commit_layout.rs`
- `worker-progress/worker-reconciler-ref-commit-order.md`

Task:

- Store ref metadata as opaque handles on fibers.
- Detach refs during mutation for deleted fibers and changed refs.
- Attach refs during layout after `root.current` switches.
- Keep JS callback invocation behind a rooting/lifetime boundary; Rust tests
  can use fake ref handles and logs first.

Verification:

- tests proving detach-before-remove for deletions and attach-after-current for
  mounts/updates;
- tests proving changed refs detach old before attaching new;
- no raw JS callback storage without a rooting policy.

### 6. Deletion traversal and detach cleanup

Write scope:

- `crates/fast-react-reconciler/src/deletions.rs`
- `crates/fast-react-reconciler/src/commit_mutation.rs`
- `crates/fast-react-reconciler/src/commit_passive.rs`
- `worker-progress/worker-reconciler-deletion-detach-order.md`

Task:

- Process parent-owned deletion arrays in commit phases.
- Run mutation deletion cleanup and host removals in the mutation phase.
- Call `detach_deleted_instance` for deleted host instances at the after
  mutation/deletion cleanup point with deletion-phase tokens.
- Keep alternate/fiber field detachment late enough for passive deleted-tree
  traversal to run correctly.

Verification:

- test-renderer canary logs for nested deleted subtree order;
- tests proving deleted instance snapshots are marked detached and children are
  cleared by the host;
- tests for passive deleted-subtree unmount order.

### 7. Layout, callbacks, commit mount, and passive scheduling

Write scope:

- `crates/fast-react-reconciler/src/commit_layout.rs`
- `crates/fast-react-reconciler/src/commit_passive.rs`
- `crates/fast-react-reconciler/src/effects.rs`
- `worker-progress/worker-reconciler-layout-passive-order.md`

Task:

- Run layout effects, callbacks, `commit_mount`, and ref attaches only after
  `root.current` switches.
- Record pending passive unmount/mount work after layout and schedule it
  through a scheduler hook or deterministic test queue.
- Flush passive unmounts before passive mounts; deleted subtrees traverse
  parent-to-child for passive unmounts.

Verification:

- tests for layout-after-current and passive-deferred behavior;
- tests that passive work scheduled during commit does not run inside mutation
  or layout;
- tests for updates scheduled during passive flush routing through the root
  scheduler.

### 8. Integration with root scheduler and update queues

Write scope:

- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/work_loop.rs`
- `worker-progress/worker-reconciler-commit-scheduler-integration.md`

Task:

- Wire commit completion to mark lanes finished, reschedule remaining work, and
  flush/schedule passive effects according to root scheduler policy.
- Ensure `root.render`, `root.unmount`, and future `flushSync` paths enqueue
  updates and schedule work rather than calling host mutations directly.

Verification:

- fake scheduler tests for commit completion, passive scheduling, sync flush,
  and no render/commit reentrancy;
- test-renderer root integration tests before DOM root implementation depends
  on the path.

## Verification Strategy

For this report-only task, source tests were not run. Standard report checks
are sufficient:

- scoped status shows only
  `worker-progress/worker-082-reconciler-commit-ordering-plan.md` changed;
- no concrete local path leaks in the report;
- no trailing whitespace in the report;
- no-index diff whitespace check covers the new untracked report file;
- prompt keyword checks cover before-mutation, mutation, `root.current`,
  layout, passive scheduling, deletion detach, ref detach/attach, host
  prepare/reset, and test renderer canary requirements.

Future implementation verification should start with operation-order unit
tests against the test renderer and synthetic roots before any DOM adapter
claims. DOM conformance tests should wait until DOM-specific renderer work
lands behind the same generic commit path.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan keeps commit ordering in the reconciler and host storage in
  renderers.
- It covers all requested phases and explicitly accounts for the merged
  host-token boundary.
- It rejects direct root-object mutation and renderer-owned update shortcuts.

Maintainability:

- Commit phase modules are split by before-mutation/mutation/layout/passive
  responsibilities.
- The test renderer remains a generic canary and does not grow DOM behavior.
- Host operation errors stay structured and renderer-neutral.

Performance:

- Commit traversal should stay mask-driven over `flags` and `subtree_flags`.
- The operation log should be test-only and must not become a production host
  operation queue.
- Host trait calls remain monomorphized for mutation renderers unless evidence
  later justifies dynamic dispatch.

Security:

- Host values, tokens, refs, and callbacks remain opaque.
- JS callback refs, layout/passive callbacks, and root error callbacks need an
  explicit rooting/lifetime model before native bindings invoke user code.
- DOM security-sensitive behavior remains outside this report.
- Deleted host/fiber tokens must be invalidated so stale public instance,
  event, hydration, or diagnostic maps cannot outlive deletion cleanup.

## Commands Run

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,240p' worker-progress/worker-018-test-renderer-mutation-host.md
sed -n '1,240p' worker-progress/worker-019-reconciler-host-boundary-migration.md
sed -n '1,240p' worker-progress/worker-022-host-operation-errors.md
sed -n '1,260p' worker-progress/worker-071-core-fiber-flags-effect-plan.md
sed -n '1,260p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,260p' worker-progress/worker-073-test-renderer-update-model-plan.md
sed -n '261,620p' worker-progress/worker-071-core-fiber-flags-effect-plan.md
sed -n '621,760p' worker-progress/worker-071-core-fiber-flags-effect-plan.md
sed -n '261,620p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '621,920p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '261,620p' MASTER_PLAN.md
sed -n '261,620p' MASTER_PROGRESS.md
sed -n '1,240p' worker-progress/worker-051-dom-host-token-boundary.md
sed -n '1,220p' docs/tasks/worker-082-reconciler-commit-ordering-plan.prompt.md
sed -n '1,220p' worker-progress/README.md
sed -n '1,260p' crates/fast-react-host-config/src/lib.rs
sed -n '261,620p' crates/fast-react-host-config/src/lib.rs
sed -n '621,1040p' crates/fast-react-host-config/src/lib.rs
sed -n '980,1160p' crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
sed -n '240,340p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,320p' crates/fast-react-test-renderer/src/lib.rs
sed -n '321,760p' crates/fast-react-test-renderer/src/lib.rs
sed -n '761,1120p' crates/fast-react-test-renderer/src/lib.rs
rg -n "fn create_instance|fn create_text_instance|struct HostFiberTokenRef|HostFiberToken" crates/fast-react-host-config/src/lib.rs crates/fast-react-test-renderer/src/lib.rs crates/fast-react-reconciler/src/lib.rs
rg -n "root\\.current|commitBeforeMutationEffects|commitMutationEffects|commitLayoutEffects|flushPassiveEffects|prepareForCommit|resetAfterCommit|detachDeletedInstance|safelyDetachRef|safelyAttachRef|commitDeletionEffects|commitPassiveUnmountEffects" . -g '!ORCHESTRATOR.md' -g '!target/**' -g '!node_modules/**'
rg -n "worker-082|commit ordering|root.current|host mutation|before-mutation|passive scheduling|deletion detach|ref detach|ref attach|prepare/reset" docs worker-progress MASTER_PLAN.md MASTER_PROGRESS.md -g '!ORCHESTRATOR.md'
npm view react-dom@19.2.6 dist.tarball dist.integrity --json
npm view react-test-renderer@19.2.6 dist.tarball dist.integrity --json
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | rg -n "root\\.current = finishedWork|commitBeforeMutationEffects|commitMutationEffects|commitLayoutEffects|flushPassiveEffects|prepareForCommit|resetAfterCommit|commitRoot\\(|safelyDetachRef|safelyAttachRef|detachDeletedInstance|commitDeletionEffects|commitPassiveUnmountEffects"
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/cjs/react-test-renderer.development.js | rg -n "root\\.current = finishedWork|commitBeforeMutationEffects|commitMutationEffects|commitLayoutEffects|flushPassiveEffects|prepareForCommit|resetAfterCommit|commitRoot\\(|detachDeletedInstance|commitDeletionEffects|commitPassiveUnmountEffects|updateContainer|createContainer"
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | sed -n '17820,17905p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | sed -n '17900,18115p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | sed -n '14200,14310p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | sed -n '14540,14660p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-client.development.js | sed -n '16070,16320p'
git status --short --untracked-files=all
```

Nested-agent commands:

```sh
create_goal
spawn_agent
create_goal
create_goal
spawn_agent
create_goal
wait_agent
```

No source tests were run because this was a report-only task.

## Changed Files

- `worker-progress/worker-082-reconciler-commit-ordering-plan.md`

## Risks Or Blockers

- Worker 051's token-aware host-config change intentionally leaves
  test-renderer and reconciler skeleton migration as follow-up work. Operation
  canary tests should start with that migration.
- No root model, fiber arena, update queue, complete work, or real commit
  module exists in `fast-react-reconciler` yet.
- Root lane bookkeeping and scheduler/act workers are active or recently
  merged in separate worktrees; commit integration should consume their merged
  APIs rather than invent duplicate scheduling behavior.
- Ref callbacks, effect callbacks, class callbacks, and root error callbacks
  need a JS rooting/lifetime policy before real user code can run.
- Host mutation errors during commit need a first explicit fail-closed policy
  until full error recovery exists.
- Passive deleted-subtree cleanup must keep enough fiber/alternate metadata
  alive until passive unmount traversal completes.
- DOM behavior compatibility remains unclaimed.

## Recommended Next Tasks

1. Migrate the test renderer and reconciler skeletons to the token-aware
   host-config lifecycle signatures.
2. Add a test-renderer operation log for generic host call ordering.
3. Implement a reconciler commit state skeleton that records phase events and
   enforces `root.current` switch timing on synthetic roots.
4. Add mutation host effect routing with the test renderer as the first canary.
5. Add ref detach/attach and deletion detach ordering tests before layout and
   passive effect callback execution.
6. Wire passive scheduling to the root scheduler only after the scheduler API
   is merged and stable.

## Completion Checklist

- [x] Called `create_goal` before research, file reads, implementation, or
      verification.
- [x] Read all required worker and progress files.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Used nested subagents to test hypotheses.
- [x] Modified only the worker 082 progress report.
- [x] Covered before-mutation ordering.
- [x] Covered mutation ordering and host mutation phase calls.
- [x] Covered `root.current` switch timing.
- [x] Covered layout ordering.
- [x] Covered passive scheduling and passive flush ordering.
- [x] Covered deletion detach.
- [x] Covered ref detach and attach.
- [x] Covered host `prepare_for_commit` and `reset_after_commit` ordering.
- [x] Used the test renderer as the first operation-order canary.
- [x] Avoided DOM behavior compatibility claims.
- [x] Verified report-only scope with standard report checks.
