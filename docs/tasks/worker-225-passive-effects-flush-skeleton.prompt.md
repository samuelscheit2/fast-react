# Worker 225: Passive Effects Flush Skeleton

Objective: add a private passive-effects flush skeleton that consumes the
accepted pending passive metadata as data and produces deterministic flush
records, without executing hook callbacks, scheduling public act/flushSync
behavior, mutating host output, or changing public renderer APIs.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 078, 139, 157, 173, 197, and 224 if present.
- Inspect `crates/fast-react-reconciler/src/root_commit.rs`,
  `root_scheduler.rs`, and hook effect modules.

## Write Scope

- Primary: new or existing private reconciler passive-effects module plus
  `crates/fast-react-reconciler/src/lib.rs`.
- Secondary: `crates/fast-react-reconciler/src/root_commit.rs` only for narrow
  pending-passive accessors.
- Report: `worker-progress/worker-225-passive-effects-flush-skeleton.md`.
- Do not edit function_component, sync_flush, test-renderer, JS packages, or
  master docs.

## Verification

- `cargo fmt --all --check`
- Focused passive-effects/root-commit tests.
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`
