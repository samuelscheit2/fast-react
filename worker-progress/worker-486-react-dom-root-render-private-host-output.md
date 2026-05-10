# Worker 486: React DOM Root Render Private Host Output

Date: 2026-05-10

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: add a private React DOM root
  facade diagnostic that routes an accepted host-output render through the
  bridge and fake-DOM mutation adapter without opening public root
  compatibility.
- `update_goal(status: "complete")` was called after implementation,
  verification, and report writing; the tool reported time used: 612 seconds.
- Two read-only explorer subagents were spawned for root-bridge and
  conformance orientation, but neither returned a final result before being
  closed; they did not affect the implementation or conclusions.

## Summary

Added a private host-output render diagnostic to the existing symbol-only
`react-dom/client` private root public-facade adapter. The new adapter method
routes a public-shaped private `root.render(element)` call into the bridge,
admits the create/render path, applies the accepted initial fake-DOM host-output
handoff, and immediately reverts the temporary root marker/listener setup.

The diagnostic returns a frozen private record with accepted fake-DOM evidence,
hidden raw payload accessors for focused tests, and explicit blocked
capabilities for public root execution, native/Rust execution, reconciler
execution, browser DOM compatibility, hydration, events, refs, and compatibility
claims. Public `createRoot`, `hydrateRoot`, `root.render`, and `root.unmount`
remain placeholders and no public root compatibility is opened.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `worker-progress/worker-486-react-dom-root-render-private-host-output.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, and present worker reports 368, 395, 410, 427, 428,
  442, and 454.
- Confirmed the existing private bridge already owns create/render admission,
  initial fake-DOM host output, host-output update, root-commit update handoff,
  public-shaped adapter, and marker/listener preflight slices.
- Added `adapter.renderHostOutput(root, element, options)` plus exported
  private record type/status/payload accessors.
- Added fail-closed guards for foreign facade roots, invalid roots, unsupported
  host-output children, occupied root markers, active host-output diagnostics,
  and unmounted roots.
- Focused tests prove the diagnostic mutates only fake DOM, publishes latest
  props through the mutation handoff, cleans marker/listener setup, keeps public
  placeholders inert, and leaves compatibility unclaimed.

## Commands Run

```sh
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node tests/smoke/react-dom-private-root-bridge-shell.mjs
node tests/smoke/react-dom-mutation-adapter-shell.mjs
npm run check --workspace @fast-react/react-dom
node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
npm run root-public-facade:conformance --workspace @fast-react/conformance
git add --intent-to-add worker-progress/worker-486-react-dom-root-render-private-host-output.md
git diff --check
```

## Verification

- Focused React DOM private root bridge package test passed: 29 tests.
- Private root bridge smoke passed.
- DOM mutation adapter smoke passed.
- `npm run check --workspace @fast-react/react-dom` passed: 62 package tests
  plus import-entrypoint smoke. npm printed the existing
  `minimum-release-age` warning.
- Focused public root facade blocked-gate test passed: 16 tests.
- `root-public-facade:conformance` passed with public root compatibility still
  blocked.
- `git diff --check` passed with this progress report included.

## Risks Or Blockers

- No blockers remain for this worker slice.
- The diagnostic is private adapter infrastructure only. It does not schedule
  roots, execute native/Rust or reconciler work, mutate browser DOM, hydrate,
  dispatch events, run refs, or claim compatibility.
- The admitted host-output path is intentionally the narrow existing initial
  fake-DOM HostComponent plus HostText handoff.

## Recommended Next Tasks

1. Add a later private facade update diagnostic only after the public-shaped
   facade can safely select an existing fake-DOM HostComponent token.
2. Keep public root facade conformance rows blocked until public package-path
   roots execute through accepted scheduling, commit, cleanup, event, hydration,
   and browser DOM behavior.
