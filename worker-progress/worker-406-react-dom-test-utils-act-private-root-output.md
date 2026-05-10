# Worker 406: React DOM Test Utils Act Private Root Output

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`:
  `make the React DOM test-utils act private gate recognize accepted private root host-output diagnostics as blocked prerequisites without opening public react-dom/test-utils.act`

## Summary

Refreshed the React DOM `test-utils.act` private routing gate so accepted
private root host-output diagnostics are explicitly tracked as blockers before
any public `react-dom/test-utils.act` admission.

The gate now records the current private host-output diagnostic set from the
root-render E2E gate: 8 accepted scenarios, 2 unsupported scenarios, 16
accepted scenario-mode rows, and 4 blocked scenario-mode rows. Each accepted
scenario is also represented as a blocked private-root-host-output prerequisite
that must remain blocked until public roots execute that scenario.

Public `react-dom/test-utils.act` remains a placeholder. This change does not
execute act callbacks, queued work, effects, sync flush through the public
surface, public React DOM roots, or DOM mutation, and it does not claim
compatibility.

## Changed Files

- `packages/react-dom/src/test-utils-act-gate.js`
- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `worker-progress/worker-406-react-dom-test-utils-act-private-root-output.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read present requested reports: workers 282, 322, and 382.
- Worker reports 390 and 405 were not present under `worker-progress/`; their
  task prompts were present under `docs/tasks/` and were read for boundary
  context only.
- Also inspected relevant accepted host-output/root-facade reports 352, 368,
  380, and 381 to align the diagnostic counts and blocker semantics.
- Confirmed current root-render E2E gate source admits
  `create-root-no-render`, `initial-host-render`, `update-host-render`,
  `replace-host-tree`, `render-null-clears-container`, `root-unmount`,
  `double-unmount`, and `render-after-unmount` as private host-output
  diagnostics, while `flush-sync-cross-root-render` and
  `development-warning-boundaries` remain unsupported.
- Spawned one read-only explorer to inspect the current gate/test shape. It did
  not return before the local implementation and verification were complete, so
  it was closed and did not affect conclusions.

## Commands Run

```sh
node --check packages/react-dom/src/test-utils-act-gate.js
node --check packages/react-dom/test-utils.js
node --check tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs
node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs
npm run check --workspace @fast-react/react-dom
npm run check:js
git diff --check
```

Additional inspection used `rg`, `sed`, `nl`, `find`, `git status --short`,
and `git diff --stat`.

An early focused test run failed on local identifier typos in the new gate
metadata exports. Those names were corrected, and the focused test and all
required verification commands passed afterward.

## Verification

Passed after final edits:

- JS syntax checks for the two React DOM files and the focused conformance
  test.
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
  with 13 tests passed.
- `npm run check --workspace @fast-react/react-dom` with 37 package tests
  passed plus the import-entrypoints smoke check.
- `npm run check:js` with package surface, smoke, benchmarks, workspace checks,
  and conformance passed; conformance reported 600 tests passed.
- `git diff --check` passed.

NPM printed the existing `minimum-release-age` warning during npm commands.

## Risks Or Blockers

- No blocker remains for this worker scope.
- The new blocker rows are static gate metadata. They do not discover Rust or
  root-render gate internals at runtime.
- Accepted host-output rows are still private fake-DOM diagnostics only. They
  do not prove public React DOM root execution, browser DOM mutation,
  scheduler-driven effects, public `flushSync`, or `act` compatibility.
- `flush-sync-cross-root-render` and `development-warning-boundaries` remain
  unsupported in the private host-output layer and are recorded as such.

## Recommended Next Tasks

- Keep public `react-dom/test-utils.act` blocked until public React `act`, act
  queue draining, scheduler/passive integration, public React DOM root
  execution, and public `flushSync` are admitted together.
- If future workers admit the two remaining private host-output scenarios,
  refresh this gate's scenario lists and blocked prerequisite rows in the same
  change.
- When public root execution becomes real, retire these private diagnostic
  blockers one scenario at a time rather than treating private fake-DOM output
  as public compatibility evidence.
