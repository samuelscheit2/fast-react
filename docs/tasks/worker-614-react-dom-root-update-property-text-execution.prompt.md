# Worker 614: React DOM Root Update Property Text Execution

## Objective

Extend private React DOM root update diagnostics so one accepted fake-DOM
HostComponent update can apply property and text mutations before latest-props
publication.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 579 and 580 added style and dangerousHTML fake-DOM commit metadata; keep
this task to generic property/text rows.

## Write Scope

- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/test/*.test.js`
- `worker-progress/worker-614-react-dom-root-update-property-text-execution.md`

Do not edit dangerousHTML or style oracle files unless a negative assertion is
needed.

## Requirements

- Add a private update gate that validates accepted root update metadata and
  applies one property plus one text mutation to fake DOM.
- Reject stale latest-props handoff, text mutation failure, and unsupported
  property payload rows with rollback evidence.
- Keep public React DOM root compatibility blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test packages/react-dom/test/*.test.js`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`
