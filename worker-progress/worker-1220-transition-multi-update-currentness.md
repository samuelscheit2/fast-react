# Worker 1220: Transition Multi-Update Currentness

## Summary

- Added private/test-only evidence for two HostRoot transition updates in the
  same transition lane to continue through the scheduler queue-lane handoff and
  commit currentness path.
- Kept the Worker 1215 single-transition queue-lane proof narrow: generic
  `proves_source_owned_lane_handoff()` still requires distinct compatible lane
  rows, and the repeated-lane path uses dedicated same-transition validators.
- Added a same-lane multi-update scheduler continuation record, currentness
  record, source-token handoff, source metadata checks, and live tree state
  validation for the committed HostRoot tree.
- Added focused positive and negative canaries for repeated update sequence
  rows, lane/count mismatches, stale callback replay, source-owned commit
  currentness, and non-claims for public compatibility surfaces.
- Repaired the branch onto current `main` at
  `7d77514434fcfc2f4517cbbea741f9a11a2e3b03` with merge repair commit
  `33f096ecf5960610b4d0497591d1594595f01cb8`, preserving Worker 1221's
  entangled transition queue-lane canaries beside this branch's same-lane
  multi-update canaries.

## Changed Files

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_scheduler/tests.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `worker-progress/worker-1220-transition-multi-update-currentness.md`

## Evidence Gathered

- Positive scheduler canary accepts two transition updates in
  `Lane::TRANSITION_1`, both owned by the same HostRoot update queue, and
  commits only when the render, queue handoff, scheduler callback, finished work
  handoff, and committed root state agree.
- Positive currentness canary consumes the same-lane multi-update source token,
  proves root token/current/finished-work identity, selected/finished/remaining
  lanes, update sequence IDs, resulting element, committed element after
  consume, committed child topology, mutation records, and one-shot consumption.
- Negative canaries reject duplicated single-update claims, duplicate update IDs,
  missing update rows, reordered source rows, wrong selected lanes, wrong
  finished lanes, applied count mismatch, and replay after commit/stale callback.
- Currentness negative canaries reject preconsume clones, caller-shaped metadata
  with preserved source tokens, replay after consumption, and stale live roots.
- The same-transition queue proof remains separate from the generic Worker 1215
  queue proof, so existing single-transition/distinct-lane behavior is not
  widened for public or generic private consumers.
- Merge repair preserved Worker 1221's distinct-transition entangled helper and
  three tests:
  `root_scheduler_transition_entangled_queue_lane_continuation_accepts_two_transition_lanes`,
  `root_scheduler_transition_entangled_queue_lane_continuation_rejects_missing_entanglement_and_one_selected_lane`,
  and
  `root_scheduler_transition_entangled_queue_lane_continuation_rejects_duplicate_update_rows`.
  The same-lane duplicate-row rejection still expects ordered duplicate rows,
  while the entangled duplicate-row rejection still expects reordered/duplicate
  aggregate evidence to fail source ownership.

## Commands Run

- `cargo fmt --all`
  - Applied formatting during merge repair.
- `git diff --check`
  - Passed.
- `cargo test -p fast-react-reconciler --all-features root_scheduler_transition`
  - Passed: 26 tests.
- `cargo test -p fast-react-reconciler --all-features root_scheduler_queue_lane_continuation`
  - Passed: 13 tests.
- `cargo test -p fast-react-reconciler --all-features finished_work_queue_lane_commit_currentness`
  - Passed: 5 tests.
- `cargo test -p fast-react-reconciler --all-features root_updates`
  - Passed: 34 tests.
- `cargo test -p fast-react-reconciler --all-features root_commit`
  - Passed: 128 tests.
- `cargo check -p fast-react-reconciler --all-features`
  - Passed.
- `cargo fmt --all --check`
  - Passed.

## Compatibility Non-Claims

- This remains private Rust/test-only canary evidence.
- No public Scheduler timing, public root, React DOM, transition hook, `act`,
  test-renderer, native runtime, package, renderer, or public effect
  compatibility is claimed.
- No generic public compatibility is inferred from accepting repeated update rows
  in one transition lane.

## Risks Or Blockers

- No blockers found.
- Accepted current-main files outside this worker's manual write scope were
  carried by the merge commit as merge-parent content and were not manually
  refactored during conflict repair.
- The same-lane multi-update path is intentionally narrow and fixed to the
  two-update canary shape used by these tests. Broader batching should add a
  separate audited proof rather than widening this one opportunistically.
- Future changes to Worker 1215 transition continuation metadata must keep the
  same-lane multi-update source metadata comparison and source-token consumption
  in sync.

## Recommended Next Tasks

- Keep public Scheduler/root/React DOM/hooks/act/test-renderer/native/package/
  renderer compatibility blocked until separate public behavior gates are
  accepted.
- If more than two same-transition updates are admitted, add explicit N-row
  ordering and replay canaries before changing this helper shape.

## Commit

- Substantive implementation commit:
  `1bfe7e1133f3fab64d3ced1eb4fab8890e257978` (`Add same transition multi
  update currentness canary`).
- Merge repair commit:
  `33f096ecf5960610b4d0497591d1594595f01cb8` (`Merge branch 'main' into
  worker/1220-transition-multi-update-currentness`).
- Final branch `HEAD` is reported in the worker handoff after the report hash
  commit is created. A commit cannot contain its own final hash in this tracked
  report.
