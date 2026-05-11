# Worker 769 - CJS Sibling Text toTree Admission

## Summary

Added private CJS-only sibling-text `toTree` admission for `react-test-renderer` while keeping public serialization routes, package-root behavior, native bridge loading, and compatibility claims blocked.

- CJS development and production `toTree` private facades now expose hidden sibling-text admission helpers.
- The `toTree` admission consumes the dedicated sibling-text finished-work identity from the existing private toJSON gate instead of the generic finished-work identity gate.
- The sibling-text identity must carry canonical `rootFinishedLanesHandoff` evidence; alias-only handoff keys remain rejected.
- Generic sibling-text and broad multichild finished-work identity evidence remains fail-closed for `toTree`.
- Production CJS uses a narrow sibling-text `toTree` report validator for this private admission without broadening generic production multichild `toTree` serialization.
- Package-root `react-test-renderer` behavior was intentionally left unchanged.

## Changed Files

- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`

## Commands Run

- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs --test-name-pattern "sibling|toTree|identity|root finished"`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs --test-name-pattern "sibling|toTree|identity|root finished"`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence Gathered

- Focused serialization local gate passed: 10 tests, 10 pass.
- Focused create-routing gate passed: 32 tests, 32 pass.
- The touched conformance files also passed in a full-file targeted review run after the final assertion cleanup.
- Workspace react-test-renderer check passed through the smoke import entrypoint inventory.
- Package surface guard passed; no new public exports or package-root surface changes were introduced.
- Import smoke passed for accepted entrypoints.
- `git diff --check` passed after the final cleanup.

## Risks Or Blockers

- No blocker found.
- The new helper methods are private CJS facade properties only; public `toTree`, `toJSON`, `root`, `ReactTestInstance`, native bridge loading, and compatibility claims remain blocked in assertions.
- CJS production intentionally has a narrow sibling-text validator because generic production `serializeAcceptedTreeMetadata` still does not accept broad multichild reports.

## Recommended Next Tasks

- If a future worker promotes sibling-text `toTree` support beyond private CJS diagnostics, audit package-root behavior and package-surface snapshots separately.
- Keep any future root-finished-lanes evidence additions on the canonical `rootFinishedLanesHandoff` key; alias-only handoff evidence is part of the fail-closed contract.
