You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a root scheduler canary for pinged retry lanes interacting with the accepted Suspense/Offscreen fail-closed markers. Prove lane selection and callback scheduling metadata remain deterministic without implementing Suspense, promises, wakeables, or hidden tree rendering.

Write scope:
- `crates/fast-react-core/src/root_lanes.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-302-root-scheduler-ping-retry-lane-gate.md`

Context to inspect:
Workers 156, 175, 287, and scheduler root tests.

Constraints:
- No real Suspense/Offscreen implementation.
- Keep unsupported feature diagnostics fail-closed.
- Do not change public Scheduler package behavior.

Verification:
- `cargo fmt --all --check`
- Focused root lanes, root scheduler, and root work-loop tests
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
