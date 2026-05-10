# Worker 310 - DOM Root Private Create Mark/Listen Gate

## Goal Evidence

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and reported status
  `active`.
- Active objective from `get_goal`:
  `Add a private React DOM root bridge gate that can mark containers and register root listeners for private createRoot records while public react-dom/client root APIs remain placeholders.`
- A final `get_goal` check before this report still showed the same objective
  with status `active`.
- `ORCHESTRATOR.md` was not read.

## Summary

Added an explicit private React DOM createRoot side-effect gate. Private
createRoot records can now opt in to a reversible mark/listen step that marks
the root container, installs root listeners plus owner-document
`selectionchange`, and returns frozen side-effect and cleanup records.

The default private root bridge path remains record-only and public
`react-dom/client` `createRoot` / `hydrateRoot` remain placeholders. No native
execution, reconciler execution, hydration, event dispatch, DOM child mutation,
or compatibility claim was added.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/client/root-markers.js`
- `packages/react-dom/src/events/root-listeners.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-310-dom-root-private-create-mark-listen-gate.md`

## Evidence Gathered

- Read required context after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Inspected required worker context: workers 122, 167, 269, 270, and 275.
- Confirmed worker 122 established private container marker/listener shells,
  worker 167 kept the private root bridge inert, worker 269 added native
  request handoff metadata, worker 270 kept public lifecycle rows blocked, and
  worker 275 added read-only hydration marker/listener diagnostics.
- Added marker mutation records in `root-markers.js` that snapshot prior
  marker state, reject occupied truthy root markers, mark the container, and
  restore the exact prior marker state on cleanup.
- Added reversible listener registration records in `root-listeners.js` that
  validate `removeEventListener`, install only new listener-set keys, track
  root/document listening marker snapshots, and remove owned listeners plus
  restore markers on cleanup.
- Added root bridge `applyCreateRootSideEffects` /
  `revertCreateRootSideEffects` private methods and top-level private helpers.
  They validate genuine private create records and bridge ownership before any
  side effects, clean up the marker if listener validation fails, and keep
  render/update/unmount records rejected for this gate.
- Focused tests prove the explicit private gate installs 138 root container
  listeners and 1 owner-document listener, marks the container with the private
  owner, performs no DOM child mutation, and fully reverts the marker,
  listener registrations, listener sets, and listening markers.
- Focused tests also cover invalid render-record input, foreign bridge
  ownership, add-only event targets without `removeEventListener`, and occupied
  truthy container markers failing closed before listener installation.
- Public facade conformance tests now separately exercise the explicit private
  mark/listen gate while confirming public placeholder rows and default private
  bridge inspection remain record-only.
- No nested agents were spawned.

## Commands Run

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files worker-progress | rg 'worker-(122|167|269|270|275)'
rg --files packages/react-dom/src packages/react-dom/test tests/conformance | rg '(root-bridge|root-markers|root-listeners|private-root-bridge|root-public-facade)'
git status --short
sed -n '1,220p' worker-progress/worker-122-dom-container-listener-shell.md
sed -n '1,240p' worker-progress/worker-167-react-dom-private-root-bridge.md
sed -n '1,240p' worker-progress/worker-269-dom-root-bridge-native-request-handoff.md
sed -n '1,240p' worker-progress/worker-270-dom-root-public-facade-update-unmount-blocked-gate.md
sed -n '1,240p' worker-progress/worker-275-hydration-marker-root-bridge-gate.md
sed -n '1,860p' packages/react-dom/src/client/root-bridge.js
sed -n '1,420p' packages/react-dom/src/client/root-markers.js
sed -n '1,480p' packages/react-dom/src/events/root-listeners.js
sed -n '1,520p' packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
sed -n '1,520p' tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
sed -n '520,1040p' packages/react-dom/src/client/root-bridge.js
sed -n '1,320p' packages/react-dom/src/events/listener-registry.js
sed -n '1,360p' tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
sed -n '360,760p' tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
sed -n '760,1240p' tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
sed -n '1240,1700p' tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
sed -n '1700,2200p' tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
sed -n '2200,2760p' tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
sed -n '2740,3040p' tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
sed -n '3040,3260p' tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs
sed -n '1,240p' packages/react-dom/src/client/dom-container.js
sed -n '1,420p' tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs
rg -n "listenToAllSupportedEvents|markContainerAsRoot|unmarkContainerAsRoot|describeRootListenerGuard|warnIfContainerAlreadyRoot|inspectListeningMarker|root-listeners|root-markers" packages/react-dom/test tests/conformance tests/smoke packages/react-dom/src -g '*.js' -g '*.mjs'
sed -n '1,420p' tests/smoke/react-dom-container-listener-shell.mjs
sed -n '1,260p' packages/react-dom/src/client/hydration-boundary-gate.js
cat package.json
cat packages/react-dom/package.json
cat tests/conformance/package.json
rg -n "reconcilerExecution|markerWrites|listenerInstallation|domMutation|compatibilityClaimed|Object\\.keys\\([^\\n]*create|rootBridge\\.|privateRootCreateRecordType" packages/react-dom/test tests/smoke tests/conformance/test tests/conformance/src -g '*.js' -g '*.mjs'
sed -n '1,560p' tests/smoke/react-dom-private-root-bridge-shell.mjs
sed -n '560,720p' tests/smoke/react-dom-private-root-bridge-shell.mjs
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/src/client/root-markers.js
node --check packages/react-dom/src/events/root-listeners.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node tests/smoke/react-dom-private-root-bridge-shell.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs
node --test packages/react-dom/test/*.test.js
npm run root-public-facade:conformance --workspace @fast-react/conformance
npm run root-render-e2e:conformance --workspace @fast-react/conformance
npm run check:js
git diff --check
git status --short
```

## Verification

- `node --check` passed for all touched JS files:
  - `packages/react-dom/src/client/root-bridge.js`
  - `packages/react-dom/src/client/root-markers.js`
  - `packages/react-dom/src/events/root-listeners.js`
  - `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  passed: 5 tests.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
  passed: 8 tests.
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs` passed.
- `node tests/smoke/react-dom-container-listener-shell.mjs` passed.
- `node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`
  passed: 10 tests.
- `node --test packages/react-dom/test/*.test.js` passed: 16 tests.
- `npm run root-public-facade:conformance --workspace @fast-react/conformance`
  passed with 44 accepted client-root rows, 20 accepted root-render rows, 20
  blocked root-render rows, 10 blocked public facade rows, 8 blocked private
  bridge rows, and 0 failures.
- `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
  passed with 0 admitted public rows, 20 blocked public rows, 18 private bridge
  request rows compared, 2 private bridge request rows blocked, 5 portal rows
  blocked, and 0 failures.
- `npm run check:js` passed, including package surface guard, import smoke,
  benchmark gates, workspace checks, native loader checks, and 560 conformance
  tests. NPM printed the existing `minimum-release-age` warnings.
- `git diff --check` passed.

## Risks Or Blockers

- The mark/listen gate is private and explicit. It is not public createRoot
  behavior and does not prove public React DOM root compatibility.
- Reversible listener cleanup requires targets to provide `removeEventListener`.
  That matches browser DOM targets, but intentionally fails closed for minimal
  add-only test doubles.
- Listener cleanup removes only listeners installed by this private gate and
  restores marker snapshots; it does not model React's production lifetime
  policy for retaining delegated root listeners after unmount.
- No reconciler, scheduler, native bridge execution, DOM mutation commit,
  synthetic event dispatch, or hydration behavior is admitted.

## Recommended Next Tasks

- Wire this private gate into a future private root execution path only after
  reconciler/root scheduling can consume the accepted private create request.
- Keep public `react-dom/client` root APIs blocked until marker/listener setup,
  root scheduling, commit, unmount cleanup, and DOM mutation match the accepted
  React DOM root E2E oracle.
- Add a later commit-path test that proves real unmount ordering coordinates
  marker cleanup with sync flush once public roots are intentionally unblocked.
