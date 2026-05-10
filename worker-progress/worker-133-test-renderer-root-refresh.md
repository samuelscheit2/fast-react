# Worker 133: Test Renderer Root Canary Refresh

## Goal Evidence

- `create_goal` called first for objective: "Produce the report-only refresh for worker 133 in worker-progress/worker-133-test-renderer-root-refresh.md, with required inspections and validation while only modifying that file."
- `get_goal` returned status `active` for the same objective.
- Goal thread: `019e0f9e-3f8b-7f22-9714-6ad7669137e2`.

## Summary

This is a report-only refresh for sequencing the first reconciler-backed
test-renderer root canary. No source, tests, package files, lockfiles, or
master documents were changed.

The current repo is ready for a narrower canary than older plans assumed:
`fast-react-test-renderer` has already migrated to the token-aware host-config
trait surface, and the reconciler now has `FiberRootStore`, HostRoot current
fibers, HostRoot update queues, `update_container`,
`update_container_sync`, root scheduler list/callback bookkeeping, and
work-in-progress HostRoot helpers. It is not ready for a public
`react-test-renderer` compatibility claim because the reconciler still lacks
HostRoot render execution, host component/text complete work, minimal commit,
real sync flush, act routing, and committed-fiber inspection.

The first canary should therefore be a Rust-level `TestRendererRoot` facade
that owns a `TestRenderer` host, a `TestContainer`, and a reconciler
`FiberRootStore<TestRenderer>`. `create`, `update`, and `unmount` must enqueue
shared HostRoot updates and schedule shared root work. They must not append,
clear, replace, or inspect host storage directly. Host snapshots and operation
logs are diagnostic checks only after reconciler render/commit owns the work.

## Sequenced Canary

### Readiness Gate

Do not start the root canary as a standalone direct-host mutation feature. It
should wait for these prerequisites to be accepted or be explicitly scoped as
pending in tests:

- Worker 129 HostRoot render phase: process the pending HostRoot queue created
  by `update_container`, create/reuse a HostRoot work-in-progress fiber, write
  the selected `{element}` to WIP HostRoot state, preserve skipped lanes, and
  leave host storage untouched.
- Minimal commit work: commit a finished HostRoot tree through shared
  commit state, mark lanes finished, switch `root.current` only after host
  mutation/reset, abort before current switch on host errors, and keep
  structured `ReconcilerError::HostOperation` propagation.
- Host component/text complete work: reconcile the minimal host element/text
  shape, create detached test-renderer host instances/text with
  `HostFiberTokenRef`, bubble flags/subtree flags, and hand commit enough data
  for placement/update/text/deletion operations.
- Sync flush/act shell: only required for canary tests that expose
  `flush_sync` or act routing. Root create/update/unmount enqueue tests can
  land before public act compatibility, but they must not fake local flushing.

### Canary 1: Root Facade Over Shared Semantics

Purpose: prove test-renderer lifecycle methods use the same reconciler root
path as React DOM/native roots will use.

Future file scope:

- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/options.rs`
- `crates/fast-react-test-renderer/src/error.rs`
- `crates/fast-react-test-renderer/src/operation_log.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-test-renderer/Cargo.toml`
- matching worker progress report

Expected root shape:

- `TestRendererRoot` owns a raw `TestRenderer` host and a root-owned
  `TestContainer`.
- It owns or contains a `FiberRootStore<TestRenderer>` plus the current
  `FiberRootId`.
- It tracks lifecycle state and a generation token for future stale wrapper
  checks.
- It exposes read-only diagnostic snapshots/logs, not direct mutable host
  methods.
- It maps `TestRendererOptions` to reconciler `RootOptions` only for scoped
  test-renderer options: strict mode, React Native test-environment concurrent
  branch, and stored `create_node_mock`. Do not add React DOM-only public root
  options to this facade.

Required implementation behavior:

- `create(element, options)` creates the raw host and container, creates a
  shared reconciler client root, calls `update_container`, then calls
  `ensure_root_is_scheduled` on the returned schedule record. It must not call
  `append_child_to_container`, `clear_container`, or any snapshot-driven tree
  mutation.
- `update(element)` delegates to `update_container` on the same
  `FiberRootId`, schedules via the shared scheduler record, and ignores or
  returns a typed ignored result after unmount without resurrecting the root.
- `unmount()` delegates to `update_container_sync(root, RootElementHandle::NONE)`
  or the eventual shared unmount helper, schedules sync work, then invalidates
  wrapper access after enqueue. It must not implement unmount as
  `clear_container`.
- `flush_sync`, if included in this first canary, must call the shared
  reconciler flush-sync entry point. If that entry point is not merged, omit
  `flush_sync` from the first canary instead of draining host storage locally.

### Canary 2: Commit And Host Output Check

Purpose: once worker 129 plus minimal commit and host complete work can produce
finished host output, extend the canary from enqueue/schedule assertions to a
committed host tree assertion.

Tests should use a minimal fixture element handle or future element bridge that
renders one host component with one text child. The expected operation order is:

1. Host creation/complete work creates detached instance/text records.
2. Commit calls `prepare_for_commit`.
3. Mutation commit places host output via `append_child_to_container` or
   `append_child`.
4. Commit calls `reset_after_commit`.
5. `root.current` switches after host reset and before layout-style hooks.
6. Root-owned snapshot reads the committed host storage after commit only.

This stage should also prove that a failed host operation returns a structured
error and leaves `root.current` on the old tree.

### Canary 3: Serialization Gate

Do not combine the first root canary with `toJSON`, `toTree`, or public
`TestInstance`. Those APIs should wait for a committed-fiber inspection API.
The operation log and raw snapshots can cross-check commit order, but they are
not the public test-renderer output model.

## Tests To Add

Root enqueue and lifecycle tests:

- `root_create_enqueues_host_root_update_without_host_mutation`
- `root_update_reuses_same_fiber_root_and_shared_scheduler_record`
- `root_unmount_enqueues_sync_null_update_before_invalidation`
- `root_unmount_is_idempotent`
- `root_update_after_unmount_does_not_mutate_or_reschedule`
- `root_options_store_strict_mode_and_create_node_mock_without_invocation`

Scheduler/flush tests when shared APIs exist:

- `root_create_requests_root_schedule_microtask`
- `root_sync_unmount_marks_sync_work`
- `root_flush_sync_delegates_cross_root_flush`
- `root_flush_sync_refuses_render_or_commit_reentry`

Commit canary tests after commit and host complete work:

- `root_commit_places_simple_host_text_tree_through_mutation_host`
- `root_commit_operation_log_matches_prepare_mutation_reset_current_layout`
- `root_commit_host_error_aborts_before_current_switch`
- `root_commit_deletion_removes_then_detaches_host_instances`
- `root_commit_text_update_uses_commit_text_update_only`

Negative tests:

- no root facade method calls `append_child_to_container`,
  `insert_in_container_before`, `remove_child_from_container`, or
  `clear_container` directly;
- public/fiber `TestInstance` is not introduced in the root canary;
- `to_json` and `to_tree` remain absent or explicitly unsupported until
  committed-fiber inspection exists.

## Public API Limits

The first canary is a Rust crate canary, not a public JS package claim.

- Do not add `packages/react-test-renderer/**` in this slice.
- Do not change npm package manifests or smoke entrypoint tests.
- Do not claim compatibility with the checked React 19.2.6
  `react-test-renderer` oracles.
- Do not implement public warning strings, `react.test.json` branding,
  `toJSON`, `toTree`, `find*`, public `TestInstance`, `getInstance`, or
  `shallow` behavior.
- Do not expose `act` as a local synchronous drain. Public `act` is React-owned;
  renderer work should only route through shared reconciler act hooks after
  those hooks exist.
- Keep low-level host handles distinct from future public `TestInstance`
  wrappers. If naming is still ambiguous when this work starts, split or rename
  the low-level handle before exposing public wrapper-like APIs.

## Evidence Gathered

Project state:

- `MASTER_PLAN.md` lists worker 133 as report-only and keeps workers 130-139
  out of source files while worker 129 owns the HostRoot render-phase
  foundation.
- `MASTER_PROGRESS.md` records accepted workers 123, 124, and 128, so this
  refresh can rely on FiberRoot/HostRoot records, HostRoot update queues, and
  root scheduler foundation.
- `WORKER_BRIEF.md` requires recording goal evidence, keeping scope narrow,
  avoiding `ORCHESTRATOR.md`, and including handoff sections.

Prior plans:

- Worker 073 established the core boundary: test-renderer `create`, `update`,
  and `unmount` must call shared `updateContainer` semantics, while
  serialization and query wrappers are renderer-specific but fiber-aware.
- Worker 101 planned `TestRendererRoot`, options, root invalidation,
  `flush_sync`, and operation logging as a facade over shared roots.
- Worker 102 separated serialization from root lifecycle and required a
  committed-fiber inspection API before `toJSON`, `toTree`, or `TestInstance`.
- Worker 114 combined the first root and serialization implementation plan but
  included stale blockers that are now resolved locally, notably test-renderer
  token-aware trait migration.
- Worker 117 sequences the root milestone with fake/test-renderer roots as the
  first commit canary before React DOM uses the path.

Accepted oracle reports and artifacts:

- Worker 083 export oracle records root export keys, descriptors, shallow
  removal, condition behavior, and deprecation warning behavior.
- Worker 084 root lifecycle oracle covers `create`, `update`, `unmount`,
  `.root`, `getInstance`, `createNodeMock`, strict/concurrent options, React
  Native test environment diagnostics, and post-unmount behavior.
- Worker 085 serialization oracle covers `toJSON`, `toTree`, hidden Activity
  behavior, text/null/array roots, composite tree output, and `TestInstance`
  query basics.
- Worker 086 act oracle covers exported act, production act absence,
  `_Scheduler`, update flushing, `unstable_flushSync`, warnings, and error
  aggregation.
- Worker 087 error-surface oracle covers query errors, unmounted-root access,
  invalid create/update inputs, shallow removal, unsupported `use`, and
  deterministic development diagnostics.
- Local artifact probe showed the accepted oracle set has export, lifecycle,
  serialization, act, and error-surface artifacts with Fast React
  compatibility claims still false.

Current source:

- `crates/fast-react-core` now exposes fiber topology, flags, root lane
  bookkeeping, event priority, lane bitsets, and related handles.
- `crates/fast-react-reconciler/src/fiber_store.rs` owns
  `FiberRootStore<H>`, `FiberRootId`, HostRoot state storage, update queues,
  root scheduler state, and scheduler bridge state.
- `crates/fast-react-reconciler/src/root_updates.rs` implements
  `update_container` and `update_container_sync` as HostRoot `{element}`
  enqueue operations that return scheduler records and do not render, flush,
  commit, or mutate host containers.
- `crates/fast-react-reconciler/src/root_scheduler.rs` consumes
  `RootScheduleUpdateRecord`, maintains the scheduled-root list, records
  callback schedule/cancel/microtask decisions, and deliberately stops before
  render or commit.
- `crates/fast-react-reconciler/src/work_in_progress.rs` creates/reuses
  HostRoot work-in-progress alternates and leaves `root.current` unchanged.
- `crates/fast-react-test-renderer/src/lib.rs` is still documented as a
  deterministic in-memory mutation host, not a reconciler. It now implements
  token-aware `HostTypes`, `HostCreation`, `HostCommit`, and `MutationHost`,
  and remains useful as the first root commit canary host.
- `crates/fast-react-test-renderer/Cargo.toml` currently depends only on
  `fast-react-host-config`; a root facade will need a scoped dependency on
  `fast-react-reconciler`.
- No `packages/react-test-renderer` package exists locally.

## Risks Or Blockers

- Worker 129 is active, not accepted in this worktree. Without HostRoot
  render-phase queue processing, the first root canary can only prove
  enqueue/schedule behavior.
- Minimal commit is not present. Without commit, host snapshots cannot prove
  React root behavior and must remain low-level host diagnostics.
- Host component/text begin/complete work is not present. Without it, no
  simple host tree can be produced from a root element.
- `flush_sync_work` and act routing are not fully implemented in the current
  source. The canary should omit public flush/act claims until shared
  reconciler APIs own them.
- Current element storage is still opaque `RootElementHandle`. The canary may
  need fixture handles until the element-to-fiber bridge lands.
- Adding a dependency from `fast-react-test-renderer` to
  `fast-react-reconciler` should be checked for crate layering and test
  compile time, but it is the clean direction for a root facade.
- Operation logs can become brittle if they are treated as the renderer output
  model. Keep them scoped to phase-order and no-direct-mutation assertions.

## Recommended Next Tasks

1. Accept worker 129 or an equivalent HostRoot render-phase slice that consumes
   `update_container` queues and produces finished HostRoot work without host
   mutation.
2. Land a minimal commit slice that switches `root.current` only after
   mutation/reset and preserves host operation errors.
3. Land host component/text begin/complete work for a one-host-node plus text
   fixture.
4. Add `TestRendererRoot` as the first Rust canary over shared root APIs, with
   enqueue/schedule tests first and committed host-output tests gated on commit
   and complete work.
5. Add committed-fiber inspection and then serialization/query slices after
   the root canary is stable.
6. Add a JS `react-test-renderer` facade only after Rust root lifecycle,
   serialization, act routing, and error mapping can be compared against the
   accepted oracles.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,240p' WORKER_BRIEF.md
rg --files worker-progress
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,320p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-073-test-renderer-update-model-plan.md
sed -n '1,620p' worker-progress/worker-101-test-renderer-root-api-plan.md
sed -n '1,680p' worker-progress/worker-102-test-renderer-serialization-plan.md
sed -n '1,760p' worker-progress/worker-114-test-renderer-implementation-plan.md
sed -n '1,260p' worker-progress/worker-083-react-test-renderer-export-oracle.md
sed -n '1,260p' worker-progress/worker-084-react-test-renderer-root-lifecycle-oracle.md
sed -n '1,280p' worker-progress/worker-085-react-test-renderer-serialization-oracle.md
sed -n '1,280p' worker-progress/worker-086-react-test-renderer-act-oracle.md
sed -n '1,300p' worker-progress/worker-087-react-test-renderer-error-surface-oracle.md
rg --files crates/fast-react-test-renderer crates/fast-react-reconciler crates/fast-react-core crates/fast-react-host-config packages tests/conformance worker-progress
sed -n '1,620p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,760p' crates/fast-react-reconciler/src/fiber_root.rs
sed -n '1,760p' crates/fast-react-reconciler/src/root_updates.rs
sed -n '1,820p' crates/fast-react-reconciler/src/root_scheduler.rs
sed -n '1,760p' crates/fast-react-reconciler/src/fiber_store.rs
sed -n '1,360p' crates/fast-react-reconciler/src/work_in_progress.rs
sed -n '1,360p' crates/fast-react-reconciler/src/host_tokens.rs
sed -n '1,920p' crates/fast-react-test-renderer/src/lib.rs
sed -n '921,1320p' crates/fast-react-test-renderer/src/lib.rs
sed -n '1,360p' crates/fast-react-reconciler/src/root_config.rs
sed -n '1,360p' crates/fast-react-reconciler/src/scheduler_bridge.rs
sed -n '1,360p' crates/fast-react-reconciler/src/update_queue.rs
sed -n '1,260p' crates/fast-react-core/src/root_lanes.rs
sed -n '1,320p' worker-progress/worker-123-reconciler-fiber-root-host-root.md
sed -n '1,320p' worker-progress/worker-124-host-root-update-queue.md
sed -n '1,360p' worker-progress/worker-128-reconciler-root-scheduler-foundation.md
sed -n '1,760p' worker-progress/worker-109-reconciler-commit-minimum-implementation-plan.md
sed -n '1,590p' worker-progress/worker-117-root-render-implementation-sequencing-plan.md
node -e "<summarize react-test-renderer oracle artifact kinds, modes, scenarios, and false compatibility claims>"
sed -n '1,200p' crates/fast-react-test-renderer/Cargo.toml
git status --short --untracked-files=all
rg -n '[[:blank:]]$' worker-progress/worker-133-test-renderer-root-refresh.md
rg -n '^(<<<<<<<|=======|>>>>>>>)' worker-progress/worker-133-test-renderer-root-refresh.md
git add -N worker-progress/worker-133-test-renderer-root-refresh.md
git diff --check -- worker-progress/worker-133-test-renderer-root-refresh.md
git reset -q -- worker-progress/worker-133-test-renderer-root-refresh.md
scoped changed-path check excluding `.worker-logs/`
git status --short --untracked-files=all
```

## Changed Files

- `worker-progress/worker-133-test-renderer-root-refresh.md`

Observed but not edited:

- `.worker-logs/worker-133-test-renderer-root-refresh.log`

## Verification

- `git diff --check -- worker-progress/worker-133-test-renderer-root-refresh.md`
  passed after adding the untracked report file to the index with
  intent-to-add. The index entry was reset immediately after the check.
- Scoped changed-path check passed. Excluding the generated `.worker-logs/`
  session artifact, the only changed path is
  `worker-progress/worker-133-test-renderer-root-refresh.md`.
- Scoped trailing-whitespace and conflict-marker scans over this report had no
  matches.

## Completion Checklist

- [x] `create_goal` was called before research or file reads.
- [x] `get_goal` evidence was recorded.
- [x] `WORKER_BRIEF.md` was read after goal setup.
- [x] `ORCHESTRATOR.md` was not read.
- [x] Required master docs, prior test-renderer plans, accepted
      react-test-renderer oracle reports, and current source were inspected.
- [x] Report sequences the first root canary through shared reconciler root
      semantics instead of direct storage mutation.
- [x] File scope, tests, public API limits, and dependencies on worker 129,
      commit, and host component/text complete work are included.
- [x] Final `git diff --check` passed.
- [x] Final scoped changed-path check passed.
