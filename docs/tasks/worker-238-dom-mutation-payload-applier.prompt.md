You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private DOM mutation payload applier for the accepted ordinary property payload records, applying only safe fake-DOM set/remove attribute/property operations in tests while leaving public roots, hydration, events, controlled forms, resources, style, dangerous HTML, and compatibility claims blocked.

Write scope:
- `packages/react-dom/src/dom-host/property-payload.js`
- `packages/react-dom/src/dom-host/mutation.js`
- Focused smoke/conformance tests for private payload application
- `worker-progress/worker-238-dom-mutation-payload-applier.md`

Context to inspect:
Workers 061, 154, 168, 186, 212, 213, 259.

Constraints:
- You are not alone in the codebase. Workers 242, 259, and 261 may edit adjacent DOM host files.
- Keep this private and fake-DOM/test-only. Do not wire public `createRoot` or real browser behavior.
- Do not apply style or `dangerouslySetInnerHTML`; worker 242 owns that slice.

Verification:
- `node --check` for touched JS files
- Focused property payload and DOM mutation smoke tests
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
