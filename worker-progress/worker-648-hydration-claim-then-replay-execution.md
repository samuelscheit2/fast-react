# Worker 648: Hydration Claim Then Replay Execution

## Goal Evidence

- First action: `create_goal` was called before file reads, research,
  implementation, or verification.
- Goal objective from `create_goal`: Connect private hydration target claiming
  to one blocked replay target-dispatch execution record, preserving
  recoverable-error and public hydration blockers.
- `get_goal` was available immediately after setup and again before this
  report.
- Latest `get_goal` status: `active`.
- Latest `get_goal` objective: Connect private hydration target claiming to one
  blocked replay target-dispatch execution record, preserving recoverable-error
  and public hydration blockers.

## Summary

- Added a private
  `FastReactDomHydrationClaimedReplayTargetDispatchExecutionRecord` in the
  hydration boundary gate.
- The record consumes an accepted private hydration target-claiming diagnostic
  and the exact private replay target-dispatch link that produced it, then
  records one blocked target-dispatch execution path.
- Added fail-closed identity checks for stale claims, stale/foreign target
  dispatch links, mismatched ownership rows, and dispatch records that are not
  still blocked.
- Preserved recoverable-error metadata as callback-free evidence and kept
  public hydrateRoot, event replay, dispatch, queue draining, hydration, and
  compatibility claims blocked.
- Re-exported the private execution payload/type helpers through `root-bridge`.

## Changed Files

- `packages/react-dom/src/client/hydration-boundary-gate.js`
- `packages/react-dom/src/client/root-bridge.js`
- `packages/react-dom/test/hydration-private.test.js`
- `tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`
- `worker-progress/worker-648-hydration-claim-then-replay-execution.md`

## Commands Run And Results

- `create_goal`: succeeded; goal set to this worker objective.
- `get_goal`: succeeded after setup and before report; status `active`.
- `sed -n ... WORKER_BRIEF.md`: read required worker brief.
- `sed -n ... worker-progress/worker-583...md`,
  `worker-618...md`, `worker-528...md`, `worker-433...md`,
  `worker-458...md`, `worker-401...md`, `worker-372...md`: read relevant
  hydration/replay handoff reports.
- `rg` / `sed` inspections across hydration boundary gate, marker parser,
  root bridge, plugin event system, focused tests, conformance tests, and the
  React 19.2.6 reference clone.
- `node --check packages/react-dom/src/client/hydration-boundary-gate.js`:
  passed.
- `node --check packages/react-dom/src/client/hydration-marker-parser.js`:
  passed.
- `node --check packages/react-dom/src/client/root-bridge.js`: passed.
- `node --check packages/react-dom/test/hydration-private.test.js`: passed.
- `node --check tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed.
- `node --test packages/react-dom/test/hydration-private.test.js`: passed, 7
  tests.
- `node --test packages/react-dom/test/hydration-boundary.test.js`: passed, 9
  tests.
- `node --test tests/conformance/test/react-dom-hydration-boundary-gate.test.mjs`:
  passed, 13 tests.
- `npm run check --workspace @fast-react/react-dom`: passed, 127 package tests
  plus import-entrypoint smoke. npm emitted the existing unknown
  `minimum-release-age` config warning.
- `git diff --check`: passed.
- `git status --short`: showed only the four scoped source/test files and this
  worker report before commit.

## Evidence Gathered

- Existing private hydration target claiming already records accepted marker
  parser evidence, retained replay ownership rows, and a private target-dispatch
  link while keeping execution blocked.
- The new execution record follows the existing private diagnostic pattern:
  frozen record, WeakMap payload, exported `getPrivate...Payload` and
  `isPrivate...Record` helpers, and root-bridge pass-throughs.
- React 19.2.6 reference source confirms the real public path queues blocked
  hydration targets, attempts hydration, and only dispatches/replays after
  unblocking. Fast React still lacks that public hydration path here, so the
  new record remains blocked metadata only.
- Focused tests prove recoverable-error metadata remains callback-free
  (`onRecoverableError` call count stays zero) and public hydration/replay
  blockers remain attached to the execution record.

## Risks Or Blockers

- No blockers remain for this scoped private diagnostic.
- The record is intentionally not an executable replay implementation. It does
  not hydrate host instances, drain replay queues, redispatch native events,
  call plugin dispatch, create synthetic events, invoke listeners, queue
  recoverable errors, or claim public hydrateRoot compatibility.
- Target claiming still supports only direct root-container child targets, as
  established by the prior private target-claiming gate.

## Recommended Next Tasks

- Keep public `hydrateRoot` and browser event replay blocked until real
  reconciler hydration roots, hydratable cursors, retry scheduling, and event
  replay queue draining are implemented together.
- Add broader private execution records only after nested target claiming and
  real hydratable boundary traversal are represented safely.
- When public execution begins, connect this diagnostic chain to actual replay
  dispatch only after recoverable-error routing can enqueue and flush through
  root options correctly.

## Nested Agents

- Spawned one read-only explorer agent to inspect the local hydration/replay
  shape. Its recommendation was to add the blocked execution diagnostic in
  `hydration-boundary-gate.js`, reuse the existing plugin target-dispatch link
  payload, and keep `plugin-event-system.js` unchanged. The implementation
  follows that recommendation.
