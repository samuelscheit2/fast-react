# Worker 942 - Resource/Form Reset Currentness

## Summary

- Added source-owned fake form identity and reset currentness records to the
  private form action submit-reset execution path.
- Bound fulfilled reset fake queue/commit evidence to the current reset
  generation and rejected stale replay after a newer reset generation advances.
- Extended the resource/form root execution consumer to require current
  fulfilled-reset generation evidence before consuming accepted resource/form
  rows.
- Kept public resources, form actions, requestFormReset/action invocation,
  React updates, native/root execution, DOM/head/resource mutation, real form
  reset, and package compatibility blocked.

## Changed Files

- `packages/react-dom/src/shared/form-actions.js`
- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/test/form-action-fulfilled-reset-execution.test.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/src/private-admission-850-resource-form-execution-ledger.mjs`
- `tests/conformance/test/private-admission-850-resource-form-execution-ledger.test.mjs`
- `worker-progress/worker-942-resource-form-reset-currentness.md`

## Currentness Path

1. `recordFormActionSubmitDispatchWithGate` creates a private reset
   currentness state for the source submit dispatch record.
2. `recordFormActionSubmitResetExecutionWithGate` increments that state,
   mints `privateFormActionResetFakeFormIdentityRecordType` and
   `privateFormActionResetCurrentnessRecordType` rows, and stores the current
   reset generation in source-owned WeakMap payloads.
3. Callback/action preflight and async callback metadata carry only the minted
   fake-form identity/currentness IDs and generation.
4. `recordFormActionFulfilledResetExecutionWithGate` rejects the submit-reset
   metadata unless it is still the latest generation for the source submit
   dispatch, then records fake reset queue/commit evidence with the same
   currentness IDs.
5. `recordRootExecutionConsumer` calls
   `isCurrentPrivateFormActionFulfilledResetExecutionRecord` and rejects
   fulfilled-reset replay if a newer reset generation has advanced before the
   root consumer consumes the row.

## Evidence Gathered

- Positive canaries now assert the minted fake-form identity, reset
  currentness ID, reset generation, queue/commit propagation, root lifecycle
  binding, and root-consumer consumption.
- Negative coverage rejects stale reset metadata, cloned/caller-built rows,
  cross-root/form aliases, replay after reset generation advances, public
  action/reset claims, DOM/head/resource mutation claims, native/root execution
  claims, and package compatibility claims.
- The private-admission 850 ledger now pins source tokens for reset
  currentness records and root-consumer currentness replay rejection.

## Checks

- `node --check packages/react-dom/src/shared/form-actions.js`
- `node --check packages/react-dom/src/resource-form-gates.js`
- `node --check packages/react-dom/src/resource-form-internals-gate.js`
- `node --check packages/react-dom/test/form-action-fulfilled-reset-execution.test.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --check tests/conformance/src/private-admission-850-resource-form-execution-ledger.mjs`
- `node --check tests/conformance/test/private-admission-850-resource-form-execution-ledger.test.mjs`
- `node --test packages/react-dom/test/form-action-fulfilled-reset-execution.test.js`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs`
- `node --test tests/conformance/test/private-admission-850-resource-form-execution-ledger.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Risks / Blockers

- No blockers found.
- Overlap risk is moderate in `resource-form-gates.js` and root lifecycle
  validation because active React DOM workers may touch adjacent root bridge,
  hydration, and event currentness code. This change does not edit
  `root-bridge.js`.

## Recommended Next Tasks

- Keep future form/root consumers using
  `isCurrentPrivateFormActionFulfilledResetExecutionRecord` before accepting
  fulfilled-reset evidence.
- Re-run the root/resource/form focused suites after merging nearby React DOM
  root lifecycle workers.
