# Worker 349: Hook Effect Destroy Callback Execution Private

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active status from `get_goal`: `active`.
- Active objective from `get_goal`: Worker 349: add a private
  destroy-callback execution path for accepted passive effect metadata,
  including ordering and error records, without public useEffect compatibility
  or act flushing claims.

## Summary

- Added a crate-private passive destroy callback executor path that only runs
  when tests explicitly call the new `flush_passive_effects_after_commit_with_destroy_executor`
  helper.
- Kept the existing passive flush APIs metadata-only: accepted create and
  destroy handles are still carried without invocation unless the private
  executor path is selected.
- Added ordered destroy execution request/record metadata and separate
  executor error records. Executor-reported errors are captured in the flush
  result and do not turn accepted passive metadata into validation failures.
- Marked only executed unmount-phase destroy handles as invoked in flush
  records. Mount records and create callbacks remain non-invoked.
- Did not alter React JS hook dispatchers, public `useEffect`, public `act`,
  scheduler-driven passive flushing, host mutation, or renderer public APIs.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `worker-progress/worker-349-hook-effect-destroy-callback-execution-private.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 157, 173, 224, 250, 279, 296, and 301. Worker report
  326 was not present under `worker-progress/`; only its task prompt existed.
- Inspected `passive_effects.rs`, `function_component.rs`, `root_commit.rs`,
  and accepted hook effect arena helpers.
- Checked the pinned React 19.2.6 reference source:
  `ReactFiberCommitEffects.js` clears and calls effect destroy callbacks during
  hook passive unmount handling, captures commit-phase errors, and passive
  flush runs unmounts before mounts in `ReactFiberWorkLoop.js`.
- No nested agents were used.

## Tests Added Or Updated

- Added `passive_effects_destroy_executor_runs_unmounts_in_flush_order_and_records_errors`.
  It proves two accepted passive update destroys execute in unmount flush order,
  mount/create records remain non-invoked, an executor error is recorded, and
  the second destroy still runs after the first reports an error.
- Extended existing passive metadata tests to assert the old handoff flush path
  still records no destroy executions or destroy errors.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features passive_effects
cargo test -p fast-react-reconciler --all-features function_component
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features
get_goal
git diff --check
git add --intent-to-add worker-progress/worker-349-hook-effect-destroy-callback-execution-private.md && git diff --check; rc=$?; git reset -- worker-progress/worker-349-hook-effect-destroy-callback-execution-private.md >/dev/null; exit $rc
```

Additional inspection commands used `rg`, `sed`, `git status --short`,
`git log --oneline`, and `git diff` against the required docs, worker reports,
local reconciler files, the worker task prompt, and the pinned React source.

## Verification Results

Passed:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features passive_effects`: 12
  matching tests passed.
- `cargo test -p fast-react-reconciler --all-features function_component`: 46
  matching tests passed.
- `cargo test -p fast-react-reconciler --all-features`: 273 unit tests passed
  plus 1 compile-fail doctest.
- `git diff --check`
- Report-inclusive `git diff --check` with intent-to-add for the new progress
  file.

## Risks Or Blockers

- No blockers.
- Destroy execution remains private and test-controlled. There is still no
  public hook dispatcher wiring, no public `useEffect` compatibility claim, and
  no scheduler/act passive flush integration.
- The executor consumes opaque destroy handles from accepted handoff metadata;
  it does not yet clear or replace destroy handles in committed hook-effect
  instance storage after create callbacks, because committed hook ownership is
  still not modeled as a production traversal path.

## Recommended Next Tasks

- Add committed hook-effect ownership and traversal so passive destroys can be
  discovered without caller-supplied canary handoff records.
- Add the matching private create-callback execution path that can store the
  returned destroy handle once callback lifetime and error ownership are
  defined.
- Keep public effect behavior, renderer integration, scheduler passive
  execution, and public `act` compatibility behind separate conformance gates.
