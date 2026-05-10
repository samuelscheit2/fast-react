You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a narrow begin-work/root-work-loop canary for a Fragment with exactly one host child. Keep multi-child fragments, keyed fragments, arrays, portals, Suspense, Offscreen, and public renderer output fail-closed.

Write scope:
- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-297-begin-work-fragment-single-child-handoff.md`

Context to inspect:
Workers 249, 282, 286, and 287.

Constraints:
- Single-child test-only handoff only.
- Do not add broad child traversal or reconciliation.
- Existing unsupported Fragment preflight tests must be adjusted only when the new single-child gate explicitly covers them.

Verification:
- `cargo fmt --all --check`
- Focused `begin_work` and `root_work_loop` tests
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
