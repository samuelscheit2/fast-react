# Worker 191: Root Scheduler Lane Selection Integration

You are worker 191 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-191-root-scheduler-lane-selection-integration.md`.

Objective: integrate the accepted core `RootLaneState::get_next_lanes` helper
into the reconciler root scheduler's lane selection path, preserving existing
callback reuse/cancel behavior while adding focused coverage for suspended,
pinged, prewarm, idle, and entangled lane selection.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-128-reconciler-root-scheduler-foundation.md`
- `worker-progress/worker-155-scheduler-callback-execution.md`
- `worker-progress/worker-156-root-lane-selection-helpers.md`
- `crates/fast-react-core/src/root_lanes.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`

Write scope:
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- Minimal exports in `crates/fast-react-reconciler/src/lib.rs` only if needed
- Focused reconciler tests in touched modules
- `worker-progress/worker-191-root-scheduler-lane-selection-integration.md`

Do not edit core lane helpers, sync-flush commit integration, root commit
implementation, DOM packages, test-renderer packages, native bridge files,
hooks/function-component work, or public Scheduler package files. You are not
alone in the codebase; do not revert other workers' changes and adapt if
concurrent scheduler branches changed nearby code.

Implementation requirements:
- Replace the scheduler's simplified highest-priority pending-lane selection
  with the accepted `RootLaneState::get_next_lanes` semantics where the
  scheduler chooses work for microtasks and scheduled callback execution.
- Keep entanglement expansion through existing root-lane bookkeeping after
  selecting the scheduling priority.
- Preserve existing behavior for no-work, sync work, scheduled callbacks,
  reused callbacks, stale callbacks, and no host mutation/current switching.
- Add focused tests showing suspended unpinged lanes do not schedule async
  callbacks, pinged lanes do schedule, prewarm behavior stays fail-closed when
  there is a pending commit, idle work waits behind suspended non-idle work,
  and entangled lanes expand after priority selection.
- Keep `get_next_lanes_to_flush_sync` integration out of scope unless it is a
  tiny local refactor required by this change; if deferred, document that in
  the worker report.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo test -p fast-react-reconciler --all-features root_work_loop`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`
