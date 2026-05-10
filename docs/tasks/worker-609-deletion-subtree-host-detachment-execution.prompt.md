# Worker 609: Deletion Subtree Host Detachment Execution

## Objective

Generalize one private deletion subtree path from cleanup metadata to
deterministic test-host child detachment execution.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Use accepted deletion cleanup, ref cleanup, and host-node invalidation evidence.

## Write Scope

- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/host_nodes.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-609-deletion-subtree-host-detachment-execution.md`

Do not edit JS packages.

## Requirements

- Add a private canary that detaches one host child subtree after validating the
  deletion list and cleanup order records.
- Reject portals, Suspense, stale deletion records, and wrong parent handles.
- Keep public unmount and broad host teardown compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features deletion -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features host_nodes -- --nocapture`
- `git diff --check`
