# Worker 475: Passive Effect Error Routing Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active status from `get_goal`: `active`.
- Active objective from `get_goal`: Record private root error routing
  diagnostics when passive create or destroy execution throws, preserving
  accepted root option callback metadata without invoking public callbacks.

## Summary

- Added private passive root error routing diagnostics for passive destroy and
  mount-create executor failures.
- Passive root error propagation now carries the accepted
  `RootErrorOptionCallbackRecord` for commit-phase root options instead of only
  copying raw callback handles.
- Per-error routing records tie each passive callback failure to its scheduled
  root error capture, propagation record, root option callback metadata, and
  explicit no-public-callback/no-public-boundary/no-public-act flags.
- Public root callbacks, public error boundaries, public act aggregation, and
  recoverable-error compatibility remain blocked.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `worker-progress/worker-475-passive-effect-error-routing-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and worker reports 416, 421, 445, and 450.
- Worker report 474 was not present in this worktree.
- Inspected current passive effect flush/error capture records, root scheduler
  passive capture records, root option callback metadata, and HostRoot commit
  passive handoff state.
- Checked React 19.2.6 reference source for passive hook create/destroy error
  handling: passive create and destroy throws route through
  `captureCommitPhaseError`, which creates a sync root error update and later
  reaches root option callbacks. This worker records private routing metadata
  only.
- No nested agents or explorer subagents were used.

## Commands Run

```sh
cargo test -p fast-react-reconciler --all-features passive_effects_callback_executor_errors_preserve_cross_phase_order_and_block_root_errors
cargo test -p fast-react-reconciler --all-features passive_effects
cargo test -p fast-react-reconciler --all-features root_commit
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo fmt --all
cargo test -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
```

Additional inspection used `rg`, `sed`, `git status --short`, `git diff`,
local React reference reads, and `get_goal`.

## Verification Results

- Focused passive routing test passed.
- `passive_effects` filter passed: 25 tests.
- `root_commit` filter passed: 44 tests.
- `root_scheduler` filter passed: 50 tests.
- `cargo test -p fast-react-reconciler --all-features` passed: 399 unit tests
  and 1 compile-fail doc test.
- `cargo fmt --all --check` passed.
- `git diff --check` passed before adding this report.
- Report-inclusive `git diff --check` with intent-to-add for the new progress
  file passed.

## Risks Or Blockers

- No blockers remain for this worker scope.
- The routing records are private diagnostics. They do not invoke public root
  error callbacks, implement public error boundaries, report recoverable errors,
  or claim public act compatibility.
- Root error captures still schedule private sync-lane metadata only; real
  captured HostRoot error update payload ownership remains future work.

## Recommended Next Tasks

- Add real captured HostRoot error update payload records when callback
  lifetime and error payload ownership are accepted.
- Keep public root callback invocation and public error-boundary compatibility
  behind separate gates.
