# Worker 453 - DOM Style and dangerousHTML Mutation Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: extend the private DOM mutation
  adapter so admitted style and `dangerouslySetInnerHTML` property payload rows
  can mutate fake DOM records with rollback diagnostics while public DOM
  behavior remains blocked.

## Summary

Extended the private React DOM fake-DOM mutation adapter with rollback
diagnostics for admitted property payload mutations.

Successful admitted payload application and the dedicated style/HTML applier
still return the same applied row arrays, but those arrays are now backed by a
private WeakMap diagnostic payload with the target fake node, frozen mutation
records, frozen rollback records, rollback count, and status metadata. A new
private rollback helper can restore those rows later.

The appliers also roll back partial fake-DOM mutations when a later attribute,
style, property, or `innerHTML` write throws. The new innerHTML rollback
snapshot restores the prior string value and, for fake DOM records with array
`childNodes`, restores the previous child list and parent links.

Public `react-dom` root behavior and package exports remain blocked.

## Changed Files

- `packages/react-dom/src/dom-host/mutation.js`
- `tests/conformance/test/dom-property-payload-helper.test.mjs`
- `tests/smoke/react-dom-mutation-adapter-shell.mjs`
- `worker-progress/worker-453-dom-style-dangerous-html-mutation-gate.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and required
  prior reports for workers 186, 324, 396, 428, and 440.
- Also inspected workers 213, 238, 242, 271, and 368 to preserve the existing
  property-payload, style/HTML applier, and latest-props rollback boundaries.
- Confirmed the existing dedicated style/HTML applier mutated fake DOM but had
  no returned rollback diagnostic contract and no rollback on runtime setter
  failures.
- Confirmed the ordinary public applier still blocks style and innerHTML rows,
  and public `react-dom/client.createRoot` remains unsupported.
- Spawned a read-only explorer for the rollback contract question, but it did
  not return before direct implementation and verification completed; I closed
  it, and it did not affect conclusions.

## Tests Added Or Updated

- Added conformance coverage for hidden rollback diagnostics on successful
  style and `dangerouslySetInnerHTML` fake-DOM mutation records.
- Added conformance and smoke coverage for manual rollback restoring style,
  innerHTML, child arrays, and fake parent links.
- Added conformance and smoke coverage for partial rollback when an
  `innerHTML` setter throws after assigning.
- Added conformance coverage for mixed admitted attribute/style/innerHTML rows
  rolling back after a later fake `setAttribute` write throws.

## Commands Run

```sh
node --check packages/react-dom/src/dom-host/mutation.js
node --check tests/conformance/test/dom-property-payload-helper.test.mjs
node --check tests/smoke/react-dom-mutation-adapter-shell.mjs
node --test tests/conformance/test/dom-property-payload-helper.test.mjs
node tests/smoke/react-dom-mutation-adapter-shell.mjs
npm run check --workspace @fast-react/react-dom
git diff --check
git add --intent-to-add worker-progress/worker-453-dom-style-dangerous-html-mutation-gate.md && git diff --check; rc=$?; git reset -- worker-progress/worker-453-dom-style-dangerous-html-mutation-gate.md >/dev/null; exit $rc
node tests/smoke/react-dom-component-tree-map-shell.mjs
```

The component-tree smoke command was an exploratory check outside the requested
verification set. It failed on the pre-existing expectation that direct
`createLatestPropsCommitRecord` style payload records are unsafe, while this
checkout already admits style rows for latest-props handoffs. I did not change
that test or component-tree behavior for this worker.

## Verification Results

- Focused DOM property-payload conformance passed: 27 tests.
- React DOM private mutation adapter smoke passed.
- `npm run check --workspace @fast-react/react-dom` passed: 53 package tests
  plus import-entrypoint smoke.
- `git diff --check` passed, including the new progress report via
  intent-to-add.
- NPM printed the existing `minimum-release-age` warning; it did not affect the
  result.

## Risks Or Blockers

- This is still private fake-DOM infrastructure. It does not wire public roots,
  browser DOM compatibility, real CSSOM behavior, Trusted Types, hydration,
  events, refs, controlled forms, resources, or generic reconciler execution.
- InnerHTML child restoration is intentionally fake-DOM scoped: it restores
  array-backed `childNodes` records and parent links, not parsed browser DOM.
- Latest-props publication still does not admit `setInnerHTML` rows.

## Recommended Next Tasks

1. Keep `dangerouslySetInnerHTML` out of latest-props/root update handoffs
   until text-content and managed-child transitions have their own private
   admission gate.
2. Add broader CSS property coverage only with new oracle-backed payload rows.
3. Re-run package-surface guards if a future worker exposes any new private
   runtime diagnostics on public objects.
