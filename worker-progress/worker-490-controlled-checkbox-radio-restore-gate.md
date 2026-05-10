# Worker 490: Controlled Checkbox/Radio Restore Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Worker 490: add private
  controlled-input diagnostics for checkbox and radio restore metadata,
  including group intent records, without live DOM control compatibility.

## Summary

Added private controlled-input restore diagnostics for checkable inputs. The
post-event restore queue gate now records checkbox/radio checked metadata and a
deterministic group intent record. Radio rows with a `name` prop record that a
group restore would need root traversal, same-form filtering, sibling props
lookup, sibling input wrapper refresh, and value-tracker refresh; all of those
operations remain blocked metadata only.

The DOM property payload helper also marks checkbox/radio controlled rows with
blocked checkable restore metadata while ordinary controlled payload handling
still rejects the rows.

No live form controls are mutated. The new diagnostics do not query radio
groups, install descriptors, write `_valueTracker`, read or write host values,
invoke wrappers, write or flush restore queues, or claim public controlled-input
compatibility.

## Changed Files

- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/src/dom-host/property-payload.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `worker-progress/worker-490-controlled-checkbox-radio-restore-gate.md`

## Evidence Gathered

- Required context read after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, worker reports 431 and 462, and the
  DOM controlled-input oracle report.
- React 19.2.6 reference source shows the real post-event path queues targets,
  later reads latest props, and restores controlled state. For radio inputs,
  input restore also finds same-name radio siblings, reads their current props,
  refreshes sibling checked state, and refreshes value tracking. This worker
  records only private intent at that boundary.
- Existing worker 431 covered event/latest-props restore intent. Existing
  worker 462 covered select/textarea fake-DOM latest-props restore intent.
  This worker extends the same private, metadata-only pattern to checkbox and
  radio checked restore, including radio group intent rows.
- Unsupported source-token scan through the controlled conformance gate remains
  clean; touched implementation files do not introduce live controlled-form
  adapter tokens.
- Nested agents: spawned `radio_restore_reference` and
  `controlled_gate_insertion_points` for independent source/insertion checks.
  They completed without retrievable final content in this session, so their
  output did not affect the implementation conclusions.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Context and inspection:
  - `pwd`
  - `git status --short`
  - `rg --files`
  - `rg -n`
  - `sed -n` reads for required docs/reports, React reference files, and
    focused source/tests
  - `git diff --stat`
  - `git diff`
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
- Required workspace verification:
  - `npm run check --workspace @fast-react/react-dom`
- Hygiene:
  - `rg -n` source-token guard over the touched implementation files
  - `git add --intent-to-add worker-progress/worker-490-controlled-checkbox-radio-restore-gate.md`
  - `git diff --check`

## Verification Results

- Syntax checks passed for all touched JS/MJS files.
- Package-local resource/form/controlled tests passed: 28/28 tests.
- Controlled input conformance passed: 16/16 tests.
- DOM property payload helper conformance passed: 28/28 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 62/62 package
  tests plus import-entrypoint smoke checks.
- `git diff --check` passed after this report was added.
- npm emitted the existing `minimum-release-age` warning during the workspace
  check; it did not fail verification.

## Risks Or Blockers

- No blockers remain.
- The new radio group records are diagnostic metadata only. They do not prove
  browser/jsdom radio group behavior, native form interaction, or cross-root
  same-name radio handling.
- Actual queue writes, queue flushing, wrapper execution, live value tracking,
  radio group DOM lookup, sibling props lookup, and value-tracker refresh remain
  blocked.

## Recommended Next Tasks

- Add a separate private gate for restore queue write/flush ordering before
  wrapper calls are admitted.
- Add browser or jsdom-backed dual-run controlled radio group coverage before
  enabling live descriptor installation or public controlled-input behavior.
