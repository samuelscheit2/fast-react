# Worker 761: Scheduler postTask Deferred Yield Guard

## Goal Evidence

- Initial `get_goal` status: `active`.
- Initial objective: add scheduler-only conformance coverage for a deferred
  `scheduler.yield` shim so the private postTask root-continuation gate stays
  fail-closed or explicitly pending when `yield.then` does not run
  synchronously.
- Latest `get_goal` status before report: `active`.
- No nested managed agents were spawned.

## Summary

- Added root-continuation conformance coverage for a controlled
  `globalThis.scheduler.yield` shim whose `then` handler stores the continuation
  until the test explicitly releases it.
- Proved the deferred-yield row is accepted only as pending private metadata
  while the continuation remains queued, with renderer/root execution and every
  public compatibility claim blocked.
- Proved releasing the deferred yield continuation makes the same
  root-continuation evidence reject as `stale-continuation` after the callback
  run count advances from 1 to 2.
- Added a public-claim mutation after release to ensure the adapter still
  rejects public renderer/root admission instead of treating released yield work
  as compatibility evidence.
- Preserved Worker 751's synchronous `scheduler.yield` stale-continuation test.
- Did not touch Scheduler source, React private act code, React DOM,
  test-renderer, Rust crates, package manifests, master docs, or oracle
  artifacts.

## Changed Files

- `tests/conformance/test/scheduler-post-task-root-continuation.test.mjs`
- `worker-progress/worker-761-scheduler-posttask-deferred-yield-guard.md`

## Commands Run

- `pwd && git status --short --branch` - passed; confirmed assigned worktree and
  `worker/761-scheduler-posttask-deferred-yield-guard`.
- `rg --files ...` - passed; located assigned docs, conformance tests, package
  postTask entrypoints, and prior worker progress.
- `sed` inspections of `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `worker-progress/worker-751-scheduler-posttask-yield-handoff.md`,
  `tests/conformance/test/scheduler-post-task-root-continuation.test.mjs`,
  `tests/conformance/test/scheduler-post-task-oracle.test.mjs`,
  `tests/conformance/src/scheduler-post-task-oracle.mjs`,
  `tests/conformance/src/scheduler-post-task-root-continuation.cjs`, and
  Scheduler postTask package files - passed.
- `node --check tests/conformance/test/scheduler-post-task-root-continuation.test.mjs` - passed.
- `node --check tests/conformance/test/scheduler-post-task-oracle.test.mjs` - passed.
- `node --test tests/conformance/test/scheduler-post-task-root-continuation.test.mjs` - passed, 5 tests.
- `node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs` - passed, 18 tests.
- `npm run check --workspace scheduler` - passed; npm emitted the existing
  `minimum-release-age` warning.
- `npm run check:package-surface` - passed; package surface snapshot guard
  passed, with the existing npm warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed after all edits.
- `git status --short` and `git diff --stat` - passed; reviewed final scope.

## Evidence Gathered

- React Scheduler's postTask development entrypoint uses
  `scheduler.yield(continuationOptions).then(nextTask)` when
  `scheduler.yield` is available.
- Worker 751's synchronous shim path still records `scheduler.yield`, runs the
  continuation during the same controlled flush, and rejects the root row as
  `stale-continuation`.
- The new deferred shim records `yield` and `yield.then-deferred`, leaves one
  queued yield continuation, and produces a pending private
  root-continuation metadata row before release.
- Before release, the accepted private row keeps browser postTask compatibility,
  browser task ordering, public Scheduler timing, public React act, public root
  scheduler, public renderer/effects, root execution, and package compatibility
  claims false or blocked.
- After release, the callback event list includes the deferred continuation,
  diagnostics show two callback runs, and
  `createPrivatePostTaskRootContinuationMetadataRow` rejects the row as
  `stale-continuation`.
- A public renderer compatibility claim injected after release is rejected as
  `public-compatibility-claimed`.

## Risks Or Blockers

- This remains controlled-shim scheduler conformance evidence only. It does not
  prove real browser Task Scheduling API ordering, raw timing, public Scheduler
  timing compatibility, public React act draining, public root scheduling,
  renderer execution, effects, or package compatibility.
- The deferred-yield helper is test-local because the shared oracle helper only
  models synchronous `yield.then`; no runtime or oracle artifact changes were
  needed for this guard.

## Recommended Next Tasks

- Keep public Scheduler postTask/browser/root compatibility blocked until a real
  browser harness validates Task Scheduling API ordering and timing together
  with public root and renderer execution.
- If future work changes the shared oracle shim to support deferred yield
  release, move this controlled deferred evidence into the shared oracle rows
  and keep the stale-after-release rejection assertions.
