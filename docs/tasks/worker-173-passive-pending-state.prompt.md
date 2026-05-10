# Worker 173: Passive Pending State

You are worker 173 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-173-passive-pending-state.md`.

Objective: expand internal pending passive effect state records and tests so
future commit/effect workers can queue passive unmounts before mounts, without
implementing hooks or flushing passive effects.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-139-passive-ref-refresh.md`
- `worker-progress/worker-136-function-hooks-refresh.md`
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- React reference passive effect queue code as needed.

Write scope:
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- Focused tests
- `worker-progress/worker-173-passive-pending-state.md`

Do not implement hook effect rings, commit traversal, public `act`, or passive
flush execution. You are not alone in the codebase.

Requirements:
- Keep default pending passive state empty.
- Add typed pending passive records or handles only if missing.
- Add tests for deterministic ordering metadata and fail-closed no-op state.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_config`
- `cargo test -p fast-react-reconciler --all-features fiber_root`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

