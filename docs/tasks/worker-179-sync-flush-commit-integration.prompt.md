# Worker 179: Sync Flush Commit Integration

You are worker 179 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-179-sync-flush-commit-integration.md`.

Objective: integrate the accepted HostRoot render and current-switch commit
foundations into a narrow internal sync-flush path that can render and commit
sync-ready HostRoot work without public DOM/test-renderer facade behavior.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `worker-progress/worker-129-host-root-render-phase-foundation.md`
- `worker-progress/worker-149-host-root-current-switch-commit.md`
- `worker-progress/worker-131-sync-flush-act-refresh.md`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- React reference files for `flushSyncWorkOnAllRoots` and sync work-loop
  commit handoff as needed.

Write scope:
- `crates/fast-react-reconciler/src/sync_flush.rs`
- Minimal wiring in `crates/fast-react-reconciler/src/lib.rs`
- Narrow additions in `crates/fast-react-reconciler/src/root_scheduler.rs`
- Tests in those modules
- `worker-progress/worker-179-sync-flush-commit-integration.md`

Do not touch DOM packages, test-renderer packages, host complete-work,
function components, hooks, native bridge files, or public JS facades. You are
not alone in the codebase; do not revert other workers' changes.

Implementation requirements:
- Add an internal sync flush record/result type for roots with sync work.
- Render HostRoot sync lanes with the accepted render-phase API and commit with
  `commit_finished_host_root`.
- Keep behavior HostRoot-only and data-only: no host mutation, no effects, no
  callbacks, no DOM/test-renderer wiring.
- Make skipped non-sync work remain pending and visible in result records.
- Add focused tests for no-op flush, one-root sync commit, multiple-root
  ordering, skipped lane retention, and no host operations.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features sync_flush`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`
