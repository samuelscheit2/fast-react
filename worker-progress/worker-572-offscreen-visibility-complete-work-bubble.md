# Worker 572: Offscreen Visibility Complete-Work Bubble

Date: 2026-05-10

## Goal Tool State

- First action: `create_goal` was called before repository research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status recorded before final verification: `active`.
- Active goal objective recorded from `get_goal`: Add private Offscreen
  visibility diagnostics for complete-work bubbling and subtree flag blockers
  after the accepted begin-work visibility gate.

## Summary

- Added a private transition identity comparator for Offscreen visibility
  transition records so complete-work diagnostics can reject stale begin-work
  records while ignoring the phase-specific blocker label.
- Extended the test-only complete-work Offscreen visibility blocker to consume
  the accepted begin-work Offscreen record, require a narrow single-child
  diagnostic shape, reject stale transition metadata, and preserve the current
  fail-closed feature marker.
- Recorded complete-work subtree bubbling intent, candidate child lanes,
  candidate subtree flags, and blockers explaining why subtree flags are not
  applied and why `Visibility` effects are not scheduled.
- Kept child traversal, host mutation, visibility effect scheduling, and public
  Offscreen compatibility blocked.

## Changed Files

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/complete_work.rs`
- `worker-progress/worker-572-offscreen-visibility-complete-work-bubble.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and worker
  reports 559, 480, 522, 351, and 227.
- Inspected the current begin-work Offscreen transition diagnostics and the
  test-only complete-work handoff helper.
- Checked React 19.2.6 reference source:
  `ReactFiberCompleteWork.js` schedules `Visibility` on Offscreen
  hidden/visible changes and conditionally bubbles hidden subtree flags only at
  Offscreen priority; `ReactFiberCommitWork.js` performs the actual host
  hide/unhide and passive visibility work later in commit.
- No nested agents were spawned.

## Commands Run

- `create_goal`
- `get_goal`
- `git status --short --branch`
- `sed` / `rg` inspections of required reports, worker reports, reconciler
  source, core flag/bubbling helpers, and React reference Offscreen
  begin/complete/commit source.
- `cargo fmt --all`
- `cargo test -p fast-react-reconciler --all-features complete_offscreen_visibility_transition_blocker -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features begin_work_fails_closed_with_offscreen_visibility_transition_diagnostics -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features offscreen -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features complete_work -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features begin_work_fails_closed_with_suspense_and_offscreen_child_shape_diagnostics -- --nocapture`
- `cargo test -p fast-react-reconciler --all-features begin_work_fails_closed_with_suspense_list_and_activity_child_shape_diagnostics -- --nocapture`
- `cargo fmt --all --check`
- `git diff --check`

## Verification

- Focused new complete-work Offscreen blocker filter passed: 2 tests.
- Existing begin-work Offscreen visibility transition diagnostic passed: 1
  test.
- Required Offscreen filter passed: 7 tests.
- Required complete-work filter passed: 20 tests.
- Suspense/Offscreen blocker test passed: 1 test.
- SuspenseList/Activity blocker test passed: 1 test.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed.

## Risks Or Blockers

- No blockers are known.
- The complete-work diagnostic intentionally admits only a single-child
  Offscreen shape so it can document the bubbling boundary without opening
  broader child traversal.
- Candidate child lanes and subtree flags are read for diagnostics only; they
  are not applied to the Offscreen fiber, no `Visibility` flag is set, and no
  host mutation or public compatibility path is exposed.

## Recommended Next Tasks

- Preserve the begin-work to complete-work transition identity check when real
  Offscreen complete-work support starts replacing this private diagnostic.
- Add public conformance blockers only if a package-facing surface starts to
  expose Offscreen visibility behavior.
