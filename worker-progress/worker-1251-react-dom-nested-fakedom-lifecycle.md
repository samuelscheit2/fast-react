# Worker 1251 React DOM Nested Fake-DOM Lifecycle

## Summary

- Repaired the audited active public nested fake-DOM update path so
  `<div id?><span>{text}</span></div>` updates are applied transactionally:
  parent property mutation first, child property handoff second, text mutation
  third, and parent/child latest props published together only after all
  mutations succeed.
- Replaced the misleading child-only `host-output-update-handoff` evidence on
  active nested public updates with source-owned nested update evidence:
  `parentPropertyMutation`, `childPropertyMutation`,
  `nestedHostOutputUpdateCurrent`, and parent-backed `propertyMutation`.
- Added rollback for failed active nested public update records so hostile
  parent attribute failures do not mutate child text, publish latest props, or
  leave the root lifecycle poisoned.
- Preserved the existing narrow public facade: flat div text, one nested
  div/span fake-DOM shape, `render(null)` cleanup, id removal, duplicate-root
  guard, render-after-unmount rejection, and recreate-after-unmount behavior.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `worker-progress/worker-1251-react-dom-nested-fakedom-lifecycle.md`

## Evidence

- Active nested updates now expose parent id set/remove evidence from the same
  source update record that drove the fake-DOM mutation.
- Hostile parent `setAttribute("id", ...)` failure leaves the initial parent id,
  child text node, parent latest props, and child latest props unchanged, then
  unmount still succeeds after lifecycle rollback.
- Public and smoke tests now cover nested no-id render, nested id removal,
  nested span `id`/`className` blockers, nested component smuggling, and
  compatibility alias rejection.
- E2E conformance now verifies text+id, id-only, and id-removal nested active
  update diagnostics with source-owned parent mutation evidence.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js` - pass.
- `node --check packages/react-dom/client.js` - pass.
- `node --check packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js` - pass.
- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js` - pass, 5/5 tests.
- `node --check tests/smoke/react-dom-private-root-bridge-shell.mjs` - pass.
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs` - pass.
- `node --check tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs` - pass.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - pass, 46/46 tests.
- `node --check tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs` - pass.
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs` - pass, 12/12 tests.
- `npm run check --workspace @fast-react/react-dom` - pass, 237/237 package tests plus import smoke.
- `npm run check:package-surface` - pass.
- `node tests/smoke/import-entrypoints.mjs` - pass.
- `git diff --check` - pass.

## Risks And Blockers

- No broad public React DOM compatibility is claimed. Browser DOM, hydration,
  listeners/events, refs, style, dangerous HTML, resources/forms, controlled
  inputs, native execution, reconciler scheduling, and generic nested
  reconciliation remain blocked.
- The active nested diagnostic intentionally has no single
  `hostOutputUpdateHandoffId`; source-owned parent/child property handoffs and
  latest-props batch publication are the durable evidence for this narrow
  nested update.

## Recommended Next Tasks

- If direct unmount after successful active nested updates is required, scope a
  follow-up to teach unmount currentness about source-owned nested update
  diagnostics rather than generic child host-output handoffs.
- Keep additional public host shapes behind separate fail-closed gates.
