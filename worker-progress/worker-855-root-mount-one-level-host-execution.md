# Worker 855 - Root Mount One-Level Host Execution

Date: 2026-05-11

## Summary

Connected the private HostRoot one-level child-set root-work-loop path through
root commit and private test-host mutation execution.

The new root-work-loop canaries now prove that a rendered one-level
HostComponent + HostText root child set can:

- execute two `append_child_to_container` mutations after commit
- execute two `insert_in_container_before` mutations before a stable root text
  sibling after commit
- remain recorded-only when the stable sibling is unproven
- reject stale insert-before sibling host-node evidence before any host call

The path remains private/canary-scoped. It does not claim public root rendering,
React DOM, react-test-renderer, hydration, native, package, ref/effect, or broad
renderer compatibility.

## Changed Files

- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-855-root-mount-one-level-host-execution.md`

## Commands Run

```sh
cargo test -p fast-react-reconciler --all-features root_work_loop_one_level_child_set
cargo fmt --all
cargo test -p fast-react-reconciler --all-features root_work_loop_one_level_child_set
cargo test -p fast-react-reconciler --all-features host_work
cargo test -p fast-react-reconciler --all-features root_work_loop_managed_child
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
cargo test -p fast-react-reconciler --all-features root_commit
```

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and accepted
  Workers 826, 842, and 852 progress reports.
- Confirmed the existing one-level HostRoot child-set helper already consumes
  `mount_test_host_sibling_work`, but discarded detached host records before
  private mutation application.
- Added a narrow crate-private host-work canary wrapper that applies a
  `HostRootCommitRecord` against a retained `HostWorkResult` and a sibling
  mount helper that can carry existing detached host records forward.
- Root append canary proves two post-commit
  `AppendPlacementToContainer` records execute as
  `append_child_to_container` for HostComponent and HostText root children.
- Root insert-before canary first commits a stable root text child, then renders
  a source-owned one-level HostComponent + HostText child set before that stable
  sibling and proves two `InsertPlacementInContainerBefore` records execute as
  `insert_in_container_before`.
- Negative canaries prove an unproven stable sibling stays recorded-only and a
  stale sibling host node fails with `HostNodeViolation::Stale` before host
  mutation.

## Verification Results

- `root_work_loop_one_level_child_set`: passed, 6 tests.
- `host_work`: passed, 60 tests.
- `root_work_loop_managed_child`: passed, 9 tests.
- `root_commit`: passed, 108 tests.
- `cargo check -p fast-react-reconciler --all-features`: passed.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Risks Or Blockers

- Insert-before requires an existing stable root sibling, so that proof is an
  update placement-before-stable-sibling slice, not an empty-root first mount.
- The execution path is private fake-host canary code only. Public renderers,
  React DOM, react-test-renderer, hydration, native bridge/package behavior,
  refs/effects, and broad multi-child traversal remain blocked.
- Cross-parent sibling rejection remains covered by the underlying root commit
  topology validation; this worker added stale and unproven sibling negatives at
  the root-work-loop execution layer.

## Recommended Next Tasks

1. Add a dedicated root-work-loop cross-parent sibling canary only if the core
   topology test API grows a safe way to construct a mixed-parent sibling chain.
2. Keep public DOM/test-renderer/native wiring separate until those paths can
   consume the same source-owned root commit and host-node evidence.
3. Expand beyond one-level source-owned arrays/fragments only after generalized
   child reconciliation and host sibling discovery ownership is accepted.
