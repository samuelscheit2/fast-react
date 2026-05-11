# Worker 934: Transition Queue/Lane Scheduler Continuation

## Summary

Closed the public current-event transition-lane leak on `RootSchedulerState`
while preserving the private transition queue/lane continuation evidence. The
transition lane reader is no longer public, and the public `Debug`/`PartialEq`
observers for `RootSchedulerState` no longer expose the private
`current_event_transition_lane` field.

No public Scheduler timing, transition hook, `act`, React DOM, test-renderer,
package, or renderer compatibility surface was opened.

## Changed Files

- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `worker-progress/worker-934-transition-queue-lane-scheduler-continuation.md`

## Exact Leak Closure

- Changed `RootSchedulerState::current_event_transition_lane()` from public to
  private scheduler state access.
- Replaced derived `Debug` with a manual public-surface `Debug` implementation
  that omits `current_event_transition_lane`.
- Replaced derived `PartialEq`/`Eq` with public-surface equality that ignores
  `current_event_transition_lane`, preventing equality checks from observing
  private transition-lane changes.
- Added transition-focused regressions proving private canaries can still read
  the event lane internally while an external crate cannot call the getter
  through either `RootSchedulerState::new()` or
  `FiberRootStore::root_scheduler()`.

## Exact Continuation Path Preserved

Accepted path remains:

1. `update_container_transition_for_canary`
2. `record_transition_lane_scheduler_request_from_update_diagnostics_for_canary`
3. `execute_scheduled_root_callback`
4. `host_root_update_queue_lane_handoff_for_canary`
5. `execute_transition_scheduler_continuation_for_queue_lane_handoff_for_canary`
6. `commit_host_root_update_queue_lane_handoff_with_finished_work_pending_commit_for_canary`

## Evidence Gathered

- Existing accepted transition continuation canary still proves scheduler,
  transition entanglement, queue/lane handoff, finished-work commit handoff,
  and current switch evidence.
- Negative transition canaries still reject stale diagnostics, wrong
  entanglement, wrong selected lanes, wrong finished lanes, replay after
  commit, skipped-lane commit attempts, cross-root evidence, and caller-built
  rows.
- New public API probe builds a temporary external crate. Its debug probe runs
  successfully without exposing `current_event_transition_lane`, and its getter
  probe fails to compile for both direct scheduler and root-store scheduler
  paths.

## Commands Run

- `cargo test -p fast-react-reconciler --all-features root_scheduler_transition`
- `cargo test -p fast-react-reconciler --all-features root_scheduler_queue_lane_continuation`
- `cargo test -p fast-react-reconciler --all-features root_updates`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all --check`
- `git diff --check`

All final commands passed. An earlier `cargo fmt --all --check` found formatting
drift in the new code; `cargo fmt --all` was applied before the final rerun.

## Risks Or Blockers

- The continuation remains intentionally private and test-only. It depends on
  the current canary shape of `RootSchedulerCallbackExecutionRecord` and the
  existing queue/lane commit handoff validators.
- Public `RootSchedulerState` equality now reflects public scheduler fields
  only. Internal transition-lane assertions should continue using private
  canary evidence rather than public equality.
- Overlap risk is limited to `root_scheduler.rs`, which was within scope. No
  active worker overlap was observed in the worktree.

## Recommended Next Tasks

- Add public transition event lane lifecycle semantics only after the private
  scheduler/commit path is accepted.
- Consider a follow-up canary for multiple entangled transition updates once
  source-owned queue/lane evidence for multi-transition batches is accepted.
