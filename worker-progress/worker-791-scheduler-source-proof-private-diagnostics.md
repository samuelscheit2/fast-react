# Worker 791 - Scheduler Source Proof Private Diagnostics

## Summary

- Moved the Scheduler mock expired/delayed act/root source validator off public
  flush-helper symbol properties and onto the existing frozen private
  diagnostics object.
- Updated the React private act dispatcher gate to obtain the Scheduler-owned
  validator through `__FAST_REACT_PRIVATE_ACT_QUEUE_FLUSH_DIAGNOSTICS__`.
- Preserved clone, old-global, and fake-validator rejection for expired and
  delayed React act gates.
- Added coverage that public mock flush helpers expose no private validator
  symbols through `Reflect.ownKeys`.

## Changed Files

- `packages/scheduler/unstable_mock.js`
- `packages/react/private-act-dispatcher-gate.js`
- `tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `worker-progress/worker-791-scheduler-source-proof-private-diagnostics.md`

## Commands Run

- `node --check packages/scheduler/unstable_mock.js`
- `node --check packages/react/private-act-dispatcher-gate.js`
- `node --check tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `node --check tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `node --check tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `node --check tests/conformance/test/react-act-oracle.test.mjs`
- `node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/react-act-oracle.test.mjs tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check --workspace scheduler`
- `npm run check --workspace @fast-react/react`
- `npm test --workspace @fast-react/conformance`
- `git diff --check`

## Evidence Gathered

- Focused Scheduler/React act run passed: 93 tests, 93 pass.
- Package surface guard passed.
- Import-entrypoints smoke passed.
- Scheduler workspace check passed.
- React workspace check passed.
- `git diff --check` passed.
- `npm test --workspace @fast-react/conformance` ran 952 tests; 940 passed and
  12 failed in `private-admission-727-728-gate.test.mjs`, unrelated to this
  worker's Scheduler mock / React act source-proof files.

## Risks Or Blockers

- Merge overlap is likely with other Scheduler mock, React act, and private
  diagnostics workers touching `packages/scheduler/unstable_mock.js`,
  `packages/react/private-act-dispatcher-gate.js`, and nearby conformance tests.
- Full conformance currently has unrelated worker-727/728 private admission
  failures that should be resolved separately before treating the whole
  conformance workspace as green.

## Recommended Next Tasks

- Re-run the focused Scheduler/React act suite after merge conflict resolution.
- Have the owner of worker-727/728 private admission metadata address the full
  conformance failures.
