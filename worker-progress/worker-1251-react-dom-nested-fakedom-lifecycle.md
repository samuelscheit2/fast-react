# Worker 1251 React DOM Nested Fake-DOM Lifecycle

## Summary

- Extended the public `react-dom/client.createRoot(container).render(...)`
  fake-DOM host-output facade from flat `<div>{text}</div>` to one narrow
  nested shape: `<div id?><span>{text}</span></div>`.
- Preserved the accepted flat div/text lifecycle, `render(null)` cleanup,
  idempotent `root.unmount()`, stale render-after-unmount rejection, and
  recreate-after-unmount behavior.
- Kept unsupported arrays, fragments, component wrappers, events, refs, style,
  `dangerouslySetInnerHTML`, resources/forms/controlled inputs, hydration,
  browser DOM compatibility, and listener installation blocked before fake-DOM
  mutation.

## Changed Files

- `packages/react-dom/client.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `worker-progress/worker-1251-react-dom-nested-fakedom-lifecycle.md`

## Evidence

- Public facade validation now admits only a parent `div` with primitive text or
  exactly one nested `span` HostComponent with primitive text. The nested child
  still rejects keys, `id`, event/ref/style/dangerous HTML props, arrays,
  fragments, siblings, and component wrappers.
- The root bridge now detects active nested initial host output and updates the
  mounted child HostText plus outer parent latest props in place. Outer `id`
  updates are covered both when nested text changes and when only the outer id
  changes.
- Tests cover initial nested render, same-root nested text update, outer id
  update, `render(null)` cleanup, recreate after `render(null)`, idempotent
  unmount cleanup, stale old-root render rejection, recreate after unmount, and
  hostile unsupported sibling/component/prop probes.

## Commands Run

- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js` - pass, 5/5 tests.
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs` - pass.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - pass, 46/46 tests.
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs` - pass, 11/11 tests.
- `npm run check --workspace @fast-react/react-dom` - pass, including package tests and import smoke.
- `npm run check:package-surface` - pass.
- `node tests/smoke/import-entrypoints.mjs` - pass.
- `git diff --check` - pass.

## Risks And Blockers

- Public compatibility remains intentionally narrow and fake-DOM only. No
  browser DOM, hydration, listener/event, ref, style, dangerous HTML,
  resources/forms, controlled input, native bridge execution, Scheduler, act, or
  broad root compatibility is claimed.
- Nested support is intentionally one parent `div` plus one child `span`; nested
  sibling arrays and all component/wrapper shapes remain blocked.

## Recommended Next Tasks

- Add a separately scoped worker for another explicit host shape only after this
  nested shape is accepted and audited.
- Keep broader DOM prop/event/ref/style/hydration work behind separate
  fail-closed gates.
