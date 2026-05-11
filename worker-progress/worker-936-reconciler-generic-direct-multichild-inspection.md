# Worker 936 - Reconciler Generic Direct Multi-Child Inspection

## Summary

- Added a reconciler-owned source-bound private inspection path for committed
  `HostRoot -> HostComponent -> [HostText, HostText]` without changing the
  generic shape-only `inspect_test_renderer_committed_fiber_tree(store, root_id)`
  boundary.
- The new path mints
  `ReconcilerDirectMultiChildCommittedFiberSource` from a real
  `HostRootCommitRecord` plus live committed topology, then consumes it through
  `inspect_reconciler_direct_multi_child_committed_fiber_tree`.
- Preserved public serialization, react-test-renderer public compatibility,
  React DOM, native execution, broad renderer, act, Scheduler, and package
  compatibility blockers.

## Changed Files

- `crates/fast-react-reconciler/src/private_fiber_inspection.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-936-reconciler-generic-direct-multichild-inspection.md`

## Exact Inspection And Currentness Path

- Source minting:
  `record_reconciler_direct_multi_child_committed_fiber_source(store, commit, component, first_text, second_text)`.
- Required source/currentness evidence:
  - `HostRootCommitRecord` root, previous current, committed current/finished work,
    finished lanes, remaining lanes, and pending lanes.
  - Store current root equality with the commit current.
  - Cleared root `finished_work`/`finished_lanes` after commit consumption.
  - HostRoot state-node/root-token identity and alternate link back to the
    previous current.
  - Exact root child identity, component child identity/order, text sibling
    order, props, state node handles, lanes, child lanes, and source rows.
  - Non-empty host/root state-node presence and explicit compatibility-claim
    blockers.
- Inspection:
  `inspect_reconciler_direct_multi_child_committed_fiber_tree(store, source)`
  validates source rows against the live committed store, then returns
  `ReconcilerDirectMultiChildCommittedFiberInspection`.
- Generic boundary:
  `inspect_test_renderer_committed_fiber_tree(store, root_id)` still rejects the
  direct adjacent-text host component with `UnexpectedChildCount`.

## Evidence Added

- Positive canary for the new source-bound path accepting direct
  `HostComponent -> [HostText, HostText]`.
- Negatives for missing source evidence, missing host-node/state-node presence,
  caller-built source rows, stale cloned inspection, cross-root source mismatch,
  reversed text siblings, missing text sibling, missing state node, source lane
  drift, live row drift, and public/native/package compatibility claims.
- Existing generic single-host/text, nested/multi-child root, function wrapper,
  and public compatibility blocker tests remain intact.

## Commands Run

- `cargo check -p fast-react-reconciler --all-features`
- `cargo test -p fast-react-reconciler --all-features private_fiber_inspection --no-run`
- `cargo test -p fast-react-reconciler --all-features private_fiber_inspection`
- `cargo test -p fast-react-reconciler --all-features direct_multi_child`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `git diff --check`

## Results

- `direct_multi_child`: 11 passed.
- `private_fiber_inspection`: 23 passed.
- `cargo check`, `cargo fmt --all --check`, and `git diff --check` passed.

## Risks Or Blockers

- This intentionally remains a private reconciler inspection path. It does not
  enable public toJSON/toTree/TestInstance, native bridge execution, React DOM,
  act, Scheduler, package, or broad renderer compatibility.
- The source record is opaque to downstream crates but can be cloned like any
  Rust value. Stale clones are rejected when the committed current/root rows
  move; a bit-for-bit identical in-process clone before currentness changes is
  not distinguishable from the original source record.
- Overlap risk is low: this touched only private inspection/export surfaces, not
  scheduler, root work loop, or host commit execution code.

## Recommended Next Tasks

- Decide whether a future test-renderer-owned consumer should use this
  source-bound reconciler path, still behind private serialization/native
  blockers.
- If real HostNodeStore ownership is later threaded into committed inspection,
  replace the current state-node-presence proof with direct host-node metadata
  validation.
