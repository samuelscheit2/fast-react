# Worker 442: DOM Root Marker/Listener Public-Facade Preflight

Date: 2026-05-10

## Goal Evidence

- First action: `create_goal` was called before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: `Add a public-facade
  preflight gate that proves root marker and root listener setup/cleanup
  prerequisites for future public React DOM root execution without installing
  public behavior.`

## Summary

Added a private public-facade marker/listener preflight gate behind the existing
symbol-only `react-dom/client.createRoot` adapter. The new adapter method
accepts a private public-shaped root facade, applies the existing reversible
createRoot marker/listener side-effect gate, immediately reverts it, and returns
a frozen preflight record with setup and cleanup evidence plus hidden payload
links.

The gate proves that the future public-facade root path can satisfy root marker
ownership, root listener installation, owner-document `selectionchange`, and
cleanup prerequisites. It remains private and fail-closed: public `createRoot`
and `hydrateRoot` still throw placeholders, no public roots execute, no
hydration runs, no event dispatch occurs, no native/reconciler execution runs,
and no host DOM children/text/attribute mutation is admitted.

## Changed Files

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
- `worker-progress/worker-442-dom-root-marker-listener-public-facade-preflight.md`

## Evidence Gathered

- Read required context after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and present worker reports 122, 167,
  170, 171, 337, 367, 395, and 412.
- Worker report 427 was requested but not present under `worker-progress/`.
- Confirmed the current public `react-dom/client` facade remains a placeholder
  with a non-enumerable symbol-only private adapter on `createRoot`.
- Confirmed existing private createRoot side effects already provide reversible
  root marker and root listener setup/cleanup records.
- Added
  `preflightRootMarkerListenerSetupAndCleanup(root, options)` on the private
  public-facade adapter and exported
  `preflightPrivateRootPublicFacadeMarkerListenerSetup(root, options)` for
  focused private tests.
- Added a new
  `FastReactDomPrivateRootPublicFacadeMarkerListenerPreflightRecord` with
  setup evidence, cleanup evidence, accepted capability ids, blocked capability
  ids, and hidden payload accessors.
- Focused tests prove successful setup/cleanup, hidden raw payloads, final
  marker/listener cleanup, foreign-root rejection, invalid-root rejection,
  occupied-marker rejection, unmounted-root rejection, and unchanged public
  placeholder behavior.
- No nested agents were spawned.

## Commands Run

```sh
create_goal
get_goal
git status --short
rg --files
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,240p' worker-progress/worker-122-dom-container-listener-shell.md
sed -n '1,240p' worker-progress/worker-167-react-dom-private-root-bridge.md
sed -n '1,240p' worker-progress/worker-170-dom-event-priority-shell.md
sed -n '1,240p' worker-progress/worker-171-dom-root-marker-listener-guard.md
sed -n '1,260p' worker-progress/worker-337-react-dom-root-private-create-render-admission.md
sed -n '1,260p' worker-progress/worker-367-react-dom-root-private-initial-render-host-output.md
sed -n '1,260p' worker-progress/worker-395-react-dom-private-root-public-facade-adapter.md
sed -n '1,260p' worker-progress/worker-412-private-root-output-gate-docs-and-smoke-refresh.md
rg --files worker-progress | rg 'worker-427'
sed -n '1,360p' packages/react-dom/src/client/root-markers.js
sed -n '1,520p' packages/react-dom/src/client/root-bridge.js
sed -n '1,420p' packages/react-dom/src/events/root-listeners.js
sed -n '1,320p' packages/react-dom/src/events/listener-registry.js
sed -n '1,260p' packages/react-dom/client.js
sed -n '1,260p' packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
sed -n '260,620p' packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
sed -n '2440,2635p' packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
sed -n '1,320p' tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
sed -n '320,760p' tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
sed -n '760,940p' tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --check packages/react-dom/src/client/root-bridge.js
node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --check packages/react-dom/src/client/root-markers.js
node --check packages/react-dom/src/events/root-listeners.js
node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js
node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs
node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
node tests/smoke/react-dom-private-root-bridge-shell.mjs
npm run check --workspace @fast-react/react-dom
git add --intent-to-add worker-progress/worker-442-dom-root-marker-listener-public-facade-preflight.md && git diff --check
git reset -- worker-progress/worker-442-dom-root-marker-listener-public-facade-preflight.md
```

## Verification

- `node --check packages/react-dom/src/client/root-bridge.js`: passed.
- `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed.
- `node --check tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`:
  passed.
- `node --check packages/react-dom/src/client/root-markers.js`: passed.
- `node --check packages/react-dom/src/events/root-listeners.js`: passed.
- `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`:
  passed, 21 tests.
- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`:
  passed, 14 tests.
- `node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`:
  passed, 25 tests.
- `node tests/smoke/react-dom-container-listener-shell.mjs`: passed.
- `npm run check --workspace @fast-react/react-dom`: passed, 45 package
  tests plus import-entrypoint smoke. NPM printed the existing
  `minimum-release-age` warning.
- `git add --intent-to-add worker-progress/worker-442-dom-root-marker-listener-public-facade-preflight.md && git diff --check`:
  passed, including the new progress report.

## Notes

- An optional `node tests/smoke/react-dom-private-root-bridge-shell.mjs` run
  failed on an existing host-output update accepted-capability expectation:
  actual capability ids included `property-payload-evidence` and
  `attribute-payload-rows` where the smoke expected only the older three-row
  list. This failure is unrelated to the marker/listener public-facade
  preflight and is not part of the requested verification command set.

## Risks Or Blockers

- No blockers remain for this worker slice.
- The new gate intentionally installs and removes listener shells only on fake
  event targets during private preflight. It does not authorize public root
  behavior, browser DOM compatibility, hydration, event dispatch, host mutation,
  native execution, or reconciler execution.
- Future public root work should consume this as prerequisite evidence only,
  then add separate public-path compatibility gates when public root execution
  is explicitly opened.

## Recommended Next Tasks

1. Add a public-path root execution admission only after createRoot can route
   through accepted scheduling and commit paths without bypassing this
   marker/listener preflight evidence.
2. Keep public facade conformance rows blocked until setup, render/update,
   unmount cleanup, event behavior, hydration, and DOM mutation match React DOM
   19.2.6 through public package paths.
3. Refresh the optional private root-bridge smoke host-output capability list
   separately if that smoke is restored to the required verification set.
