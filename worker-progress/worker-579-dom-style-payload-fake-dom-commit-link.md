# Worker 579: DOM Style Payload Fake-DOM Commit Link

## Goal

- Status at setup: active.
- Objective: Link private style object diff payload rows to the React DOM
  fake-DOM commit handoff without mutating real browser DOM or claiming style
  compatibility.
- `get_goal` was available and confirmed the active objective above.

## Summary

- Added private style fake-DOM commit metadata status constants for accepted
  style-object diff rows.
- Linked accepted private style-object diff payload rows into the private
  root host-output update handoff payload after the fake-DOM property mutation
  succeeds.
- Kept the public handoff sanitized: full style row values are available only
  through the private WeakMap payload, while public root/style compatibility
  remains false.
- Rejected stale host-output update records by requiring the latest rendered
  `root.render` record before fake-DOM mutation.
- Preserved unsupported style row rejection and dangerous HTML blocked
  diagnostics.

## Changed Files

- `packages/react-dom/src/dom-host/property-payload.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/dom-property-operations-private.test.js`
- `tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `worker-progress/worker-579-dom-style-payload-fake-dom-commit-link.md`

## Commands Run

- `node --test packages/react-dom/test/dom-property-operations-private.test.js`
- `node --test tests/conformance/test/dom-style-dangerous-html-oracle.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `git diff --check`

## Evidence Gathered

- Private package test passes with new coverage for accepted style rows,
  stale host-output records, unsupported style rows, and existing dangerous
  HTML gates.
- Conformance oracle test passes with new coverage proving oracle style rows
  are mirrored in private fake-DOM commit metadata without public
  compatibility claims.
- React DOM workspace check passes, including the broader private root bridge
  shell tests and import smoke.
- `git diff --check` passes.
- Spawned a managed explorer for relevant code questions, but it did not
  return a usable final result before completion; conclusions were based on
  direct code inspection.

## Risks Or Blockers

- No blockers.
- The full accepted style payload rows remain private handoff payload data.
  The public handoff continues to expose only existing sanitized counts and
  booleans, avoiding raw style value leakage.

## Recommended Next Tasks

- Add a later reconciler-owned producer for the same metadata once real
  HostComponent update records carry stable style payload handles.
- Keep public style compatibility blocked until dual-run DOM style behavior is
  compared against React DOM 19.2.6.
