# Worker 869: React DOM Private Facade Lifecycle Consumer

## Summary

- Routed a second private React DOM client facade `root.render()` call through
  the fake-DOM host-output update consumer instead of producing only request
  metadata while an active host output is present.
- Added source-owned lifecycle container snapshot records for private facade
  render, update, and unmount cleanup execution. Diagnostics now expose accepted
  snapshot status, phase, ownership, before/after child counts, and
  marker/listener preservation evidence.
- Added fail-closed validation for private lifecycle source overrides so cloned
  or caller-built create/render/update/unmount records cannot drive fake-DOM
  mutation paths.
- Preserved Worker 843/848 invariants: native handoff metadata remains inert,
  marker/listener state is restored, and public/browser DOM, hydration,
  resources, forms, refs/events, and compatibility surfaces remain blocked.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-869-react-dom-private-facade-lifecycle-consumer.md`

## Evidence Gathered

- Reviewed the existing private facade adapter, host-output render/update, and
  unmount cleanup paths built by Workers 843 and 848.
- Confirmed active private facade host output is tracked via source-owned
  render diagnostics and can be reused for update mutation without opening the
  public `createRoot` surface.
- Confirmed marker/listener guards should compare marker and listener state,
  while allowing fake-DOM mutation logs to change during accepted render,
  update, and unmount phases.
- Added positive package and conformance coverage for second-`root.render()`
  lifecycle updates, plus render/update/unmount snapshot payload identity.
- Added negative package coverage for cloned or caller-built lifecycle source
  create/render/update/unmount records before any new fake-DOM mutation occurs.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js`
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

## Verification

- Focused package root-bridge test passed: 68 tests.
- Focused conformance public-facade blocked gate passed: 36 tests.
- React DOM workspace check passed: 200 package tests plus import-entrypoint
  smoke. npm printed the existing `minimum-release-age` warning.
- Package surface guard passed.
- Import entrypoint smoke passed.
- `git diff --check` passed.

## Risks Or Blockers

- No blockers remain.
- The lifecycle source override options are private diagnostic hooks only; they
  reject non-canonical source records and do not expose public root behavior.
- This remains fake-DOM/private metadata execution only. Native requests are
  mirrored but not executed, and public React DOM compatibility remains blocked.

## Recommended Next Tasks

- Keep browser DOM, hydration, resources, forms, refs/events, and public
  compatibility behind separate gates with their own execution evidence.
