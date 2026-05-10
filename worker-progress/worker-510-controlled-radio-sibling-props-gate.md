# Worker 510: Controlled Radio Sibling Props Gate

## Goal

- Status after final pane closeout: complete
- Objective: Add private controlled radio sibling-props lookup diagnostics that prove the intended same-name/same-form sibling metadata shape without DOM queries, wrapper execution, or public controlled radio compatibility.
- Goal tool evidence: `create_goal` succeeded before file reads; `get_goal` reported the active objective/status above.

## Summary

- Added private controlled radio sibling-props lookup diagnostics to the post-event restore queue record.
- The diagnostic accepts explicit admission metadata for radio sibling props and redacted form keys, then emits frozen primitive records that prove accepted same-name/same-form radio sibling shape plus skipped different-form, different-name, and primary-node rows.
- Kept the accepted checkbox/radio group intent rows intact: group lookup, sibling latest-props lookup, wrapper execution, sibling input restore, value tracker refresh, DOM query, form traversal, and public compatibility all remain false.
- Did not touch `property-payload.js`; existing blocked radio payload metadata still passes its conformance gate.

## Changed Files

- `packages/react-dom/src/client/controlled-restore-queue.js`
- `packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `worker-progress/worker-510-controlled-radio-sibling-props-gate.md`

## Evidence

- Package gate proves `radioGroupSiblingPropsLookup` and nested sibling records are frozen/redacted, accept only same-name/same-form sibling evidence, and keep execution flags false.
- Controlled-input conformance now checks the oracle-facing radio group row carries sibling-props lookup status/counts and accepted/skipped sibling evidence without DOM lookup, form traversal, wrapper execution, raw latest props retention, or compatibility claims.
- DOM property payload helper was rerun because radio payload metadata is adjacent; no property-payload changes were needed.

## Commands Run

- `node --check packages/react-dom/src/client/controlled-restore-queue.js`
- `node --check packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --check tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `node --test packages/react-dom/test/resource-form-unsupported-gates.test.js`
- `node --test tests/conformance/test/dom-controlled-input-oracle.test.mjs`
- `node --test tests/conformance/test/dom-property-payload-helper.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

All commands passed. The workspace check emitted the existing npm warning for unknown user config `minimum-release-age`.

## Risks Or Blockers

- The sibling-props diagnostic is admission-driven metadata only. It does not discover siblings, read live props from DOM nodes, traverse forms, or validate actual browser form identity.
- Public controlled radio compatibility remains blocked by design.
- I spawned one nested explorer for a shape review, but it did not return a result before closure and did not affect the implementation.

## Recommended Next Tasks

- Add a later bridge from real component-tree sibling discovery only after DOM query/form traversal policy is intentionally opened.
- Keep the public controlled radio restore path blocked until wrapper execution and value tracker refresh are implemented and dual-run oracle evidence exists.
