You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private read-only committed-fiber inspection API for the Rust test renderer sufficient to describe the current HostRoot, one HostComponent, and one HostText canary tree, without exposing host nodes, mutating fibers, serializing public TestInstance output, or wiring JS `react-test-renderer`.

Write scope:
- `crates/fast-react-reconciler/src/lib.rs`
- New/touched reconciler private inspection module if needed
- `crates/fast-react-test-renderer/src/lib.rs`
- `worker-progress/worker-235-test-renderer-private-fiber-inspection.md`

Context to inspect:
Workers 153, 178, 188, 195, 203, 208, 209, and React test renderer serialization oracle workers 085/178.

Constraints:
- You are not alone in the codebase. Coordinate by keeping APIs private, minimal, and diagnostic-only.
- Do not expose host state nodes or public JS objects.
- Do not claim serialization compatibility; this is prerequisite inspection evidence only.

Verification:
- `cargo fmt --all --check`
- Focused reconciler/test-renderer inspection tests
- `cargo test -p fast-react-reconciler --all-features`
- `cargo test -p fast-react-test-renderer --all-features`
- Clippy for touched Rust packages with warnings denied
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
