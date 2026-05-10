You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add a private resource-map commit diagnostic gate for stylesheet/preload/script
records, building on worker 491 precedence metadata while keeping real resource
maps, singleton ownership, fetch/load state, and public resource APIs blocked.

Write scope:
- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `worker-progress/worker-507-resource-map-commit-gate.md`

Constraints:
- Do not mutate real or fake DOM resource maps except explicit private records.
- Do not fetch, preload, acquire, release, or load resources.
- Redact raw URLs/integrity/precedence strings when adding diagnostics.

Verification:
- Run syntax checks for touched JS/MJS.
- Run package resource/form tests.
- Run resource hints conformance.
- Run `npm run check --workspace @fast-react/react-dom`.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
