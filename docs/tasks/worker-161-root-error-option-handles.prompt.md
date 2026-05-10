# Worker 161: Root Error Option Handles

You are worker 161 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-161-root-error-option-handles.md`.

Objective: strengthen root option storage for uncaught/caught/recoverable error
callback handles and option parsing records, without implementing actual render
error capture or public React DOM warnings.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-138-root-error-callback-refresh.md`
- `worker-progress/worker-135-react-dom-root-bridge-refresh.md`
- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- React DOM root option handling references as needed.

Write scope:
- `crates/fast-react-reconciler/src/root_config.rs`
- Minimal tests in `crates/fast-react-reconciler/src/fiber_root.rs` or
  `fiber_store.rs` if needed
- `worker-progress/worker-161-root-error-option-handles.md`

Do not touch root commit, update callback invocation, DOM packages, JS native
handle tables, or test-renderer public errors. You are not alone in the
codebase.

Implementation requirements:
- Ensure `RootOptions` has explicit handles for onUncaughtError,
  onCaughtError, and onRecoverableError or equivalent existing names.
- Add typed option records that can be bridged from JS later without storing JS
  values directly.
- Preserve current root creation tests and add new tests for default and custom
  handles.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_config`
- `cargo test -p fast-react-reconciler --all-features fiber_root`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

