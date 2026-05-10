# Worker 678: DOM Hydration Replay Click Dispatch

## Goal Evidence

- First action: `create_goal` was called before file reads, research,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active goal status from latest `get_goal`: `active`.
- Active goal objective from latest `get_goal`: connect private hydration replay
  target-claiming evidence to one blocked click replay dispatch diagnostic,
  preserving queue order and public hydration/event compatibility blockers.

## Summary

- Added an event-layer
  `FastReactDomHydrationReplayClickDispatchDiagnostic` for one blocked replayed
  click dispatch.
- The diagnostic requires an accepted private hydration target-claiming record
  that matches the exact replay target-dispatch link, queue entry, target path,
  dehydrated boundary owner, and queue order.
- The hydration claimed replay target-dispatch execution record now attaches the
  click dispatch diagnostic and payload for claimed click targets.
- Public hydrateRoot, replay queue draining, live listener installation, public
  event dispatch, SyntheticEvent creation, native redispatch, and listener
  invocation remain blocked.

## Changed Files

- `packages/react-dom/src/events/plugin-event-system.js`
- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/test/hydration-private.test.js`
- `tests/conformance/test/dom-event-delegation-oracle.test.mjs`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-678-dom-hydration-replay-click-dispatch.md`

## Verification

- `node --check packages/react-dom/src/events/plugin-event-system.js`: passed.
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`:
  passed.
- `node --check packages/react-dom/test/hydration-private.test.js`: passed.
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
  and `node --check tests/conformance/test/dom-event-delegation-oracle.test.mjs`:
  passed.
- `node --test packages/react-dom/test/hydration-private.test.js`: passed, 7
  tests.
- `node --test packages/react-dom/test/events-private.test.js`: passed, 14
  tests.
- `node --test packages/react-dom/test/hydration-boundary.test.js`: passed, 10
  tests.
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed, 13 tests.
- `node --test tests/conformance/test/dom-event-delegation-oracle.test.mjs`:
  passed, 15 tests.
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`:
  passed, 15 tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 135 package tests
  plus import-entrypoint smoke. npm emitted the existing unknown
  `minimum-release-age` config warning.
- `git diff --check`: passed.

## Notes

- The new click diagnostic is fail-closed for missing or mismatched
  target-claiming evidence.
- The diagnostic records queue order preservation through `inputOrder`,
  `replayQueueOrder`, `prioritySortKey`, and matching claim/link fields.
- Nested read-only explorers inspected the hydration gate chain and the event
  dispatch hooks. Their findings supported keeping the connection in
  hydration replay metadata instead of routing through root-listener click
  execution helpers, which would imply listener-shell activity outside this
  worker scope.

## Completion Audit

- Objective deliverable: private target-claiming evidence is connected to one
  blocked click replay dispatch diagnostic. Evidence: `plugin-event-system.js`
  exports `createHydrationReplayClickDispatchDiagnostic`; the hydration
  execution record stores `clickReplayDispatchDiagnostic` and
  `blockedClickReplayDispatchDiagnosticCount`.
- Queue-order deliverable: the diagnostic preserves `inputOrder`,
  `replayQueueOrder`, `prioritySortKey`, and validates matching claim/link
  fields before recording `queueOrderPreserved: true`.
- Compatibility-blocker deliverable: tests assert public dispatch, public
  hydration/replay compatibility, live listener installation, root listener
  installation, event replay dispatch, SyntheticEvent creation, private click
  delegation dispatch, and listener invocation all remain blocked.
- Write-scope deliverable: changed files are limited to the scoped hydration
  gate, event system, hydration/event conformance tests, focused package tests,
  and this worker report.
- Verification deliverable: the focused package tests, hydration conformance
  test, event delegation oracle test, workspace check, and `git diff --check`
  passed against the current checkout.
