# Worker 151: Host Complete-Work Skeleton

You are worker 151 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-151-host-complete-work-skeleton.md`.

Objective: implement a private, test-only HostRoot/HostComponent/HostText
begin/complete-work skeleton that can create detached host records and attach
them under a HostRoot WIP, without committing to containers or exposing public
renderers.

Context to read:
- `WORKER_BRIEF.md`
- `worker-progress/worker-129-host-root-render-phase-foundation.md`
- `worker-progress/worker-132-host-complete-work-refresh.md`
- `worker-progress/worker-110-dom-text-content-host-plan.md`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- `crates/fast-react-host-config/src/lib.rs`
- React reference `completeWork` and HostComponent/HostText paths as needed.

Write scope:
- `crates/fast-react-reconciler/src/host_work.rs`
- Minimal wiring in `crates/fast-react-reconciler/src/lib.rs`
- Minimal test host support in `crates/fast-react-reconciler/src/test_support.rs`
- Minimal setters/accessors in core/reconciler fiber files only if required
- `worker-progress/worker-151-host-complete-work-skeleton.md`

Do not switch `root.current`, mutate a container, wire DOM/test-renderer
packages, implement function components, or change public JS facades. You are
not alone in the codebase; do not revert other workers' edits.

Implementation requirements:
- Keep the supported element model intentionally tiny and test-only if no real
  element tree exists yet.
- Create HostComponent/HostText WIP fibers under HostRoot WIP with stable
  topology.
- Create detached host instance/text handles using existing host-config powers
  or an intentionally narrow extension.
- Store opaque state-node handles on host fibers and bubble flags/child lanes.
- Add tests covering one host element with text, text-only child, and no
  container mutation.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features host_work`
- `cargo test -p fast-react-reconciler --all-features work_in_progress`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

