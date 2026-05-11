# Worker 846 Progress

## Status

- Complete.
- Root cause: React DOM focused report factories loaded `scheduler/unstable_mock` before loading the React private act gate, so Worker 834's load hook never captured the Scheduler-owned source validator for the current React gate instance.
- Implemented the conservative route: valid focused fixtures now load the React private gate before fresh Scheduler mock execution; Scheduler-first cache-hit fixtures remain rejected.

## Changed Files

- `packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `worker-progress/worker-846.md`

## Verification

- PASS: `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/react-act-oracle.test.mjs tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs packages/react-dom/test/react-dom-test-utils-act-gate.test.js`
- PASS: `npm run check --workspace @fast-react/react-dom`
- PASS: `npm run check --workspace scheduler`
- PASS: `npm run check:package-surface`
- PASS: `node tests/smoke/import-entrypoints.mjs`
- PASS: `git diff --check`

## Risks

- Test-only change. The negative Scheduler-first assertions reject at the nested metadata source-proof validation layer, which is still the intended fail-closed behavior and avoids adding late cache registration.
