# Worker 617: DOM Input Change Restore Execution

## Goal Evidence

- `create_goal` was not available in this Codex tool surface before the first
  file reads.
- `get_goal` was available after initial context inspection and returned no
  active goal.
- Objective from the worker prompt: connect private input/change extraction to
  controlled restore queue execution for one text input or checkbox fake-DOM
  path, without public controlled input compatibility.

## Summary

Added a private input/change controlled restore execution gate to
`controlled-restore-queue.js`. The gate consumes the existing input/change
bridge, write-execution, flush-blocker, and wrapper mutation-intent records,
then records deterministic fake-DOM execution evidence for the text input path.

The new gate validates latest-props linkage, rejects stale source records,
rejects radio-group ambiguity, and requires an explicit fake-DOM target while
rejecting likely live DOM nodes before mutation. It still keeps public behavior
blocked: no event dispatch, SyntheticEvent creation, restore queue writes,
queue flush, host wrapper invocation, wrapper property writes, value tracker
writes, host value reads/writes, browser input mutation, or compatibility claim.

## Changed Files

- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-617-dom-input-change-restore-execution.md`

## Evidence Gathered

- Required context read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Worker 581 established the accepted private input/change latest-props bridge
  shape.
- Worker 582 established the accepted wrapper mutation-intent metadata shape.
- React 19.2.6 reference source checked:
  - `packages/react-dom-bindings/src/events/plugins/ChangeEventPlugin.js`
  - `packages/react-dom-bindings/src/events/ReactDOMControlledComponent.js`
  - `packages/react-dom-bindings/src/client/inputValueTracking.js`
  - `packages/react-dom-bindings/src/client/ReactDOMInput.js`
- Reference source confirms real React enqueues state restore during change
  event extraction, drains the restore target/queue after the event batch, looks
  up current props before wrapper restore, and uses descriptor-backed
  `_valueTracker` state for live inputs. This worker records only private
  fake-DOM execution evidence and leaves those live behaviors blocked.

## Commands Run

- Context and inspection:
  - `pwd && rg --files | head -200`
  - `git status --short`
  - `rg -n ...`
  - `sed -n ...` reads over required docs, worker reports, source, tests, and
    React 19.2.6 reference files
- Syntax:
  - `node --check packages/react-dom/src/client/controlled-restore-queue.js`
  - `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
  - `node --check tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Focused tests:
  - `node --test --test-name-pattern='input/change controlled restore execution' packages/react-dom/test/resource-form-unsupported-gates.test.js tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- Required verification:
  - `node --test packages/react-dom/test/*.test.js`
  - `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
  - `npm run check --workspace @fast-react/react-dom`
  - `git diff --check`

## Verification Results

- JS syntax checks passed.
- Focused input/change controlled restore execution tests passed: 2/2.
- React DOM package tests passed: 107/107.
- Controlled input conformance passed: 21/21.
- React DOM workspace check passed: 107/107 package tests plus import-entrypoint
  smoke checks.
- `git diff --check` passed.
- npm emitted the existing `minimum-release-age` warning during workspace
  verification; it did not fail the run.

## Risks Or Blockers

- No blockers remain.
- The new gate is private diagnostic evidence only. It does not prove live
  browser/jsdom controlled input compatibility or actual wrapper mutation.
- The fake-DOM target is accepted only as admission metadata and is not retained
  or mutated.

## Recommended Next Tasks

- Add a later fake-DOM wrapper execution gate only when actual fake target
  mutation can be modeled and rolled back without exposing public controlled
  input behavior.
- Keep radio group lookup and live descriptor/value-tracker mutation as
  separate gates before any compatibility claim.
