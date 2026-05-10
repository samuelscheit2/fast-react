# Worker 581: DOM Change Event Controlled Restore Link

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active goal status before final completion: `active`.
- Active goal objective from `get_goal`: Link private input/change event
  extraction preflight records to controlled restore queue preflight metadata
  without dispatching events or mutating DOM.

## Summary

Linked the private input/change extraction preflight gate to the controlled
post-event restore queue preflight metadata with a metadata-only bridge record.
The bridge consumes an accepted input/change extraction preflight, the matching
controlled restore latest-props intent record, and the matching restore queue
write-preflight row, then records a private latest-props evidence bridge row.

The bridge rejects foreign preflight records, unsupported input/change targets,
controlled restore records that do not describe the same latest-props evidence,
and stale write-preflight records that do not contain the restore intent source
row. It keeps event dispatch, SyntheticEvent creation, value tracker writes,
restore queue writes/flushes, host wrapper invocation, host value writes, and
DOM mutation blocked.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/events-private.test.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-581-dom-change-event-controlled-restore-link.md`

## Evidence Gathered

- Required context read after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Worker 543 showed the accepted input/change extraction preflight shape and
  blocked value-tracker/SyntheticEvent/dispatch behavior.
- Workers 533, 547, and 548 showed the accepted controlled restore intent,
  write-preflight, write-execution, and flush-blocker metadata shapes.
- React 19.2.6 reference source confirms `ChangeEventPlugin` calls
  `enqueueStateRestore` before SyntheticEvent dispatch, and
  `ReactDOMControlledComponent` later resolves latest props before wrapper
  restore. This worker records that link only as private metadata.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Context and inspection:
  - `sed -n` reads for required docs, focused source/tests, worker reports,
    and React 19.2.6 reference files
  - `rg -n`
  - `rg --files`
  - `git status --short`
  - `git diff`
- Syntax:
  - `node --check packages/react-dom/src/client/controlled-restore-queue.js`
  - `node --check packages/react-dom/src/events/plugin-event-system.js`
  - `node --check packages/react-dom/test/events-private.test.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --check tests/conformance/test/dom-event-delegation-oracle.test.mjs`
  - `node --check tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Focused verification:
  - `node --test packages/react-dom/test/events-private.test.js`
  - `node --test --test-name-pattern='input/change controlled restore bridge|input/change extraction bridge' packages/react-dom/test/resource-form-unsupported-gates.test.js tests/conformance/test/dom-controlled-input-oracle.test.mjs`
  - `node --test --test-name-pattern='private input/change extraction preflight records target and controlled metadata' tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- Required verification:
  - `node --test packages/react-dom/test/events-private.test.js`
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs tests/conformance/test/dom-controlled-input-oracle.test.mjs`
  - `npm run check --workspace @fast-react/react-dom`
  - `git diff --check`

## Verification Results

- JS syntax checks passed for all touched JS/MJS files.
- Package event private tests passed: 3/3.
- Package resource/form/controlled tests passed: 38/38.
- DOM event delegation plus controlled input conformance passed: 31/31.
- React DOM workspace check passed: 95/95 package tests plus import-entrypoint
  smoke checks.
- `git diff --check` passed before and after this report was added.
- npm emitted the existing `minimum-release-age` warning during workspace
  verification; it did not fail the run.

## Risks Or Blockers

- No blockers remain.
- The bridge is private diagnostic metadata only. It does not prove live
  browser input/change compatibility, value tracking, controlled restore queue
  execution, host wrapper restore behavior, or public React DOM controlled
  input compatibility.

## Nested Agents

- No nested agents were spawned for this worker.

## Recommended Next Tasks

- Add a later private gate for value-tracker change detection before admitting
  actual ChangeEventPlugin extraction.
- Keep public input/change and controlled-input compatibility blocked until
  browser/jsdom dual-run coverage proves listener dispatch, value tracking,
  queue writes, queue flush, wrapper restore, and default behavior together.
