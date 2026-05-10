# Worker 427: React DOM Public Root Facade Private Execution Preflight

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add a public-shaped React DOM root
  facade preflight that can route createRoot/render/unmount calls into accepted
  private bridge diagnostics without opening public compatibility.

## Summary

Added a hidden private public-facade preflight behind
`react-dom/client.createRoot`. The public `createRoot` and `hydrateRoot`
exports still throw the existing `FAST_REACT_UNIMPLEMENTED` placeholder errors.

The new preflight is reachable only through
`Symbol.for('fast.react_dom.client.private_root_public_facade_preflight')` on
the placeholder `createRoot` function. It exposes a public-shaped private
`createRoot(container).render(...).unmount()` flow, but each call only produces
accepted private bridge diagnostics: request admission records and inert native
request handoff mirrors. It does not apply marker/listener side effects, mutate
DOM, hydrate, execute native/Rust/reconciler work, or claim compatibility.

## Changed Files

- `packages/react-dom/client.js`
  - Attached the private preflight factory as a non-enumerable,
    non-configurable, non-writable symbol property on the placeholder
    `createRoot` function.
- `packages/react-dom/src/client/root-bridge.js`
  - Added private preflight/root/record types, symbol, status constants,
    accepted/blocked capability metadata, accessors, payload guards, and the
    public-shaped preflight factory.
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - Added focused coverage for createRoot/render/unmount preflight routing,
    accepted request admissions, native handoff mirrors, stale render blocking,
    hidden payload accessors, and no marker/listener/DOM side effects.
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
  - Added public-facade blocked gate coverage proving the preflight is
    symbol-only private evidence and public placeholders remain blocked.
- `worker-progress/worker-427-react-dom-public-root-facade-private-execution-preflight.md`
  - This report.

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested prior worker reports present in this checkout: 239, 240, 337,
  367, 368, 369, 395, 410, 411, and 412.
- Confirmed worker 395 already provided a symbol-only adapter that routes
  public-shaped root calls to private request records.
- Confirmed accepted private bridge diagnostics available for this slice are
  request admissions and native handoff mirrors, both with execution and
  compatibility blocked.
- Confirmed public root blocked gate still expects public `createRoot` and
  `hydrateRoot` placeholders, with public lifecycle rows blocked.
- No nested agents were spawned.

## Commands Run

```sh
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/client.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
npm run root-public-facade:conformance --workspace @fast-react/conformance
npm run check --workspace @fast-react/react-dom
npm run check:package-surface
git diff --check
```

Additional inspection used `rg`, `sed`, `git status --short`, `git diff
--stat`, and `get_goal`.

## Verification

- JS syntax checks passed for all touched JS/MJS files.
- Focused private root bridge package test passed: 20 tests.
- Focused public facade blocked-gate test passed: 14 tests.
- `root-public-facade:conformance` passed with 13 blocked public facade rows,
  8 blocked private bridge rows, 18 admitted private host-output diagnostic
  rows, 2 blocked private host-output rows, 2 admitted private warning-boundary
  rows, 18 blocked private warning-boundary rows, 5 blocked portal rows, and
  0 failures.
- `npm run check --workspace @fast-react/react-dom` passed with 44 package
  tests plus import-entrypoint smoke.
- `npm run check:package-surface` passed.
- `git diff --check` passed before writing this report and again with this
  report included via `--intent-to-add`.
- npm printed the existing `minimum-release-age` warning during npm commands;
  it did not affect results.

## Risks Or Blockers

- The new preflight is private diagnostic infrastructure only. It does not
  make public `createRoot`, `hydrateRoot`, `root.render`, or `root.unmount`
  compatible.
- The preflight deliberately stops at request admission and native handoff
  mirror diagnostics. It does not apply the accepted private mark/listen or
  fake-DOM host-output paths, so it cannot be used as public DOM behavior
  evidence.
- No package-surface snapshot update was needed because public string exports
  and package export maps did not change.

## Recommended Next Tasks

1. Keep public root facade rows blocked until public package-path root
   execution can be compared against the React DOM 19.2.6 oracle.
2. If future workers route this preflight into host-output diagnostics, keep
   that path separate from public DOM compatibility and prove cleanup/no-leak
   behavior with focused gates.
3. Snapshot React DOM private runtime facade symbols in the package-surface
   guard if more hidden public-function symbols are added.
