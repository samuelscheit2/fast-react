# Worker 160: Root Update Callback Commit Prep

You are worker 160 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-160-root-update-callback-commit-prep.md`.

Objective: prepare HostRoot update callback collection for commit-time
invocation with deterministic records, without invoking JS callbacks, adding
error boundaries, or wiring public facades.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-124-host-root-update-queue.md`
- `worker-progress/worker-129-host-root-render-phase-foundation.md`
- `worker-progress/worker-138-root-error-callback-refresh.md`
- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`

Write scope:
- `crates/fast-react-reconciler/src/update_queue.rs`
- New `crates/fast-react-reconciler/src/root_callbacks.rs` if useful
- Minimal exports in `crates/fast-react-reconciler/src/lib.rs`
- Focused tests
- `worker-progress/worker-160-root-update-callback-commit-prep.md`

Do not touch public JS packages, root error capture, host mutation, or native
callback registries. If you need root commit integration, add only a narrow
handoff record and avoid owning worker 149's commit path. You are not alone in
the codebase.

Implementation requirements:
- Preserve callback ordering from processed HostRoot updates.
- Distinguish visible and hidden/deferred callbacks using existing queue data.
- Add a take/peek API suitable for commit layout phase tests.
- Add tests for skipped updates, no-lane clones, hidden callbacks, and no
  duplicate callback invocation records.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features update_queue`
- `cargo test -p fast-react-reconciler --all-features root_callbacks`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

