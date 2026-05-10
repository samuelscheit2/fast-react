# Worker 377: Scheduler Act Queue Flush Helper Private

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` succeeded after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add private Scheduler/act queue flush
  helper diagnostics that drain only accepted internal test queues, with
  explicit blockers for public Scheduler timing and public React act behavior.

## Summary

Added private Scheduler mock act-queue flush diagnostics for internal tests
without changing public Scheduler export keys, public Scheduler timing claims,
or public React `act` behavior.

The private diagnostic object is attached as a non-enumerable property on the
existing `scheduler/unstable_mock` flush helper functions. It validates and
drains only branded data queues created by
`packages/react/private-act-dispatcher-gate.js`; it rejects plain arrays,
public Scheduler task-shaped objects, ordinary act metadata, unbranded queues,
and tampered queue records. Draining consumes only internal test records and
does not run queued work, advance mock time, flush Scheduler task queues,
execute effects, or delegate to public `React.act`.

The React private act dispatcher gate now exposes accepted internal test queue
and task factories plus matching metadata. Public `React.act` remains the
unsupported placeholder, and public act compatibility remains blocked.

## Changed Files

- `packages/react/private-act-dispatcher-gate.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.development.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.production.js`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `worker-progress/worker-377-scheduler-act-queue-flush-helper-private.md`

`packages/scheduler/unstable_mock.js` was syntax-checked and left unchanged;
the environment wrapper already selects the modified CJS variants.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and worker
  reports 120, 125, 126, 164, 176, 277, and 335.
- Worker report 366 was not present in this checkout.
- Also inspected workers 255, 280, 308, 331, and 348 for Scheduler mock
  flush-helper metadata, react-test-renderer act scheduling gates, and
  current public-act blockers.
- Checked React 19.2.6 reference `ReactAct.js` to confirm real public `act`
  flushes renderer callback queues and continuations; this worker deliberately
  adds only private data-queue diagnostics.
- Confirmed package-surface and import smoke checks still pass with no new
  Scheduler module own keys or public React act behavior.
- No nested managed agents were spawned.

## Commands Run

```sh
node --check packages/scheduler/unstable_mock.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.development.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.production.js
node --check packages/react/private-act-dispatcher-gate.js
node --check tests/conformance/test/scheduler-mock-oracle.test.mjs
node --check tests/conformance/test/react-act-oracle.test.mjs
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
node --test tests/conformance/test/react-act-oracle.test.mjs
npm run check:js
git diff --check
```

Additional inspection used `sed`, `nl`, `rg`, `git status`, and `git diff` on
the required context files, worker reports, Scheduler mock files, React private
act gate, focused conformance tests, React reference source, and package smoke
guards.

## Verification Results

Passed:

```sh
node --check packages/scheduler/unstable_mock.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.development.js
node --check packages/scheduler/cjs/scheduler-unstable_mock.production.js
node --check packages/react/private-act-dispatcher-gate.js
node --check tests/conformance/test/scheduler-mock-oracle.test.mjs
node --check tests/conformance/test/react-act-oracle.test.mjs
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
node --test tests/conformance/test/react-act-oracle.test.mjs
npm run check:js
git diff --check
```

Focused results:

- `scheduler-mock-oracle.test.mjs`: 15 tests passed.
- `react-act-oracle.test.mjs`: 15 tests passed.
- `npm run check:js`: package-surface guard, smoke entrypoints, benchmark
  gate, workspace checks, native loader probes, and conformance tests passed
  with 587 conformance tests. npm printed the existing
  `minimum-release-age` warning.

## Risks Or Blockers

- No blocker remains for this worker objective.
- The private Scheduler helper consumes branded internal test records only. It
  is not a public Scheduler timing API and does not prove raw host timing,
  browser ordering, or broad Scheduler compatibility.
- The helper does not execute callbacks, effects, renderer roots, passive
  effects, or continuations. Public `React.act`, React DOM test-utils `act`,
  and react-test-renderer `act` remain blocked.
- The private diagnostic object is attached to existing flush helper function
  objects, not to the Scheduler module exports object, to avoid opening a new
  public Scheduler key.

## Recommended Next Tasks

1. Keep public `React.act` blocked until renderer root execution, passive
   effect callback invocation, and continuation flushing are all admitted
   together.
2. Add a future private executor for real renderer-backed act tasks only after
   it can preserve the same fail-closed public Scheduler and React act
   blockers.
3. Refresh react-test-renderer and React DOM act gates when they can consume
   this diagnostic path without exposing public compatibility.
