# Worker 222: Core Context Stack Reconciler Canary

Objective: add a private reconciler canary proving the accepted core
`ContextStack` can be pushed, read, and unwound around a fake Provider-like
fiber boundary, without public React context propagation, DOM/test-renderer
integration, or compatibility claims.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 028, 136, 180, 194, and 221 if present.
- Inspect `crates/fast-react-core/src/context_stack.rs`,
  `crates/fast-react-reconciler/src/begin_work.rs`, and `function_component.rs`.

## Write Scope

- Primary: `crates/fast-react-reconciler/src/begin_work.rs`.
- Secondary: `crates/fast-react-core/src/context_stack.rs` tests only if needed.
- Report: `worker-progress/worker-222-core-context-stack-reconciler-canary.md`.
- Do not edit JS React context files, root work-loop, root commit, or master docs.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features context_stack`
- `cargo test -p fast-react-reconciler --all-features begin_work`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`
