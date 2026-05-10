# Worker 665: Sync Flush Cross Root Callback Execution

## Goal Evidence

- `create_goal` was called as the first action before file reads, research,
  implementation, or verification.
- Initial `get_goal` after setup returned status `active`.
- Final `get_goal` before report writing returned status `active`.
- Active goal objective:
  `advance private sync flush execution to drain accepted visible callbacks for two roots after matching commits, proving cross-root order without opening public callback compatibility`
- No nested managed agents were used.

## Summary

- Added a crate-private sync-flush execution diagnostic that drains accepted
  visible HostRoot update callbacks for committed sync-flush roots through the
  existing test-control callback gate.
- The sync-flush execution path first checks that accepted callback snapshots
  match committed root order, then validates every accepted visible snapshot
  against its matching commit before invoking any callback gate.
- Added cross-root execution records with committed root, commit order,
  per-root invocation order, flattened cross-root invocation order, update,
  callback, visibility, and test-control status.
- Added diagnostics proving two roots drain in committed sync-flush order while
  public JS callbacks, public root callback behavior, hidden callbacks, and
  root error callbacks remain blocked.
- Added a mismatch canary proving reversed accepted root order produces no
  invocations and leaves per-root callback gates intact.

## Changed Files

- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/sync_flush.rs`
- `worker-progress/worker-665-sync-flush-cross-root-callback-execution.md`

## Tests

- `cargo fmt --all --check`: passed.
- Requested combined focused command:
  `cargo test -p fast-react-reconciler sync_flush callback root_updates root_scheduler -- --nocapture`
  failed before running tests because Cargo accepts only one test filter before
  `--` (`unexpected argument 'callback' found`).
- Equivalent focused filters were run separately:
  - `cargo test -p fast-react-reconciler sync_flush -- --nocapture`: passed, 50
    tests.
  - `cargo test -p fast-react-reconciler callback -- --nocapture`: passed, 95
    tests.
  - `cargo test -p fast-react-reconciler root_updates -- --nocapture`: passed,
    16 tests.
  - `cargo test -p fast-react-reconciler root_scheduler -- --nocapture`: passed,
    67 tests.
- `git diff --check`: passed.

## Notes

- The change is private and test-control only. It does not touch passive
  effects, act queues, Scheduler mock JS, or React DOM root facade behavior.
- Public callback compatibility remains explicitly unclaimed.
