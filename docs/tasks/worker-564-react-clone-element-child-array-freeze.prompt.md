# Worker 564: React CloneElement Child Array Freeze

## Objective

Close the focused React `cloneElement` development-mode multiple-children array
freeze mismatch against the React 19.2.6 element-object oracle without claiming
full element-object compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
The current `packages/react/element-factory.js` freezes `createElement`
multiple-child arrays in development, and `jsxDEV`/`jsxs` freeze static child
arrays, but `cloneElement` currently builds a fresh multiple-children array
without freezing it in development. The checked element-object oracle already
captures `clone-multiple-children` behavior.

## Write Scope

- `packages/react/element-factory.js`
- `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
- `tests/conformance/test/element-object-oracle.test.mjs`
- `worker-progress/worker-564-react-clone-element-child-array-freeze.md`
- If the oracle generator requires a narrow metadata/count update, the matching
  `tests/conformance/src/element-object-*.mjs` file may also be edited.

Do not edit hooks, React DOM, scheduler, react-test-renderer, native transport,
or unrelated package-surface guards.

## Requirements

- Match React 19.2.6 for development `React.cloneElement(element, null, a, b)`
  child-array freeze behavior while preserving production mutability.
- Regenerate or update the element-object oracle artifacts and test assertions
  so the checked oracle reflects the new Fast React observation.
- Keep `fastReactBehaviorCompatible`, `fullDualRunOracleExists`, and
  compatibility-claimed flags false unless the existing oracle framework already
  proves full compatibility.
- Preserve existing key/ref/defaultProps/child validation behavior.
- Commit all accepted changes on the worker branch before marking the worker
  goal complete.

## Verification

- `npm run element-object:generate --workspace @fast-react/conformance` if the
  oracle artifact changes
- `node --test tests/conformance/test/element-object-oracle.test.mjs`
- `npm run check --workspace @fast-react/react`
- `git diff --check`
