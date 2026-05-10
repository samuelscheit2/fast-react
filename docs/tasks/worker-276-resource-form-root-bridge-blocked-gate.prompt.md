You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Tighten resource/form unsupported internals gates against accepted root bridge/facade metadata so resource hints, form actions, and controlled controls remain fail-closed at public roots and private source-adapter boundaries.

Write scope:
- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs` if needed
- `worker-progress/worker-276-resource-form-root-bridge-blocked-gate.md`

Context to inspect:
Workers 172, 219, 240, 260, 262.

Constraints:
- Do not dispatch resources or inspect/reset forms.
- No public root compatibility claim.
- Keep metadata deterministic and unsupported.

Verification:
- `node --check` for touched JS files
- `npm run check --workspace @fast-react/react-dom`
- Focused controlled/resource conformance tests if touched
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
