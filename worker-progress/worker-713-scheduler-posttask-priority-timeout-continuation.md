# Worker 713: Scheduler postTask Priority Timeout Continuation

## Goal Evidence

- `create_goal` was called before file reads, research, edits, or verification.
- Initial `get_goal` status: `active`.
- Initial `get_goal` objective: `add private Scheduler postTask evidence for priority, timeout, delayed continuation, and abort ordering that can be consumed by act/root handoff metadata without broad browser compatibility claims.`
- Latest `get_goal` status before report: `active`.
- Latest `get_goal` objective before report: `add private Scheduler postTask evidence for priority, timeout, delayed continuation, and abort ordering that can be consumed by act/root handoff metadata without broad browser compatibility claims.`
- No nested managed agents were spawned.

## Summary

- Added opt-in private `scheduler/unstable_post_task` priority-timeout diagnostics in both development and production CJS bundles without changing public exports or callback node shape.
- The private timeout record maps Scheduler priorities to the corresponding timeout constants, records that postTask still passes deprecated `didTimeout` as `false`, and keeps raw timing/browser ordering/public compatibility claims false.
- Threaded the timeout evidence through schedule snapshots, callback runs, continuation fallback metadata, private root-continuation routes, delayed act/root handoff records, act-queue handoff records, and root-work metadata records.
- Updated the root-continuation conformance adapter so act/root handoff metadata consumes the timeout evidence along with priority, delayed continuation, and abort-ordering data.
- Focused tests now assert the timeout evidence for normal, low, idle, immediate, user-blocking, and unknown-priority postTask diagnostics while keeping public compatibility blocked.

## Changed Files

- `packages/scheduler/cjs/scheduler-unstable_post_task.development.js`
- `packages/scheduler/cjs/scheduler-unstable_post_task.production.js`
- `tests/conformance/src/scheduler-post-task-root-continuation.cjs`
- `tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- `tests/conformance/test/scheduler-post-task-root-continuation.test.mjs`
- `worker-progress/worker-713-scheduler-posttask-priority-timeout-continuation.md`

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md` - passed.
- `sed -n '1,260p' MASTER_PLAN.md` - passed.
- `sed -n '1,260p' MASTER_PROGRESS.md` - passed.
- `git status --short` - passed; initial status was clean.
- `rg --files packages/scheduler | sort` - passed.
- `rg --files tests | rg 'scheduler|post|task|conformance'` - passed.
- `nl -ba packages/scheduler/cjs/scheduler-unstable_post_task.development.js | sed -n ...` - passed; inspected implementation.
- `nl -ba packages/scheduler/cjs/scheduler-unstable_post_task.production.js | sed -n ...` - passed; inspected production parity.
- `nl -ba tests/conformance/test/scheduler-post-task-oracle.test.mjs | sed -n ...` - passed; inspected focused tests.
- `nl -ba tests/conformance/test/scheduler-post-task-root-continuation.test.mjs | sed -n ...` - passed; inspected root-continuation tests.
- `nl -ba tests/conformance/src/scheduler-post-task-root-continuation.cjs | sed -n ...` - passed; inspected metadata adapter.
- `nl -ba /Users/user/Developer/Developer/react-reference/packages/scheduler/src/forks/SchedulerPostTask.js | sed -n '1,230p'` - passed; checked React 19.2.6 postTask source behavior.
- `node --check packages/scheduler/cjs/scheduler-unstable_post_task.development.js && node --check packages/scheduler/cjs/scheduler-unstable_post_task.production.js` - passed.
- `node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs` - passed, 17 tests.
- `node --test tests/conformance/test/scheduler-post-task-root-continuation.test.mjs` - passed, 3 tests.
- `npm run check --workspace scheduler` - passed; npm emitted the existing `minimum-release-age` warning.
- `npm run check:package-surface` - passed; no package surface changes were expected.
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" packages/scheduler tests/conformance worker-progress --glob '!node_modules'` - passed with no matches.
- `git diff --check` - passed.
- `git diff --stat` and `git diff -- ...` - passed; reviewed changed scope.

## Evidence Gathered

- React 19.2.6 `SchedulerPostTask` always passes deprecated `didTimeout` as `false` and schedules continuations through `scheduler.yield` or `scheduler.postTask` with the same signal.
- Existing private postTask diagnostics were already opt-in behind `__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__` and exposed only through the private symbol snapshot.
- The new priority-timeout record is private metadata only: it records Scheduler timeout constants and the postTask `didTimeout: false` behavior but does not use raw timestamps for public timing claims.
- Focused conformance proves delayed continuation act/root handoff metadata now carries priority, timeout, delay, signal validation, and abort-ordering evidence while renderer/root execution remains blocked.

## Risks Or Blockers

- This remains controlled-shim private evidence only. It does not claim real browser `scheduler.postTask` ordering, raw timing, public Scheduler timing compatibility, public React act draining, or renderer/root execution.
- The timeout constants are diagnostic evidence for act/root metadata; they do not change the public postTask variant behavior, which still invokes callbacks with `didTimeout` false.

## Recommended Next Tasks

- Keep public Scheduler postTask/browser compatibility blocked until a real browser Task Scheduling API harness validates ordering and timing.
- If future act/root work consumes this metadata for execution, add that admission in the root/reconciler layer rather than executing renderer work from `scheduler/unstable_post_task`.
