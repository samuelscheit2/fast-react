# Worker 166: Native Bridge Handle Table

You are worker 166 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-166-native-bridge-handle-table.md`.

Objective: add a private native bridge handle-table skeleton in
`fast-react-napi` with deterministic environment-local handle behavior, without
adding real N-API dependencies or wiring JS packages to native code.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-096-native-root-boundary-plan.md`
- `worker-progress/worker-142-native-js-bridge-refresh.md`
- `crates/fast-react-napi/src/lib.rs`
- `bindings/node/package.json`

Write scope:
- `crates/fast-react-napi/src/lib.rs`
- New private modules under `crates/fast-react-napi/src/`
- Focused Rust tests
- `worker-progress/worker-166-native-bridge-handle-table.md`

Do not add N-API dependencies, platform build artifacts, package native
loaders, or reconciler root operations. You are not alone in the codebase.

Implementation requirements:
- Implement environment-local opaque handles with generation or stale-handle
  detection.
- Add insert/get/remove semantics for placeholder root/value records.
- Add tests for wrong-environment, stale, disposed, and duplicate-dispose
  behavior.
- Keep all APIs private or clearly experimental.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git diff --check`

