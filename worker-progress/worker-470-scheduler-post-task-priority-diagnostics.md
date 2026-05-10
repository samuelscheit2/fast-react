# Worker 470 Scheduler postTask Priority Diagnostics

## Goal Setup Evidence

- `create_goal` was called first with objective: add scheduler
  `unstable_post_task` priority diagnostics for shimmed TaskController
  scheduling, cancellation, and continuation fallbacks while keeping
  compatibility claims scoped.
- `get_goal` returned status `active` for that objective after setup.
- Final audit `get_goal` still returned status `active` for the same objective.

## Summary

Added opt-in private priority diagnostics to the local
`scheduler/unstable_post_task` CJS development and production files. When the
private global flag is set before requiring the entrypoint, returned callback
nodes expose a non-enumerable `Symbol.for` diagnostic reader that records:

- public Scheduler priority to TaskController/postTask priority mapping;
- normalized delay and TaskController/signal shape from the shim;
- callback run priority/deadline observations;
- cancellation through `TaskController.abort`;
- continuation routing through `scheduler.yield` or the `scheduler.postTask`
  fallback while reusing the original signal.

Default behavior remains aligned with the checked post-task oracle: without the
private flag, public exports and returned node `Object.keys` stay unchanged, and
oracle regeneration still byte-compares equal to the checked artifact. Browser
postTask ordering/timing compatibility and broad Scheduler compatibility remain
explicitly unclaimed.

## Changed Files

- `packages/scheduler/cjs/scheduler-unstable_post_task.development.js`
- `packages/scheduler/cjs/scheduler-unstable_post_task.production.js`
- `tests/conformance/src/scheduler-post-task-oracle.mjs`
- `tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- `worker-progress/worker-470-scheduler-post-task-priority-diagnostics.md`

## Evidence Gathered

- Read the required worker context, master plan/progress, worker 125 and 164
  reports, worker 068 post-task oracle report, and scheduler root/variant/mock/
  native oracle reports.
- `worker-progress/worker-469-*.md` was not present in this worktree; only
  `docs/tasks/worker-469-scheduler-mock-expired-continuation-gate.prompt.md`
  was available, so no worker-469 progress report content was used.
- Compared the local post-task CJS shape to the React reference
  `SchedulerPostTask.js` and upstream post-task tests.
- Confirmed the private diagnostics are opt-in and hidden from default oracle
  generation by byte-comparing a freshly generated post-task oracle to the
  checked JSON artifact.
- No nested managed agents were spawned.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,240p' worker-progress/worker-125-scheduler-post-task-implementation.md
sed -n '1,240p' worker-progress/worker-164-scheduler-regression-tests.md
rg --files worker-progress | rg 'worker-469|scheduler.*469|expired-continuation|post-task-priority'
sed -n '1,260p' worker-progress/worker-068-scheduler-post-task-oracle.md
sed -n '1,260p' worker-progress/worker-038-scheduler-root-oracle.md
sed -n '1,260p' worker-progress/worker-039-scheduler-variant-oracles.md
sed -n '1,260p' worker-progress/worker-052-scheduler-mock-oracle.md
sed -n '1,260p' worker-progress/worker-069-scheduler-native-entry-oracle.md
sed -n '1,360p' packages/scheduler/cjs/scheduler-unstable_post_task.development.js
sed -n '1,320p' packages/scheduler/cjs/scheduler-unstable_post_task.production.js
sed -n '1,320p' tests/conformance/src/scheduler-post-task-oracle.mjs
sed -n '1,820p' tests/conformance/test/scheduler-post-task-oracle.test.mjs
sed -n '1,1040p' tests/conformance/src/scheduler-post-task-probe-runner.mjs
sed -n '1,780p' tests/conformance/src/scheduler-post-task-oracle-generator.mjs
sed -n '1,260p' tests/conformance/src/scheduler-post-task-scenarios.mjs
sed -n '1,260p' tests/conformance/src/scheduler-post-task-targets.mjs
sed -n '1,260p' docs/tasks/worker-470-scheduler-post-task-priority-diagnostics.prompt.md
sed -n '1,260p' docs/tasks/worker-469-scheduler-mock-expired-continuation-gate.prompt.md
sed -n '1,260p' /Users/user/Developer/Developer/react-reference/packages/scheduler/src/forks/SchedulerPostTask.js
sed -n '1,260p' /Users/user/Developer/Developer/react-reference/packages/scheduler/src/__tests__/SchedulerPostTask-test.js
node --check packages/scheduler/cjs/scheduler-unstable_post_task.development.js
node --check packages/scheduler/cjs/scheduler-unstable_post_task.production.js
node --check tests/conformance/src/scheduler-post-task-oracle.mjs
node --check tests/conformance/test/scheduler-post-task-oracle.test.mjs
node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs
npm run check --workspace scheduler
tmpfile=$(mktemp); node tests/conformance/scripts/generate-scheduler-post-task-oracle.mjs > "$tmpfile"; cmp -s "$tmpfile" tests/conformance/oracles/scheduler-0.27.0-post-task-oracle.json; rc=$?; rm -f "$tmpfile"; exit $rc
git diff --check
git status --short
git diff --stat
```

Goal/tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after setup and again during final audit.
- `update_plan` for the implementation checklist.

## Verification

Passing:

```sh
node --check packages/scheduler/cjs/scheduler-unstable_post_task.development.js
node --check packages/scheduler/cjs/scheduler-unstable_post_task.production.js
node --check tests/conformance/src/scheduler-post-task-oracle.mjs
node --check tests/conformance/test/scheduler-post-task-oracle.test.mjs
node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs
npm run check --workspace scheduler
tmpfile=$(mktemp); node tests/conformance/scripts/generate-scheduler-post-task-oracle.mjs > "$tmpfile"; cmp -s "$tmpfile" tests/conformance/oracles/scheduler-0.27.0-post-task-oracle.json; rc=$?; rm -f "$tmpfile"; exit $rc
git diff --check
```

Focused post-task conformance passed 15 tests. The scheduler workspace check
passed; npm emitted only the existing `minimum-release-age` warning.

## Quality Review

- Compatibility: diagnostics are gated by
  `__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__` and are attached only
  to returned task nodes via a non-enumerable symbol reader, so default public
  exports and default oracle comparisons do not change.
- Maintainability: the conformance helper owns the shimmed runtime and cache/
  global cleanup, keeping focused tests deterministic across development and
  production modes.
- Performance: the default path does one empty WeakMap lookup per callback run
  or cancellation; diagnostic snapshots are created only when the private flag
  is enabled and a caller reads the symbol.
- Security: no new package installs, lifecycle scripts, eval, or persistent temp
  files were introduced.

## Risks Or Blockers

- The diagnostics intentionally cover controlled Node Task Scheduling API shims,
  not real browser postTask ordering or raw timing.
- The private symbol is an opt-in diagnostic surface only; broad
  `scheduler/unstable_post_task` and browser-host compatibility remain
  unclaimed.
- Worker 469's progress report was unavailable in this worktree, so any
  accepted details from that worker need merge-time review if it lands in
  parallel.

## Recommended Next Tasks

1. If browser-host postTask compatibility becomes a target, add a real browser
   harness before changing compatibility claims.
2. Recheck worker 469's scheduler mock changes during merge if they land
   separately, especially any shared scheduler diagnostic conventions.
