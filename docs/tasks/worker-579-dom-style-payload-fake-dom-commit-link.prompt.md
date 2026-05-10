# Worker 579: DOM Style Payload Fake-DOM Commit Link

## Objective

Link private style object diff payload rows to the React DOM fake-DOM commit
handoff without mutating real browser DOM or claiming style compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 561 added style object diff diagnostics. Build the next fake-DOM commit
metadata bridge.

## Write Scope

- `packages/react-dom/src/dom-host/property-payload.js`
- `packages/react-dom/src/client/root-bridge.js` only for a narrow fake-DOM row
- `packages/react-dom/test/dom-property-operations-private.test.js`
- `tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `worker-progress/worker-579-dom-style-payload-fake-dom-commit-link.md`

Avoid scheduler, native, test-renderer, and unrelated React DOM event/resource
files.

## Requirements

- Record style payload rows as accepted fake-DOM commit metadata for one host
  update.
- Keep real DOM style mutation, public root compatibility, and style
  compatibility claims blocked.
- Preserve unsupported style row behavior and existing dangerous HTML tests.
- Reject stale host-output update records and unsupported style payload rows.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/dom-property-operations-private.test.js`
- `node --test tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
