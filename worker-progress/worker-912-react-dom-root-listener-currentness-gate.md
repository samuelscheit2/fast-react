# Worker 912 - React DOM Root Listener Currentness Gate

## Status

Complete.

## Scope

- `packages/react-dom/src/events/root-listeners.js`
- `packages/react-dom/test/events-private.test.js`

## Notes

- Added a WeakMap-backed private/test-only root listener currentness gate that
  validates source-owned registration records without public event dispatch or
  compatibility claims.
- Covered root listener rows, owner-document `selectionchange`, same-container
  dedupe, same-document dedupe, and stale/cloned/alias/mutation canaries in the
  private events test suite.

## Checks

- `node --check packages/react-dom/src/events/root-listeners.js`
- `node --check packages/react-dom/src/events/listener-registry.js`
- `node --check packages/react-dom/test/events-private.test.js`
- `node --test packages/react-dom/test/events-private.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Risks

- Root bridge files also contain marker/listener preflight diagnostics, but this
  worker intentionally stayed inside the event-layer write scope.
