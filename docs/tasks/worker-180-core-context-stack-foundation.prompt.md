# Worker 180: Core Context Stack Foundation

You are worker 180 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-180-core-context-stack-foundation.md`.

Objective: add a renderer-agnostic core context stack foundation that can store
typed context slots, push provider values, restore snapshots, and report
current values for future function-component/context work.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `worker-progress/worker-136-function-hooks-refresh.md`
- `crates/fast-react-core/src/element.rs`
- `crates/fast-react-core/src/fiber_handles.rs`
- `crates/fast-react-core/src/lib.rs`
- React reference files for context stack/cursor behavior as needed.

Write scope:
- `crates/fast-react-core/src/context_stack.rs`
- Minimal wiring in `crates/fast-react-core/src/lib.rs`
- Tests in `context_stack.rs`
- `worker-progress/worker-180-core-context-stack-foundation.md`

Do not touch reconciler root scheduling, DOM packages, test-renderer packages,
JS React facades, or hook queue implementation files. You are not alone in the
codebase; do not revert other workers' changes.

Implementation requirements:
- Use opaque, typed handles for context identities and values; avoid storing JS
  values or renderer-specific data.
- Provide deterministic push/pop or snapshot/restore behavior that catches
  mismatched restores.
- Preserve default values when no provider is active.
- Keep APIs small enough for later reconciler ownership.
- Add tests for default lookup, nested providers, sibling restore, mismatched
  restore rejection, and stable handle identity.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features context_stack`
- `cargo test -p fast-react-core --all-features`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- `git diff --check`
