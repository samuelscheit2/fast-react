# worker-126-scheduler-native-entry-implementation

## Objective

Implement `scheduler@0.27.0` native entrypoint behavior against the checked
native-entry oracle while keeping root scheduler, mock scheduler, post-task
scheduler, React lanes, reconciler scheduling, React Native renderer
integration, and React DOM integration out of scope.

Goal state recorded with `get_goal`:

- Startup status: `active`
- Startup objective: `Implement scheduler@0.27.0 native entrypoint behavior against the checked native-entry oracle within the scoped files, preserving root/mock/post-task scheduler behavior and completing required verification plus worker progress reporting.`
- Pre-handoff status after implementation and verification: `active`
- Pre-handoff objective: `Implement scheduler@0.27.0 native entrypoint behavior against the checked native-entry oracle within the scoped files, preserving root/mock/post-task scheduler behavior and completing required verification plus worker progress reporting.`

## Summary

Replaced the native scheduler placeholder with a real native-entry CJS
implementation for development and production. The implementation keeps its own
fallback task and timer queues, fallback priority constants, cancellation
tombstones, `requestPaint`/`shouldYield` state, `unstable_now`, and
`unstable_getCurrentPriorityLevel`. At module initialization it delegates the
supported native APIs and constants to `nativeRuntimeScheduler` when that
global is present. The unsupported priority-context helpers
`unstable_runWithPriority`, `unstable_next`, `unstable_wrapCallback`, and
`unstable_forceFrameRate` now throw `Error("Not implemented.")` as in the
published native entrypoint.

Updated the native-entry oracle generator/test to copy the local scheduler
package into an isolated temp `node_modules/scheduler`, probe it with the same
native-entry runner as the exact `scheduler@0.27.0` tarball, and compare the
native behavior observations scenario-by-scenario. Local package metadata is
excluded from the behavior comparison because package identity cleanup is out
of scope. The regenerated oracle records 14
`matched-but-compatibility-not-claimed` comparisons across two modes and seven
native-entry scenarios.

## Changed Files

- `packages/scheduler/cjs/scheduler.native.development.js`
- `packages/scheduler/cjs/scheduler.native.production.js`
- `tests/conformance/src/scheduler-native-entry-targets.mjs`
- `tests/conformance/src/scheduler-native-entry-oracle-generator.mjs`
- `tests/conformance/src/scheduler-native-entry-oracle.mjs`
- `tests/conformance/scripts/generate-scheduler-native-entry-oracle.mjs`
- `tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `tests/conformance/oracles/scheduler-0.27.0-native-entry-oracle.json`
- `worker-progress/worker-126-scheduler-native-entry-implementation.md`

`packages/scheduler/index.native.js` was inspected and already matched the
published wrapper selection behavior, so it was not changed.

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, worker 069, worker 120, worker 041 public Scheduler
  separation sections, and the React reference native scheduler files.
- Spawned two read-only nested explorer agents:
  - native behavior check: confirmed export order, descriptor shape, fallback
    scheduling, native runtime delegation, unsupported helper throwers, and
    root-scheduler differences from React/reference/oracle evidence.
  - harness check: confirmed the existing native-entry oracle was scheduler
    artifact only and needed a Fast React comparison path.
- Direct local probes using `scheduler-native-entry-probe-runner.mjs` showed
  the implemented native files matched the checked oracle behavior for fallback
  runtime, native runtime delegation, export descriptors, and direct native CJS
  loading.
- Regenerated oracle comparison status:
  `{"matched-but-compatibility-not-claimed":14}`.
- Focused oracle test passed 13 tests, including the new Fast React comparison
  assertion.

## Commands Run

```sh
node --check packages/scheduler/cjs/scheduler.native.development.js
node --check packages/scheduler/cjs/scheduler.native.production.js
node --check tests/conformance/src/scheduler-native-entry-oracle-generator.mjs
node --check tests/conformance/src/scheduler-native-entry-probe-runner.mjs
node --check tests/conformance/test/scheduler-native-entry-oracle.test.mjs
node --check tests/conformance/scripts/generate-scheduler-native-entry-oracle.mjs
node --check tests/conformance/scripts/print-scheduler-native-entry-oracle.mjs
node tests/conformance/scripts/generate-scheduler-native-entry-oracle.mjs --write
node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs
npm run check:js
git diff --check
<scoped changed-path allowlist check>
<conflict-marker check over changed files>
<trailing-whitespace check over changed files>
<placeholder-marker denylist check over changed files>
```

Additional local probe and inspection commands were run for implementation
debugging, including temporary isolated `node_modules/scheduler` probes through
`tests/conformance/src/scheduler-native-entry-probe-runner.mjs`, generated
oracle status-count inspection, `git status --short`, and scoped diffs.

## Verification

Passing:

```sh
node --check packages/scheduler/cjs/scheduler.native.development.js
node --check packages/scheduler/cjs/scheduler.native.production.js
node --check tests/conformance/src/scheduler-native-entry-oracle-generator.mjs
node --check tests/conformance/src/scheduler-native-entry-probe-runner.mjs
node tests/conformance/scripts/generate-scheduler-native-entry-oracle.mjs --write
node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs
git diff --check
<scoped changed-path allowlist check>
<conflict-marker check over changed files>
<trailing-whitespace check over changed files>
<placeholder-marker denylist check over changed files>
```

Blocked:

```sh
npm run check:js
```

`npm run check:js` fails in `tests/smoke/import-entrypoints.mjs` before
workspace checks run. Latest failure:
`AssertionError [ERR_ASSERTION]: scheduler index.native.js CJS keys` at
`assertSchedulerInventoryKeys` in `tests/smoke/import-entrypoints.mjs:788`.
The smoke still asserts `scheduler/index.native.js` has placeholder metadata
and the old placeholder/root-like export order. The checked native-entry oracle
requires the published native export order and no Fast React placeholder
metadata. `tests/smoke/**` is explicitly out of this worker's write scope, so
this report leaves that gate as an unresolved out-of-scope blocker instead of
patching the smoke test. Orchestrator scope coordination later confirmed that
this worker must not edit `tests/smoke/import-entrypoints.mjs`; if `npm run
check:js` fails only because smoke still expects placeholder/native scheduler
behavior, record the exact failure and continue with focused native-entry
gates.

## Prompt-To-Artifact Checklist

- Implement fallback/nativeRuntimeScheduler delegation behavior:
  `packages/scheduler/cjs/scheduler.native.development.js` and
  `packages/scheduler/cjs/scheduler.native.production.js` now contain native
  fallback scheduling and import-time native runtime delegation.
- Preserve wrapper selection: `packages/scheduler/index.native.js` was
  inspected and already selects production only when `NODE_ENV ===
  "production"`.
- Keep root/mock/post-task and renderer scheduling out of scope: no root,
  mock, post-task, React, React DOM, reconciler, `crates/**`, lockfile, or
  smoke files were modified.
- Compare Fast React against checked native oracle: native-entry generator,
  helper, target, test, and regenerated JSON now include local Fast React
  observations and 14 matching native-entry comparisons.
- Preserve no broad compatibility claim: oracle still keeps
  `compatibilityClaimed: false` and `fastReactBehaviorCompatible: false`.
- Record progress: this file documents implementation, evidence, commands,
  delegated checks, and the unresolved broad-check blocker.
- Required verification: all scoped native-entry checks passed; `npm run
  check:js` was run and is blocked only by an out-of-scope stale smoke
  placeholder/native scheduler assertion per orchestrator scope coordination.

## Quality Review

- Maintainability: the native implementation is isolated from root scheduler
  state and mirrors the native entrypoint contract instead of importing the
  root package.
- Performance: fallback scheduling uses the same heap-based task/timer queues
  and host callback transport behavior as the published scheduler native
  fallback.
- Security: oracle generation still fetches the exact pinned npm tarball,
  verifies integrity/shasum, runs probes in temp projects, and does not execute
  package lifecycle scripts.
- Compatibility boundary: public Scheduler priorities remain JS package
  constants and are not reused as React lanes or event priorities.

## Risks Or Follow-Ups

- Update or replace the stale `tests/smoke/import-entrypoints.mjs` scheduler
  native placeholder assertions during orchestrator-owned smoke integration,
  then rerun `npm run check:js`.
- The native-entry oracle compares Node-controlled fallback/delegation behavior
  only; React Native host integration remains a separate surface.
- Broad `scheduler@0.27.0` package compatibility remains unclaimed because
  local package metadata is workspace-specific and root/mock/post-task
  behavior is owned by separate tasks.
