# Worker 862 - Root Unmount Container Execution

Date: 2026-05-11

## Summary

Added private root-work-loop canaries proving that a committed one-level
HostRoot host output can unmount through `update_container_sync` with
`RootElementHandle::NONE`, render, commit, `remove_child_from_container`, and
host-node cleanup.

The execution stays canary-scoped. Public root/renderers, React DOM,
react-test-renderer, native, package behavior, hydration, and broad traversal
claims remain blocked.

## Changed Files

- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-862-root-unmount-container-execution.md`

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features root_work_loop_root_unmount
cargo test -p fast-react-reconciler --all-features host_work
cargo test -p fast-react-reconciler --all-features root_commit_deletion
cargo check -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
```

## Evidence Gathered

- Reused Worker 855's one-level HostRoot mount/commit host execution path and
  retained its `HostWorkResult` so unmount consumes source-owned detached host
  records from the prior mount.
- Added a narrow crate-private deletion preflight in `host_work.rs` that checks
  committed current identity, deletion mutation host children, and every
  host-node cleanup record before any host call.
- Added a crate-private deletion cleanup wrapper that applies existing
  HostRoot deletion cleanup through the retained detached host records and
  exposes cleanup counts for root-work-loop assertions.
- Added a root-work-loop mount helper and unmount executor that marks the
  previously committed root children for deletion, commits the unmount, runs the
  deletion preflight, applies two `remove_child_from_container` calls, and then
  applies host-node cleanup.
- New root-work-loop tests prove:
  - positive sync unmount removes both one-level root host children and applies
    one instance detach plus two text invalidations;
  - stale detached host evidence is rejected before container removal;
  - cross-root mount evidence is rejected before host calls;
  - double replay and render-after-unmount evidence are rejected before host
    calls.

## Verification Results

- `root_work_loop_root_unmount`: passed, 4 tests.
- `host_work`: passed, 61 tests.
- `root_commit_deletion`: passed, 7 tests.
- `cargo check -p fast-react-reconciler --all-features`: passed.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Risks Or Blockers

- This remains a private test-host canary path; no public renderer/root API now
  executes unmount host mutations.
- The proof covers committed one-level HostRoot output only. Nested traversal,
  portals, suspense/offscreen, hydration, refs/effects, and public DOM/native
  surfaces remain separate blocked work.
- The deletion preflight is intentionally narrow to root/host-parent deletion
  mutations and cleanup records; broader mixed mutation execution should keep
  using source-owned evidence gates before public wiring.

## Recommended Next Tasks

1. Add private execution coverage for broader deletion shapes only after their
   source-owned finished-work and detached-host evidence is accepted.
2. Keep public root/renderer unmount behavior blocked until it can consume the
   same commit-current, deletion, and cleanup preflight guarantees.
