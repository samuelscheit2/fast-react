# Worker 375: Controlled Input Value Tracker Private Gate

Objective: add a private controlled-input value tracker diagnostic that can
install, observe, and detach a fake-DOM tracker record without enabling live
public controlled input behavior.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 172, 317, 344, 368, and 369 if present.

Write scope: `packages/react-dom/src/resource-form-internals-gate.js`,
`packages/react-dom/src/dom-host/property-payload.js`,
`packages/react-dom/test/resource-form-unsupported-gates.test.js`,
`tests/conformance/test/dom-property-payload-helper.test.mjs`, focused tests,
and `worker-progress/worker-375-controlled-input-value-tracker-private-gate.md`.

Do not install descriptors on real DOM nodes or claim public controlled input
compatibility.

Verification: run JS syntax checks, focused controlled/resource/property tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
