# Worker 570: Context Multi-Provider Lane Propagation

## Objective

Extend private context-provider diagnostics to cover multiple providers and
consumer lane propagation without opening public context compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 538 added context-provider update lane diagnostics. This task should
cover nested and sibling provider lane propagation in a narrow Rust gate.

## Write Scope

- `crates/fast-react-reconciler/src/context.rs`
- `crates/fast-react-reconciler/src/begin_work.rs`
- Focused Rust tests in those modules
- `worker-progress/worker-570-context-multi-provider-lane-propagation.md`

Do not edit React DOM, test-renderer, scheduler JS, native, or package-surface
files.

## Requirements

- Record provider stack identity, changed context handles, render lanes, and
  consumer dependency lane propagation for at least two providers.
- Keep public context propagation and renderer-visible updates blocked.
- Reject unsupported provider shapes, missing consumer dependencies, and stale
  stack snapshots.
- Preserve existing begin-work context unwind behavior.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo test -p fast-react-reconciler --all-features context -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features begin_work -- --nocapture`
- `cargo fmt --all --check`
- `git diff --check`
