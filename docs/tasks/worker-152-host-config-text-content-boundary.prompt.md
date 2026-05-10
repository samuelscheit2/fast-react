# Worker 152: Host-Config Text Content Boundary

You are worker 152 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-152-host-config-text-content-boundary.md`.

Objective: refine the renderer-independent host-config boundary for primitive
text/children decisions and detached instance creation so complete-work and DOM
adapter workers do not invent incompatible APIs.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-132-host-complete-work-refresh.md`
- `worker-progress/worker-134-dom-mutation-refresh.md`
- `worker-progress/worker-110-dom-text-content-host-plan.md`
- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- React reference HostConfig text-content hooks as needed.

Write scope:
- `crates/fast-react-host-config/src/lib.rs`
- Focused tests in that crate
- Minimal alignment in `crates/fast-react-test-renderer/src/lib.rs` only if
  required by trait changes
- `worker-progress/worker-152-host-config-text-content-boundary.md`

Do not touch reconciler root commit/work-loop files or JS packages. You are not
alone in the codebase; if another worker changes host-config, adapt without
reverting.

Implementation requirements:
- Add narrowly typed primitives for text content decisions, initial children,
  and detached host child handles only if the existing API is insufficient.
- Preserve opaque host values and capability-driven errors.
- Keep hydration, resources, forms, singletons, and events out of scope.
- Add tests that prove mutation-only and unsupported hosts fail closed.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-host-config --all-features`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `git diff --check`

