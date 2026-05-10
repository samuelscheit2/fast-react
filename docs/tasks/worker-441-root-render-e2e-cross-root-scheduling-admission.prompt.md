# Worker 441: Root Render E2E Cross-Root Scheduling Admission

Objective: add or refresh private root-render E2E evidence for cross-root
scheduling/flush interactions so the conformance gate distinguishes scheduling
proof from public root compatibility.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 262, 352, 380, 381, 410, 411, 412, and
422 if present.

Write scope: `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`,
`tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`, focused
root-render gate tests, and
`worker-progress/worker-441-root-render-e2e-cross-root-scheduling-admission.md`.

Do not open public React DOM root behavior, public flushSync compatibility, or
browser DOM compatibility.

Verification: run `npm run root-render-e2e:conformance --workspace
@fast-react/conformance`, focused root-render tests, and `git diff --check`.
