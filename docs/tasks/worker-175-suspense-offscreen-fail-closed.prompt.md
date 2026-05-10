# Worker 175: Suspense/Offscreen Fail-Closed

You are worker 175 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-175-suspense-offscreen-fail-closed.md`.

Objective: add fail-closed tests and small internal unsupported markers for
Suspense, Offscreen, Activity, and ViewTransition so future workers cannot
accidentally claim these features through generic fiber tags.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-147-suspense-offscreen-refresh.md`
- `crates/fast-react-core/src/fiber.rs`
- `crates/fast-react-core/src/root_lanes.rs`
- `crates/fast-react-reconciler/src/lib.rs`

Write scope:
- `crates/fast-react-core/src/fiber.rs` only for tiny helpers/tests if needed
- `crates/fast-react-reconciler/src/lib.rs` or a new unsupported-feature module
  if a reconciler marker is cleaner
- Focused tests
- `worker-progress/worker-175-suspense-offscreen-fail-closed.md`

Do not implement Suspense retry, Offscreen visibility, hidden subtree commit,
or hydration. You are not alone in the codebase.

Requirements:
- Preserve existing fiber tag mappings.
- Add explicit unsupported checks or tests around the tags most likely to be
  hit by future generic work loops.
- Keep lane behavior unchanged unless a pure test documents current limits.

Verification:
- `cargo fmt --all --check`
- Focused core/reconciler tests you add
- `cargo test -p fast-react-core --all-features`
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

