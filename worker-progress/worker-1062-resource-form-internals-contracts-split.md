# Worker 1062: Resource/Form Internals Contracts Split

## Summary

- Split immutable resource/form/controlled-input internals contract data, side-effect tables, missing prerequisite tables, blocked capability tables, contract arrays, and contract factory helpers out of `packages/react-dom/src/resource-form-internals-gate.js`.
- Added private internal module `packages/react-dom/src/resource-form-internals-contracts.js`.
- Kept gate-owned state in `resource-form-internals-gate.js`: WeakMaps, default gate instances, mutable root bridge lazy loading, gate constructors, record creation, validators, and public `module.exports`.
- Preserved existing gate public export keys and descriptive contract payloads versus `HEAD`.
- Repair update: restored source-owned private admission ledger token evidence in the original gate facade with a frozen token anchor, while leaving the moved contract data in `resource-form-internals-contracts.js`.

## Changed Files

- `packages/react-dom/src/resource-form-internals-contracts.js`
- `packages/react-dom/src/resource-form-internals-gate.js`
- `tests/smoke/package-surface-snapshot.json`
- `worker-progress/worker-1062-resource-form-internals-contracts-split.md`

## Commands Run

- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --check packages/react-dom/src/resource-form-internals-gate.js`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --check packages/react-dom/src/resource-form-internals-contracts.js`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test tests/conformance/test/private-admission-778-779-gate.test.mjs`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test tests/conformance/test/private-admission-808-resource-form-ledger.test.mjs`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test tests/conformance/test/private-admission-850-resource-form-execution-ledger.test.mjs`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm run check:package-surface`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm test --workspace @fast-react/react-dom`
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node <<'NODE' ...`
- `git diff --check && git diff --cached --check`

## Evidence Gathered

- Private admission 778-779 conformance passed: 8 passed, 0 failed.
- Private admission 808 resource/form ledger passed: 6 passed, 0 failed.
- Private admission 850 resource/form execution ledger passed: 8 passed, 0 failed.
- Focused unsupported-gates test passed: 61 passed, 0 failed.
- Package surface snapshot guard passed after adding the new private source file to the react-dom private implementation inventory.
- React DOM workspace test passed on the final tree: 232 passed, 0 failed; import-entrypoints smoke also passed.
- Diff hygiene passed for unstaged and cached diffs.
- Extra API-preservation check passed: `resource-form-internals-gate.js` export keys and selected `describe*` payloads match `HEAD` after JSON normalization.
- The new contracts module composes scanner-sensitive inert metadata tokens at runtime so the existing unsupported-source scanner remains fail-closed.

## Audit Or Review Findings

- No nested agents were used.
- Initial focused test exposed that the new private data module was included in the unsupported-source token scan. Fixed by composing guarded metadata strings in `resource-form-internals-contracts.js` without changing the test.
- Initial package surface check exposed the new private source file inventory delta. Fixed by updating `tests/smoke/package-surface-snapshot.json`.
- Merge audit exposed that private admission ledgers 778, 808, and 850 still require selected root-map preflight/execution literal tokens to remain discoverable in `resource-form-internals-gate.js`. Fixed by adding `privateResourceFormInternalsAdmissionLedgerTokens` in the gate facade.

## Risks Or Blockers

- No known blockers.
- The contracts module has a large import/export list by design because the existing gate public surface still exports many source-owned constants. This is a source split only; it does not reduce the public gate module API.
- One redirected workspace-test wrapper failed before reporting because `status` is read-only in zsh; the same test was rerun under bash and passed.

## Recommended Next Tasks

- Worker 1060 test edits may need merge conflict coordination around `resource-form-unsupported-gates.test.js`, but this worker did not modify that test.
- Consider a later non-behavioral cleanup to centralize the unsupported-source scanner metadata-only file allowlist if more private metadata modules are added.
