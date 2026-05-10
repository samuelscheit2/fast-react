# Worker 150: Sync Flush Execution Context

You are worker 150 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-150-sync-flush-execution-context.md`.

Objective: add the first reconciler sync-flush execution context foundation:
guarded execution-context state, deterministic cross-root sync flush records,
and tests that can later call worker 149's commit path without owning commit
or public facade behavior.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `worker-progress/worker-129-host-root-render-phase-foundation.md`
- `worker-progress/worker-131-sync-flush-act-refresh.md`
- `worker-progress/worker-111-reconciler-sync-flush-act-plan.md`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- React reference files for `flushSyncWorkOnAllRoots` and execution-context
  guards as needed.

Write scope:
- `crates/fast-react-reconciler/src/execution_context.rs`
- Minimal wiring in `crates/fast-react-reconciler/src/lib.rs`
- Narrow additions in `crates/fast-react-reconciler/src/root_scheduler.rs`
- Tests in those modules
- `worker-progress/worker-150-sync-flush-execution-context.md`

Do not touch DOM packages, test-renderer packages, host complete-work, or
native bridge files. You may touch root scheduler, but keep changes separable
from worker 155's scheduler callback execution work. You are not alone in the
codebase; do not revert other workers' changes.

Implementation requirements:
- Model execution-context flags needed to reject or record illegal sync flush
  reentry.
- Replace or supplement `collect_sync_flush_plan` with a deterministic
  flush-ready record type without doing host mutation or public `flushSync`.
- Prefer small internal APIs and tests over broad facade wiring.
- If worker 149's commit API is not available in your branch, stop at a
  render/plan-level executor that documents the commit handoff in code and
  tests.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features execution_context`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

