# Worker 156: Root Lane Selection Helpers

## Goal

- Status: complete
- Objective: add core root lane selection helpers needed by scheduler, sync flush, and future Suspense/Offscreen work, without touching reconciler root commit or public Scheduler code
- Final pre-completion `get_goal` check: status `active` for the same objective.

## Progress

- Initialized worker goal and recorded active goal status/objective.
- Read `WORKER_BRIEF.md`; did not read `ORCHESTRATOR.md`.
- Implemented core-only root lane selection helpers and tests.
- Ran all required verification commands successfully.
- Integrated with current `main` and reran the core verification gates.

## Summary

- Added React 19.2.6-grounded `RootLaneState::get_next_lanes`,
  `RootLaneState::get_next_lanes_to_flush_sync`, and
  `RootLaneState::check_if_root_is_prerendering`.
- Added exported free-function wrappers for future scheduler/sync-flush callers.
- Preserved existing `highest_priority_pending_lanes` behavior and tests.
- Kept the work inside core lane bookkeeping; no reconciler, DOM,
  test-renderer, native, package, root commit, or public Scheduler code was
  touched.
- Documented unsupported Offscreen/Suspense behavior in tests by failing closed
  for fully warm suspended Offscreen work until a ping or update changes lane
  state.

## Changed Files

- `crates/fast-react-core/src/root_lanes.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-156-root-lane-selection-helpers.md`

## Evidence Gathered

- `WORKER_BRIEF.md` confirmed the write scope and React reference clone/tag.
- `worker-progress/worker-147-suspense-offscreen-refresh.md` identified the
  missing core `get_next_lanes`, `get_next_lanes_to_flush_sync`, and
  prerendering helpers plus the needed test matrix.
- `worker-progress/worker-047-core-root-lane-bookkeeping.md` confirmed current
  root lane state is pure core bookkeeping and that scheduler integration was
  intentionally excluded from that slice.
- `crates/fast-react-core/src/root_lanes.rs` already had pending, suspended,
  pinged, warm, expired, entangled, hidden update, and retry bookkeeping.
- `crates/fast-react-core/src/lane.rs` already had the needed lane masks and
  `lanes_of_equal_or_higher_priority`, so no lane primitive changes were
  required.
- React source checked directly at
  `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js`
  for `getNextLanes`, `getNextLanesToFlushSync`,
  `checkIfRootIsPrerendering`, `getHighestPriorityLanes`, and sync/hydration
  lane masks.

## Tests Added

- Pending/unblocked lane selection and unchanged highest-priority pending
  behavior.
- Suspended, pinged, warm/prewarm, and pending-commit selection behavior.
- Idle-only roots and idle deferral while non-idle work remains pending.
- Retry grouping and suspended retry ping behavior.
- Sync update grouping and WIP non-interruption, including the
  Default-vs-Transition rule.
- Entanglement remaining separate from scheduling-priority selection.
- Expired lane visibility to callers without changing selection priority.
- Sync flush exclusion of suspended unpinged lanes, ping inclusion,
  equal-or-higher priority batching, forced `SyncLane`, and hydration isolation.
- Offscreen warm-suspended fail-closed behavior until pinged.

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,220p' worker-progress/worker-147-suspense-offscreen-refresh.md`
- `sed -n '1,260p' worker-progress/worker-047-core-root-lane-bookkeeping.md`
- `sed -n '1,260p' crates/fast-react-core/src/root_lanes.rs`
- `sed -n '220,520p' crates/fast-react-core/src/root_lanes.rs`
- `sed -n '520,980p' crates/fast-react-core/src/root_lanes.rs`
- `sed -n '980,1180p' crates/fast-react-core/src/root_lanes.rs`
- `sed -n '1,260p' crates/fast-react-core/src/lane.rs`
- `sed -n '260,620p' crates/fast-react-core/src/lane.rs`
- `sed -n '1,220p' crates/fast-react-core/src/lib.rs`
- `rg -n "function getNextLanes|getNextLanesToFlushSync|function getHighestPriorityLanes|function getHighestPriorityLane|includesSyncLane|SyncUpdateLanes|TransitionLanes|RetryLanes|IdleLane|markRoot" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js`
- `sed -n '1,260p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js`
- `sed -n '260,560p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js`
- `sed -n '560,760p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js`
- `sed -n '760,1110p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js`
- `rg -n "highest_priority_pending_lanes|get_next_lanes|flush_sync|sync_flush|RootLaneState|root_lanes" crates worker-progress -g '!target'`
- `cargo fmt --all`
- `cargo test -p fast-react-core --all-features root_lanes` (first run found one bad assertion, fixed)
- `cargo fmt --all && cargo test -p fast-react-core --all-features root_lanes`
- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- `git diff --check`
- `git status --short --untracked-files=all`

## Verification

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-core --all-features root_lanes`: passed, 30 tests.
- `cargo test -p fast-react-core --all-features`: passed, 92 unit tests and 0 doctests.
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`: passed.
- `git diff --check`: passed.

## Delegated Checks

- Spawned read-only explorer `/root/lane_selection_react_check` to inspect the
  same React lane-selection area. It did not return useful output before
  verification completed and was closed; conclusions are based on direct source
  inspection and local tests.

## Risks Or Blockers

- These helpers are not wired into `fast-react-reconciler` yet; current root
  scheduler behavior will not change until a later worker replaces the
  simplified `highest_priority_pending_lanes` scheduling path.
- Core still has no wakeable identity, ping listener registry, Suspense
  boundary retry queue, Offscreen visibility state, hydration boundary state,
  render unwind, or commit behavior. Tests only cover lane states that are
  already representable locally.
- Hidden update bookkeeping remains count-based, matching the existing core
  limitation until update handles are owned where Offscreen bits can be
  stripped after commit.

## Recommended Next Tasks

- Integrate `RootLaneState::get_next_lanes` into root scheduler selection while
  preserving callback reuse/cancel semantics.
- Use `RootLaneState::get_next_lanes_to_flush_sync` in cross-root sync flush
  planning when forced transition lanes are present.
- Add reconciler-level tests for `check_if_root_is_prerendering` preventing
  suspended prerender work from taking the sync fast path.
