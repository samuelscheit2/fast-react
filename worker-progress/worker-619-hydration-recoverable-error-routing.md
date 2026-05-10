# Worker 619 - Hydration Recoverable Error Routing

## Goal

- Active goal status: active
- Active goal objective: Add private hydration recoverable-error routing diagnostics that tie mismatch metadata to root options without invoking public callbacks.
- `get_goal` was available and returned the same active objective before implementation.

## Summary

- Added a private React DOM root-bridge hydration recoverable-error routing record.
- The record consumes existing hydrateRoot boundary text mismatch metadata, recoverable-error rows, accepted hydration replay error metadata, and hydrateRoot root option callback descriptors.
- The route records `onRecoverableError` association metadata only: no recoverable errors are queued, no root error updates are scheduled, no public callbacks are invoked, and hydration compatibility remains blocked.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-boundary.test.js`
- `worker-progress/worker-619-hydration-recoverable-error-routing.md`

## Evidence Gathered

- React reference source shows hydration mismatch errors are queued through `queueRecoverableErrors` and later delivered through `root.onRecoverableError` during commit.
- Existing Fast React metadata already records hydration text mismatch rows and hydration replay error metadata; this worker links those accepted records to hydrateRoot option callback metadata without executing the public callback.

## Verification

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/hydration-boundary.test.js`
- `node --test packages/react-dom/test/hydration-boundary.test.js`
- `node --test packages/react-dom/test/*.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

## Notes

- Negative coverage rejects stale root options, hydrate records with no mismatch rows, and explicit callback-execution evidence.
- No events or resource/form implementation files were edited.
