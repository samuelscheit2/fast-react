# Worker 617: DOM Input Change Restore Execution

## Goal Evidence

- Active goal objective from `get_goal`: connect private input/change extraction
  to controlled restore queue execution for one text input or checkbox fake-DOM
  path, without public controlled input compatibility.
- Active goal status from `get_goal`: `active`.
- The assigned objective was already present as the active goal when this
  continuation resumed, so no replacement goal was created.

## Summary

Connected the private input/change extraction path to controlled restore queue
execution for the fake-DOM text input path. The execution gate now consumes the
input/change preflight, input/change restore bridge, restore queue write
execution, flush blocker, wrapper mutation intent, and explicit fake-DOM target
admission.

The gate records event extraction, latest-props validation, private queue
write, private flush, and wrapper mutation execution evidence. It validates the
current component-tree latest props before mutation, rejects stale latest props,
rejects radio-group ambiguity, and rejects live DOM-like targets even if they
carry the fake-DOM marker.

Public controlled input compatibility remains blocked. The execution mutates
only an explicitly admitted private fake-DOM target, while public restore queue
write/flush flags, browser input mutation, event dispatch, SyntheticEvent
creation, live value tracker writes, and compatibility claims remain false.

## Changed Files

- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/events-private.test.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-617-dom-input-change-restore-execution.md`

## Evidence

- Positive execution evidence:
  - fake-DOM text input `value` is restored from current latest props.
  - `privateRestoreQueueWritten`, `privateRestoreQueueFlushed`, and
    `fakeDomInputMutated` are true.
  - public `restoreQueueWritten`, public `restoreQueueFlushed`,
    `browserInputMutated`, and compatibility claims stay false.
- Rejection evidence:
  - stale latest props fail with `stale-latest-props-for-execution`.
  - DOM-like targets fail with `unsupported-live-dom-node` before mutation.
  - radio/multi-row ambiguity fails with
    `radio-group-ambiguity-before-mutation` before mutation.
- No nested agent results were consumed for the final conclusions.

## Commands Run

- `node --check packages/react-dom/src/client/controlled-restore-queue.js`
- `node --check packages/react-dom/test/events-private.test.js`
- `node --test packages/react-dom/test/events-private.test.js`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `node --test packages/react-dom/test/*.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

## Verification Results

- `node --test packages/react-dom/test/*.test.js`: passed, 110/110.
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`:
  passed, 21/21.
- `npm run check --workspace @fast-react/react-dom`: passed, 110/110 package
  tests plus import-entrypoint smoke checks.
- `git diff --check`: passed.
- npm emitted the existing `minimum-release-age` warning during workspace
  verification; it did not fail the run.

## Risks Or Blockers

- No blockers remain.
- This is still private fake-DOM execution evidence only. It does not enable
  public controlled input compatibility, live DOM wrapper restoration, radio
  group lookup, or live descriptor/value-tracker mutation.

## Recommended Next Tasks

- Add a separate private gate for checkbox execution coverage if the next phase
  wants the second checkable fake-DOM path.
- Keep radio group lookup and live DOM controlled input restoration behind
  separate admissions before any compatibility claim.
