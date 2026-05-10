# Worker 595: Root Commit Host Component Update Execution

## Objective

Move one private HostComponent update path from metadata-only handoff toward
actual test-host commit execution, without opening public React DOM or
test-renderer compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Queue 565-594 accepted finished-work, fake-DOM, and test-renderer update
metadata. This task should consume that evidence in the Rust commit layer.

## Write Scope

- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/host_work.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-595-root-commit-host-component-update-execution.md`

Do not edit JS packages or master docs.

## Requirements

- Add a private diagnostic that applies one accepted HostComponent prop/text
  update through the test host commit path.
- Prove stale finished-work, unsupported payload, and wrong-root records fail
  closed before mutation.
- Keep public compatibility flags and renderer package behavior blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features host_component_update -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_commit -- --nocapture`
- `git diff --check`
