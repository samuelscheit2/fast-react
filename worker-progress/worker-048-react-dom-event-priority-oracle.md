# worker-048-react-dom-event-priority-oracle

## Objective

Add deterministic React DOM event-name and update-priority oracle files for React DOM 19.2.6.

Write scope honored:

- `tests/conformance/src/react-dom-event-priority-*.mjs`
- `tests/conformance/scripts/generate-react-dom-event-priority-oracle.mjs`
- `tests/conformance/scripts/print-react-dom-event-priority-oracle.mjs`
- `tests/conformance/test/react-dom-event-priority-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-event-priority-oracle.json`
- `worker-progress/worker-048-react-dom-event-priority-oracle.md`

## Summary

Implemented a checked React DOM 19.2.6 event-priority oracle generated from pinned source, checked runtime package inventory tarballs, and local Fast React placeholder boundary probes. The oracle records event-name buckets, lane-backed event priority constants, the special `message` Scheduler priority bridge, representative `resolveUpdatePriority` fallback cases, compiled-package evidence, and current Fast React comparison boundaries.

No DOM event behavior was implemented. The oracle keeps Fast React compatibility claims false because the current `@fast-react/react-dom` and scheduler packages are still placeholders for this surface.

## Oracle Coverage

- Discrete DOM event names: 53 source-derived `getEventPriority` cases.
- Continuous DOM event names: 18 source-derived `getEventPriority` cases.
- Default DOM event names: 22 `DOMEventName` union members that fall through to default priority.
- Unknown event fallback: recorded as `DefaultEventPriority`.
- `message` event: recorded for Immediate, UserBlocking, Normal, Low, Idle, and unknown Scheduler priority cases, including the idle mapping to `IdleEventPriority`.
- Lane-backed priority constants: `NoEventPriority`, `DiscreteEventPriority`, `ContinuousEventPriority`, `DefaultEventPriority`, and `IdleEventPriority`, including lane names and numeric values.
- `resolveUpdatePriority`: recorded stored-priority-wins, no-window-event default, click/discrete, wheel/continuous, and unknown/default fallback cases.
- Fast React boundaries: root React DOM placeholder, client placeholder, and scheduler priority-context placeholder.

## Evidence Gathered

- Used worker 041's DOM events/priority plan as the implementation target for event-name, Scheduler bridge, and update-priority boundaries.
- Read the checked runtime inventory at `tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json`.
- Fetched pinned React source from tag `v19.2.6`, tag object `2fcbe419ed90f863e6f67ce5b9738f38dbec640b`, peeled commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- Parsed these source files:
  - `ReactVersions.js`
  - `packages/react-dom-bindings/src/events/ReactDOMEventListener.js`
  - `packages/react-dom-bindings/src/events/DOMEventNames.js`
  - `packages/react-dom-bindings/src/client/ReactDOMUpdatePriority.js`
  - `packages/react-reconciler/src/ReactEventPriorities.js`
  - `packages/react-reconciler/src/ReactFiberLane.js`
- Downloaded exact npm tarballs from the checked inventory for `react-dom@19.2.6`, `react@19.2.6`, and `scheduler@0.27.0`; verified integrity and tarball file lists.
- Checked compiled React DOM package files `cjs/react-dom-client.development.js` and `cjs/react-dom-client.production.js` for event-priority/update-priority source markers.
- Probed copied local Fast React React DOM and scheduler placeholders in a temporary isolated project, with local path fragments normalized out of error messages.
- Spawned read-only subagents to independently check the oracle shape and React DOM priority-source hypothesis; their findings were used as review input, not as additional write authority.

## Timing And Source Caveats

- The oracle records source-derived priority mappings and package evidence, not public runtime calls into React DOM private internals.
- No wall-clock timing is recorded. `message` rows are deterministic Scheduler priority cases from pinned source, not measurements of asynchronous task timing.
- Source files are fetched from GitHub by immutable commit during regeneration, so regeneration needs network access.
- The compiled npm package evidence is marker-based because React DOM does not publicly export `getEventPriority` or `resolveUpdatePriority`.
- Fast React placeholder probes only define current comparison boundaries; they do not claim behavior compatibility.

## Changed Files

- `tests/conformance/src/react-dom-event-priority-targets.mjs`
- `tests/conformance/src/react-dom-event-priority-scenarios.mjs`
- `tests/conformance/src/react-dom-event-priority-probe-runner.mjs`
- `tests/conformance/src/react-dom-event-priority-oracle.mjs`
- `tests/conformance/src/react-dom-event-priority-oracle-generator.mjs`
- `tests/conformance/scripts/generate-react-dom-event-priority-oracle.mjs`
- `tests/conformance/scripts/print-react-dom-event-priority-oracle.mjs`
- `tests/conformance/test/react-dom-event-priority-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-event-priority-oracle.json`
- `worker-progress/worker-048-react-dom-event-priority-oracle.md`

## Commands Run

Initial inspection:

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `git status --short`
- `rg --files tests/conformance | sort | rg '(event-priority|react-dom-client-root|scheduler-root|react-dom-export)'`
- `sed -n '1,1040p' tests/conformance/src/react-dom-event-priority-oracle-generator.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-event-priority-oracle.mjs`
- `sed -n '1,240p' tests/conformance/src/react-dom-event-priority-probe-runner.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-event-priority-scenarios.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-event-priority-targets.mjs`
- `sed -n '1,560p' tests/conformance/test/react-dom-event-priority-oracle.test.mjs`
- `sed -n '1,220p' tests/conformance/scripts/generate-react-dom-event-priority-oracle.mjs`
- `sed -n '1,220p' tests/conformance/scripts/print-react-dom-event-priority-oracle.mjs`
- `sed -n '1,260p' worker-progress/worker-041-dom-events-priority-plan.md`
- `node -e "const o=require('./tests/conformance/oracles/react-19.2.6-react-dom-event-priority-oracle.json'); console.log(JSON.stringify({kind:o.oracleKind, buckets:Object.fromEntries(Object.entries(o.eventPriorityTable.buckets).map(([k,v])=>[k,v.length])), messages:o.messageSchedulerPriorityMapping.length, cases:o.resolveUpdatePriority.cases.length, boundaries:o.fastReactComparisonBoundaries.length, source:Object.keys(o.sourceEvidence||{}).length}, null, 2))"`
- Scoped local/temp path leak check over changed files.
- `node tests/conformance/scripts/print-react-dom-event-priority-oracle.mjs --format=markdown | sed -n '1,120p'`

Verification commands are recorded below after completion.

## Verification

Worker and orchestrator verification:

- `node --test tests/conformance/test/react-dom-event-priority-oracle.test.mjs`
  - 10 tests passed.
- Scoped local/temp path leak check over changed files passed.
- Scoped trailing-whitespace check over changed files passed.
- Scoped `git diff --check` over changed files passed.

Full conformance should be run after merge with the other accepted oracle workers.

## Risks Or Blockers

- This oracle is not a full dual-run behavior oracle because React DOM event priority internals are private and current Fast React React DOM event behavior does not exist.
- Regeneration depends on network access to fetch immutable React source files and checked npm tarballs.
- The marker check for compiled React DOM package files proves the package contains the relevant machinery, but the exact mappings come from pinned source parsing.

## Recommended Next Tasks

- Implement DOM event code only after a DOM adapter owns delegated root/portal listener registration, plugin dispatch, current update priority, and hydration replay boundaries.
- Add a later runtime behavior oracle once Fast React has enough React DOM client root and event implementation to compare observable dispatch behavior against React DOM.
