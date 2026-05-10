# Worker 460: Resource Preload Dedupe/Order Gate

Objective: extend private resource hint diagnostics with preload/preinit
dedupe, precedence, and head insertion order evidence while public resource APIs
stay record-only.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 172, 374, 400, 432, and 440 if
present.

Write scope: `packages/react-dom/src/resource-form-gates.js`,
`packages/react-dom/src/resource-form-internals-gate.js`, focused resource
tests, focused conformance tests if needed, and
`worker-progress/worker-460-resource-preload-dedupe-order-gate.md`.

Do not dispatch public resource hints, mutate real DOM head, or claim resource
compatibility.

Verification: run focused resource/form tests, `npm run check --workspace
@fast-react/react-dom`, focused resource conformance tests if touched, and `git
diff --check`.
