# Worker 158: Core Hook State Queue

You are worker 158 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-158-core-hook-state-queue.md`.

Objective: implement pure core hook state update queue primitives for
useState/useReducer style queues, without adding a reconciler dispatcher,
function component rendering, or public hook facades.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-099-core-hook-state-queue-plan.md`
- `worker-progress/worker-112-core-hook-queue-implementation-plan.md`
- `worker-progress/worker-136-function-hooks-refresh.md`
- `crates/fast-react-core/src/lane.rs`
- Existing handle/arena style in `crates/fast-react-core/src/`
- React reference hook queue processing as needed.

Write scope:
- New hook queue module under `crates/fast-react-core/src/`
- Minimal exports in `crates/fast-react-core/src/lib.rs`
- Focused core unit tests
- `worker-progress/worker-158-core-hook-state-queue.md`

Do not touch reconciler dispatcher, function component files, DOM, packages, or
native bridge. Worker 157 may edit `lib.rs`; merge around it later. You are not
alone in the codebase.

Implementation requirements:
- Model circular pending update append and base queue rebasing with lanes.
- Keep state/action payloads generic enough for future opaque JS/native values,
  but test with simple copyable handles or integers.
- Return applied/skipped counts and remaining lanes.
- Add tests for insertion order, skipped-lane rebasing, eager no-op boundaries
  if representable, and stale handle failures if generations are used.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features hook`
- `cargo test -p fast-react-core --all-features`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- `git diff --check`

