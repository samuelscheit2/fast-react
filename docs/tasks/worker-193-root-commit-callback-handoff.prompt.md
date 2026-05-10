# Worker 193: Root Commit Callback Handoff

You are worker 193 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-193-root-commit-callback-handoff.md`.

Objective: extend the internal HostRoot commit handoff so commit tests can
drain deterministic root update callback records produced by the accepted
update-queue callback API, without invoking JS callbacks, adding public
facades, wiring native callback registries, or implementing layout effects.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-149-host-root-current-switch-commit.md`
- `worker-progress/worker-160-root-update-callback-commit-prep.md`
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/root_callbacks.rs`
- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- React reference callback commit handling in
  `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberClassUpdateQueue.js`

Write scope:
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/root_callbacks.rs` only for narrow tests or
  helper shape needed by commit
- `crates/fast-react-reconciler/src/update_queue.rs` only if the commit API
  needs a minimal accessor and existing callback tests remain intact
- Minimal exports in `crates/fast-react-reconciler/src/lib.rs` only if needed
- Focused reconciler unit tests
- `worker-progress/worker-193-root-commit-callback-handoff.md`

Do not touch DOM packages, test-renderer packages, public React/React DOM
facades, native callback registries, host mutation, function-component render,
hook queues, or scheduler execution. Workers 179, 188, and 191 may also touch
root commit/work-loop/scheduler files; keep the callback handoff separable and
merge around them later. You are not alone in the codebase.

Implementation requirements:
- Preserve the existing HostRoot current-switch commit behavior.
- Add an internal commit record path that drains visible root update callback
  records exactly once after a successful HostRoot commit.
- Keep hidden callbacks deferred as data and prove they are not returned as
  visible invocation records.
- Do not call or simulate JS callback execution; return records only.
- Add tests covering successful callback record handoff, no duplicate records
  on repeated commit/take paths, and hidden callback deferral.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo test -p fast-react-reconciler --all-features root_callbacks`
- `cargo test -p fast-react-reconciler --all-features update_queue`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`
