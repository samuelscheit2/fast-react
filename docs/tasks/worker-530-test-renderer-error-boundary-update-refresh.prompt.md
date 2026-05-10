You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Refresh private react-test-renderer error-boundary diagnostics for update and
commit rows after accepted serialization/query/act work, without exposing
public error-boundary compatibility.

Write scope:
- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-530-test-renderer-error-boundary-update-refresh.md`

Constraints:
- Do not execute public renderer roots, lifecycle methods, or error boundary
  recovery.
- Keep diagnostics private and deterministic.

Verification:
- Run focused Rust test-renderer tests.
- Run error-surface and create-routing conformance.
- Run full `fast-react-test-renderer` tests and workspace check if feasible.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
