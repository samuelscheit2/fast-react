# Worker 523 Scheduler postTask Environment Diagnostics

## Goal Setup Evidence

- Final pane closeout observed by orchestrator: complete (tmux reported `Goal achieved`).
- `create_goal` was called first with objective: extend private Scheduler
  `unstable_post_task` diagnostics for environment capability, priority
  mapping, and abort/continuation metadata without changing public Scheduler
  behavior or browser postTask compatibility claims.
- Initial `get_goal` returned status `active` for that exact objective.
- Final audit `get_goal` returned status `active` for the same objective.

## Summary

Extended the opt-in private `scheduler/unstable_post_task` diagnostic snapshot
behind `__FAST_REACT_ENABLE_POST_TASK_PRIORITY_DIAGNOSTICS__`. Scheduled nodes
now expose additional hidden metadata for:

- controlled Task Scheduling API environment capabilities;
- explicit Scheduler priority to postTask/TaskController priority mapping;
- abort metadata describing before/after signal state and callback/fallback
  counts;
- continuation metadata describing fallback selection, available scheduler
  capabilities, source callback, and reused signal state.

Public exports, default returned node keys, checked oracle behavior, and browser
postTask compatibility claims remain unchanged.

## Changed Files

- `packages/scheduler/cjs/scheduler-unstable_post_task.development.js`
- `packages/scheduler/cjs/scheduler-unstable_post_task.production.js`
- `tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- `worker-progress/worker-523-scheduler-post-task-environment-diagnostics.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Reviewed worker 125, 470, and 494 postTask progress reports to preserve the
  accepted public/private boundary.
- Inspected the current postTask CJS implementation, focused oracle test, probe
  runner, oracle helper, generator, targets, and scenario definitions.
- Confirmed private diagnostics remain a non-enumerable symbol reader attached
  only when the private global flag is enabled.
- Confirmed oracle regeneration still byte-compares equal to the checked
  artifact, proving default probes and public behavior stayed stable.
- Spawned one read-only explorer for context, but it did not return before
  local verification completed and was closed without affecting conclusions.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files | rg 'scheduler|post.?task|worker-progress'
rg -n "postTask|post_task|unstable_post_task|unstable_postTask|oracle|scheduler-post" packages tests worker-progress package.json
git status --short
sed -n '1,260p' packages/scheduler/unstable_post_task.js
sed -n '1,620p' packages/scheduler/cjs/scheduler-unstable_post_task.development.js
sed -n '1,560p' packages/scheduler/cjs/scheduler-unstable_post_task.production.js
sed -n '1,1320p' tests/conformance/test/scheduler-post-task-oracle.test.mjs
sed -n '1,620p' tests/conformance/src/scheduler-post-task-oracle.mjs
sed -n '1,1100p' tests/conformance/src/scheduler-post-task-probe-runner.mjs
sed -n '1,620p' tests/conformance/src/scheduler-post-task-oracle-generator.mjs
sed -n '1,260p' tests/conformance/src/scheduler-post-task-scenarios.mjs
sed -n '1,220p' tests/conformance/src/scheduler-post-task-targets.mjs
sed -n '1,260p' docs/tasks/worker-523-scheduler-post-task-environment-diagnostics.prompt.md
sed -n '1,260p' worker-progress/worker-494-scheduler-post-task-abort-diagnostics.md
sed -n '1,240p' worker-progress/worker-470-scheduler-post-task-priority-diagnostics.md
sed -n '1,220p' worker-progress/worker-125-scheduler-post-task-implementation.md
node --check packages/scheduler/cjs/scheduler-unstable_post_task.development.js
node --check packages/scheduler/cjs/scheduler-unstable_post_task.production.js
node --check tests/conformance/test/scheduler-post-task-oracle.test.mjs
node --check tests/conformance/src/scheduler-post-task-oracle.mjs
node --check tests/conformance/src/scheduler-post-task-probe-runner.mjs
node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs
tmpfile=$(mktemp); node tests/conformance/scripts/generate-scheduler-post-task-oracle.mjs > "$tmpfile" && cmp -s "$tmpfile" tests/conformance/oracles/scheduler-0.27.0-post-task-oracle.json; rc=$?; rm -f "$tmpfile"; exit $rc
npm run check --workspace scheduler
git diff --check
git add -N worker-progress/worker-523-scheduler-post-task-environment-diagnostics.md && git diff --check; rc=$?; git reset -q -- worker-progress/worker-523-scheduler-post-task-environment-diagnostics.md; exit $rc
git diff --stat
git diff --name-only
```

Goal/tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after setup and again during final audit.
- `update_plan` for the implementation checklist.
- Spawned and closed one read-only explorer that did not produce a result used
  by this worker.

## Verification

Passing:

```sh
node --check packages/scheduler/cjs/scheduler-unstable_post_task.development.js
node --check packages/scheduler/cjs/scheduler-unstable_post_task.production.js
node --check tests/conformance/test/scheduler-post-task-oracle.test.mjs
node --check tests/conformance/src/scheduler-post-task-oracle.mjs
node --check tests/conformance/src/scheduler-post-task-probe-runner.mjs
node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs
tmpfile=$(mktemp); node tests/conformance/scripts/generate-scheduler-post-task-oracle.mjs > "$tmpfile" && cmp -s "$tmpfile" tests/conformance/oracles/scheduler-0.27.0-post-task-oracle.json; rc=$?; rm -f "$tmpfile"; exit $rc
npm run check --workspace scheduler
git diff --check
```

Focused post-task conformance passed 16 tests. The scheduler workspace smoke
check passed; npm emitted only the existing `minimum-release-age` warning. The
regenerated post-task oracle output remained byte-identical to the checked
artifact.

## Quality Review

- Compatibility: public exports, returned node `Object.keys`, default oracle
  probes, and browser postTask compatibility claims are unchanged.
- Maintainability: the new rows are nested under the existing private snapshot
  instead of adding a new export or changing the public task node shape.
- Performance: extra metadata allocation happens only when the private
  diagnostic flag is enabled; default scheduling remains on the existing path.
- Security: no dependencies, lifecycle scripts, eval, networked runtime
  behavior, or persistent temp files were added.

## Risks Or Blockers

- The new environment capability rows describe the controlled Node Task
  Scheduling API shim used by tests, not real browser task ordering or raw
  timing.
- The private diagnostic surface remains opt-in and should not be treated as a
  browser `scheduler.postTask` compatibility claim.

## Recommended Next Tasks

1. Keep real browser postTask compatibility blocked until there is a browser
   harness that can prove host task ordering and timing.
2. Reuse the current private diagnostic snapshot pattern for future scheduler
   metadata so public package-surface checks remain stable.
