# Worker 512 Progress: React DOM Facade Unmount Cleanup

## Goal

- Final pane closeout observed by orchestrator: complete (tmux reported `Goal achieved`).
- Status: active
- Objective: Add a private React DOM client facade unmount cleanup diagnostic that routes an accepted fake-DOM host-output cleanup through the private bridge without opening public root unmount compatibility.

## Summary

- Added a private, symbol-only React DOM client facade host-output unmount cleanup diagnostic.
- The diagnostic creates private facade create/render/unmount request records, admits create/render through the private bridge, applies fake-DOM host output, then routes cleanup through `cleanupUnmountHostOutput`.
- Public `react-dom/client` `createRoot`, public root unmount behavior, native/Rust execution, reconciler scheduling, browser DOM compatibility, events, refs, hydration, and compatibility claims remain blocked.
- Existing resource, form, controlled, event, portal, ref, host-output render, and public facade gates stayed green.
- Nested delegation: spawned one read-only explorer for script/pattern confirmation; it timed out before returning results and was closed. No conclusions depend on nested-agent output.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-512-react-dom-facade-unmount-cleanup.md`

## Implementation Notes

- Added `privateRootPublicFacadeHostOutputUnmountCleanupRecordType` plus accepted/blocked capability rows and hidden payload accessors.
- Added hidden adapter methods:
  - `unmountHostOutput(root, element, options)`
  - `getRootHostOutputUnmountCleanupDiagnostics(root)`
- Added exported private helpers:
  - `unmountPrivateRootPublicFacadeHostOutput`
  - `getPrivateRootPublicFacadeHostOutputUnmountCleanupPayload`
  - `isPrivateRootPublicFacadeHostOutputUnmountCleanupRecord`
- The new path rejects foreign roots, invalid roots, unsupported host-output elements, occupied root markers, active host-output render diagnostics, and already unmounted facade roots.

## Commands Run

- `node --check packages/react-dom/src/client/root-bridge.js` - pass
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` - pass
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - pass
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js` - pass, 31 tests
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs` - pass, 18 tests
- `npm run root-public-facade:conformance --workspace @fast-react/conformance` - pass
- `npm run check --workspace @fast-react/react-dom` - pass, 69 package tests plus import-entrypoint smoke
- `git diff --check` - pass

## Evidence

- Package test verifies the facade unmount diagnostic records private create/render/unmount ids, bridge admission, initial host-output handoff, unmount cleanup id/status, fake-DOM clear counts, detached component-tree metadata counts, marker/listener cleanup, hidden payload linkage, and public placeholder behavior.
- Conformance test verifies the new diagnostic is reachable only through the private adapter symbol and remains non-compatible while public facade lifecycle rows stay blocked.
- React DOM workspace check proves existing resource/form/controlled/event/portal/ref/host-output diagnostics remained accepted.

## Risks Or Blockers

- No blocker found.
- The diagnostic is intentionally fake-DOM/private-only and should not be treated as browser DOM or public root unmount compatibility evidence.
- The hidden adapter surface grew, but the public `react-dom/client` export keys and public placeholder behavior remain unchanged.

## Recommended Next Tasks

- Merge with adjacent React DOM facade workers carefully if they add more private adapter methods or payload snapshot fields.
- Keep package-surface/import-smoke checks in the merge batch because new private exports can interact with private-file guard expectations.
