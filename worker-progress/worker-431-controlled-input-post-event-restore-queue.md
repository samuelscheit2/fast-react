# Worker 431: Controlled Input Post-Event Restore Queue

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Add a private post-event controlled
  restore queue gate that consumes event/latest-props evidence and records
  deterministic restore intent without installing live descriptors.

## Summary

Added a private client-side controlled input post-event restore queue gate that
accepts existing private event dispatch records plus component-tree latest-props
lookup evidence. The gate records deterministic restore intent for controlled
input/select/textarea event rows and skip intent for unsupported event/props
combinations.

The new path remains metadata-only. It does not install live descriptors, write
`_valueTracker`, read or mutate browser input values, write or flush a restore
queue, invoke controlled wrappers, create SyntheticEvents, or claim public
controlled input compatibility.

## Changed Files

- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/src/dom-host/property-payload.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `worker-progress/worker-431-controlled-input-post-event-restore-queue.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and worker
  reports 317, 344, 375, 399, and 397 after goal setup.
- Worker report 428 was requested but not present in this worktree.
- React 19.2.6 reference source confirms the real path: change-event extraction
  queues a controlled target, post-event batching checks for pending restore,
  latest props are read from the component-tree map, and controlled wrappers
  perform the actual restore. This worker records only private intent at that
  boundary.
- Existing worker 399 covered fake-DOM tracker-observation intent. This worker
  adds the next private gate over event dispatch plus latest-props evidence
  without admitting live value tracking or queue mutation.
- No nested managed agents were used.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Context and inspection:
  - `rg --files`, `rg -n`, `git status --short`, `git diff --stat`, `git diff`
  - `sed -n` reads for required docs/reports, React reference files, and
    focused source/tests.
- Syntax:
  - `node --check packages/react-dom/src/client/controlled-restore-queue.js`
  - `node --check packages/react-dom/src/dom-host/property-payload.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --check tests/conformance/test/dom-controlled-input-oracle.test.mjs`
  - `node --check tests/conformance/test/dom-property-payload-helper.test.mjs`
- Focused verification:
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
  - `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
  - `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- Required workspace verification:
  - `npm run check --workspace @fast-react/react-dom`
- Hygiene:
  - `git add --intent-to-add packages/react-dom/src/client/controlled-restore-queue.js worker-progress/worker-431-controlled-input-post-event-restore-queue.md`
  - `git diff --check`
- Non-verification mistake:
  - `node --check worker-progress/worker-431-controlled-input-post-event-restore-queue.md`
    failed with Node's expected unknown `.md` extension error; markdown syntax
    is not part of the JS syntax gate.

## Verification Results

- JS syntax checks passed for all touched JS/MJS files.
- Package-local resource/form gates passed: 21/21 tests.
- Controlled input conformance passed: 14/14 tests.
- DOM property payload helper passed: 24/24 tests.
- Event dispatch plugin skeleton passed: 14/14 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 44/44 package
  tests plus import-entrypoint smoke checks. npm emitted the existing
  `minimum-release-age` warning.
- `git diff --check` passed with the new source and report files included via
  intent-to-add.

## Risks Or Blockers

- No blockers remain.
- The new gate records event/latest-props restore intent only. It does not
  prove browser/jsdom controlled input behavior.
- Intent uses private event dispatch metadata and summarized latest props. It
  deliberately does not retain raw latest props, raw events, or raw targets in
  the public record payload.

## Recommended Next Tasks

- Add a separate private change-event extraction gate before creating real
  change SyntheticEvents.
- Add jsdom/browser-backed controlled form dual-run coverage before installing
  live descriptors or writing `_valueTracker`.
- Admit actual restore queue write/flush and input/select/textarea wrapper
  restore behavior separately, keeping public compatibility false until public
  root rows match React DOM.
