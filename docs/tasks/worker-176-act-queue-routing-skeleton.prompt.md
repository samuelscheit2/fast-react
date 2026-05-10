# Worker 176: Act Queue Routing Skeleton

You are worker 176 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-176-act-queue-routing-skeleton.md`.

Objective: add internal act queue routing records and fake callback-node tests
without exposing public `act` or changing React DOM/test-renderer facades.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-081-reconciler-root-scheduler-act-plan.md`
- `worker-progress/worker-086-react-test-renderer-act-oracle.md`
- `worker-progress/worker-097-react-act-oracle.md`
- `worker-progress/worker-131-sync-flush-act-refresh.md`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/scheduler_bridge.rs`

Write scope:
- `crates/fast-react-reconciler/src/scheduler_bridge.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- Minimal exports in `crates/fast-react-reconciler/src/lib.rs`
- Focused tests
- `worker-progress/worker-176-act-queue-routing-skeleton.md`

Do not touch public JS `act`, test-renderer facade, sync flush execution, or
commit. Worker 150/155 may also edit scheduler files; keep changes separable.
You are not alone in the codebase.

Requirements:
- Add internal act queue/fake callback-node records if missing.
- Preserve normal scheduler bridge behavior when act mode is inactive.
- Add tests for routing, cancellation, and no public side effects.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features scheduler_bridge`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

