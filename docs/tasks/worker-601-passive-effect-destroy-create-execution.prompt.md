# Worker 601: Passive Effect Destroy Create Execution

## Objective

Move one private passive-effect flush path from metadata-only order diagnostics
to deterministic test callback execution for accepted committed fibers.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Use accepted passive pending, effect ring, and committed-fiber diagnostics.

## Write Scope

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `crates/fast-react-reconciler/src/root_config.rs`
- Existing focused Rust tests in those files
- `worker-progress/worker-601-passive-effect-destroy-create-execution.md`

Do not edit scheduler or JS package files.

## Requirements

- Add a private passive flush gate that invokes deterministic destroy-before-
  create test callbacks for one committed function component.
- Reject missing commit handoff, stale effect records, and wrong phase before
  callback invocation.
- Keep public effect flushing and public act compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features passive_effect -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_config_pending_passive -- --nocapture`
- `git diff --check`
