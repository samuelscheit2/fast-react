# Worker 608: Host Component Property Update Execution

## Objective

Add a private HostComponent property update execution gate in the Rust host-work
layer for one safe test-host property payload.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Use accepted property payload and fake-host config diagnostics without opening
DOM compatibility.

## Write Scope

- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/host_nodes.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-608-host-component-property-update-execution.md`

Do not edit React DOM JS files.

## Requirements

- Add a private canary that applies one property update to a test host instance
  after validating host token, root, fiber, and payload metadata.
- Reject unsupported style/dangerousHTML rows, stale handles, and conflicting
  text updates.
- Keep public DOM property compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features host_component -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features host_nodes -- --nocapture`
- `git diff --check`
