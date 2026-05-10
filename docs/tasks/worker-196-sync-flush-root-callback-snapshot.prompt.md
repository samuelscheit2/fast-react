# Worker 196: Sync Flush Root Callback Snapshot

Objective: extend the internal sync-flush canary so `SyncFlushRootRecord`
surfaces and tests the root update callback snapshot carried by
`HostRootCommitRecord`, without invoking callbacks, changing root scheduling
selection, adding public `flushSync` behavior, or touching DOM/test-renderer
facades.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 179, 191, and 193.
- Inspect `crates/fast-react-reconciler/src/sync_flush.rs`,
  `root_commit.rs`, `root_callbacks.rs`, and `update_queue.rs`.

## Write Scope

- Primary: `crates/fast-react-reconciler/src/sync_flush.rs`.
- Report: `worker-progress/worker-196-sync-flush-root-callback-snapshot.md`.
- Avoid editing `root_commit.rs`, scheduler package JS, React DOM packages,
  test renderer crate, and master docs.

## Implementation Notes

- Prefer borrowing/accessor tests over reshaping commit records.
- Add focused tests for a sync update with a callback and a hidden callback if
  the existing queue helpers support it through sync flush.
- Keep callback records data-only. No callback invocation, layout effects,
  passive effects, host mutation, or public facade behavior.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features sync_flush`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

