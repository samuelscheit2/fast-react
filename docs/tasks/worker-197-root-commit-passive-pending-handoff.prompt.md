# Worker 197: Root Commit Passive Pending Handoff

Objective: add a narrow internal HostRoot commit handoff for already-accepted
pending passive metadata so future passive-effect workers can see which root,
finished work, and lanes were committed, without traversing effects, flushing
passive work, implementing hooks, invoking callbacks, or touching DOM/native
renderers.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 173, 179, 188, and 193.
- Inspect `crates/fast-react-reconciler/src/root_config.rs`,
  `fiber_root.rs`, and `root_commit.rs`.
- Inspect React 19.2.6 reference `ReactFiberWorkLoop.js` and
  `ReactFiberCommitWork.js` only for pending passive metadata shape and
  ordering, not for full effect traversal.

## Write Scope

- Primary: `crates/fast-react-reconciler/src/root_commit.rs` and, if needed for
  existing metadata accessors only, `crates/fast-react-reconciler/src/root_config.rs`.
- Report: `worker-progress/worker-197-root-commit-passive-pending-handoff.md`.
- Do not edit function-component render, hook list code, sync flush,
  test-renderer crate, JS packages, or master docs.

## Implementation Notes

- Keep the handoff inert metadata only.
- Fail closed if the committed render record is stale or lanes are empty; do not
  relax existing commit validation.
- Tests should prove normal commits leave pending passive state empty when no
  passive metadata exists, and any new helper records only deterministic root,
  finished-work, and lane data.
- Do not implement passive unmount/mount traversal or flushing.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo test -p fast-react-reconciler --all-features root_config`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

