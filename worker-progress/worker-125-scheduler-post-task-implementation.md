# worker-125-scheduler-post-task-implementation

## Objective

Implement `scheduler@0.27.0/unstable_post_task` behavior against the checked
post-task oracle for the local scheduler package, limited to the assigned write
scope.

Goal state recorded with `get_goal`:

- Startup status: `active`
- Startup objective: `Implement scheduler@0.27.0/unstable_post_task behavior against the checked post-task oracle for the local scheduler package, limited to the specified write scope, with required oracle updates, verification, progress report, goal evidence, and handoff checklist.`
- Audit status: `active`
- Audit objective: `Implement scheduler@0.27.0/unstable_post_task behavior against the checked post-task oracle for the local scheduler package, limited to the specified write scope, with required oracle updates, verification, progress report, goal evidence, and handoff checklist.`

## Summary

Replaced the local post-task throwing stubs with a real
Task Scheduling API-backed scheduler implementation for both development and
production CJS artifacts. The implementation matches the published
`scheduler@0.27.0` post-task fork behavior for public priorities, `TaskController`
cancellation, continuation scheduling through `scheduler.yield` or `postTask`,
deadline-based `shouldYield`, priority context restoration, hidden task promise
error handling, and no-op paint/frame-rate APIs.

Promoted the post-task oracle to run the same controlled probes against the
local package copied under an isolated alias. The regenerated oracle records 12
`matched-but-compatibility-not-claimed` Fast React comparisons across
development and production modes while keeping broad Scheduler compatibility
claims false.

After the orchestrator expanded scope for this specific blocker, updated the
smoke harness so `scheduler/unstable_post_task` asserts the upstream plain-Node
`ReferenceError: window is not defined` import behavior instead of the former
placeholder behavior.

## Changed Files

- `packages/scheduler/cjs/scheduler-unstable_post_task.development.js`
- `packages/scheduler/cjs/scheduler-unstable_post_task.production.js`
- `tests/conformance/oracles/scheduler-0.27.0-post-task-oracle.json`
- `tests/conformance/src/scheduler-post-task-oracle-generator.mjs`
- `tests/conformance/src/scheduler-post-task-oracle.mjs`
- `tests/conformance/src/scheduler-post-task-probe-runner.mjs`
- `tests/conformance/src/scheduler-post-task-targets.mjs`
- `tests/conformance/test/scheduler-post-task-oracle.test.mjs`
- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-125-scheduler-post-task-implementation.md`

## Evidence Gathered

- Read the required worker context, prior post-task oracle report, prior mock
  scheduler implementation report, public Scheduler separation notes, and the
  React 19.2.6 reference post-task source/tests.
- Compared local implementation needs against the published
  `scheduler@0.27.0` CJS tarball artifacts for exact export order, function
  arity, environment access, and production/development differences.
- Spawned two read-only explorer subagents:
  - Oracle/probe explorer confirmed required export, environment, priority,
    scheduling, cancellation, and continuation observations, and called out that
    local comparison needed alias metadata normalization.
  - Reference-source explorer confirmed the root cause and implementation
    behavior: postTask priority mapping, `TaskController` cancellation,
    continuation scheduling, deadline restoration, context APIs, and error
    rethrow through `window.setTimeout`.
- Regenerated oracle comparison status:
  `{"matched-but-compatibility-not-claimed":12}`.

## Commands Run

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,240p' worker-progress/worker-068-scheduler-post-task-oracle.md
sed -n '1,260p' worker-progress/worker-120-scheduler-mock-source-implementation.md
rg -n "Scheduler|scheduler|priority|public|lane|separation|separate" worker-progress/worker-041-dom-events-priority-plan.md
sed -n '1,280p' <react-reference>/packages/scheduler/src/forks/SchedulerPostTask.js
sed -n '1,760p' <react-reference>/packages/scheduler/src/__tests__/SchedulerPostTask-test.js
rg --files packages/scheduler tests/conformance worker-progress | rg "scheduler-post-task|unstable_post_task|worker-125"
git status --short
sed -n '1,260p' packages/scheduler/cjs/scheduler-unstable_post_task.development.js
sed -n '1,240p' packages/scheduler/cjs/scheduler-unstable_post_task.production.js
sed -n '1,120p' packages/scheduler/unstable_post_task.js
sed -n '1,620p' tests/conformance/test/scheduler-post-task-oracle.test.mjs
sed -n '1,1040p' tests/conformance/src/scheduler-post-task-probe-runner.mjs
sed -n '1,520p' tests/conformance/src/scheduler-post-task-oracle-generator.mjs
sed -n '1,220p' tests/conformance/src/scheduler-post-task-targets.mjs
sed -n '1,220p' tests/conformance/src/scheduler-post-task-scenarios.mjs
sed -n '1,180p' tests/conformance/scripts/generate-scheduler-post-task-oracle.mjs
sed -n '1,180p' tests/conformance/scripts/print-scheduler-post-task-oracle.mjs
sed -n '1,220p' tests/conformance/src/scheduler-post-task-oracle.mjs
sed -n '1,760p' tests/conformance/src/scheduler-mock-oracle-generator.mjs
sed -n '1,545p' tests/conformance/test/scheduler-mock-oracle.test.mjs
sed -n '1,220p' tests/conformance/src/scheduler-mock-targets.mjs
sed -n '1,240p' tests/conformance/src/scheduler-mock-oracle.mjs
curl -fsSL https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz | tar -xOzf - package/cjs/scheduler-unstable_post_task.development.js | sed -n '1,260p'
curl -fsSL https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz | tar -xOzf - package/cjs/scheduler-unstable_post_task.production.js | sed -n '1,240p'
node --check packages/scheduler/cjs/scheduler-unstable_post_task.development.js
node --check packages/scheduler/cjs/scheduler-unstable_post_task.production.js
node --check tests/conformance/src/scheduler-post-task-oracle-generator.mjs
node --check tests/conformance/src/scheduler-post-task-probe-runner.mjs
node --check tests/conformance/test/scheduler-post-task-oracle.test.mjs
node --check tests/smoke/import-entrypoints.mjs
node tests/conformance/scripts/generate-scheduler-post-task-oracle.mjs --write
node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs
node tests/smoke/import-entrypoints.mjs
npm run check:js
git diff --stat
git diff --check
scoped conflict-marker check over all changed files
scoped trailing-whitespace check over all changed files
scoped local-path leak check over all changed files
diff-scoped unsupported-stub denylist check over all changed files
```

Goal/tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after goal setup.
- Spawned two managed read-only explorer subagents.
- `get_goal` again during the completion audit.

## Verification

Passing:

```sh
node --check packages/scheduler/cjs/scheduler-unstable_post_task.development.js
node --check packages/scheduler/cjs/scheduler-unstable_post_task.production.js
node --check tests/conformance/src/scheduler-post-task-oracle-generator.mjs
node --check tests/conformance/src/scheduler-post-task-probe-runner.mjs
node --check tests/smoke/import-entrypoints.mjs
node tests/conformance/scripts/generate-scheduler-post-task-oracle.mjs --write
node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs
npm run check:js
git diff --check
scoped conflict-marker check over all changed files
scoped trailing-whitespace check over all changed files
scoped local-path leak check over all changed files
diff-scoped unsupported-stub denylist check over all changed files
```

`npm run check:js` passed with 414 conformance tests. npm emitted only the
existing `minimum-release-age` warnings.

## Prompt-To-Artifact Checklist

- Implement post-task behavior in development CJS:
  `packages/scheduler/cjs/scheduler-unstable_post_task.development.js` now
  matches the published fork shape and passes syntax check.
- Implement post-task behavior in production CJS:
  `packages/scheduler/cjs/scheduler-unstable_post_task.production.js` no longer
  reexports development and passes syntax check.
- Keep root scheduler, mock scheduler, native scheduler, React lanes,
  reconciler scheduling, and React DOM integration out of scope: no files in
  those areas were modified.
- Preserve wrapper entrypoint:
  `packages/scheduler/unstable_post_task.js` remains the environment-selecting
  CJS wrapper and was not changed.
- Update post-task oracle/comparison files only:
  post-task generator, target, oracle helper, probe runner, focused test, and
  checked JSON were updated.
- Update smoke harness only under the orchestrator's scope expansion:
  `tests/smoke/import-entrypoints.mjs` marks only post-task scheduler entries as
  requiring a browser-like `window` and asserts the upstream plain-Node
  `ReferenceError`.
- Prove official target remains pinned:
  target file still pins `scheduler@0.27.0` tarball integrity and shasum.
- Compare local Fast React behavior:
  regenerated oracle records 12 matching local comparisons under the isolated
  `fast-react-scheduler` alias.
- Keep broad compatibility unclaimed:
  `conformanceClaims.compatibilityClaimed` and
  `fastReactBehaviorCompatible` remain false.
- Required syntax checks:
  all four requested `node --check` commands passed.
- Required oracle regeneration and focused test:
  regeneration completed and focused test passed with 12 tests.
- Required broad JS check:
  `npm run check:js` passed with 414 conformance tests.
- Required hygiene:
  `git diff --check`, scoped path leak, conflict-marker, trailing-whitespace,
  and diff-scoped unsupported-stub denylist checks passed over all changed
  files.

## Quality, Maintainability, Performance, And Security Review

- Quality: implementation mirrors the published post-task CJS behavior rather
  than approximating it through the root scheduler.
- Maintainability: local comparison follows the already accepted scheduler mock
  oracle pattern and strips only package alias metadata from behavior diffs.
- Performance: implementation delegates scheduling to the host Task Scheduling
  API and uses the same 5ms local deadline as React's fork.
- Security: no new lifecycle scripts, package installs, eval, or filesystem
  writes beyond the checked oracle artifact and report.

## Risks Or Blockers

- The oracle uses a controlled Node shim for Task Scheduling API calls; it does
  not claim browser host task ordering or raw timing compatibility.
- Broad `scheduler@0.27.0` package compatibility remains unclaimed because this
  slice covers only `scheduler/unstable_post_task`.

## Recommended Next Tasks

1. Keep worker 126's native scheduler entrypoint implementation separate from
   this post-task variant.
