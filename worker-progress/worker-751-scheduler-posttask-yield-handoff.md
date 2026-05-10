# Worker 751: Scheduler postTask Yield Handoff

## Goal Evidence

- Initial `get_goal` status: `active`.
- Initial objective: extend the existing postTask delayed act/root handoff evidence
  to cover the `scheduler.yield`-available path/fallback behavior without
  touching Scheduler source, `unstable_mock`, or claiming public Scheduler/root
  compatibility.
- Latest `get_goal` status before report: `active`.
- No nested managed agents were spawned.

## Summary

- Added root-continuation conformance coverage for a delayed continuation when
  `globalThis.scheduler.yield` is available.
- Pinned that the controlled `scheduler.yield` path records the private delayed
  act/root handoff and selects `scheduler.yield`, but the root-continuation row
  rejects it as `stale-continuation` after the shimmed `yield.then` continuation
  has already run.
- Added oracle coverage for the yield-selected delayed handoff while keeping
  public Scheduler timing, public React act, public root scheduler, renderer
  work, effects, browser ordering/timing, and compatibility claims false.
- Added yield-path public compatibility claim rejection coverage for the private
  act/root handoff tree.
- Did not touch Scheduler source, `packages/scheduler/unstable_mock.js`, React,
  React DOM, Rust crates, package manifests, or master docs.

## Changed Files

- `tests/conformance/test/scheduler-post-task-root-continuation.test.mjs`
- `tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- `worker-progress/worker-751-scheduler-posttask-yield-handoff.md`

## Commands Run

- `pwd && git status --short --branch` - passed; started on
  `worker/751-scheduler-posttask-yield-handoff`.
- `sed -n '1,220p' WORKER_BRIEF.md` - passed.
- `sed -n '1,260p' MASTER_PLAN.md` - passed.
- `sed -n '1,180p' worker-progress/worker-683-scheduler-posttask-act-root-continuation.md` - passed.
- `sed -n '1,180p' worker-progress/worker-713-scheduler-posttask-priority-timeout-continuation.md` - passed.
- `sed`/`rg` inspections of Scheduler postTask conformance tests, the
  root-continuation adapter, scheduler package files, and the React 19.2.6
  `SchedulerPostTask.js` reference - passed.
- `node --check tests/conformance/test/scheduler-post-task-root-continuation.test.mjs` - passed.
- `node --check tests/conformance/test/scheduler-post-task-oracle.test.mjs` - passed.
- `node --test tests/conformance/test/scheduler-post-task-root-continuation.test.mjs` - passed, 4 tests.
- `node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs` - passed, 18 tests.
- `npm run check --workspace scheduler` - passed; npm emitted the existing
  `minimum-release-age` warning.
- `npm run check:package-surface` - passed; package surface snapshot guard
  passed.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
- `git status --short` and `git diff --stat` - passed; reviewed final scope.

## Evidence Gathered

- React 19.2.6 `scheduler/unstable_post_task` schedules continuations through
  `scheduler.yield(options).then(nextTask)` when `scheduler.yield` exists, and
  otherwise falls back to `scheduler.postTask(nextTask, options)`.
- In the controlled conformance shim, `yield.then` invokes the continuation
  during the same controlled flush. That produces two callback runs for the
  delayed continuation case while still recording the private delayed handoff.
- The private root-continuation adapter rejects that yield-path row as
  `stale-continuation` because the callback run count advanced from 1 to 2,
  keeping the root handoff diagnostic-only.
- The yield-path handoff metadata keeps all public compatibility and execution
  claims false and does not add public Scheduler exports or package subpaths.

## Risks Or Blockers

- This remains controlled-shim diagnostic evidence only. It does not prove real
  browser Task Scheduling API ordering, raw timing, public Scheduler timing
  compatibility, public React act draining, public root scheduling, renderer
  execution, effects, or compatibility.
- The source diagnostics still record an accepted private act/root handoff for
  the yield path; the root-continuation row intentionally rejects it after the
  continuation has executed in the shim.

## Recommended Next Tasks

- Keep public Scheduler postTask/browser compatibility blocked until a real
  browser harness validates Task Scheduling API ordering and timing.
- If a future worker changes the `scheduler.yield` shim semantics to defer the
  continuation instead of running it synchronously, add a new acceptance test
  proving whether the private root-continuation row should become pending or
  remain blocked.
