# Worker 445: Root Error Option Callback Records

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add private root error option callback
  records for render/commit errors so onUncaughtError, onCaughtError, and
  onRecoverableError handles are preserved as metadata without invoking user
  callbacks.

## Summary

- Added a crate-private `RootErrorOptionCallbackRecord` keyed by root and
  render/commit phase. It carries the root option handles for
  `onUncaughtError`, `onCaughtError`, and `onRecoverableError` and explicitly
  reports callback invocation, public error boundaries, and recoverable error
  compatibility as blocked.
- Added private render error and commit error option callback records that
  retain the originating `RootWorkLoopError` / `RootCommitError`, root lanes or
  finished work, and the shared callback metadata.
- Threaded the shared callback record through existing passive/root-scheduler
  root error capture and post-passive propagation records without changing
  their public behavior or invoking callbacks.

## Changed Files

- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `worker-progress/worker-445-root-error-option-callback-records.md`

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested worker reports 161, 389, 416, and 421. Worker 465 was not
  present in this worktree.
- Inspected existing root option handle storage, root commit error paths,
  root scheduler render/passive error records, and passive effect error
  propagation records.
- Checked local React 19.2.6 reference source for root storage of
  `onUncaughtError`, `onCaughtError`, and `onRecoverableError`,
  `createRootErrorUpdate`, `captureCommitPhaseError`, `logUncaughtError`,
  `logCaughtError`, and recoverable error reporting.
- Spawned one explorer subagent for a small code-pattern check, but it did not
  return a usable summary before implementation completed, so it was closed and
  did not affect conclusions.

## Tests Added Or Updated

- Added root config coverage for metadata-only root error option callback
  records.
- Added root commit coverage proving commit error records preserve all three
  configured handles without invoking callbacks or switching current.
- Added root scheduler coverage proving render error records preserve all three
  configured handles without scheduling callbacks or touching host output.
- Extended passive root error capture scheduler coverage to assert it now
  carries the shared commit-phase callback metadata record.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features root_config
cargo test -p fast-react-reconciler --all-features root_commit
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo test -p fast-react-reconciler --all-features
cargo fmt --all --check
git diff --check
```

Additional inspection used `rg`, `sed`, `git status --short`, `git diff`,
local React reference reads, and `get_goal`.

## Verification Results

- `cargo test -p fast-react-reconciler --all-features root_config` passed: 12
  focused tests.
- `cargo test -p fast-react-reconciler --all-features root_commit` passed: 39
  focused tests.
- `cargo test -p fast-react-reconciler --all-features root_scheduler` passed:
  47 focused tests.
- `cargo test -p fast-react-reconciler --all-features` passed: 365 unit tests
  and 1 compile-fail doc-test.
- `cargo fmt --all --check` passed.
- `git diff --check` passed, including the new progress report via
  intent-to-add.

## Risks Or Blockers

- No blockers.
- The new records are private diagnostic metadata only. They do not invoke JS
  callbacks, implement public error boundaries, schedule public root error
  reporting, or claim recoverable error compatibility.
- The render and commit error records are foundations for future routing work;
  they do not replace existing public error return shapes.

## Recommended Next Tasks

- Connect these private render/commit option records to future root error
  recovery diagnostics once real captured HostRoot error update payloads exist.
- Keep public root error callback invocation and recoverable error
  compatibility behind separate conformance gates.
