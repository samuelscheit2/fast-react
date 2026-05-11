# Worker 917 - Reconciler Direct Multi-Child Fiber Inspection

## Summary

- Added direct committed-fiber inspection support for
  `HostRoot->HostComponent->[HostText,HostText]` in the reconciler-owned
  private inspection module.
- Extended node inspection rows with actual `StateNodeHandle` identity while
  preserving the existing `state_node_present()` compatibility helper.
- Added public compatibility blocker accessors that keep public serialization,
  react-test-renderer public compatibility, React DOM compatibility, native
  execution, broad renderer compatibility, act, Scheduler, and package
  compatibility blocked.
- Added test-only reconciler source/currentness proof rows for the direct
  multi-child shape. The proof requires current-root identity, consumed
  finished-work metadata, exact parent/child/sibling order, state-node identity,
  props/text identity, and node lanes.

## Changed Files

- `crates/fast-react-reconciler/src/private_fiber_inspection.rs`
- `worker-progress/worker-917-reconciler-direct-multichild-fiber-inspection.md`

## Source And Currentness Fields

- Root/currentness: `root`, `root_token`, `previous_current`,
  `committed_current`, `store_current`, `finished_work_after_commit`, and
  `finished_lanes_after_commit`.
- HostRoot identity: `host_root.fiber`, `alternate`, `state_node`, `child`,
  `parent`, and `sibling`.
- HostComponent identity: `fiber`, `element_type`, `pending_props`,
  `memoized_props`, `state_node`, `lanes`, `child_lanes`, `parent`, `child`,
  `sibling`, and `index`.
- Text identity: each `HostText` `fiber`, `pending_props`, `memoized_props`,
  `state_node`, `lanes`, `parent`, `child`, `sibling`, and `index`.
- Store topology: live `FiberArena::child_ids(component)` must equal
  `[first_text, second_text]`.

## Commands Run

- `cargo test -p fast-react-reconciler --all-features private_fiber_inspection`
- `cargo test -p fast-react-reconciler --all-features direct_multi_child`
- `cargo test -p fast-react-reconciler --all-features multichild`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `git diff --check`

## Evidence Gathered

- Focused `private_fiber_inspection` filter passed: 16 tests.
- Direct multi-child filter passed: 9 tests.
- Existing multichild filter passed: 6 tests.
- Full reconciler package passed: 753 unit tests and 1 doc test.
- Negative canaries cover empty root, wrong root current, reversed text
  siblings, missing state node, extra child, nested component shape rejection,
  stale/cloned inspection rows, and public compatibility flags.

## Risks Or Blockers

- This stays in the reconciler inspection boundary. It does not claim public
  serialization, react-test-renderer, React DOM, native execution, broad
  renderer, act, Scheduler, or package compatibility.
- Existing test-renderer consumers may need a follow-up if they want to consume
  the new direct `HostComponent->[HostText,HostText]` shape publicly; this
  worker intentionally leaves those compatibility surfaces blocked.
- Overlap risk: Worker 899's test-renderer rows are accepted on main, but this
  work does not use those rows as source evidence. The proof derives from the
  live reconciler `FiberRootStore` and committed current fibers.

## Recommended Next Tasks

- Add a test-renderer-owned consumer only after deciding how public
  serialization should treat direct adjacent text children.
- Extend reconciler complete-work/source handoff coverage if a future worker
  needs direct HostComponent sibling text execution rather than inspection-only
  evidence.
