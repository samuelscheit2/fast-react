# Worker 380: Root Render E2E Private Update Unmount Admissions

Objective: refresh the root-render E2E conformance gate after private
update/unmount host-output work, admitting only rows backed by explicit private
fake-DOM evidence and keeping public rows blocked.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 163, 337, 338, 352, 367, 368, and 369
if present.

Write scope: `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`,
`tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`,
`tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`,
focused tests, and
`worker-progress/worker-380-root-render-e2e-private-update-unmount-admissions.md`.

Do not claim public React DOM root compatibility.

Verification: run JS syntax checks, focused root E2E/public facade tests,
`npm run root-render-e2e:conformance --workspace @fast-react/conformance`,
`npm run check:js`, and `git diff --check`.
