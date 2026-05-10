# Worker 395: React DOM Private Root Public Facade Adapter

Date: 2026-05-10

## Goal State

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add an explicitly private adapter
  behind `react-dom/client` that can route createRoot/render/unmount calls to
  existing private root bridge records for tests, while default public
  placeholders remain fail-closed.

## Summary

Added a symbol-only private root facade adapter behind the public
`react-dom/client.createRoot` placeholder. The public `createRoot` and
`hydrateRoot` exports still throw structured `FAST_REACT_UNIMPLEMENTED`
placeholder errors by default and keep the same enumerable export shape.

The private adapter is reachable only through
`Symbol.for('fast.react_dom.client.private_root_public_facade_adapter')` on the
`createRoot` function. It creates a fresh private root bridge shell and returns
a private root facade whose `render` and `unmount` methods route to existing
private bridge request records. It does not apply marker/listener side effects,
run native or reconciler work, mutate DOM, or claim compatibility.

## Changed Files

- `packages/react-dom/client.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-395-react-dom-private-root-public-facade-adapter.md`

## Evidence Gathered

- Read required context after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and worker reports 167, 310, 337,
  367, 368, 369, 380, and 381.
- Confirmed the existing private root bridge already owns deterministic
  create/render/unmount request records, create/render admission, fake-DOM
  host-output diagnostics, and unmount cleanup paths.
- Added `createPrivateRootPublicFacadeAdapter` and private facade root payload
  accessors in `root-bridge.js`.
- Attached the adapter factory as a non-enumerable, non-writable,
  non-configurable symbol property on the public `createRoot` placeholder.
- Focused tests prove the adapter routes `createRoot`, `root.render`, repeated
  `root.unmount`, and render-after-unmount through existing private bridge
  behavior while leaving containers, markers, listeners, and public facade
  behavior untouched.
- No nested agents were spawned.

## Commands Run

```sh
node --check packages/react-dom/client.js
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node tests/smoke/react-dom-private-root-bridge-shell.mjs
npm run root-public-facade:conformance --workspace @fast-react/conformance
npm run check --workspace @fast-react/react-dom
git diff --check
git add --intent-to-add worker-progress/worker-395-react-dom-private-root-public-facade-adapter.md
git diff --check
```

## Verification

- JS syntax checks passed for all touched JS/MJS files.
- Focused private root bridge package test passed: 17 tests.
- Focused public facade blocked-gate conformance test passed: 12 tests.
- Private root bridge smoke passed.
- `root-public-facade:conformance` passed with 12 blocked public facade rows,
  8 blocked private bridge rows, 16 admitted private host-output diagnostics,
  4 blocked private host-output diagnostics, 5 blocked portal rows, and 0
  failures.
- `npm run check --workspace @fast-react/react-dom` passed with 38 package
  tests plus import-entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- `git diff --check` passed, including this report after marking it
  intent-to-add.

## Risks Or Blockers

- The adapter is private test infrastructure only. It does not make public
  `createRoot`, public `hydrateRoot`, `root.render`, or `root.unmount`
  compatible.
- The adapter returns private bridge records and does not schedule work, run
  native/Rust or reconciler execution, apply marker/listener side effects, or
  mutate host output.
- Hydration remains intentionally outside this adapter and public
  `hydrateRoot` stays a placeholder.

## Recommended Next Tasks

- Keep public root facade rows blocked until public package-path root execution
  can be compared against the React DOM 19.2.6 oracle.
- Use this symbol-only adapter for tests that need public-shaped
  createRoot/render/unmount calls without exposing public compatibility.
- Add later public facade admissions only after marker/listener setup,
  scheduling, commit, unmount cleanup, events, hydration, and DOM mutation are
  all explicitly accepted through the real public path.
