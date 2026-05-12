# Worker 1235 Public Render Capability Matrix Repair

## Summary

- Added the missing `unsupported-id-object` smoke rejection case so the smoke matrix matches the package-level public render rejection coverage.
- Added the missing `public-render-unsupported-component` conformance capability row so the public facade blocked gate records the component rejection covered by package and smoke tests.
- Did not change runtime behavior or generated oracle JSON.

## Audit Finding Repaired

- Worker 1232 audit finding: evidence matrix drift between package tests, smoke coverage, and the public facade conformance rows.
- Repair: smoke now covers `unsupported-id-object`; conformance now records `public-render-unsupported-component`.
- Guardrail: both additions remain blocked capability evidence with `compatibilityClaimed: false`; no public render, browser DOM, native, hydration, event, resource, form, controlled-input, or test-renderer compatibility was broadened.

## Changed Files

- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `worker-progress/worker-1235-public-render-capability-matrix-repair.md`

## Verification

- `node --check tests/smoke/react-dom-private-root-bridge-shell.mjs && node --check tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs` - passed.
- `npm --prefix tests/conformance run root-public-facade:conformance` - passed; blocked public facade rows: 56; failures: 0.
- `npm --prefix tests/conformance run root-render-e2e:conformance` - passed; compatibility remains blocked; failures: 0.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - passed; 44 tests.
- `npm --prefix packages/react-dom run check` - passed; 237 package tests plus import-entrypoints smoke.
- `npm run check:package-surface` - passed.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
- Extra focused check: `node tests/smoke/react-dom-private-root-bridge-shell.mjs` - passed.

## Evidence Gathered

- Package-level `react-dom-client-symbol-facade-gate.test.js` already covers both `unsupported-id-object` and `unsupported-component` labels.
- Smoke coverage previously had `unsupported-component` but not `unsupported-id-object`; the new smoke case is rejected before private bridge side effects.
- Conformance coverage previously had `public-render-unsupported-id-object` but not `public-render-unsupported-component`; the new row is included in the blocked public facade rows.

## Risks Or Blockers

- No blockers.
- This branch intentionally does not update generated oracle JSON or runtime source.

## Recommended Next Tasks

- Merge after orchestrator review if no broader matrix drift is found.
