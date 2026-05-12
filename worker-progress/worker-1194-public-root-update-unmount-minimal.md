# Worker 1194 - Public Root Update And Unmount Minimal Slice

## Summary

- Opened the next narrow public `react-dom/client.createRoot` lifecycle slice
  after the accepted first div text render.
- Public `root.render(React.createElement("div", { id? }, text | number))`
  now supports repeat fake-DOM host-output updates on the same root and returns
  `undefined`.
- Public `root.unmount()` now succeeds after an accepted minimal render, clears
  fake-DOM host output, clears duplicate-root tracking for the container, and
  returns `undefined`.
- Kept render-after-unmount, repeated unmount, unmount before the accepted render,
  unsupported render arguments/shapes/props, options, hydrateRoot, profiling
  createRoot, browser DOM compatibility, events, refs, Scheduler/act/flushSync,
  portals, resources/forms, and controlled inputs blocked.

## Changed Files

- `packages/react-dom/client.js`
- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell/context.js`
- `tests/conformance/scripts/check-react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `worker-progress/worker-1194-public-root-update-unmount-minimal.md`

## Evidence

- Public repeat render mutates the existing fake-DOM `DIV` text path without
  replacing the host node.
- Public unmount removes the fake-DOM output, leaves root/listener markers clear,
  and permits a later `createRoot(container)` on the same container.
- Stale render after unmount and repeated public unmount still throw
  `FAST_REACT_UNIMPLEMENTED`.
- Public facade conformance rows record these slices as minimal fake-DOM
  admissions while broad root compatibility remains blocked.

## Checks

- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix packages/react-dom run check` - passed
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - passed
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs` - passed
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix tests/conformance run root-public-facade:conformance` - passed
- `source /Users/user/.nvm/nvm.sh && nvm use 26.1.0 >/dev/null && npm --prefix tests/conformance run root-render-e2e:conformance` - passed
- `git diff --check` - passed

## Remaining Blockers

- This does not claim broad public React DOM root compatibility.
- Unsupported element shapes, props beyond `id`, callbacks/options, empty-root
  unmount, repeated unmount, stale root updates, hydrateRoot, profiling
  createRoot, native `.node` loading, browser DOM behavior, events/listeners,
  refs, Scheduler/act/flushSync, portals, resources/forms, and controlled inputs
  remain intentionally fail-closed.
