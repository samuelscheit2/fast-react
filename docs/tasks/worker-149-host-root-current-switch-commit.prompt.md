# Worker 149: HostRoot Current-Switch Commit

You are worker 149 in a real tmux Codex process. Do not read
`ORCHESTRATOR.md`; read `WORKER_BRIEF.md`.

First action: call `create_goal` for this objective, then call `get_goal` if
available and record the active goal status/objective in
`worker-progress/worker-149-host-root-current-switch-commit.md`.

Objective: implement the narrow HostRoot-only commit foundation that consumes
worker 129's render-phase result and switches `root.current` to the completed
HostRoot WIP without doing host mutation, child reconciliation, effects,
public JS facade work, or DOM/test-renderer wiring.

Context to read:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-129-host-root-render-phase-foundation.md`
- `worker-progress/worker-130-commit-readiness-refresh.md`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-core/src/root_lanes.rs`
- React reference files for commit/root finished lane behavior as needed.

Write scope:
- `crates/fast-react-reconciler/src/root_commit.rs`
- Minimal wiring in `crates/fast-react-reconciler/src/lib.rs`
- Minimal accessors/mutators in `crates/fast-react-reconciler/src/fiber_root.rs`
- Minimal integration in `crates/fast-react-reconciler/src/root_work_loop.rs`
- Focused tests in those modules
- `worker-progress/worker-149-host-root-current-switch-commit.md`

Do not touch host-config, DOM packages, test-renderer packages, hook files,
native bridge files, or conformance harness files. You are not alone in the
codebase; other workers may edit nearby scheduler/host files. Do not revert or
overwrite changes you did not make.

Implementation requirements:
- Add a small internal commit API that can commit a completed HostRoot WIP for
  selected lanes.
- Preserve the alternate relationship and switch only the root's `current`.
- Mark finished lanes through `RootLaneState::mark_finished`.
- Clear or reset render-phase scheduling fields consistently.
- Leave `finished_work`, host mutation, callbacks, effects, deletions, and
  child traversal explicitly out of scope unless a minimal field reset is
  required for the HostRoot-only commit.
- Add tests proving current switches, current state reflects the rendered
  element, pending lanes are cleared for completed lanes, skipped lanes remain,
  and no host operations run.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo test -p fast-react-reconciler --all-features root_work_loop`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

