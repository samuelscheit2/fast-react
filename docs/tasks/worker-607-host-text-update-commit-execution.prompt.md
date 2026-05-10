# Worker 607: Host Text Update Commit Execution

## Objective

Move one private HostText update from recorded payload metadata to deterministic
test-host mutation execution.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Build on accepted host text update payload and root commit diagnostics.

## Write Scope

- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-607-host-text-update-commit-execution.md`

Do not edit JS DOM packages.

## Requirements

- Add a private HostText commit execution path that mutates a test-host text
  record only after accepted update payload and commit handoff validation.
- Reject unchanged text, stale host tokens, and wrong-root text handles.
- Keep public renderer compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features host_text_update -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features host_work -- --nocapture`
- `git diff --check`
