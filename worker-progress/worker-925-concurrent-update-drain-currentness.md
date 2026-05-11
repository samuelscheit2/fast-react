# Worker 925 - Concurrent Update Drain Currentness

## Progress

- Read `WORKER_BRIEF.md` and confirmed scope.
- Inspected `concurrent_updates.rs`, HostRoot update queue storage, and the existing hook queue staging validator for local patterns.
- Hardened `finish_queueing_concurrent_updates` with pre-drain validation and private/test-only currentness records.
- Added canaries for incomplete/caller-shaped tuples, missing source lane, duplicate staged update, tampered staging lanes, stale update, invalid queue, pre-linked update, replayed drain, lane mismatch, cross-root queue mismatch, and stale HostRoot-current evidence.

## Notes

- Scope is limited to `crates/fast-react-reconciler/src/concurrent_updates.rs` plus this report.
- Existing pending-ring corruption is validated through `pending_updates(queue)` before append. I did not add a new queue-store corruption helper because this worker's write scope excludes `update_queue.rs`, and the current public/local concurrent-update model cannot set a corrupt `shared.pending` or `RootUpdate.next` without crossing that boundary.
- Overlap risk: this tightens staged HostRoot update drain currentness to the root's current HostRoot fiber. Future render-boundary work that intentionally stages from a work-in-progress HostRoot will need an explicit source-owned evidence path rather than caller-shaped rows.

## Checks

- `cargo test -p fast-react-reconciler --all-features concurrent_updates`
- `cargo test -p fast-react-reconciler --all-features root_updates`
- `cargo test -p fast-react-reconciler --all-features function_component`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all --check`
- `git diff --check`
