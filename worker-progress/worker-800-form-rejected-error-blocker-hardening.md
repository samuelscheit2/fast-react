# Worker 800: form rejected-error blocker hardening

Status: ready for handoff

- Read WORKER_BRIEF.md.
- Added cross-gate stale rejected async execution rejection for the rejected-error preflight gate while preserving specific admission failures for public escape hatches.
- Expanded rejected-error public reset/action blockers and public form-action boundary fields for submit dispatch, action invocation, error routing, DOM mutation, reset queue/commit, and compatibility claims.
- Added exact fail-closed public-boundary shape assertions to the React DOM unit gate test and conformance helper.
- Verified:
  - `node --check packages/react-dom/src/shared/form-actions.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --check tests/conformance/src/react-dom-form-actions-unsupported-gates.mjs`
  - `node --check tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
  - `npm run check --workspace @fast-react/react-dom`
  - `npm run check:package-surface`
  - `node tests/smoke/import-entrypoints.mjs`
  - `git diff --check`

Merge risk: moderate form/resource overlap in `packages/react-dom/src/shared/form-actions.js` and the unsupported gate tests. The change is scoped to rejected-error preflight metadata and should merge cleanly unless another worker edits the same boundary shape or admission reasons.
