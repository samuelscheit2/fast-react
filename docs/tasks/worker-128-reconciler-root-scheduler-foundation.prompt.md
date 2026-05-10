# Worker 128: Reconciler Root Scheduler Foundation

You are worker 128 in a real tmux Codex process.

First action before research, file reads, implementation, or verification:
call `create_goal` for this objective. Immediately after goal setup, call
`get_goal` if available and record the active status/objective in
`worker-progress/worker-128-reconciler-root-scheduler-foundation.md`. If goal
tools are unavailable, say so explicitly in the report.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

You are not alone in this codebase. Other workers and the orchestrator may have
made changes; do not revert edits you did not make. Work with the current
branch state.

## Objective

Implement the first internal reconciler root scheduler foundation on top of the
accepted FiberRoot/HostRoot update queue model.

This is not the render work loop. The goal is to model the React-style global
scheduled-root list, root callback identity/priority bookkeeping, sync-work
possibility flag, microtask scheduling state, cancellation/reuse decisions, and
testable scheduler records that future work-loop and act slices can consume.

## Write Scope

Allowed:

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/scheduler_bridge.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/fiber_store.rs`
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- `worker-progress/worker-128-reconciler-root-scheduler-foundation.md`

Do not edit JS packages, smoke tests, conformance oracle files, React DOM
facades, test-renderer crates, host-config crates, core crates, lockfiles,
commit/work-loop/host mutation modules, or worker 127 files.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `worker-progress/worker-081-reconciler-root-scheduler-act-plan.md`
- `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`
- `worker-progress/worker-124-host-root-update-queue.md`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/fiber_store.rs`
- `crates/fast-react-reconciler/src/root_config.rs`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js`

Use the React source clone for scheduler invariants. Do not copy broad source
shape blindly; keep this slice narrow and testable against the current Rust
model.

## Required Work

1. Add an internal scheduler bridge/task model if needed for callback identity,
   priority, cancellation, and microtask-request records. Keep it separate from
   the public `packages/scheduler` JS implementation.
2. Add root scheduler state owned by `FiberRootStore`, including scheduled-root
   list state, microtask flags, sync-work possibility, and flush guard data.
3. Add functions that consume `RootScheduleUpdateRecord` from
   `update_container` and add/reuse/cancel scheduled root records without
   rendering, committing, mutating host containers, or switching `root.current`.
4. Add unit tests covering at least:
   - first scheduled root insertion;
   - dedupe when the same root is scheduled twice;
   - multiple-root ordering;
   - sync-lane updates mark possible sync work and bypass async callback;
   - non-sync lane records request a bridge callback;
   - equal-priority callback reuse;
   - priority change cancellation/replacement;
   - no render/commit/host mutation side effects.
5. Write a concise report with goal evidence, changed files, commands, results,
   risks, and recommended next tasks.

You may spawn managed subagents, explorers, or nested agents for hypothesis
testing. Nested agents do not count against the top-level worker cap. Summarize
any delegated findings that affect your conclusion.

## Required Verification

Run:

```sh
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo test -p fast-react-reconciler --all-features scheduler_bridge
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
```

Also run a scoped changed-path check proving changed files are limited to the
allowed write scope, excluding `.worker-logs/`.

Before final handoff, call `update_goal(status: "complete")` only when the
whole assigned task is complete.
