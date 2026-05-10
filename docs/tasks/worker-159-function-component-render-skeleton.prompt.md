# Worker 159: Function Component Render Skeleton

You are worker 159 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-159-function-component-render-skeleton.md`.

Objective: add a private reconciler function-component render skeleton with a
test-only component invocation model, without public React hook facades,
effects, DOM/test-renderer wiring, or child reconciliation beyond a minimal
recorded output.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-100-reconciler-function-component-render-plan.md`
- `worker-progress/worker-113-function-component-implementation-plan.md`
- `worker-progress/worker-136-function-hooks-refresh.md`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- Existing core hook files if workers 157/158 have not landed, design for a
  later merge rather than blocking.

Write scope:
- `crates/fast-react-reconciler/src/function_component.rs`
- Minimal exports in `crates/fast-react-reconciler/src/lib.rs`
- Focused tests in the reconciler crate
- `worker-progress/worker-159-function-component-render-skeleton.md`

Do not touch core hook storage files, root commit, host complete work, DOM,
test-renderer, or JS packages. You are not alone in the codebase; keep this
slice private and easy to merge after hook primitives.

Implementation requirements:
- Define a small internal component registry or invoker trait suitable for unit
  tests.
- Render a function component fiber into an opaque output/element handle record
  without implementing hooks.
- Add explicit unsupported errors for hooks, context, class components, and
  thrown values.
- Add tests for successful invocation, error propagation, and no host mutation.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features function_component`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

