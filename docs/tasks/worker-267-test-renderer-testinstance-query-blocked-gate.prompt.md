You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a fail-closed conformance gate for `react-test-renderer` TestInstance query surfaces (`root`, `find*`, `findBy*`, `toJSON`, `toTree`) that records accepted Rust private prerequisites but keeps public JS instance wrappers and serialization unsupported.

Write scope:
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs` if needed
- `worker-progress/worker-267-test-renderer-testinstance-query-blocked-gate.md`

Context to inspect:
Workers 085, 178, 209, 210, 234, 235, 236, 237.

Constraints:
- No public compatibility claims.
- Do not modify Rust crates or package implementation unless a gate needs stable metadata.
- Keep scenario admissions explicit and false.

Verification:
- `node --test` for touched conformance tests
- `npm run test:conformance --workspace @fast-react/conformance`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
