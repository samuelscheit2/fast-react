# Worker 192: Core Hook List Foundation

You are worker 192 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-192-core-hook-list-foundation.md`.

Objective: add a pure `fast-react-core` hook list foundation that models
ordered function-component hook slots for future render-with-hooks ownership,
without adding a reconciler dispatcher, function component rendering, commit
effect traversal, public hook facades, DOM, packages, or native bridge code.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-100-reconciler-function-component-render-plan.md`
- `worker-progress/worker-112-core-hook-queue-implementation-plan.md`
- `worker-progress/worker-136-function-hooks-refresh.md`
- `worker-progress/worker-157-core-hook-effect-ring.md`
- `worker-progress/worker-158-core-hook-state-queue.md`
- `crates/fast-react-core/src/hook_effect_ring.rs`
- `crates/fast-react-core/src/hook_state_queue.rs`
- React reference hook list traversal in
  `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHooks.js`

Write scope:
- `crates/fast-react-core/src/hook_list.rs`
- Minimal exports in `crates/fast-react-core/src/lib.rs`
- Focused core unit tests in the new module
- `worker-progress/worker-192-core-hook-list-foundation.md`

Do not touch reconciler dispatcher/render files, root scheduling, commit,
DOM/test-renderer packages, native bridge, scheduler packages, or JS public
hook facades. Workers 159, 180, 189, and later core slices may also touch
`lib.rs`; merge around them later. You are not alone in the codebase.

Implementation requirements:
- Model an ordered per-component hook list using core-only data structures and
  stable/generational IDs consistent with existing core arena/handle style.
- Represent hook slot payload ownership without storing JS values directly.
  It is acceptable to reference accepted core hook state queue IDs, hook state
  slot records, hook effect rings, or opaque handles when that keeps the module
  renderer-agnostic.
- Provide mount/append and update traversal helpers that fail closed on too few
  or too many hooks, stale handles, wrong list ownership, or corrupt links.
- Keep hook state queues and hook effect rings separate except through explicit
  hook slot payload metadata.
- Add tests for append order, update traversal order, mismatch failures, stale
  handle failures, and separation of state/effect payload metadata.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features hook_list`
- `cargo test -p fast-react-core --all-features hook`
- `cargo test -p fast-react-core --all-features`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- `git diff --check`
