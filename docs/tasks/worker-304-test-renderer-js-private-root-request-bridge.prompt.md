You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private JavaScript test-renderer root request bridge that records create/update/unmount requests in the shape needed by the Rust `TestRendererRoot` canaries, while public `create()`, `update()`, and `unmount()` remain fail-closed.

Write scope:
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-304-test-renderer-js-private-root-request-bridge.md`

Context to inspect:
Workers 266, 268, 277, 291, and `crates/fast-react-test-renderer/src/lib.rs`.

Constraints:
- No native module loading and no Rust execution from JS.
- Public behaviorful methods still throw the accepted unimplemented errors.
- Keep package surface keys unchanged.

Verification:
- `node --check` for touched JS files
- Focused react-test-renderer create routing gate
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
