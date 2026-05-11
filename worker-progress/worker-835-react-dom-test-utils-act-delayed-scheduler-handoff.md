# Worker 835 React DOM Test Utils Act Delayed Scheduler Handoff

## Status

- Implemented DOM-side private preflight for Scheduler mock delayed act/root diagnostics.
- The route delegates to React private act gate delayed preflight, validates the React-owned preflight object, and wraps the nested expired drain through the existing React DOM expired consumer.
- Added gate metadata for the delayed private diagnostics surface while keeping public `react-dom/test-utils.act`, public React act, public roots/effects, and public Scheduler timing blocked.
- Added package and conformance coverage using real `scheduler/unstable_mock` delayed promotion through `unstable_flushExpired`.

## Verification

- `node --test packages/react-dom/test/react-dom-test-utils-act-gate.test.js` passed.
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs` passed.
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs tests/conformance/test/react-act-oracle.test.mjs tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs` passed.
- `npm run check --workspace @fast-react/react-dom` passed.
- `npm run check:package-surface` passed.
- `node tests/smoke/import-entrypoints.mjs` passed.
- `git diff --check && git diff --cached --check` passed.

## Remaining

- None for this worker scope.
