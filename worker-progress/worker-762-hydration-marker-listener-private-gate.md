# Worker 762: Hydration Marker/Listener Private Gate

## Goal Tool State

- `get_goal` succeeded at the start of the turn.
- Active goal status: `active`.
- Active goal objective: extend the accepted Worker 741
  `react-dom/client.hydrateRoot` private facade preflight with a narrow private
  marker/listener gate while keeping public `hydrateRoot`, DOM mutation, real
  hydration, event replay, recoverable error routing, root execution, and
  compatibility claims blocked.

## Summary

- Added a hydrateRoot-specific private marker/listener preflight record inside
  the existing symbol-only `react-dom/client.hydrateRoot` private facade
  preflight.
- The new record validates the unsupported hydrateRoot request's deferred root
  marker guard and listener guard against live marker/listener snapshots, then
  records the preconditions as read-only private diagnostics.
- Acceptance audit hardening now compares root marker snapshot property rows
  field-by-field and validates listener guard `ownerDocumentInfo` and
  `rootEventTargetInfo` against the actual container metadata.
- The gate records both clean containers and containers with already-active
  private root marker/listener side effects without applying new writes.
- Tampered marker guards, marker property snapshots, listener booleans, listener
  target metadata, and public compatibility metadata claims fail closed.
- Public `hydrateRoot` remains the unsupported placeholder; no public root
  object is created, no marker is written, no listener is installed, no DOM is
  mutated, no hydration/event replay/recoverable-error routing runs, and no
  compatibility is claimed.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-762-hydration-marker-listener-private-gate.md`

## Commands Run

- `node --check packages/react-dom/client.js`
- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js --test-name-pattern "hydrateRoot|public facade|marker/listener"`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs --test-name-pattern "hydrateRoot|public facade|marker/listener"`
- `node --test tests/conformance/test/private-admission-739-745-gate.test.mjs`
- `node --test tests/conformance/test/private-admission-746-753-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run root-public-facade:conformance --workspace @fast-react/conformance`
- `git diff --check`

## Evidence

- Private hydrateRoot preflight records now expose an embedded
  `FastReactDomPrivateHydrateRootPublicFacadeMarkerListenerPreflightRecord`
  with:
  - marker guard action
    `defer-mark-container-as-root-for-hydrate-root`;
  - listener guard action
    `defer-listen-to-all-supported-events-for-hydrate-root`;
  - marker/listener state snapshots before and after diagnostic collection;
  - explicit preconditions for root marker state, root listener marker state,
    owner-document listener marker state, registration counts, set sizes, and
    mutation counts;
  - blocker evidence for marker writes, listener installation, hydration marker
    consumption, event replay, recoverable-error routing, public hydrateRoot,
    and compatibility.
- Tests prove the marker/listener diagnostic is tied to the hydrateRoot preflight
  payload and remains non-public/non-enumerable through the existing private
  symbol facade.
- Tests prove existing root marker/listener state is recognized without adding
  registrations, mutating the DOM, or changing marker/listener state.
- Tests prove tampered marker counts, forged marker `properties`, listener
  marker booleans, and swapped listener target metadata fail with
  `FAST_REACT_DOM_INVALID_ROOT_PUBLIC_FACADE_PREFLIGHT`.
- Existing Worker 741 accepted private metadata claim rejection remains covered.
- Package surface and smoke entrypoint checks did not require snapshot updates.

## Risks Or Blockers

- No blockers found.
- This remains diagnostic-only. It does not implement a hydration root,
  hydratable cursor state, marker consumption, scheduling, event replay,
  recoverable-error routing, or DOM commit behavior.
- The new private record is exported only through the internal root-bridge
  diagnostics module; no public package subpath or runtime facade symbol was
  added.

## Recommended Next Tasks

- Keep public `hydrateRoot` blocked until a later worker proves hydration root
  construction, marker consumption, event replay, recoverable error routing,
  DOM mutation, and compatibility against the React 19.2.6 oracle.
- If a future native/Rust hydrateRoot handoff is introduced, make it consume this
  marker/listener diagnostic explicitly instead of treating this record-only gate
  as execution compatibility.
