# Worker 954 - HostWork Root Child Replacement Execution

## Summary

- Added a private test-host root child replacement path for same-root updates
  where the current single root child tag differs from the next source root
  child tag.
- Replacement is modeled as source-owned root deletion plus root placement:
  the old current child is marked on the HostRoot deletion list and the new
  source child is completed with `Placement`, then commit execution applies
  `RemoveDeletedFromContainer` before `AppendPlacementToContainer`.
- Added a private replacement execution request/diagnostic that consumes
  finished-work handoff evidence, validates exact deletion/placement records,
  executes mutation apply plus deletion cleanup, records blockers for public
  root/React DOM/test-renderer/native/multi-level compatibility, and rejects
  replayed execution.
- Added focused canaries for `HostText -> HostComponent` and
  `HostComponent -> HostText`, including child-before-parent cleanup for the
  deleted component subtree.
- Audit repair: replacement execution now preflights deletion apply plus
  deletion cleanup before any host mutation, then consumes the execution
  identity before issuing container remove/append calls so cleanup failures
  cannot leave a replayable partial mutation.
- Audit repair: request extraction now uses store-backed single-root-child
  topology evidence, keeps same-tag root delete/place rejection at
  `SameTagReplacement`, and rejects nested host placements under a
  FunctionComponent as `UnsupportedReplacementEvidence`.

## Changed Files

- `crates/fast-react-reconciler/src/host_work.rs`
- `worker-progress/worker-954-hostwork-root-child-replacement-execution.md`

## Evidence Gathered

- Read the worker brief, master plan/progress, Worker 920 HostNode update
  currentness report, and deletion execution reports for Workers 867, 879,
  890, 819, 785, 693, 481, 414, and 206.
- Preserved Worker 920 scoped host-node currentness by validating the current
  root child's detached host record before creating a replacement and by
  keeping update payload currentness paths unchanged.
- Preserved deletion cleanup separation: mutation apply removes the old root
  child and appends the replacement first; host-node deletion cleanup runs
  afterward and keeps child-before-parent cleanup for deleted component
  subtrees.
- Added rejection coverage for cross-root detached-host evidence, stale current
  host nodes, cloned/tampered replacement requests, duplicate execution,
  request-level same-tag root delete/place, request-level unsupported
  multi-level host placement, and stale deleted-descendant cleanup preflight
  with retry leaving host operations unchanged.

## Commands Run

- `cargo check -p fast-react-reconciler --all-features`
- `cargo test -p fast-react-reconciler --all-features host_work_root_replacement -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features host_work_root_replacement`
- `cargo test -p fast-react-reconciler --all-features host_work`
- `cargo test -p fast-react-reconciler --all-features host_work_applies`
- `cargo test -p fast-react-reconciler --all-features host_work_deletion`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `git diff --check`

## Risks Or Blockers

- This remains private Rust `RecordingHost` evidence only. Public React DOM,
  react-test-renderer, native bridge, public root rendering, keyed replacement,
  fragment/portal/Suspense/Offscreen, hydration, refs/effects/resources/forms,
  and broad multi-level replacement compatibility remain blocked.
- The replacement execution request is intentionally narrow: exactly one
  HostRoot deletion apply record followed by exactly one HostRoot append
  placement record. Stable-sibling insert-before replacement and nested
  replacement require separate source-owned evidence.

## Recommended Next Tasks

- Add a separate private canary if root replacement with stable siblings needs
  insert-before ordering evidence.
- Keep any public/root-work-loop consumer behind a separate admission gate with
  dual-run oracle coverage.
