# Worker 634: Deletion Ref/Passive Cleanup Execution

Date: 2026-05-10

## Goal Evidence

- `create_goal` was called as the first action before file reads, research,
  implementation, or verification.
- Initial `get_goal` returned status `active` with objective:
  "Broaden deletion execution to prove ref cleanup and passive cleanup ordering
  for a deleted host subtree while keeping public unmount compatibility
  blocked."
- Final `get_goal` before report writing returned the same active objective.

## Summary

- Added a crate-private deleted-subtree ref/passive cleanup execution canary in
  `passive_effects`. It consumes the existing deletion cleanup order gate,
  invokes a test-controlled deleted-ref cleanup-return executor before the
  deleted-subtree passive destroy flush, and records the observed sequence.
- Added a test-host canary that deletes a ref-bearing HostComponent subtree
  containing a FunctionComponent passive destroy and HostText child, then proves
  private passive destroy, host subtree detachment, and host-node cleanup order.
- Kept public unmount/ref/effect compatibility blocked; the new snapshots and
  flush results keep public compatibility booleans false.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- `worker-progress/worker-634-deletion-ref-passive-cleanup-execution.md`

## Commands Run And Results

- `cargo test -p fast-react-reconciler deletion_ref_passive_cleanup_execution -- --nocapture`: passed, 1 test.
- `cargo test -p fast-react-reconciler host_work_deletion_executes_passive_destroy_before_host_cleanup_with_ref_order_evidence -- --nocapture`: passed, 1 test.
- `cargo test -p fast-react-reconciler deletion -- --nocapture`: passed, 22 tests.
- `cargo test -p fast-react-reconciler passive -- --nocapture`: passed, 69 tests.
- `cargo test -p fast-react-reconciler --all-features`: passed, 531 unit tests and 1 compile-fail doc test; emitted existing dead-code warnings in root scheduler/update diagnostics.
- `cargo fmt --all`: completed.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Evidence Gathered

- Read `WORKER_BRIEF.md` and inspected relevant reports, especially workers 481,
  503, 601, 609, 385, 444, 349, and 362.
- Inspected current root commit deletion cleanup ordering, ref cleanup-return
  metadata, deleted-subtree passive handoff/flush, and host deletion execution.
- Checked the local React 19.2.6 reference for deletion refs and passive
  deleted-tree ordering: mutation deletion detaches refs during deletion work,
  and passive unmount inside a deleted tree traverses parent-to-child later.
- Spawned two explorer agents for deletion and passive/ref orientation; they did
  not return usable findings before local implementation/verification completed,
  so conclusions are based on direct inspection and tests above.

## Risks Or Blockers

- Ref cleanup-return execution remains private and test-controlled; it does not
  mutate public refs or invoke public renderer callbacks.
- The host-work execution shape is intentionally narrow: one deleted
  HostComponent subtree under a HostComponent parent. Portal, Suspense,
  Offscreen, multi-root, and public root unmount behavior remain blocked.
- Host-node cleanup invalidates fake host-node metadata after private
  detachment; this is not a broad public renderer teardown path.

## Recommended Next Tasks

1. Add separate private teardown gates for Portal and Suspense/Offscreen before
   broadening deleted-subtree execution.
2. Connect the order evidence to renderer-specific DOM/test-renderer unmount
   adapters only after oracle coverage exists.
3. Keep public unmount compatibility blocked until ref callbacks, passive
   destroys, host detachment, and host cleanup are all proven through public
   roots.
