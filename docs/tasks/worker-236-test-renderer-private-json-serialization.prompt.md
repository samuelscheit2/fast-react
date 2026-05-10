You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private Rust-only JSON serialization skeleton for the minimal committed test-renderer host-output canary, producing diagnostic data for one host component and text child while keeping public `toJSON`, `toTree`, `TestInstance`, JS facade routing, `act`, and compatibility claims blocked.

Write scope:
- `crates/fast-react-test-renderer/src/lib.rs`
- Focused test-renderer tests
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs` only to keep the gate explicitly blocked if needed
- `worker-progress/worker-236-test-renderer-private-json-serialization.md`

Context to inspect:
Workers 085, 153, 178, 188, 202, 208, 209, 210, and 235 if present in current branch.

Constraints:
- You are not alone in the codebase. Do not revert worker 234/235-style canary changes if they appear during merges.
- Keep all serialization private and fail-closed; no public package behavior.
- Do not broaden scenario admission unless the gate still clearly says compatibility is blocked.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-test-renderer --all-features`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `npm run check:js` if JS gate files change
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
