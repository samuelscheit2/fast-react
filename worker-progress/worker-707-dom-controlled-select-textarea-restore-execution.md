# Worker 707: DOM Controlled Select/Textarea Restore Execution

## Goal Evidence

- `create_goal` was called as the first action before file reads, research,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add private React DOM
  controlled-restore execution evidence for admitted select and textarea
  fake-DOM targets, preserving blocked live DOM/value-tracker compatibility.

## Summary

Added a private controlled post-event restore fake-DOM execution path that
consumes accepted fake-DOM observation/latest-props restore intent, write
execution, flush blocker, and wrapper mutation-intent metadata for select and
textarea targets.

The execution path revalidates latest props, mutates only explicitly marked
fake-DOM targets, records queue/write/flush/wrapper execution evidence, and
rejects live DOM-like targets before value, selected-values, descriptor, or
`_valueTracker` access. Public controlled behavior, live DOM mutation, and
value-tracker compatibility remain blocked.

## Changed Files

- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-707-dom-controlled-select-textarea-restore-execution.md`

`packages/react-dom/src/client/root-bridge.js` was inspected but not edited.

## Evidence Gathered

- Required context read after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Existing accepted metadata admitted select single, select multiple, and
  textarea restore kinds through restore intent, write preflight/execution,
  flush blocker, and wrapper mutation-intent gates.
- The existing input/change execution path intentionally accepts only text and
  checkbox input bridge rows, so select/textarea execution needed a separate
  fake-DOM restore path instead of broadening event extraction.
- Tests prove select single writes fake `value`, select multiple writes fake
  `selectedValues`, textarea writes fake `value`, and guarded live DOM-like
  targets are rejected without value or tracker access.

## Commands Run

- Goal tools: `create_goal`, `get_goal`
- Inspection: `sed -n`, `rg -n`, `rg --files`, `git status --short`,
  `git diff --stat`, focused `git diff` reads
- Syntax:
  - `node --check packages/react-dom/src/client/controlled-restore-queue.js`
  - `node --check packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - `node --check tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Focused verification:
  - `node --test --test-name-pattern='private controlled select and textarea fake-DOM restore execution' packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - `node --test --test-name-pattern='private controlled select and textarea restore execution' tests/conformance/test/dom-controlled-input-oracle.test.mjs`
  - `node --test --test-name-pattern='controlled restore execution|fake-DOM restore execution' packages/react-dom/test/react-dom-private-root-bridge-shell.test.js packages/react-dom/test/events-private.test.js`
  - `node --test --test-name-pattern='controlled restore execution|controlled select and textarea restore execution' tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Broader verification:
  - `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
  - `node --test packages/react-dom/test/react-dom-private-root-bridge-shell.test.js`
  - `npm run check --workspace @fast-react/react-dom`
- Hygiene:
  - conflict-marker scan on touched source/test files
  - anchored conflict-marker scan on `packages` and `tests`
  - `git diff --check`
  - `git add --intent-to-add worker-progress/worker-707-dom-controlled-select-textarea-restore-execution.md`

## Verification Results

- Focused controlled restore package tests passed: 5/5.
- Focused controlled-input conformance tests passed: 3/3.
- Full controlled-input conformance test passed: 23/23.
- Full private root bridge shell test passed: 46/46.
- React DOM workspace check passed: 142/142 package tests plus import smoke.
- Scoped and packages/tests conflict-marker scans passed.
- `git diff --check` passed.
- npm emitted the existing `minimum-release-age` warning during the workspace
  check; it did not fail verification.

## Risks Or Blockers

- No blockers remain.
- The new path is private fake-DOM evidence only. It is not browser/jsdom
  controlled select or textarea compatibility.
- Actual public event extraction, public restore queue writes/flushes, live
  wrapper invocation, descriptor installation, `_valueTracker` writes, and real
  DOM mutation remain blocked.

## Nested Agents

- No nested managed agents were used.

## Recommended Next Tasks

- Add a separate live preflight for select/textarea restore attempts if future
  work needs row-level blocker evidence beyond the current live rejection.
- Keep browser-backed controlled select/textarea compatibility blocked until
  value tracking, option state updates, event dispatch, queue flushing, and
  wrapper execution are proven together.
