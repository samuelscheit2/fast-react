# Worker 155: Scheduler Callback Execution

You are worker 155 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-155-scheduler-callback-execution.md`.

Objective: connect scheduled root callback records to the HostRoot render-phase
entry point from worker 129, producing deterministic execution records and
stale-callback behavior without owning sync flush, commit, or public Scheduler
package behavior.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-128-reconciler-root-scheduler-foundation.md`
- `worker-progress/worker-129-host-root-render-phase-foundation.md`
- `worker-progress/worker-131-sync-flush-act-refresh.md`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/scheduler_bridge.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- React reference `ReactFiberRootScheduler.js` as needed.

Write scope:
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/scheduler_bridge.rs` only if record types
  need a narrow extension
- Minimal exports in `crates/fast-react-reconciler/src/lib.rs`
- Focused tests in those modules
- `worker-progress/worker-155-scheduler-callback-execution.md`

Do not implement cross-root sync flush, act queues, commit, host mutation, or
JS Scheduler package changes. Worker 150 may also edit scheduler internals; keep
your changes small and documented. You are not alone in the codebase.

Implementation requirements:
- Add an internal callback execution API that validates callback identity using
  worker 129's render callback validation.
- Return explicit records for stale callback, rendered callback, and no-work
  cases.
- Preserve existing scheduler callback scheduling tests.
- Do not call host APIs or switch current.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo test -p fast-react-reconciler --all-features root_work_loop`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

