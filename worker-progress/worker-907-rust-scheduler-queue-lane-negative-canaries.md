# Worker 907 - Rust Scheduler Queue/Lane Negative Canaries

## Summary

- Hardened the private/test-only HostRoot queue/lane scheduler continuation evidence so accepted scheduler evidence requires the requested scheduler callback node to still match the root's current callback node.
- Added focused negative canaries for:
  - stale scheduler callback identity after a real scheduled callback render/commit and a later queue/lane handoff,
  - selected-lane mismatch in queue evidence after scheduler finished-work evidence is otherwise accepted,
  - replayed queue rows from an earlier current switch presented to a newer finished-work handoff.
- Preserved the accepted Worker 904 positive source-owned continuation path and existing Worker 898 queue/lane handoff and commit-consumer blockers.

## Changed Files

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `worker-progress/worker-907-rust-scheduler-queue-lane-negative-canaries.md`

## Commands Run

- `cargo test -p fast-react-reconciler --all-features root_scheduler_queue_lane_continuation`
- `cargo fmt --all`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo test -p fast-react-reconciler --all-features root_updates`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo test -p fast-react-reconciler --all-features host_root_queue_lane_handoff`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all --check`
- `git diff --check`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_queue_lane_continuation`

## Evidence Gathered

- `root_scheduler_queue_lane_continuation`: 13 passed, including the new stale callback, selected-lane mismatch, and replayed row/currentness canaries.
- `root_scheduler`: 91 passed.
- `root_updates`: 34 passed.
- `root_commit`: 108 passed.
- `host_root_queue_lane_handoff`: 7 passed.
- `cargo check`, `cargo fmt --all --check`, and `git diff --check` passed.

## Risks Or Blockers

- No blockers found.
- Merge overlap risk is limited to `root_scheduler.rs` near Worker 904's queue/lane continuation tests and evidence helpers; Worker 906 is also working nearby, so these additions may need straightforward test-block conflict resolution.
- This remains private/test-only and does not open public Scheduler timing, public roots, hooks, act, flushSync, or renderer compatibility.

## Recommended Next Tasks

- Keep Worker 906 merge review focused on preserving the callback-currentness evidence predicate and the three new negative canaries.
- If future work expands queue/lane continuation beyond sync HostRoot paths, add equivalent callback identity and replay/currentness canaries before accepting new paths.
