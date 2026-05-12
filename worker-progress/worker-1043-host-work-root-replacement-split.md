# Worker 1043 - Host Work Root Replacement Split

## Summary

- Split root child replacement request, diagnostic, error, execution, evidence, and duplicate-execution identity helpers from `host_work.rs` into `host_work/root_replacement.rs`.
- Kept existing crate-visible `host_work::*ForCanary` paths through private module re-exports.
- Left root replacement work-construction helpers, mutation apply, host update apply, payload handling, tests, and `root_commit` code in place.

## Changed Files

- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/host_work/root_replacement.rs`
- `worker-progress/worker-1043-host-work-root-replacement-split.md`

## Commands Run

- `cargo test -p fast-react-reconciler host_work::tests::root_replacement --lib`
  - First run failed after the move because sibling tests lost access to former `host_work`-private tamper fields and blocker constants.
  - Fixed by using `pub(super)` for request fields and a test-only parent import for the blocker constant.
- `cargo fmt --all`
- `cargo test -p fast-react-reconciler host_work --lib`
- `cargo test -p fast-react-reconciler root_work_loop --lib`
- `cargo fmt --all --check`
- `git diff --check && git diff --cached --check`
- `cargo test -p fast-react-reconciler host_work::tests::root_replacement --lib`

## Evidence Gathered

- Focused root replacement canaries pass: 22 passed, 0 failed.
- Full `host_work` filter passes: 91 passed, 0 failed.
- `root_work_loop` filter passes: 119 passed, 0 failed.
- Formatting and whitespace checks pass.
- The moved execution path still performs source handoff validation, stable previous sibling evidence validation, deletion/placement preflight, duplicate execution consumption, mutation apply, and deletion cleanup in the same order.

## Audit, Review, Or Nested-Agent Findings

- No nested agents used.
- Local review confirmed only root replacement request/execution/evidence helpers moved; unrelated host update payload, mutation apply, host update apply, tests, and root commit code were not moved.

## Risks Or Blockers

- No current blockers.
- Integration risk: worker 1041 may change `root_commit` exports/import paths. This split imports the same root commit types from `crate::root_commit`; if those names move during merge, `root_replacement.rs` imports may need the same adjustment as `host_work.rs`.

## Recommended Next Tasks

- Merge with worker 1041 root commit re-export changes and rerun the same focused root replacement, `host_work`, and `root_work_loop` filters after conflict resolution.
