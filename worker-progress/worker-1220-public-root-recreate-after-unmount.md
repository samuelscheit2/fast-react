# Worker 1220 Public Root Recreate After Unmount

## Summary

Added a narrow public fake-DOM lifecycle row for recreate-after-unmount on the
already accepted hostile escaped div/text surface. The sequence is:
`createRoot(container)`, render hostile escaped div/text, same-root update,
`root.unmount()`, stale old-root `render` and `unmount` fail-closed, fresh
`createRoot(container)` on the same fake-DOM container, hostile escaped render
again, and fresh `unmount()`.

This is record/conformance evidence only. It keeps `compatibilityClaimed:
false` and does not promote broad browser DOM, root, hydrateRoot, Scheduler,
act, flushSync, events, refs, profiling, arrays/fragments/nested/component
children, className, object id, or options support.

## Changed Files

- `tests/conformance/src/react-dom-root-public-facade-blocked-gate.mjs`
  - Added `public-create-root-recreate-after-unmount`.
  - Added raw `getAttribute("id")` snapshot evidence.
  - Added recreate-after-unmount validator checks for a distinct fresh root,
    stale old-root fail-closed attempts, fresh render/unmount attempts, escaped
    `innerHTML`, raw `textContent`, child/firstElementChild/tagName data, and
    mutation logs.
- `tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
  - Added expected snapshots and assertions for the new row.
  - Added false-green tamper cases for reused roots, stale old-root no-op
    behavior, missing raw `getAttribute`, unescaped hostile serialization, and
    incomplete mutation logs.
- `tests/smoke/react-dom-private-root-bridge-shell.mjs`
  - Extended the public facade smoke path to recreate a fresh root on the same
    fake-DOM container and render/unmount the same hostile escaped shape.

## Commands Run

- `node --test tests/conformance/test/react-dom-root-public-facade-blocked-gate.test.mjs`
  - Passed: 43 tests.
- `npm --prefix tests/conformance run root-public-facade:conformance`
  - Passed. Reported blocked public facade rows: 23, failures: 0.
- `node tests/smoke/react-dom-private-root-bridge-shell.mjs`
  - Passed: `React DOM private root bridge shell smoke checks passed.`
- `node --test packages/react-dom/test/react-dom-client-symbol-facade-gate.test.js`
  - Passed: 4 tests.
- `git diff --check`
  - Passed.

## Evidence Gathered

- The public boundary now records a distinct `freshRoot` after the first
  `root.unmount()`.
- The old root's `render` and `unmount` attempts both throw
  `FAST_REACT_UNIMPLEMENTED` through `react-dom/client`.
- The fresh root renders the hostile id `app&<>"` and text `hello & < >`, with
  escaped serialized HTML and raw `getAttribute("id")` / `textContent` checks.
- The final fake-DOM container mutation log is exactly append/remove/append/remove.
- The aggregate conformance gate remains blocked and non-compatible.

## Non-Claims

- No browser DOM compatibility claim.
- No broad public root compatibility claim.
- No hydrateRoot, event, ref, Scheduler, act, flushSync, profiling, fragment,
  array, nested child, component child, className, object id, or options support.
- No reliance on React's second-unmount no-op behavior.

## Risks Or Blockers

- No active code blocker remains.
- The assigned worktree path disappeared during the turn and was recreated at
  the exact assigned path/branch from `8f611f0e` before any edits were made.
  This is noted for orchestration visibility.
- The source implementation was not changed; this is conformance/smoke evidence
  over the existing public facade behavior.

## Recommended Next Tasks

- Keep this row scoped as fake-DOM public-facade evidence until a real browser
  DOM/root compatibility lane exists.
- If future work broadens public root support, promote blockers one surface at a
  time with matching hostile negative cases.

## Commit Info

- Implementation commit: `f339e386`
- Report commit: pending
