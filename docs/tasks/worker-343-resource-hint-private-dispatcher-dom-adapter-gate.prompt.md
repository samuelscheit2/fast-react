# Worker 343: Resource Hint Private Dispatcher DOM Adapter Gate

Objective: extend the resource hint private dispatcher metadata gate with a
fake-DOM adapter admission layer for normalized preload/preconnect/preinit
records, proving DOM/resource side effects remain blocked until explicitly
admitted.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 060, 143, 172, 219, 260, 316, and
320.

Write scope: `packages/react-dom/src/resource-form-internals-gate.js`,
`packages/react-dom/src/resource-form-gates.js`,
`packages/react-dom/test/resource-form-unsupported-gates.test.js`, focused
tests, and
`worker-progress/worker-343-resource-hint-private-dispatcher-dom-adapter-gate.md`.

Do not implement public resource hint DOM insertion.

Verification: run JS syntax checks, focused resource/form gate tests,
resource-hint oracle tests if touched, `npm run check --workspace
@fast-react/react-dom`, and `git diff --check`.
