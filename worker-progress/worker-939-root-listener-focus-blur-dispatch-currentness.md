# Worker 939 - Root Listener Focus/Blur Dispatch Currentness

## Status

Complete. Focus/blur private root dispatch execution now carries explicit
root-listener currentness and shell-pair evidence alongside source-owned plugin
dispatch metadata.

## Changes

- Bound `invokePrivateRootFocusBlurEventDispatchExecution` to a current
  capture+bubble root listener shell pair from the currentness gate state.
- Added focus/blur record fields for root shell set keys, source-owned plugin
  dispatch metadata, hydration replay blocked status, and public/package/
  SyntheticEvent compatibility blockers.
- Blocked public event, package, SyntheticEvent, and hydration replay
  compatibility claims in private root listener currentness and dispatch gate
  options.
- Rejected hydration replay diagnostics as root listener currentness source
  aliases.
- Added focus/blur currentness canaries for focusin bubble and focusout
  capture positives, plus stale registration, missing root shell, cloned/
  foreign/stale currentness, forged listener state, wrong phase/type,
  hydration replay alias, and forged compatibility claim negatives.
- Extended conformance coverage for focus/blur discrete priority wrappers,
  root listener shell metadata, focus/blur registration name mapping, and
  package surface blocking.

## Checks

- `node --check packages/react-dom/src/events/root-listeners.js`
- `node --check packages/react-dom/src/events/plugin-event-system.js`
- `node --check packages/react-dom/test/events-private.test.js`
- `node --check tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --check tests/conformance/test/react-dom-event-priority-shell.test.mjs`
- `node --test packages/react-dom/test/events-private.test.js`
- `node --test tests/conformance/test/react-dom-event-dispatch-plugin-skeleton.test.mjs`
- `node --test tests/conformance/test/react-dom-event-priority-shell.test.mjs`
- `npm run check --workspace @fast-react/react-dom`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

All checks passed.

## Risks / Overlap

- Overlaps React DOM event internals only. Hydration replay workers may add
  richer queued-focus diagnostics later; this worker keeps replay dispatch
  blocked and only rejects replay evidence as a currentness alias.
- No public DOM event dispatch, SyntheticEvent, hydration replay, mutation, or
  package compatibility is claimed or enabled.
