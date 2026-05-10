# Worker 481: Deletion Passive/Ref Cleanup Order Gate

Date: 2026-05-10

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before report writing.
- Goal status after final pane closeout: `complete`.
- Active goal objective from `get_goal`: add private deletion cleanup
  diagnostics proving ref cleanup returns and passive destroy metadata are
  ordered deterministically for removed host subtrees.

## Summary

Added a private deletion cleanup order gate in `root_commit.rs`. The gate
records deletion ref cleanup-return metadata before deleted-subtree passive
destroy metadata, and then host-node cleanup records, while preserving the
existing child-before-parent host cleanup diagnostics.

Added a deleted-subtree passive unmount handoff helper that reads committed
function-component passive metadata from the hook store, queues unmount records
with `PendingPassiveUnmountOrigin::DeletedSubtree`, and records destroy handles
without executing callbacks. The focused root-commit canary proves the order for
a removed HostComponent subtree containing a ref, a function component with a
passive destroy handle, and a HostText child.

The test renderer unmount diagnostic test now also reads the order gate and
confirms its host-cleanup-only shape for the existing committed-output unmount
path.

## Changed Files

- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `worker-progress/worker-481-deletion-passive-ref-cleanup-order-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested prior reports present in this checkout: workers 414, 415, 444,
  and 449. Worker reports 474 and 476 were not present.
- Checked the local React 19.2.6 reference in `ReactFiberCommitWork.js`:
  deletion mutation traversal detaches refs before descending/removal, deleted
  tree passive unmount effects run parent-to-child, and post-passive fiber/host
  cleanup runs after passive unmount traversal.
- No nested agents or explorers were used.

## Implementation Notes

- Added deleted-subtree passive metadata records and a queue helper scoped to
  private canaries.
- Added `HostRootDeletionCleanupOrderGateSnapshot` with stable phase labels and
  inert compatibility booleans.
- The gate records only metadata. It does not mutate real DOM, execute callback
  refs, execute ref cleanup returns, flush public effects, or claim public
  ref/effect compatibility.

## Commands Run

```sh
create_goal
get_goal
rg --files | rg '(^WORKER_BRIEF.md$|^MASTER_PLAN.md$|^MASTER_PROGRESS.md$|worker-progress/worker-(414|415|444|449|474|476).*\.md$|crates/fast-react-reconciler/src/root_commit.rs$|crates/fast-react-test-renderer/src/lib.rs$)'
git status --short
sed inspections for required context, prior worker reports, root_commit.rs, test-renderer lib.rs, root_config.rs, passive_effects.rs, function_component.rs, and React reference deletion/passive traversal
cargo fmt --all
cargo test -p fast-react-reconciler --all-features root_commit_deletion_order_gate_records_ref_cleanup_before_passive_destroy_metadata
cargo test -p fast-react-test-renderer --all-features root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics
cargo test -p fast-react-reconciler --all-features root_commit_deletion
cargo test -p fast-react-test-renderer --all-features deletion
cargo test -p fast-react-reconciler -p fast-react-test-renderer --all-features
cargo fmt --all --check
git diff --check
get_goal
```

## Verification Results

- `cargo test -p fast-react-reconciler --all-features root_commit_deletion`:
  passed, 3 focused tests.
- `cargo test -p fast-react-test-renderer --all-features deletion`: passed, 1
  focused test.
- `cargo test -p fast-react-reconciler -p fast-react-test-renderer
  --all-features`: passed, 400 reconciler tests, 67 test-renderer tests, 1
  reconciler compile-fail doc test, and 0 test-renderer doc tests.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Risks Or Blockers

- No blockers.
- Deleted-subtree passive destroy records are metadata-only and are not wired
  into public passive effect execution.
- The new helper is intentionally narrow and uses committed hook metadata plus
  explicit deleted-root input for private canaries; broad deleted-subtree
  passive traversal through Suspense, Offscreen, Fragment, and Portal remains
  future work.
- The test-renderer path only observes the order gate for host cleanup because
  its existing host-output unmount fixture has no ref or passive hook metadata.

## Recommended Next Tasks

1. Connect this deletion passive metadata to the private passive flush executor
   once deleted-subtree passive flushing is admitted.
2. Add separate gates for Fragment, Portal, Suspense, and Offscreen deletion
   traversal before broad compatibility claims.
3. Keep public ref/effect compatibility blocked until public roots and renderer
   adapters execute the same ordering under oracle coverage.
