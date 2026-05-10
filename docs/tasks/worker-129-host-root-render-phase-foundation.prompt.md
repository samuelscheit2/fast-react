# Worker 129: HostRoot Render-Phase Foundation

You are worker 129 in a real tmux Codex process.

First action before research, file reads, implementation, or verification:
call `create_goal` for this objective. Immediately after goal setup, call
`get_goal` if available and record the active status/objective in
`worker-progress/worker-129-host-root-render-phase-foundation.md`. If goal
tools are unavailable, say so explicitly in the report.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

You are not alone in this codebase. Other workers and the orchestrator may have
made changes; do not revert edits you did not make. Work with the current
branch state.

## Objective

Implement the first HostRoot render-phase foundation on top of the accepted
FiberRoot, HostRoot update queue, work-in-progress, and root scheduler models.

This is not commit and not host mutation. The goal is to process queued
HostRoot updates for selected render lanes into a HostRoot work-in-progress
fiber, record scheduler callback identity/staleness for async work, and expose
testable render-phase records that later commit and sync-flush workers can
consume.

## Write Scope

Allowed:

- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `crates/fast-react-reconciler/src/work_in_progress.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/fiber_store.rs`
- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- `worker-progress/worker-129-host-root-render-phase-foundation.md`

Do not edit JS packages, React DOM facades, test-renderer crates, host-config
crates, core crates, scheduler-native files, smoke tests, conformance oracle
files, commit/host mutation modules, lockfiles, or worker 128 files except
where the allowed reconciler scheduler file needs a narrow integration hook.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `worker-progress/worker-080-reconciler-host-root-update-queue-plan.md`
- `worker-progress/worker-081-reconciler-root-scheduler-act-plan.md`
- `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`
- `worker-progress/worker-124-host-root-update-queue.md`
- `worker-progress/worker-128-reconciler-root-scheduler-foundation.md`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/work_in_progress.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js`

Use the React source clone for scheduler/work-loop invariants. Do not copy
broad source shape blindly; keep this slice narrow and testable against the
current Rust model.

## Required Work

1. Add an internal `root_work_loop` foundation or equivalent narrow module for
   HostRoot render-phase work.
2. Add an entry point that can validate a scheduled callback node for a root
   and report stale callback identity without rendering when the callback no
   longer matches the root.
3. Add an entry point that processes the HostRoot update queue for explicit
   render lanes into a HostRoot work-in-progress fiber.
4. Write the processed `HostRootState` to the work-in-progress fiber's
   memoized state while leaving the current HostRoot fiber and `root.current`
   unchanged.
5. Record render-phase data such as root id, work-in-progress fiber id,
   render lanes, resulting element handle, applied update count, skipped
   update count, and remaining lanes.
6. Add only the narrow crate-scoped mutators needed for work-in-progress
   render state. Do not add commit, placement, host mutation, child
   reconciliation, effect traversal, function component render, hook execution,
   passive effect execution, or public facade behavior.
7. Add unit tests covering at least:
   - default HostRoot update processing writes the new element to WIP state;
   - current HostRoot state and `root.current` remain unchanged;
   - skipped lanes remain in queue/render result when render lanes do not
     include an update;
   - stale scheduler callback identity is rejected or reported without
     processing work;
   - matching scheduler callback identity can reach HostRoot render-phase
     processing;
   - no render-phase entry point calls host mutation/commit operations or
     switches `root.current`.
8. Write a concise report with goal evidence, changed files, commands, results,
   risks, and recommended next tasks.

You may spawn managed subagents, explorers, or nested agents for hypothesis
testing. Nested agents do not count against the top-level worker cap. Summarize
any delegated findings that affect your conclusion.

## Required Verification

Run:

```sh
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features root_work_loop
cargo test -p fast-react-reconciler --all-features work_in_progress
cargo test -p fast-react-reconciler --all-features update_queue
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo test -p fast-react-reconciler --all-features
cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings
git diff --check
```

Also run a scoped changed-path check proving changed files are limited to the
allowed write scope, excluding `.worker-logs/`.

Before final handoff, call `update_goal(status: "complete")` only when the
whole assigned task is complete.
