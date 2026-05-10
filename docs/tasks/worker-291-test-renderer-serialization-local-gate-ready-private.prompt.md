You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Update the react-test-renderer serialization local gate to distinguish "ready for private diagnostics" from public serialization compatibility after accepted committed host output, committed-fiber inspection, and private JSON diagnostics, while public `toJSON`, `toTree`, TestInstance wrappers, JS facade routing, and compatibility remain blocked.

Write scope:
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-serialization-oracle.test.mjs`
- `tests/conformance/package.json` if adding a focused script
- `worker-progress/worker-291-test-renderer-serialization-local-gate-ready-private.md`

Context to inspect:
Workers 178, 208, 209, 234, 235, 236, 265, 267.

Constraints:
- Public compatibility remains false.
- Scenario admission must be explicit and blocked for public rows.
- Do not modify Rust crate unless the gate exposes stale metadata.

Verification:
- `node --check` for touched JS files
- Focused serialization local gate/oracle tests
- `npm run test:conformance --workspace @fast-react/conformance`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
