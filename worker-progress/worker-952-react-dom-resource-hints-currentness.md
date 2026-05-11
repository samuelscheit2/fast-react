# Worker 952 - React DOM Resource Hints Currentness

## Summary

- Added a source-owned root lifecycle identity boundary for private resource
  root-map storage execution records when they are used by root consumers.
- Made `recordRootExecutionConsumer` require current render root lifecycle
  evidence for resource root-map execution, matching root bridge admission,
  lifecycle boundary, container identity, visible boundary tokens, and hidden
  WeakMap payloads.
- Made standalone private resource root-map diagnostics require a source-owned
  current render root lifecycle binding, while rejecting omitted bindings,
  stale, cross-root/container, wrong operation, public compatibility,
  native/Rust, and Worker 910 caller-token smuggling.
- Extended the private-admission 850 ledger with resource root lifecycle
  boundary tokens and source-owned currentness fields.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
- `packages/react-dom/src/resource-form-gates.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/src/private-admission-850-resource-form-execution-ledger.mjs`
- `tests/conformance/test/private-admission-850-resource-form-execution-ledger.test.mjs`
- `worker-progress/worker-952-react-dom-resource-hints-currentness.md`

## Evidence

- Resource root-map execution records now always expose
  `rootExecutionBoundary` and store source-owned identity in
  `getPrivateResourceHintRootMapStorageRootIdentityPayload`.
- Root execution consumers validate exact root admission, lifecycle boundary,
  lifecycle payload, container info, render operation, active/current lifecycle,
  visible source tokens, and blocked public/native flags before consuming
  resource evidence.
- Negative canaries cover omitted resource lifecycle binding, stale resource
  lifecycle, cross-container resource reuse, wrong root operation, caller-built
  source tokens, Worker 910 evidence aliases, public compatibility claims, and
  native/Rust execution claims.
- Public resource hint placeholders and public form/resource compatibility
  remain blocked.

## Checks

- `node --check packages/react-dom/src/resource-form-gates.js`
- `node --check packages/react-dom/src/resource-form-internals-gate.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --check packages/react-dom/test/form-action-fulfilled-reset-execution.test.js`
- `node --check tests/conformance/src/private-admission-808-resource-form-ledger.mjs`
- `node --check tests/conformance/src/private-admission-850-resource-form-execution-ledger.mjs`
- `node --check tests/conformance/test/private-admission-850-resource-form-execution-ledger.test.mjs`
- `node --test --test-name-pattern "root execution consumer|root-map storage execution" packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test packages/react-dom/test/form-action-fulfilled-reset-execution.test.js`
- `node --test tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs tests/conformance/test/private-admission-850-resource-form-execution-ledger.test.mjs`
- `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs tests/conformance/test/react-dom-form-actions-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Risks / Follow-Up

- Overlap risk is moderate in `resource-form-gates.js` and
  `resource-form-unsupported-gates.test.js` because nearby root lifecycle and
  hydration workers may touch adjacent root consumer guards.
- The internals gate lazy-loads `root-bridge.js` for the new bound execution
  path to avoid reopening the existing resource-form/root-bridge module-load
  cycle.
- No public resource, form, root, native, Rust, or package compatibility was
  opened.
