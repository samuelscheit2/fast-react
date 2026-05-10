# Worker 398: React DOM Ref Ordering From Root Commit Metadata

Objective: feed accepted root-commit ref metadata into the React DOM private
ref-ordering diagnostic so attach/detach ordering no longer depends solely on
test-authored metadata arrays.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 340, 371, 385, and 397 if present.

Write scope: `packages/react-dom/src/client/ref-callback-gate.js`,
`packages/react-dom/src/client/root-bridge.js`,
`packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`,
`tests/conformance/test/dom-ref-callback-oracle.test.mjs`, and
`worker-progress/worker-398-react-dom-ref-ordering-from-root-commit-metadata.md`.

Keep object refs, public root execution, and root error callback compatibility
blocked.

Verification: run JS syntax checks, focused ref callback and root bridge tests,
`npm run check --workspace @fast-react/react-dom`, and `git diff --check`.
