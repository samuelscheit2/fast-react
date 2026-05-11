# Worker 906 - Rust Scheduler Expired Queue Lane Continuation

## Summary

- Added a private/test-only expired-lane default+sync HostRoot scheduler continuation canary in `root_scheduler.rs`.
- The new continuation consumes Worker 904's source-owned HostRoot queue/lane handoff gate before accepting current-switch/commit evidence.
- Kept the path narrow: no public scheduler timing, public roots, React DOM/test-renderer roots, hooks, act, or package compatibility changes.
- Follow-up audit fix: merged current `main` with Worker 907 (`c36ff0a2`) and removed expired-wrapper re-recording of caller-provided handoff evidence before delegated queue-lane validation.

## Evidence

- Accepts only default+sync render lanes with Default marked expired and Sync co-selected.
- Records callback identity, expired lanes before/after, selected priority/render lanes, handoff identity, queue sequence IDs, source row lanes, applied/skipped counts, remaining lanes, resulting element, and commit/current identity.
- Rejects missing queue proof, stale queue after another update, stale scheduler pass / overwritten finished-work metadata, forged row lane metadata, wrong selected lanes, wrong finished lanes, cross-root queue evidence, caller-built row order, skipped lanes treated as committed, and replay after commit.
- Reuses `execute_sync_scheduler_continuation_for_queue_lane_handoff_for_canary` and `commit_host_root_update_queue_lane_handoff_with_finished_work_pending_commit_for_canary`; no parallel scheduler-only commit path was added.
- Stale scheduler-pass validation path: `execute_expired_lane_sync_scheduler_continuation_for_queue_lane_handoff_for_canary` now delegates without calling `record_root_finished_work_for_scheduler_handoff_for_canary`; the delegated Worker 904 continuation sees the newer `root.finished_work` and returns `BlockedByFinishedWorkHandoffMismatch` with no queue commit handoff.

## Commands Run

- `cargo test -p fast-react-reconciler --all-features root_scheduler_expired_default_sync_queue_lane_continuation -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_queue_lane_continuation -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo test -p fast-react-reconciler --all-features root_updates`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo test -p fast-react-reconciler --all-features host_root_queue_lane_handoff`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_queue_lane_continuation`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_expired_default_sync_queue_lane_continuation`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all --check`
- `git diff --check`

All checks passed.

## Changed Files

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `worker-progress/worker-906-rust-scheduler-expired-queue-lane-continuation.md`

## Risks / Overlap

- Merged `main` cleanly; no manual conflict resolution was needed. Worker 907's callback-currentness predicate (`requested_callback_node == current_callback_node`) and its selected-lane/replay negative canaries are preserved and passing.
- Overlaps adjacent private root scheduler/update canary work in `root_scheduler.rs`; the added API is `#[cfg(test)]` and delegates to the accepted Worker 904 queue/lane gate to reduce merge risk.
- The new tests intentionally construct forged private records, so future changes to queue handoff field shape will need corresponding canary updates.

## Recommended Next Tasks

- Merge after orchestrator reviews overlap with any concurrent root scheduler/update workers.
- Keep any public scheduler/root compatibility work separate from this private canary path.
