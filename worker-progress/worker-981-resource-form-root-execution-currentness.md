# Worker 981 - Resource/Form Root Execution Currentness

## Summary

- Tightened the private React DOM resource/form root execution consumer so
  resource root-map storage evidence and fulfilled-reset fake queue/commit
  evidence must share the exact current private render lifecycle boundary.
- Added a consumer-visible `rootExecutionCurrentnessBoundary` that records the
  Worker 981 currentness check, exact lifecycle payload/container sharing,
  source-owned tokens, stale/cross-root/replay/clone blockers, and public/root
  execution blockers.
- Required fulfilled-reset root lifecycle bindings to come from render
  lifecycle boundaries before recording root-bound fake reset evidence.
- Kept public resources/forms, real form reset, React update queueing,
  DOM/head mutation, native/root execution, and package compatibility false.

## Context Preserved

- Builds on accepted Workers 856, 850, 883, 893, 942, 952, and 953.
- Follows Worker 901 lifecycle boundary currentness conventions: exact
  source-owned lifecycle admission, active/current request boundary, shared
  root/container identity, and rejection of cloned/caller-shaped evidence
  before private execution evidence is consumed.

## Changed Files

- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/src/shared/form-actions.js`
- `packages/react-dom/test/form-action-fulfilled-reset-execution.test.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `worker-progress/worker-981-resource-form-root-execution-currentness.md`

## Verification

- `node --check packages/react-dom/src/resource-form-gates.js` - passed
- `node --check packages/react-dom/src/shared/form-actions.js` - passed
- `node --check packages/react-dom/test/form-action-fulfilled-reset-execution.test.js` - passed
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js` - passed
- `node --test packages/react-dom/test/form-action-fulfilled-reset-execution.test.js` - passed, 2 tests
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js` - passed, 61 tests
- `npm run check --workspace @fast-react/react-dom` - passed, 229 package tests plus import smoke
- `npm run check:package-surface` - passed
- `node tests/smoke/import-entrypoints.mjs` - passed
- `git diff --check` - passed
- `git diff --cached --check` - passed

## Risks

- No blocker remains.
- Merge overlap risk is moderate around `resource-form-gates.js` and the large
  resource/form test file because nearby private root/resource/form workers may
  extend adjacent boundaries. Preserve the Worker 981 currentness boundary and
  the render-only fulfilled-reset lifecycle binding when resolving conflicts.
