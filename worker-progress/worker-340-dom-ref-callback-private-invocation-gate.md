# Worker 340: DOM Ref Callback Private Invocation Gate

## Goal Evidence

- Goal tool available: yes.
- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before report
  writing.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: "Worker 340: extend the
  private DOM ref callback attach/detach gate to record controlled callback
  invocation attempts and cleanup returns under fake host nodes, preserving
  public ref compatibility blockers."

## Summary

Extended the private React DOM ref callback gate with an opt-in controlled
invocation snapshot. The existing attach/detach gate remains data-only and
continues to report no callback invocation or object-ref mutation.

The new controlled invocation gate reuses the existing root-commit metadata and
component-tree validation, creates private fake host node records for callback
ref attempts, invokes callback refs with fake host nodes or `null`, records
callback cleanup-return functions privately, and invokes supplied cleanup
returns for detach metadata. Errors are captured on private records only; root
error reporting, public root wiring, object-ref mutation, layout effects, DOM
mutation, and React DOM ref compatibility claims remain blocked.

`component-tree.js` now has a private fake host node record helper derived from
mounted host instance node records. The helper hides the raw mounted node and
latest props, while storing the frozen fake node in WeakMap payloads for
private callers.

## Changed Files

- `packages/react-dom/src/client/component-tree.js`
- `packages/react-dom/src/client/ref-callback-gate.js`
- `tests/conformance/test/dom-ref-callback-oracle.test.mjs`
- `worker-progress/worker-340-dom-ref-callback-private-invocation-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read worker reports 066, 174, 245, 273, and 313.
- Worker 338 report was not present in this checkout.
- Read worker 226 and 139 ref lifecycle context for root-commit ref metadata,
  cleanup-return blockers, and fake-ref sequencing.
- Inspected current `component-tree.js`, `ref-callback-gate.js`, focused DOM ref
  callback conformance tests, and the component-tree smoke test.
- Checked React 19.2.6 source in the local reference clone:
  `ReactFiberCommitEffects.js` stores callback attach returns on
  `finishedWork.refCleanup`, detaches by invoking cleanup first when present,
  otherwise calls callback refs with `null`, and captures errors for root
  commit-phase reporting.

## Implementation Notes

- Added private fake host node records with:
  - frozen fake element/text node payloads
  - no public raw node, latest props, or fake node exposure on the record
  - WeakMap payload access for private gate callers
- Added `createRefCallbackControlledInvocationGateSnapshot`.
- Added private controlled invocation records and payload accessors.
- Added detach metadata support for a private `refCleanup` function handle.
- Callback attach attempts receive the fake host node, and function returns are
  recorded as cleanup returns.
- Callback detach attempts invoke cleanup returns when present; otherwise they
  invoke the callback with `null`.
- Object refs are classified and skipped by the controlled invocation gate;
  object mutation stays blocked.
- Public root integration and compatibility status remain explicitly blocked,
  and no public React DOM export or root commit path was wired.

## Verification

Passed:

```sh
node --check packages/react-dom/src/client/ref-callback-gate.js
node --check packages/react-dom/src/client/component-tree.js
node --check tests/conformance/test/dom-ref-callback-oracle.test.mjs
node --test tests/conformance/test/dom-ref-callback-oracle.test.mjs
node tests/smoke/react-dom-component-tree-map-shell.mjs
npm run check --workspace @fast-react/react-dom
git diff --check
```

Focused DOM ref callback result: 15 tests passed.

React DOM workspace result: 21 tests passed plus import-entrypoint smoke. npm
printed the existing `minimum-release-age` config warning.

## Risks Or Blockers

- This is still a private gate. It does not wire public root commit ref
  invocation or claim React DOM ref compatibility.
- Controlled callback invocation now runs private JS callback values supplied to
  the gate; callers must keep this behind the private test/admission boundary.
- Cleanup persistence remains explicit through private detach metadata. There
  is still no reconciler-to-DOM ref cleanup store or public root error routing.
- Object refs remain record-only and are not mutated.

## Recommended Next Tasks

1. Add a private ref cleanup handle store or bridge so attach cleanup returns
   can flow into later detach metadata without direct test plumbing.
2. Add private root error routing records for controlled callback/cleanup
   errors before any public `onUncaughtError` behavior is admitted.
3. Keep public DOM root ref invocation blocked until host mutation output,
   current switching, latest-props handoff, and root error policy are all wired.

## Nested Agents

- No nested agents or explorer subagents were used.
