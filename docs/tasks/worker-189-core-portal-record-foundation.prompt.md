# Worker 189: Core Portal Record Foundation

You are worker 189 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-189-core-portal-record-foundation.md`.

Objective: add a renderer-agnostic Rust core portal record foundation that
captures React portal identity data with explicit typed container and child
handles, without implementing JS `createPortal`, DOM behavior, reconciliation,
commit traversal, or public serialization.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-011-core-element-model.md`
- `worker-progress/worker-057-react-dom-portal-oracle.md`
- `docs/tasks/worker-181-react-dom-create-portal-object.prompt.md`
- `crates/fast-react-core/src/element.rs`
- `crates/fast-react-core/src/symbols.rs`
- `crates/fast-react-core/src/lib.rs`

Write scope:
- `crates/fast-react-core/src/element.rs`
- Minimal exports in `crates/fast-react-core/src/lib.rs`
- Focused core unit tests in the touched Rust modules
- `worker-progress/worker-189-core-portal-record-foundation.md`

Do not edit JS packages, React DOM portal implementation files, reconciler
files, host config files, test-renderer files, conformance oracle artifacts, or
active worker branches. You are not alone in the codebase; do not revert other
workers' changes.

Implementation requirements:
- Add a generic `ReactPortalRecord` or similarly named core data record using
  `ReactSymbolTag::Portal`.
- Store explicit typed fields for children, container info, implementation
  detail/renderer state if needed, and an optional normalized `ReactKey`.
- Keep the record pure data: no DOM node assumptions, no JS descriptors, no
  Symbol object allocation, no container mutation, no reconciliation, and no
  public React DOM behavior.
- Provide small constructors/accessors consistent with existing
  `ReactElementRecord`, `ReactKey`, `ReactOwnerSlot`, and `ReactRefSlot`
  patterns.
- Add tests for portal tag identity, key preservation/absence, generic
  container/children handles, and non-element-brand classification.
- Keep compatibility claims false: this is only a core representation for
  future portal plumbing.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features portal`
- `cargo test -p fast-react-core --all-features element`
- `cargo test -p fast-react-core --all-features symbols`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- `git diff --check`
