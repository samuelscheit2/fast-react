# Worker 531: Scheduler Native Entry Guard Refresh

## Goal Evidence

- Final pane closeout observed by orchestrator: complete (tmux reported `Goal achieved`).
- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` succeeded after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: refresh Scheduler native entry and
  package guard diagnostics after accepted mock/postTask work so
  native/server/browser variant entrypoints remain explicit and public behavior
  unchanged.

## Summary

Refreshed the Scheduler native-entry oracle test with package guard
diagnostics for the accepted mock and postTask private surfaces.

The new coverage keeps public Scheduler export keys unchanged while proving:

- native/default Scheduler entries do not load mock or postTask variant files;
- native/default entries and direct native CJS files expose no mock or postTask
  private diagnostic properties or symbols;
- `scheduler/unstable_mock` private diagnostics remain non-enumerable string
  properties on the accepted flush helper functions only;
- `scheduler/unstable_post_task` private diagnostics remain opt-in and scoped
  to returned browser task nodes through the non-enumerable
  `fast-react.scheduler.unstable_post_task.priority-diagnostics` symbol.

No Scheduler package code or import-smoke inventory was changed.

## Changed Files

- `tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `worker-progress/worker-531-scheduler-native-entry-guard-refresh.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Reviewed accepted Scheduler mock/postTask reports for workers 469, 470, 493,
  and 494, plus package-surface report 497 and native-entry reports 069 and
  126.
- Inspected `packages/scheduler` wrappers and CJS entrypoints, the native-entry
  oracle/probe files, and the import smoke Scheduler guard inventory.
- Confirmed import smoke already guards missing mock private physical subpaths
  and mock private runtime string diagnostics; this worker did not add a new
  public file or package guard inventory entry.
- No nested managed agents were spawned.

## Commands Run

```sh
node --check tests/conformance/test/scheduler-native-entry-oracle.test.mjs
node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs
npm run check --workspace scheduler
node tests/smoke/import-entrypoints.mjs
git add -N worker-progress/worker-531-scheduler-native-entry-guard-refresh.md && git diff --check; rc=$?; git reset -q -- worker-progress/worker-531-scheduler-native-entry-guard-refresh.md; exit $rc
```

Additional inspection used `rg`, `find`, `sed`, `git status --short`,
`git diff --stat`, and scoped `git diff` reads.

## Verification

Passing:

```sh
node --check tests/conformance/test/scheduler-native-entry-oracle.test.mjs
node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs
node --test tests/conformance/test/scheduler-mock-oracle.test.mjs
node --test tests/conformance/test/scheduler-post-task-oracle.test.mjs
npm run check --workspace scheduler
node tests/smoke/import-entrypoints.mjs
git add -N worker-progress/worker-531-scheduler-native-entry-guard-refresh.md && git diff --check; rc=$?; git reset -q -- worker-progress/worker-531-scheduler-native-entry-guard-refresh.md; exit $rc
```

Focused results:

- Scheduler native-entry oracle: 16 tests passed.
- Scheduler mock oracle: 17 tests passed.
- Scheduler post-task oracle: 16 tests passed.
- Scheduler workspace check passed; npm printed only the existing
  `minimum-release-age` warning.
- Direct import-entrypoint smoke passed.
- `git diff --check` passed.

## Risks Or Blockers

- No blocker remains for this worker scope.
- The postTask diagnostics asserted here are still controlled-shim evidence;
  they do not claim browser `scheduler.postTask` ordering or timing
  compatibility.
- The guard intentionally checks private diagnostic placement, not broad
  Scheduler behavior compatibility.

## Recommended Next Tasks

1. Keep future Scheduler diagnostics behind existing variant-specific hidden
   surfaces or update the import/package-surface guard inventory in the same
   change that adds a new private surface.
2. Continue treating native host integration and browser postTask ordering as
   separate compatibility tracks.
