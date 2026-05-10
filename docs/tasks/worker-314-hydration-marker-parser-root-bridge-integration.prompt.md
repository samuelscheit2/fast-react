You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Integrate the private hydration marker parser with the root bridge hydration boundary gate so `hydrateRoot` requests can record accepted marker evidence without marking containers, installing listeners, or mutating DOM.

Write scope:
- `packages/react-dom/src/client/hydration-marker-parser.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-314-hydration-marker-parser-root-bridge-integration.md`

Context to inspect:
Workers 169, 246, 275, and 310 if present.

Constraints:
- Public hydrateRoot remains unsupported.
- Marker parsing is read-only and deterministic.
- No event replay, hydratable cursor mutation, or hydrated commit work.

Verification:
- `node --check` for touched JS files
- Focused hydration boundary and marker oracle tests
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
