# Worker 246: Hydration Container Marker Parser

## Goal Tool State

- `create_goal` succeeded before research, file reads, implementation, or
  verification.
- `get_goal` succeeded immediately after setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: Add a private hydration
  container marker parser/diagnostic gate for accepted React DOM hydration
  marker evidence, keeping hydrateRoot, event replay, DOM mutation, Suspense
  hydration, root scheduling, and compatibility claims unsupported.

## Summary

- Added a private React DOM hydration marker parser at
  `packages/react-dom/src/client/hydration-marker-parser.js`.
- The parser reads only container `childNodes`, comment data, and template
  marker attributes, summarizes accepted React DOM 19.2.6 hydration marker
  evidence, and returns diagnostic-only records with all hydration,
  scheduling, event replay, DOM mutation, Suspense hydration, form claiming,
  and compatibility flags set to false.
- Wired the existing private hydration boundary gate to expose
  `inspectContainerMarkers()` and to attach marker diagnostics to unsupported
  `hydrateRoot` records.
- Replaced the old `no-dom-marker-parser` blocker with
  `no-hydration-marker-consumption` and added an explicit
  `no-hydration-root-scheduling` blocker, preserving fail-closed public
  `hydrateRoot` behavior.
- Expanded the focused conformance test to cover every accepted hydration
  marker contract, invalid-container rejection for the parser path, no
  container marking/listener/DOM mutation side effects, and public placeholder
  boundaries.

## Changed Files

- `packages/react-dom/src/client/hydration-marker-parser.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-246-hydration-container-marker-parser.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`; did not read `ORCHESTRATOR.md`.
- Inspected worker reports 049, 088, 122, 169, and 218.
- Inspected hydration marker oracle files:
  `tests/conformance/src/react-dom-hydration-marker-targets.mjs`,
  `tests/conformance/src/react-dom-hydration-marker-oracle.mjs`,
  `tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json`,
  and `tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs`.
- Inspected existing private React DOM helpers:
  `dom-container.js`, `root-markers.js`, `root-bridge.js`, and
  `root-listeners.js`.
- Confirmed the parser consumes the accepted marker snapshot only as
  diagnostic evidence and does not mark containers, attach listeners, create
  roots, replay events, schedule work, mutate DOM nodes, or claim compatibility.

## Commands Run

```sh
create_goal
get_goal
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '261,520p' MASTER_PROGRESS.md
sed -n '521,760p' MASTER_PROGRESS.md
sed -n '761,1040p' MASTER_PROGRESS.md
git status --short
rg --files
rg --files packages/react-dom/src/client tests/conformance/src tests/conformance/test worker-progress | rg 'hydration|container-root|root-listener|worker-(049|088|122|169|218)'
rg -n 'hydration|hydrateRoot|marker|container' packages/react-dom/src/client tests/conformance/src tests/conformance/test
sed -n '1,260p' packages/react-dom/src/client/hydration-boundary-gate.js
sed -n '261,620p' packages/react-dom/src/client/hydration-boundary-gate.js
sed -n '1,360p' tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs
sed -n '1,260p' packages/react-dom/src/client/root-markers.js
sed -n '1,160p' packages/react-dom/src/client/dom-container.js
sed -n '1,260p' tests/conformance/src/react-dom-hydration-marker-oracle.mjs
sed -n '1,220p' tests/conformance/src/react-dom-hydration-marker-targets.mjs
sed -n '220,420p' tests/conformance/src/react-dom-hydration-marker-targets.mjs
sed -n '928,1118p' tests/conformance/oracles/react-19.2.6-react-dom-hydration-marker-oracle.json
sed -n '1,340p' tests/conformance/test/react-dom-hydration-marker-oracle.test.mjs
sed -n '1,220p' worker-progress/worker-049-react-dom-hydration-marker-oracle.md
sed -n '1,240p' worker-progress/worker-088-dom-container-root-markers-oracle.md
sed -n '1,260p' worker-progress/worker-122-dom-container-listener-shell.md
sed -n '1,260p' worker-progress/worker-169-hydration-boundary-skeleton.md
sed -n '1,220p' worker-progress/worker-218-hydration-boundary-failclosed.md
sed -n '1,260p' docs/tasks/worker-246-hydration-container-marker-parser.prompt.md
sed -n '1,220p' packages/react-dom/client.js
sed -n '1,220p' packages/react-dom/profiling.js
sed -n '1,260p' packages/react-dom/src/client/root-bridge.js
sed -n '1,220p' packages/react-dom/src/events/root-listeners.js
node --check packages/react-dom/src/client/hydration-marker-parser.js
node --check packages/react-dom/src/client/hydration-boundary-gate.js
node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs
node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs
npm run check:js
git diff --stat
git diff -- packages/react-dom/src/client/hydration-boundary-gate.js tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs
git add --intent-to-add packages/react-dom/src/client/hydration-marker-parser.js worker-progress/worker-246-hydration-container-marker-parser.md && git diff --check
git status --short
```

## Verification

- `node --check packages/react-dom/src/client/hydration-marker-parser.js`:
  passed.
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`:
  passed.
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed.
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed, 6 tests.
- `npm run check:js`: passed, including package-surface, smoke entrypoints,
  benchmark gates, workspace checks, native loader probes, and 506 conformance
  tests. npm emitted the pre-existing `minimum-release-age` config warning.
- `git diff --check`: passed after intent-to-add for new scoped files.

## Risks Or Blockers

- The parser is deliberately diagnostic-only. It does not consume markers into
  dehydrated boundaries, does not implement `hydrateRoot`, and does not unblock
  compatibility claims.
- The parser reads a deterministic DOM-like subset (`childNodes`, comment
  data, and template attributes). Real browser hydration remains blocked on
  a hydration root constructor, initial hydration scheduling, hydration
  context/cursors, boundary DOM operations, event replay, and form marker
  claiming.
- The accepted marker snapshot is still duplicated in the private gate and
  checked against the oracle. Future React target changes should update the
  oracle, accepted snapshot, parser classification, and focused gate together.

## Recommended Next Tasks

- Add real hydration marker consumption only after reconciler hydration root
  construction and hydratable cursor state exist.
- Add Suspense/Activity dehydrated boundary claiming after boundary state can
  be produced without DOM mutation.
- Add event replay and explicit hydration target gates only after dehydrated
  root/boundary ownership is available.

## Nested Agents

- Spawned two read-only explorer agents for current gate shape and oracle
  context. Neither produced a usable final report before this worker completed,
  so no conclusions depend on delegated results; both agents were closed.
