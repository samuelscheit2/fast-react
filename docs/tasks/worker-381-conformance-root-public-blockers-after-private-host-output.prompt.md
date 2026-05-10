# Worker 381: Conformance Root Public Blockers After Private Host Output

Objective: audit React DOM root public facade blockers after private
host-output admissions so public `createRoot`, render, unmount, hydration, and
portal claims stay fail-closed with explicit regression coverage.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 121, 163, 263, 337, 342, 352, 367, 368,
369, and 380 if present.

Write scope: `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`,
`tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`,
`tests/conformance/test/react-dom-client-root-oracle.test.mjs`, focused tests,
and
`worker-progress/worker-381-conformance-root-public-blockers-after-private-host-output.md`.

Do not admit any public root scenario unless the React 19.2.6 oracle matches
through the public package path.

Verification: run JS syntax checks, focused client-root/root-public/root-E2E
tests, `npm run check:js`, and `git diff --check`.
