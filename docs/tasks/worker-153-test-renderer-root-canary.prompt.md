# Worker 153: Test Renderer Root Canary

You are worker 153 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-153-test-renderer-root-canary.md`.

Objective: add the first Rust test-renderer root canary over shared reconciler
root semantics, using the existing in-memory mutation host, without adding a JS
`react-test-renderer` facade or claiming serialization compatibility.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-133-test-renderer-root-refresh.md`
- `worker-progress/worker-018-test-renderer-mutation-host.md`
- `worker-progress/worker-129-host-root-render-phase-foundation.md`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`

Write scope:
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-test-renderer/Cargo.toml` if a reconciler dependency is
  required
- Focused Rust tests in the test-renderer crate
- `worker-progress/worker-153-test-renderer-root-canary.md`

Do not edit JS packages, DOM adapter files, root commit implementation, or
conformance oracle files. If commit/host complete work is not present in your
branch, create a canary that stops at scheduled/rendered root state and records
the later handoff in test names. You are not alone in the codebase.

Implementation requirements:
- Expose a small test-renderer root object or canary helper that owns a
  `FiberRootStore<TestRenderer>`.
- Exercise create/update/unmount scheduling through shared root APIs.
- Keep serialization and public act/error behavior out of scope.
- Add tests that fail closed rather than pretending committed host output
  exists before commit/host complete work is available.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo test -p fast-react-reconciler --all-features root_work_loop`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `git diff --check`

