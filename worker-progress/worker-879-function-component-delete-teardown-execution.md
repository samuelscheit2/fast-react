# Worker 879 - FunctionComponent Delete Teardown Execution

Date: 2026-05-11

## Summary

Added a narrow private root-work-loop proof that a source-owned
FunctionComponent single HostComponent child can be deleted as a FunctionComponent
subtree and executed through the accepted deleted-subtree teardown pipeline:
ref cleanup gate, passive destroy, host subtree detach, then host-node cleanup.

The proof remains test-only and canary-scoped. Public hooks/effects/refs, public
root rendering, renderer packages, React DOM/native behavior, hydration, portals,
Suspense/Offscreen, and broad deletion traversal remain blocked.

## Changed Files

- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-879-function-component-delete-teardown-execution.md`

## Evidence Gathered

- Built a private HostComponent parent containing a FunctionComponent that
  resolves source-owned output to one HostComponent child with a HostText child.
- Committed that topology, then rendered a deletion shape where the
  FunctionComponent subtree is source-owned by a deletion list.
- Revalidated committed current, root/lane identity, finished HostRoot topology,
  FunctionComponent return/child identity, deletion list source, skipped
  non-host deletion mutation, ref cleanup metadata, passive destroy metadata,
  host detachment plan, and host cleanup order before host calls.
- Executed ordered teardown with private test-control evidence:
  ref cleanup return, passive destroy callback, `remove_child`, text invalidation,
  and instance detach.
- Added negative coverage for missing ref/passive evidence, stale
  FunctionComponent topology, cross-root source evidence, and caller-built
  request replay before host calls.
- Adjusted the private root-commit deletion detachment plan to derive the deleted
  root tag from subtree traversal evidence when the deleted root is a
  FunctionComponent, since FunctionComponent roots do not themselves emit host
  cleanup records.

## Commands Run

- `cargo test -p fast-react-reconciler --all-features root_work_loop_function_component_deleted_subtree_teardown -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_work_loop_function_component -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_work_loop_deleted_subtree -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features deleted_subtree -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features passive_effects -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features host_work_deletion -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features root_commit_deletion -- --nocapture`
- `cargo fmt --all`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all --check`
- `git diff --check`

## Risks Or Blockers

- The FunctionComponent deletion proof uses a private HostComponent parent
  fixture because the current host detachment canary only admits HostComponent
  host parents.
- The path proves one FunctionComponent with one HostComponent child; multiple
  host children, root-container FunctionComponent unmount, portals,
  Suspense/Offscreen, and public renderer execution are still blocked.

## Recommended Next Tasks

1. Add a separate private root-container FunctionComponent unmount proof once
   root-container ref/passive ordering and host detachment are accepted together.
2. Extend deletion teardown only after multi-host-child and broader
   FunctionComponent subtree traversal have source-owned commit evidence.
