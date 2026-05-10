# Worker 399: Controlled Input Private Restore Queue Gate

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available after setup and before this report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: add a private
  controlled-input restore queue diagnostic that records post-event restore
  intent from fake-DOM tracker observations without writing real DOM
  descriptors or enabling public controlled behavior.

## Summary

Added a private controlled-input restore queue diagnostic under the existing
React DOM resource/form internals gate. The diagnostic accepts only fake-DOM
value-tracker `observe` records, records whether a post-event restore intent
would be needed for changed snapshots, and stores deterministic redacted
metadata for changed and unchanged observations.

The diagnostic remains private and fake-DOM-only. It does not install real DOM
descriptors, write `_valueTracker`, dispatch change events, look up latest
props, write or flush a restore queue, invoke controlled wrappers, mutate DOM
state, touch public roots, or claim controlled-input compatibility.

## Changed Files

- `packages/react-dom/src/resource-form-internals-gate.js`
  - Added private restore queue diagnostic record type, gate description,
    record validation, admission validation, changed/unchanged intent records,
    side-effect metadata, fail-closed errors, and exports.
- `packages/react-dom/src/dom-host/property-payload.js`
  - Exported the private restore queue diagnostic status alongside the existing
    controlled tracker and wrapper boundary constants.
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - Added package-local coverage for changed and unchanged fake-DOM restore
    intent records, no descriptor writes, no `_valueTracker`, no event/queue
    side effects, and fail-closed invalid source/admission/error paths.
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
  - Added conformance coverage proving the private restore intent diagnostic
    does not alter the existing controlled-input unsupported claims.
- `worker-progress/worker-399-controlled-input-private-restore-queue-gate.md`
  - This report.

## Evidence Gathered

- Required context read after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and worker reports 260, 317, 344,
  and 375.
- Requested worker reports 396 and 397 were not present in
  `worker-progress/`.
- Worker 317 established metadata-only controlled value-tracker records while
  keeping post-event restore blocked.
- Worker 344 established controlled wrapper property-payload metadata while
  keeping controlled rows unsupported before mutation.
- Worker 375 established fake-DOM-only tracker install/observe/detach
  diagnostics without real descriptors or `_valueTracker`.
- React 19.2.6 reference source confirmed the real path: change extraction
  observes value changes, enqueues state restore, batching later calls
  `restoreStateIfNeeded`, and actual restore needs latest props plus
  controlled wrapper state. This worker records only private fake-DOM intent
  metadata for that boundary.
- No nested managed agents were used.

## Commands Run

- Goal tools:
  - `create_goal`
  - `get_goal`
- Context and inspection:
  - `rg --files` for required docs, reports, and target files.
  - `git status --short`
  - `sed -n` reads for required docs/reports and target source/tests.
  - Targeted `rg -n` scans for controlled tracker, restore, `_valueTracker`,
    and unsupported gate tokens.
  - `sed -n` reads for React reference `ReactDOMControlledComponent.js`,
    `inputValueTracking.js`, `ReactDOMUpdateBatching.js`,
    `ChangeEventPlugin.js`, and `ReactDOMComponent.js`.
  - `git diff --stat`
- Syntax:
  - `node --check packages/react-dom/src/resource-form-internals-gate.js`
  - `node --check packages/react-dom/src/dom-host/property-payload.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --check tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Focused verification:
  - `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
  - `node --test tests/conformance/test/react-dom-resource-hints-oracle.test.mjs tests/conformance/test/react-dom-form-actions-oracle.test.mjs tests/conformance/test/dom-controlled-input-oracle.test.mjs`
  - `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
- Required workspace verification:
  - `npm run check --workspace @fast-react/react-dom`
- Hygiene:
  - `git add --intent-to-add worker-progress/worker-399-controlled-input-private-restore-queue-gate.md`
  - `git diff --check`

## Verification Results

- JS syntax checks passed for all touched JS/MJS files.
- Package-local resource/form gates passed: 19/19 tests.
- Controlled-input conformance passed: 13/13 tests.
- Focused resource/form/controlled conformance passed: 39/39 tests.
- DOM property payload helper passed: 23/23 tests.
- `npm run check --workspace @fast-react/react-dom` passed: 38/38 package
  tests plus import-entrypoint smoke checks.
- `git diff --check` passed with the new worker report included via
  intent-to-add.
- npm emitted the existing `minimum-release-age` warning during workspace
  checks; it did not fail verification.

## Risks Or Blockers

- No blockers remain.
- The new diagnostic is private and fake-DOM-only. It records restore intent
  from tracker observations but does not prove browser/jsdom controlled input
  behavior.
- Restore intent records deliberately keep latest-props lookup, event plugin
  dispatch, actual queue writes, restore flushing, wrapper invocation, real DOM
  descriptor writes, and public root behavior disabled.

## Recommended Next Tasks

- Add event-plugin/latest-props private gates before admitting real
  post-event controlled restore queues.
- Add jsdom or browser-backed controlled input dual-run coverage before
  installing live descriptors or writing `_valueTracker`.
- Admit input, select, textarea, and radio-group restore behavior separately,
  keeping public controlled-input compatibility false until full public root
  rows match React DOM.
