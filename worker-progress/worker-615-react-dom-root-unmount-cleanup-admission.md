# Worker 615: React DOM Root Unmount Cleanup Admission

## Goal

- Active goal status from `get_goal`: active.
- Active goal objective from `get_goal`: Connect private React DOM root unmount diagnostics to accepted deletion cleanup and fake-DOM container cleanup metadata without enabling public unmount.

## Summary

- Added private root unmount admission metadata for root ownership, lifecycle, stale-admission rejection, no-op unmount rejection, and portal-container rejection.
- Connected unmount cleanup diagnostics to fake-DOM clear-container metadata and component-tree deletion cleanup metadata.
- Kept public `root.unmount()` compatibility blocked; new records continue to report no public root execution, no native execution, and no reconciler execution.

## Changed Files

- `packages/react-dom/src/client/dom-container.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `worker-progress/worker-615-react-dom-root-unmount-cleanup-admission.md`

## Evidence Gathered

- Existing unmount cleanup used `clearContainerForRootUnmount`, `detachHostInstanceSubtree`, and root marker/listener cleanup, but did not expose a dedicated unmount admission metadata record.
- Existing portal boundary records already identify portal containers, so root-bridge now tracks those containers and rejects them as root unmount cleanup targets.
- The new fake-DOM cleanup metadata is produced by the DOM host mutation layer and validated by root-bridge before publishing the private cleanup record.

## Verification

- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` passed.
- `node --test packages/react-dom/test/*.test.js` passed.
- `npm run check --workspace @fast-react/react-dom` passed, including import smoke.
- `git diff --check` passed.
- Committed on `worker/615-react-dom-root-unmount-cleanup-admission`.

## Notes

- A nested explorer was started for codebase evidence but did not return before timeout; it was closed and did not affect the implementation.
- No known blockers remain.
