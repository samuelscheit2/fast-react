# Worker 889 - Rust Sync Flush Delete Teardown Execution

Date: 2026-05-11

## Summary

Added a narrow private sync-flush deleted-subtree teardown execution canary. The
new host-work bridge reuses accepted sync-flush host mutation request/replay
validation and accepted deleted-subtree teardown request validation before any
fake host calls, then runs the existing ordered ref cleanup, passive destroy,
host subtree detach, and host cleanup executor.

Default public `flushSync`, public roots/renderers, hooks/effects compatibility,
React DOM/test-renderer/native/package behavior, and broad renderer behavior
remain blocked.

## Changed Files

- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/sync_flush.rs`
- `worker-progress/worker-889-rust-sync-flush-delete-teardown-execution.md`

## Commands Run

```sh
cargo test -p fast-react-reconciler --all-features sync_flush_private_deleted_subtree_teardown -- --nocapture
cargo fmt --all
cargo test -p fast-react-reconciler --all-features sync_flush_private_deleted_subtree_teardown -- --nocapture
cargo test -p fast-react-reconciler --all-features sync_flush_private_deleted_subtree_teardown
cargo test -p fast-react-reconciler --all-features sync_flush
cargo test -p fast-react-reconciler --all-features deleted_subtree
cargo test -p fast-react-reconciler --all-features root_commit_deletion
cargo test -p fast-react-reconciler --all-features host_work_deletion
cargo test -p fast-react-reconciler --all-features passive_effects
cargo test -p fast-react-reconciler --all-features root_work_loop_deleted_subtree_teardown
cargo test -p fast-react-reconciler --all-features root_work_loop_root_unmount
cargo test -p fast-react-reconciler --all-features root_work_loop_managed_child_host_text_sibling_order_delete
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
```

All commands passed.

## Evidence Gathered

- `host_work.rs` now exposes `execute_sync_flush_deleted_subtree_teardown_for_canary`, which rederives and validates the sync-flush request, rederives and validates the deletion teardown request, checks root/current/lane/finished-work identity, rejects replay through the existing sync-flush host mutation execution identity, and only then invokes the existing deleted-subtree teardown executor.
- `sync_flush.rs` now retains the test-only finished-work commit handoff on `SyncFlushRootRecord` and has a test-only method to record deleted-subtree passive metadata on both the sync-flush record and retained handoff.
- New sync-flush canaries prove ordered execution for deletion record, ref cleanup gate, passive destroy, host detach, and host cleanup; live topology and root/lane/request/deletion-list evidence; and no public compatibility claims.
- Negative canaries cover missing ref/passive evidence with host cleanup present, stale sync-flush evidence, stale committed topology, cross-root deletion evidence, caller-built deletion request tampering, and replayed sync-flush host mutation identity before additional fake host calls.

## Risks Or Blockers

- This is still private test-host evidence only. It does not open public `flushSync`, public root/render/unmount behavior, React DOM, react-test-renderer, native, hooks/effects compatibility, or package compatibility.
- The proof covers one committed HostComponent deleted subtree with a deleted host ref and one deleted function passive destroy. Portals, Suspense/Offscreen, mixed deletion lists, and broad renderer traversal stay blocked by existing guards.
- Workers 878 and 879 may overlap in reconciler files. This branch only touched `host_work.rs` and `sync_flush.rs`; merge review should keep accepted parallel edits rather than replacing them.

## Recommended Next Tasks

1. Compose this private teardown bridge with any accepted broader sync-flush managed-child deletion handoffs after those source records are stabilized.
2. Keep public renderer/root wiring blocked until the same sync-flush request, deletion request, live topology, passive/ref cleanup, and replay guards can be consumed outside test-host canaries.
