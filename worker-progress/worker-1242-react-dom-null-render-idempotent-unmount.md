# Worker 1242 - React DOM null render and idempotent unmount

## Status

Implementation and verification complete; commit pending.

## Summary

- Extended the narrow public `react-dom/client.createRoot(container)` facade so `root.render(null)` clears the active fake-DOM host output and leaves the same root reusable.
- Made public `root.unmount()` idempotent: repeated calls return `undefined`, and unmount after prior `render(null)` releases the duplicate-root guard without extra child mutation.
- Kept unsupported render shapes, options, callbacks, events, refs, hydration, resources/forms, native execution, browser DOM compatibility, and broad compatibility claims blocked.

## Changed Files

- `packages/react-dom/client.js`
- `packages/react-dom/src/client/root-bridge.js`
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`

## Commands Run

- `node tests/smoke/react-dom-private-root-bridge-shell.mjs` - pass
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - pass
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs` - pass
- `npm run root-public-facade:conformance --workspace @fast-react/conformance` - pass
- `npm run root-render-e2e:conformance --workspace @fast-react/conformance` - pass
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs` - pass
- `npm run check:package-surface` - pass
- `node tests/smoke/import-entrypoints.mjs` - pass
- `git diff --check` - pass

## Evidence Gathered

- `render(null)` after an accepted div/text render clears `childNodes`, `children`, `firstElementChild`, `textContent`, `innerHTML`, and latest-props metadata.
- `render(null)` before any host render and repeated `render(null)` after cleanup produce no fake-DOM mutation, marker, listener, or registration side effects.
- The same public root can render a new accepted div/text element after `render(null)`.
- `unmount()` after `render(null)` and repeated `unmount()` return `undefined` without extra child mutation.
- Unsupported props/types/components/arrays/fragments/resources/forms/refs/events still reject before private bridge/native/listener/ref side effects in the public facade gate.

## Notes

- `render(null)` before any accepted host render remains a side-effect-free no-op.
- Repeated `render(null)` after cleanup has no second mutation.
- Stale `root.render(...)` after public unmount remains fail-closed.
- Root-render E2E and public-facade gates still report compatibility blocked; root unmount/double-unmount are tracked as known blocked mismatches, not public compatibility admissions.

## Risks Or Blockers

- Residual risk is limited to the intentionally narrow fake-DOM facade. Browser DOM compatibility, native execution, hydration, events, refs, callbacks, resources/forms, and broader root-render shapes remain explicitly blocked.

## Recommended Next Tasks

- None for this worker scope.
