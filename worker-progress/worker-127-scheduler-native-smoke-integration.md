# Worker 127 Scheduler Native Smoke Integration

## Goal Evidence

- Goal objective: Finish native scheduler smoke integration for worker 126's scheduler native entrypoint implementation.
- Goal status after setup: active
- Replacement-process goal objective: Finish native scheduler smoke integration for worker 126's scheduler native entrypoint implementation, keeping changes scoped to tests/smoke/import-entrypoints.mjs and worker-progress/worker-127-scheduler-native-smoke-integration.md, running required verification, and reporting results.
- Replacement-process goal status after setup/get_goal: active
- The first worker 127 process stalled while starting `xcodebuildmcp`; the
  replacement process recorded a fresh active goal and audited the partial
  diff. The replacement also stalled on the same irrelevant MCP startup after
  the smoke patch was present. The orchestrator terminated the stuck tmux
  process and completed acceptance verification without broadening the write
  scope.

## Summary

Updated the smoke harness so the scheduler native entrypoints are no longer
treated as Fast React placeholders. `scheduler/index.native.js` and the native
development/production CJS files now assert the implemented native export
inventory, absence of placeholder metadata, native fallback task shape,
`requestPaint`/`shouldYield` behavior, cancellation tombstones, and the
published native `Error("Not implemented.")` throwers.

The post-task smoke behavior from worker 125 remains intact.

## Changed Files

- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-127-scheduler-native-smoke-integration.md`

Untracked session artifacts were left out of the diff:

- `.worker-logs/`

## Commands Run

```sh
node --check tests/smoke/import-entrypoints.mjs
node tests/smoke/import-entrypoints.mjs
node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs
npm run check:js
git diff --check
scoped changed-path check excluding .worker-logs/
```

## Verification Results

Passed:

```sh
node --check tests/smoke/import-entrypoints.mjs
node tests/smoke/import-entrypoints.mjs
node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs
npm run check:js
git diff --check
scoped changed-path check excluding .worker-logs/
```

`npm run check:js` passed with 415 conformance tests.

## Risks And Follow-Up

- The native smoke assertions cover package import inventory and representative
  native fallback behavior only. React Native host integration remains a
  separate surface.
- Broad `scheduler@0.27.0` compatibility remains intentionally unclaimed by
  the native oracle.
