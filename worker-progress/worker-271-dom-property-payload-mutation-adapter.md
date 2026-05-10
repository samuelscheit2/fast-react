# Worker 271 - DOM Property Payload Mutation Adapter

## Goal

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and returned status `active`.
- Active objective recorded from `get_goal`: "Wire the private DOM ordinary
  property payload helper into the private fake-DOM mutation adapter for
  admitted attribute/property rows, preserving deterministic ordering and
  fail-closed unsupported records without public roots, events, hydration,
  controlled forms, resources, or compatibility claims."
- Final pre-report `get_goal` check still showed status `active` for the same
  objective.

## Summary

Wired the private DOM property payload helper into the private fake-DOM
mutation adapter through `commitDomPropertyUpdate`, which diffs old/new props
with `diffDomPropertyPayload` and applies the admitted payload through a new
prevalidated adapter path.

The adapter applies ordinary attribute/property records, preserves the existing
style/`dangerouslySetInnerHTML` admitted records in payload order, and skips
explicit `nonPayload` rows without wiring events or children. Unsupported
controlled-form, resource-host, invalid-style, and malformed records still fail
before any fake-DOM mutation is applied.

No public root rendering, event dispatch, hydration, controlled form behavior,
resource handling, Rust crates, package exports, or compatibility claims were
changed.

## Changed Files

- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/dom-host/property-payload.js`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `worker-progress/worker-271-dom-property-payload-mutation-adapter.md`

## Evidence Gathered

- Read required project context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`; did not read `ORCHESTRATOR.md`.
- Read required worker context reports for workers 154, 186, 212, 238, 242,
  259, and 261.
- Inspected current private DOM host mutation, property-payload, smoke, and
  conformance tests to preserve worker 238's strict ordinary applier, worker
  242's style/HTML applier, worker 259's latest-props boundary, and worker
  261's HostText gate.
- Confirmed public `react-dom/client.createRoot` remains an unsupported
  placeholder through the existing mutation smoke coverage.
- No nested agents were spawned.

## Commands Run

- Tool actions: `create_goal`, then `get_goal`; final `get_goal` before this
  report.
- Context/research commands used `sed -n`, `rg`, `ls`, `git status`, and
  `git diff` over the required docs, worker reports, DOM host files, and tests.
- `node --check packages/react-dom/src/dom-host/property-payload.js`
- `node --check packages/react-dom/src/dom-host/mutation.js`
- `node --check tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `node --check tests/conformance/test/dom-property-payload-helper.test.mjs`
- `node tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
- `npm run check:js`
- `git diff --check`
- `git diff --check --no-index /dev/null worker-progress/worker-271-dom-property-payload-mutation-adapter.md`

## Verification

- `node --check` passed for all touched JS files.
- Focused mutation smoke passed:
  `React DOM private mutation adapter shell smoke checks passed.`
- Focused property payload conformance passed with 18 tests.
- `npm run check:js` passed, including package-surface, import smoke,
  benchmark gates, workspace checks, native loader checks, and 542 conformance
  tests. npm printed the existing `minimum-release-age` config warnings.
- `git diff --check` passed after adding this report.
- No-index whitespace check for this untracked progress report passed.

## Risks Or Blockers

- This remains private fake-DOM infrastructure only; it is not connected to
  public roots, reconciler commit traversal, hydration, events, controlled
  forms, refs, resources, or browser DOM compatibility.
- `nonPayload` rows are reported as skipped and do not mutate fake DOM or
  publish latest props. Future event/latest-props paths still need explicit
  ownership before event behavior can be admitted.
- Direct property rows remain limited to safe preexisting fake-DOM properties;
  custom-element property routing and namespace-aware attribute mutation remain
  future oracle-backed work.

## Recommended Next Tasks

- Wire this private adapter into a future explicit DOM commit bridge only after
  host commit traversal can provide ordered HostComponent update records.
- Keep controlled forms, resource hosts, hydration, and event/latest-props
  publication behind their dedicated fail-closed gates until each path is
  implemented and compared.
- Add namespace-aware/custom-element property routing only with checked React
  DOM oracle rows and explicit admission metadata.
