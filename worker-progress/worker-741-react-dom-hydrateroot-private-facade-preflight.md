# Worker 741: hydrateRoot Private Facade Preflight

## Summary

Added a distinct symbol-only private preflight on
`react-dom/client.hydrateRoot`. The new hidden symbol is
`fast.react_dom.client.private_hydrate_root_public_facade_preflight`, separate
from the existing createRoot adapter/preflight symbols.

The private hydrateRoot preflight records an unsupported private
`hydrateRoot(container, initialChildren, options)` bridge request and an
admission record through the existing root bridge. It intentionally does not
create a public root object, does not mirror a native request handoff, does not
write root markers/listeners, does not mutate DOM, does not execute hydration,
does not replay events, and does not claim compatibility.

Public `react-dom/client.hydrateRoot` remains the unsupported placeholder and
continues to throw `FAST_REACT_UNIMPLEMENTED`.

## Changed Files

- `packages/react-dom/client.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/smoke/import-entrypoints.mjs`
- `tests/smoke/package-surface-snapshot.json`
- `worker-progress/worker-741-react-dom-hydrateroot-private-facade-preflight.md`

## Commands Run

- `node --check packages/react-dom/client.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js --test-name-pattern "hydrateRoot|public facade"`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs --test-name-pattern "hydrateRoot|public facade"`
- `npm run root-public-facade:conformance --workspace @fast-react/conformance`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `git diff --check`

## Evidence

- The private bridge test proves the hydrateRoot symbol is attached only to
  `reactDomClient.hydrateRoot`, not to `createRoot`, and that createRoot's
  existing private symbols are not reused.
- The hydrateRoot private preflight record carries:
  - `operation: "hydrate"`
  - `facadeCall: "hydrateRoot"`
  - `requestType: "hydrateRoot"`
  - `rootKind: "unsupported-hydration"`
  - bridge admission status `admitted-private-root-bridge-request-record`
  - no native handoff record
  - all execution, mutation, marker, listener, hydration, event, and
    compatibility flags blocked/false.
- The focused and workspace tests prove public `hydrateRoot` still throws,
  creates no public root object, and leaves marker/listener/mutation state
  unchanged.
- Package surface smoke data now deliberately tracks the new non-enumerable
  hydrateRoot private runtime facade symbol.

## Risks Or Blockers

- No blockers found.
- The new preflight intentionally records diagnostic hydration boundary
  metadata, including sanitized unsupported hydration evidence. It does not
  attempt native handoff mirroring because the bridge already rejects
  hydrateRoot records for native handoff as diagnostic-only.

## Recommended Next Tasks

- Keep public hydrateRoot blocked until a later worker proves real hydration
  root creation, marker consumption, event replay, recoverable error routing,
  DOM mutation behavior, and compatibility against the React 19.2.6 oracle.
- If future workers add native hydration request shapes, update this preflight
  explicitly rather than inferring compatibility from the current diagnostic
  admission record.
