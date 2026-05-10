# Worker 156: Root Lane Selection Helpers

You are worker 156 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-156-root-lane-selection-helpers.md`.

Objective: add core root lane selection helpers needed by scheduler, sync
flush, and future Suspense/Offscreen work, without touching reconciler root
commit or public Scheduler code.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-147-suspense-offscreen-refresh.md`
- `worker-progress/worker-047-core-root-lane-bookkeeping.md`
- `crates/fast-react-core/src/root_lanes.rs`
- `crates/fast-react-core/src/lane.rs`
- React reference `ReactFiberLane.js` lane-selection functions as needed.

Write scope:
- `crates/fast-react-core/src/root_lanes.rs`
- `crates/fast-react-core/src/lane.rs` only if a tiny helper is required
- `crates/fast-react-core/src/lib.rs` only for exports
- Focused tests in core
- `worker-progress/worker-156-root-lane-selection-helpers.md`

Do not touch reconciler, DOM, test-renderer, native, or package files. You are
not alone in the codebase; keep pure core helpers separable from scheduler
integration.

Implementation requirements:
- Add `get_next_lanes` and sync-flush lane selection helpers that operate on
  existing `RootLaneState`.
- Preserve current simple `highest_priority_pending_lanes` behavior where
  existing tests depend on it.
- Fail closed or document unsupported Suspense/Offscreen semantics in tests.
- Add React-source-grounded unit tests for pending, suspended, pinged, expired,
  idle, retry, and sync cases that are already representable locally.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features root_lanes`
- `cargo test -p fast-react-core --all-features`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- `git diff --check`

