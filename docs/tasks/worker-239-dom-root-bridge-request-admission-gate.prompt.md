You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private React DOM root-bridge request admission gate that validates create/render/unmount request records against accepted root lifecycle prerequisites and explicitly blocks native/reconciler execution, DOM mutation, marker writes, listener installation, hydration, events, and compatibility claims.

Write scope:
- `packages/react-dom/src/client/root-bridge.js`
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- Optional focused conformance gate/test under `tests/conformance/src` and `tests/conformance/test`
- `worker-progress/worker-239-dom-root-bridge-request-admission-gate.md`

Context to inspect:
Workers 046, 054, 121, 122, 163, 167, 171, 215, 240, 262.

Constraints:
- You are not alone in the codebase. Workers 240 and 262 may add public/root gates; keep this private bridge scoped.
- Do not implement native/Rust execution or mutate containers.
- Preserve public `react-dom/client` placeholders.

Verification:
- `node --check` for touched JS files
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs`
- Focused root bridge/root oracle tests if added
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
