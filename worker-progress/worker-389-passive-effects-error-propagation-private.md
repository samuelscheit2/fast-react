# Worker 389: Passive Effects Error Propagation Private

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active status from `get_goal`: `active`.
- Active objective from `get_goal`: extend private passive effect
  create/destroy execution diagnostics to preserve error ordering and blocked
  root-error propagation evidence across mixed unmount and mount records.

## Summary

- Added unified private passive callback execution error diagnostics that merge
  destroy and mount-create executor errors into one deterministic
  `error_order` sequence.
- Added blocked root-error propagation records carrying the passive root's
  `onUncaughtError`, `onCaughtError`, and `onRecoverableError` handles while
  explicitly reporting no root error update scheduling, no callback invocation,
  and no public act error aggregation.
- Added a crate-private helper that runs both destroy and mount-create
  executors in one passive flush canary so mixed unmount/mount errors can prove
  cross-phase ordering.
- Extended the post-passive sync-flush root scheduler gate with matching
  blocked root-error propagation evidence.
- Kept public `act`, renderer error callbacks, DOM mutation, public effect
  execution, scheduler-driven passive execution, and compatibility claims
  blocked.

## Changed Files

- `crates/fast-react-reconciler/src/passive_effects.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `worker-progress/worker-389-passive-effects-error-propagation-private.md`

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read worker reports 326, 331, 349, 361, and 362. Worker report 388 was not
  present in this worktree.
- Inspected existing passive metadata flush, private destroy executor,
  mount-create executor, callback invocation gate, and post-passive
  sync-flush continuation gate.
- Checked React 19.2.6 reference source:
  - `flushPassiveEffectsImpl` runs passive unmount effects before passive
    mount effects, then calls `flushSyncWorkOnAllRoots`.
  - hook passive create/destroy errors are captured through commit-phase error
    handling.
  - commit-phase root errors enqueue sync root work and later report through
    root error callbacks, but those public callback paths remain outside this
    private slice.
- Spawned two explorer subagents for passive/root-scheduler inspection. They
  did not return usable summaries before implementation completed, so I closed
  them and did not base conclusions on their output.

## Tests Added Or Updated

- Added
  `passive_effects_callback_executor_errors_preserve_cross_phase_order_and_block_root_errors`.
  It runs both private executors against one update effect, records a destroy
  error before a mount-create error, preserves root/effect/callback metadata,
  and proves root error propagation remains blocked while retaining configured
  root error callback handles.
- Extended
  `root_scheduler_sync_flush_post_passive_gate_records_reentry_roots_data_only`
  to assert post-passive root-error propagation blockers and root option handle
  preservation.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features passive_effects
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features
git diff --check
```

Additional inspection used `rg`, `sed`, `git status --short`, `git diff`, and
`get_goal` against the required docs, worker reports, reconciler files, and the
pinned React reference source.

## Verification Results

Passed:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features passive_effects`: 20
  matching tests passed.
- `cargo test -p fast-react-reconciler --all-features root_scheduler`: 41
  matching tests passed.
- `cargo test -p fast-react-reconciler --all-features`: 328 unit tests passed
  plus 1 compile-fail doctest.
- `git diff --check`

## Risks Or Blockers

- No blockers.
- The new records are diagnostic only. They do not capture real commit-phase
  errors into root error updates, invoke root error callbacks, aggregate public
  act errors, mutate DOM, or change renderer public behavior.
- Returned destroy handles remain recorded but are still not persisted back to
  committed hook-effect storage.

## Recommended Next Tasks

- Add committed hook-effect ownership/traversal so passive records no longer
  depend on caller-supplied canary handoff metadata.
- Define the real commit-phase error capture path that schedules root error
  updates before enabling root error callback invocation.
- Keep public effect, renderer error callback, and public `act` compatibility
  claims behind separate conformance gates.
