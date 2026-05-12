# Worker 1225 - Hook Nested Freeze Currentness

## Summary

Hardened the five private hook currentness validators in
`packages/react/hook-dispatcher.js` so source-owned, top-level frozen reports no
longer validate when required nested records or arrays remain mutable.

The change preserves source-proof ordering: all new nested frozen-content checks
run only after the report passes the owning `WeakSet` proof and top-level
`Object.isFrozen` check.

## Changed Files

- `packages/react/hook-dispatcher.js`
- `tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `worker-progress/worker-1225-hook-nested-freeze-currentness.md`

## Implementation Notes

- Added targeted frozen-content helper checks for nested string arrays, records,
  and record arrays.
- Applied those checks to:
  - `useRef` currentness reports
  - `useRef` execution evidence reports
  - `useRef` renderer lifecycle blocker reports
  - context renderer readiness reports
  - unsupported placeholder hook currentness reports
- Required source-owned private `useRef` ref objects to remain frozen for
  execution evidence acceptance.
- Required unsupported placeholder hook callback, external store, and id
  generation nested reports to be frozen in addition to matching expected
  fields.
- Added selective `Object.freeze` bypass tests where the helper-created report
  remains top-level frozen and source-owned, but named nested fields are mutable.

## Commands Run

- `node --check packages/react/hook-dispatcher.js`
- `node --check tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `node --test tests/conformance/test/react-hook-dispatcher-oracle.test.mjs`
- `node --test tests/conformance/test/react-hook-dispatcher-guard.test.mjs`
- `npm run check --workspace @fast-react/react`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Evidence

- Oracle suite: 30 tests passed.
- Guard suite: 33 tests passed.
- Workspace React check passed via entrypoint smoke.
- Package surface guard passed.
- Import entrypoint smoke passed.
- `git diff --check` passed.

## Risks Or Blockers

No blockers. The main audit focus is that the new helper functions are used only
after source proof in the private report validators; the hostile proxy tests
continue to cover that ordering.

## Recommended Next Tasks

- Audit future private currentness reports for the same pattern: source-owned
  top-level reports should prove required nested records and arrays are frozen
  before accepting content equality.
