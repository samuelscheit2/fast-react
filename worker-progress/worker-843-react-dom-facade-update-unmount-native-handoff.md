# Worker 843: React DOM Facade Update/Unmount Native Handoff

## Summary

- Extended the private React DOM client facade host-output update diagnostic to
  mirror its `root.render` update request through the existing inert native
  root bridge handoff.
- Extended private facade root unmount cleanup diagnostics to mirror their
  `root.unmount` request through the same native handoff before exposing cleanup
  metadata.
- Kept public `createRoot`, `root.render`, `root.unmount`, browser DOM
  compatibility, native execution, reconciler execution, hydration, refs/events,
  and compatibility claims blocked.
- Added focused assertions for update/unmount native handoff payload identity,
  request kind, environment id, and blocked execution flags.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`

## Evidence Gathered

- Read `WORKER_BRIEF.md`.
- Confirmed the low-level native handoff mirror already supports create,
  render, and unmount request records, then added update lifecycle coverage.
- Confirmed the private facade update and cleanup diagnostics were the missing
  surfaces: they had fake-DOM update/unmount evidence but no cached native
  request handoff metadata.
- Confirmed aggregate conformance gates only needed private metadata fixture
  updates for the new accepted native handoff mirror IDs; public compatibility
  remains blocked.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --check tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `node --check tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

## Verification

- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed, 65 tests.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`:
  passed, 36 tests.
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`:
  passed, 11 tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 193 package tests
  plus import-entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check`: passed.

## Risks Or Blockers

- No blockers remain.
- This is private metadata only. The native request is mirrored but never
  executed, and no public root compatibility surface is opened.
- The handoff is intentionally scoped to the accepted fake-DOM facade
  update/unmount cleanup paths; nested update diagnostics remain diagnostic-only
  without a new native handoff claim.

## Recommended Next Tasks

- Keep future native/Rust execution work behind separate gates that prove real
  scheduling, commit, DOM mutation, cleanup, and public compatibility behavior.
- If nested public-facade update handoff metadata becomes useful, add it in a
  separate worker with its own native handoff admission and fixtures.
