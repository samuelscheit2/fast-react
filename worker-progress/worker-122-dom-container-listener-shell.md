# worker-122-dom-container-listener-shell

## Summary

Implemented the first private React DOM container/listener shell layer without
changing public React DOM root placeholders. The new modules provide:

- DOM container validation for element, document, and document fragment roots.
- Explicit invalid-container errors matching the worker 088 development and
  production message anchors, with an internal Fast React error code.
- Private root marker ownership using a randomized `__reactContainer$` expando,
  including duplicate-root and legacy-root diagnostic message helpers.
- Root listener marker and per-event listener-set dedupe using private
  randomized expandos.
- Root and portal listener installation shell behavior: 85 root/portal event
  names, 138 root registrations, owner-document `selectionchange`, passive
  wheel/touch listeners, capture-only root installation for 32 non-delegated
  native events, same-container dedupe, same-document document dedupe, and
  cross-document portal owner-document registration.
- No synthetic event extraction, event dispatch, root facade, reconciler,
  hydration, controlled-form, portal render, or DOM mutation commit behavior.

The implementation intentionally uses per-event listener-set dedupe instead of
using the coarse listening marker as the only gate. This preserves React's
observable marker side effect while avoiding the root cause where an
owner-document `selectionchange` marker could suppress later document-root
listener installation in this internal layer. No public compatibility claim is
made for that private implementation choice.

## Goal Evidence

- `create_goal` was called first with objective
  `Implement the React DOM container marker and root listener shell as internal source modules, preserving public React DOM root placeholders and avoiding event dispatch, with focused tests and progress updates per worker brief.`
- `get_goal` was available after setup and reported status `active` for that
  objective.

## Changed Files

- `packages/react-dom/src/client/dom-container.js`
- `packages/react-dom/src/client/root-markers.js`
- `packages/react-dom/src/events/event-names.js`
- `packages/react-dom/src/events/listener-registry.js`
- `packages/react-dom/src/events/root-listeners.js`
- `tests/smoke/react-dom-container-listener-shell.mjs`
- `worker-progress/worker-122-dom-container-listener-shell.md`

Pre-existing untracked `.worker-logs/` remains untouched.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read the required worker reports: workers 088, 089, 090, 092, 094, 098, 116,
  and 117.
- Inspected public React DOM placeholders and confirmed this worker did not
  modify `packages/react-dom/client.js`, `packages/react-dom/index.js`,
  `packages/react-dom/profiling.js`, `packages/react-dom/placeholder-utils.js`,
  `tests/smoke/import-entrypoints.mjs`, or scheduler package files.
- Used worker 088's checked oracle to anchor valid containers, invalid
  messages, private root marker prefix, marker nulling on unmark, and
  development-only duplicate-root diagnostics.
- Used worker 089's checked oracle to anchor listener counts, event-name
  counts, non-delegated capture-only root registration, passive wheel/touch
  registration, owner-document `selectionchange`, same-container dedupe,
  same-document owner-document dedupe, and cross-document portal behavior.
- Inspected the local React source clone at
  `/Users/user/Developer/Developer/react-reference` for
  `ReactDOMComponentTree.js`, `ReactDOMContainer.js`,
  `ReactDOMRoot.js`, `DOMPluginEventSystem.js`, `EventRegistry.js`,
  `DOMEventNames.js`, and `EventListener.js`.

## Delegated Checks

- Explorer `019e0f14-74cc-7633-a15a-1fa683a7a868` inspected worker 088/089
  reports and checked oracle artifacts. It confirmed schemas, marker states,
  listener counts, dedupe behavior, portal/document cases, out-of-scope
  dispatch claims, and likely worker 122 write scope.
- Explorer `019e0f14-8261-70e3-8b57-b2ba4adc239a` inspected the React 19.2.6
  source clone. It confirmed randomized root/listener marker keys,
  `markContainerAsRoot`/`unmarkContainerAsRoot`, `isValidContainer`,
  `listenToAllSupportedEvents`, `nonDelegatedEvents`, passive option handling,
  owner-document `selectionchange`, and the coarse listening-marker edge for
  document roots.

## Verification

- `node --check packages/react-dom/src/client/dom-container.js`
- `node --check packages/react-dom/src/client/root-markers.js`
- `node --check packages/react-dom/src/events/root-listeners.js`
- `node --check packages/react-dom/src/events/listener-registry.js`
- `node --check packages/react-dom/src/events/event-names.js`
- `node --check tests/smoke/react-dom-container-listener-shell.mjs`
- `node tests/smoke/react-dom-container-listener-shell.mjs`
  - Passed: `React DOM internal container marker and root listener shell smoke checks passed.`
- `node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`
  - Passed: 9 tests.
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
  - Passed: 15 tests.
- `npm run test:smoke`
  - Passed. NPM printed the existing `minimum-release-age` config warning.
- `git add --intent-to-add <scoped files> && git diff --check && git reset -- <scoped files>`
  - Passed.
- Scoped path check over the changed file list passed.
- Scoped conflict-marker check over the changed file list passed.
- Scoped trailing-whitespace check over the changed file list passed.

## Prompt-To-Artifact Checklist

- Internal modules added:
  `dom-container.js`, `root-markers.js`, `root-listeners.js`,
  `listener-registry.js`, and `event-names.js` all exist under the requested
  paths.
- Focused test added:
  `tests/smoke/react-dom-container-listener-shell.mjs` directly exercises the
  private modules and confirms public `react-dom/client` remains a placeholder.
- Progress recorded:
  this report records goal evidence, implementation, delegated checks,
  commands, and risks.
- Public placeholders preserved:
  `git status --short -- packages/react-dom/client.js packages/react-dom/index.js packages/react-dom/profiling.js packages/react-dom/placeholder-utils.js tests/smoke/import-entrypoints.mjs packages/scheduler`
  produced no output.
- No public root APIs implemented:
  no changes were made to public React DOM entrypoints, and the smoke test
  still observes `react-dom/client.createRoot` throwing
  `FAST_REACT_UNIMPLEMENTED`.
- No event dispatch implemented:
  listener shell functions return `undefined` and only carry internal metadata;
  they do not synthesize events, read props, enqueue updates, or call plugin
  dispatch.
- Container validation covered:
  the smoke test covers element, document, document fragment, null,
  undefined, plain object, text node, and comment node.
- Root marker ownership covered:
  the smoke test covers mark, unmark-to-null, root owner readback,
  duplicate-root warning text, legacy-root warning text, and production
  warning suppression.
- Listener marker dedupe covered:
  the smoke test covers repeated same-container root listener installation,
  listener marker presence, and per-event listener-set dedupe.
- Owner-document `selectionchange` covered:
  the smoke test covers root owner-document registration, same-document
  dedupe, cross-document portal owner document registration, and document-root
  selectionchange presence.
- Root/portal shell behavior covered:
  the smoke test covers root containers, same-document portals, and
  cross-document portals.
- Oracle anchors preserved:
  the checked worker 088 and worker 089 oracle tests both pass unchanged.
- Write scope honored:
  the only worker-created files are the seven paths listed in `Changed Files`;
  `.worker-logs/` was already untracked and remains untouched.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
git status --short
rg --files
find worker-progress -maxdepth 1 -type f -print | sort
sed -n '1,260p' docs/tasks/worker-122-dom-container-listener-shell.prompt.md
sed -n '1,260p' worker-progress/worker-088-dom-container-root-markers-oracle.md
sed -n '1,280p' worker-progress/worker-089-dom-root-listener-installation-oracle.md
sed -n '1,240p' worker-progress/worker-092-react-dom-create-root-facade-plan.md
sed -n '1,260p' worker-progress/worker-090-dom-node-map-public-instance-plan.md
sed -n '1,260p' worker-progress/worker-094-root-unmount-flushsync-plan.md
sed -n '1,300p' worker-progress/worker-098-dom-event-plugin-extraction-plan.md
sed -n '1,320p' worker-progress/worker-116-dom-event-plugin-implementation-plan.md
sed -n '1,320p' worker-progress/worker-117-root-render-implementation-sequencing-plan.md
find packages/react-dom -maxdepth 4 -type f -print | sort
sed -n '1,220p' packages/react-dom/client.js
sed -n '1,260p' packages/react-dom/index.js
sed -n '1,220p' packages/react-dom/package.json
sed -n '1,220p' packages/react-dom/placeholder-utils.js
sed -n '1,260p' tests/smoke/import-entrypoints.mjs
sed -n '1,220p' tests/smoke/react-dom-root-exports.mjs
sed -n '1,220p' package.json
sed -n '1,220p' tests/conformance/oracles/react-19.2.6-react-dom-container-root-markers-oracle.json
sed -n '1,260p' tests/conformance/oracles/react-19.2.6-react-dom-root-listener-installation-oracle.json
node --input-type=module -e '<summarize root listener oracle event counts>'
rg -n 'allNativeEvents|nonDelegatedEvents|listenToAllSupportedEvents|selectionchange|passiveBrowserEventsSupported|__reactListening|listenToNativeEvent|listenToNonDelegatedEvent' packages tests /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src /Users/user/Developer/Developer/react-reference/packages/react-dom/src -g '*.js'
sed -n '1,260p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/DOMPluginEventSystem.js
sed -n '1,240p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMComponentTree.js
sed -n '240,520p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/DOMPluginEventSystem.js
sed -n '240,360p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/client/ReactDOMComponentTree.js
sed -n '520,620p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/DOMPluginEventSystem.js
sed -n '1,160p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/EventRegistry.js
sed -n '1,140p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/DOMEventNames.js
sed -n '988,1012p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/DOMPluginEventSystem.js
sed -n '1,90p' /Users/user/Developer/Developer/react-reference/packages/react-dom-bindings/src/events/EventListener.js
mkdir -p packages/react-dom/src/client packages/react-dom/src/events
node --check packages/react-dom/src/client/dom-container.js
node --check packages/react-dom/src/client/root-markers.js
node --check packages/react-dom/src/events/root-listeners.js
node --check packages/react-dom/src/events/listener-registry.js
node --check packages/react-dom/src/events/event-names.js
node --check tests/smoke/react-dom-container-listener-shell.mjs
node tests/smoke/react-dom-container-listener-shell.mjs
node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs
node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs
npm run test:smoke
git add --intent-to-add packages/react-dom/src/client/dom-container.js packages/react-dom/src/client/root-markers.js packages/react-dom/src/events/root-listeners.js packages/react-dom/src/events/listener-registry.js packages/react-dom/src/events/event-names.js tests/smoke/react-dom-container-listener-shell.mjs worker-progress/worker-122-dom-container-listener-shell.md && git diff --check && git reset -- packages/react-dom/src/client/dom-container.js packages/react-dom/src/client/root-markers.js packages/react-dom/src/events/root-listeners.js packages/react-dom/src/events/listener-registry.js packages/react-dom/src/events/event-names.js tests/smoke/react-dom-container-listener-shell.mjs worker-progress/worker-122-dom-container-listener-shell.md
if rg -n '^(<<<<<<<|=======|>>>>>>>)' packages/react-dom/src/client/dom-container.js packages/react-dom/src/client/root-markers.js packages/react-dom/src/events/root-listeners.js packages/react-dom/src/events/listener-registry.js packages/react-dom/src/events/event-names.js tests/smoke/react-dom-container-listener-shell.mjs worker-progress/worker-122-dom-container-listener-shell.md; then exit 1; else exit 0; fi
if perl -ne 'print "$ARGV:$.: trailing whitespace\n" if /[ \t]$/' packages/react-dom/src/client/dom-container.js packages/react-dom/src/client/root-markers.js packages/react-dom/src/events/root-listeners.js packages/react-dom/src/events/listener-registry.js packages/react-dom/src/events/event-names.js tests/smoke/react-dom-container-listener-shell.mjs worker-progress/worker-122-dom-container-listener-shell.md | rg .; then exit 1; else exit 0; fi
git status --short -- packages/react-dom/client.js packages/react-dom/index.js packages/react-dom/profiling.js packages/react-dom/placeholder-utils.js tests/smoke/import-entrypoints.mjs packages/scheduler
find packages/react-dom/src tests/smoke worker-progress -path '*worker-122*' -o -path '*react-dom-container-listener-shell.mjs' -o -path 'packages/react-dom/src/*' | sort
node --input-type=module -e '<summarize final private event-name counts and no-dispatch shell>'
```

## Quality Review

Maintainability: behavior is split by concern: DOM container validation,
container root markers, event-name data, listener registry state, and
root/portal listener installation. Future facade/event workers can consume the
modules without importing public entrypoints or raw fibers.

Performance: root and portal installation dedupe is O(event names) only on the
first target installation and O(event names) with cheap Set lookups on repeats.
No listener closures retain root owners, fibers, props, or user callbacks.

Security: the shell does not execute user callbacks or inspect native event
payloads. It performs explicit validation for invalid containers and event
targets.

## Risks Or Follow-Ups

- Event-name lists are pinned to the checked React DOM 19.2.6 oracle and should
  be regenerated from the oracle/source if the target React DOM version changes.
- Public `createRoot`, `hydrateRoot`, `root.render`, `root.unmount`, portals,
  DOM mutation commit, hydration replay, controlled restore, and synthetic
  event dispatch remain intentionally unimplemented.
- Future facade work must decide how much private document-root listener
  behavior should track React's coarse-marker source edge versus the stronger
  per-event internal dedupe used here.
