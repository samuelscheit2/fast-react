# Worker 1044 Root Scheduler Act Split

## Summary

- Split the root-scheduler act continuation, act queue diagnostic records, and scheduler-bridge act helpers into `crates/fast-react-reconciler/src/root_scheduler/act.rs`.
- Kept `root_scheduler.rs` as the crate-visible path by adding a private `act` module and re-exporting the moved crate-private records/helpers.
- Preserved the broader scheduler, sync-flush planning, transition continuation, suspense retry, and test modules in `root_scheduler.rs`.
- Retained the drain-record literal visibility for the existing `root_scheduler` tests with `pub(super)` fields, matching the previous effective visibility from the parent module.

## Changed Files

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_scheduler/act.rs`
- `worker-progress/worker-1044-root-scheduler-act-split.md`

## Commands Run

- `cargo test -p fast-react-reconciler root_scheduler_act --lib`
- `cargo test -p fast-react-reconciler root_scheduler_scheduler_bridge_act --lib`
- `cargo test -p fast-react-reconciler sync_flush_act --lib`
- `cargo test -p fast-react-reconciler root_scheduler --lib`
- `cargo fmt --all --check`
- `git diff --check && git diff --cached --check`

## Evidence Gathered

- `root_scheduler_act`: 8 passed, 0 failed.
- `root_scheduler_scheduler_bridge_act`: 4 passed, 0 failed.
- `sync_flush_act`: 8 passed, 0 failed.
- `root_scheduler`: 127 passed, 0 failed.
- `cargo fmt --all --check`: passed.
- `git diff --check && git diff --cached --check`: passed.

## Audit, Review, Or Nested-Agent Findings

- No nested agents were used.
- A first focused test run passed but reported two import warnings after the extraction. I removed the unused `RootSchedulerCallbackHandle` import and kept the two crate-private diagnostic record re-exports behind an explicit `unused_imports` allowance because the re-exported paths preserve the private diagnostics surface.
- Follow-up audit reported non-test `cargo check` warnings for three canary-only re-exports. I narrowed `SchedulerBridgeActContinuationExecutionStatus`, `SchedulerBridgeActQueueRequestExecutionStatus`, and `execute_scheduler_bridge_act_queue_request_for_canary` to `#[cfg(test)]` re-exports; canary tests still resolve them through `root_scheduler`, while production check no longer imports them.
- I inspected the private admission/source-token path-drift note. The moved act block has no `file!`, `module_path!`, source-token, or caller-location gate, and the queue-lane currentness source-token admission path remains in `root_scheduler.rs`. No compatibility metadata update was needed for this split.

## Risks Or Blockers

- The new `act.rs` still depends on parent-private scheduler helpers for lane selection, root schedule microtask processing, expired-lane continuation execution, and sync-work recomputation. That is intentional for this behavior-preserving split, but it means future module splits should coordinate those private helper boundaries.
- No blockers remain for this assigned split.

## Recommended Next Tasks

- Integrate with adjacent root-scheduler splits and resolve any re-export ordering or module ownership preferences during orchestration.
- Consider a later pass that groups the act execution error types with the act module if the orchestrator wants the entire act scheduler-bridge surface isolated, not just records and helpers.
