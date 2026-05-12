# Worker 1176 - Public CreateRoot Minimal Host Output

## Summary

- Opened the narrow public `react-dom/client.createRoot(container)` facade only
  far enough to return a root object with `render` and `unmount`.
- Routed one public render shape through the private facade adapter:
  `React.createElement("div", { id? }, string | number)`.
- Kept broad public React DOM compatibility blocked: updates, unmount,
  hydrateRoot, profiling createRoot, events, refs, Scheduler/act/flushSync,
  resources/forms, controlled inputs, portals, and broader element shapes remain
  unsupported.

## Changed Files

- `packages/react-dom/client.js`
- `packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell/context.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell/facade-render-update.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell/host-output-mutation.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell/unmount-lifecycle.js`
- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `tests/smoke/import-entrypoints.mjs`
- `tests/smoke/package-surface-snapshot.json`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `worker-progress/worker-1176-public-create-root-minimal-host-output.md`

## Evidence Gathered

- Public `createRoot` now exposes a minimal root object without marker writes,
  listener installation, or DOM mutation.
- The first accepted public render returns `undefined` and appends exactly one
  fake-DOM `DIV` with the expected text content.
- Unsupported public render inputs fail before marker, listener, or mutation
  side effects.
- Public update and unmount remain blocked at `root.render` and `root.unmount`;
  public `hydrateRoot` and `react-dom/profiling.createRoot` remain blocked.
- The public facade conformance gate records the minimal div text row but keeps
  all broad compatibility rows blocked.

## Commands Run

- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test tests/conformance/test/react-dom-root-render-e2e-conformance-gate.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `npm --prefix packages/react-dom run check`
- `node tests/smoke/package-surface-guard.mjs`
- `node tests/smoke/import-entrypoints.mjs`
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs`
- `node tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `npm --prefix bindings/node run check`
- `git diff --check`

## Results

- All commands passed.

## Risks Or Blockers

- No blockers.
- The public facade is intentionally minimal and should not be treated as
  browser DOM or broad React DOM compatibility.
- The implementation still relies on the private fake-DOM adapter path; native
  execution and N-API runtime loading remain untouched.
