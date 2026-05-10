# Worker 190: Native Handle Environment Teardown

You are worker 190 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-190-native-handle-environment-teardown.md`.

Objective: add a private environment-teardown path to the `fast-react-napi`
handle-table skeleton so future Node-API environment cleanup can invalidate all
environment-local handles deterministically, without adding N-API dependencies,
JS package wiring, or reconciler root integration.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-142-native-js-bridge-refresh.md`
- `worker-progress/worker-166-native-bridge-handle-table.md`
- `crates/fast-react-napi/src/handle_table.rs`
- `crates/fast-react-napi/src/lib.rs`

Write scope:
- `crates/fast-react-napi/src/handle_table.rs`
- `crates/fast-react-napi/src/lib.rs` only if a minimal private module export
  adjustment is truly needed
- Focused unit tests in the N-API crate
- `worker-progress/worker-190-native-handle-environment-teardown.md`

Do not add N-API dependencies, native loader changes, JS package wiring,
React/React DOM facade behavior, reconciler integration, scheduler changes, or
platform artifacts. You are not alone in the codebase; do not revert other
workers' changes.

Implementation requirements:
- Add a private teardown/drain operation on the handle table for a
  `BridgeEnvironmentId`.
- Return a deterministic record with counts for root/value handles affected and
  enough state to prove whether anything was torn down.
- Invalidate or mark all occupied handles for that environment so later lookup,
  removal, or dispose through old handles fails with the existing disposed or
  stale-handle style errors.
- Preserve wrong-environment, wrong-kind, duplicate-dispose, and stale-handle
  behavior for handles not owned by the torn-down environment.
- Do not expose raw JS values, raw pointers, Node-API types, or public native
  APIs.
- Add focused tests for multi-handle teardown, idempotent empty teardown,
  wrong-environment isolation, post-teardown lookup/removal errors, and safe
  insertion after teardown.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features handle_table`
- `cargo test -p fast-react-napi --all-features`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git diff --check`
