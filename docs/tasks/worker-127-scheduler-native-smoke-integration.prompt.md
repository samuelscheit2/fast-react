# Worker 127: Scheduler Native Smoke Integration

You are worker 127 in a real tmux Codex process.

First action before research, file reads, implementation, or verification:
call `create_goal` for this objective. Immediately after goal setup, call
`get_goal` if available and record the active status/objective in
`worker-progress/worker-127-scheduler-native-smoke-integration.md`. If goal
tools are unavailable, say so explicitly in the report.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

You are not alone in this codebase. Other workers and the orchestrator may have
made changes; do not revert edits you did not make. Work with the current
branch state.

## Objective

Finish native scheduler smoke integration for worker 126's scheduler native
entrypoint implementation.

The integration branch already contains worker 126's committed native
implementation. The broad JS gate currently needs
`tests/smoke/import-entrypoints.mjs` to stop asserting the old native scheduler
placeholder/root-like inventory and instead assert the behavior now proven by
the native-entry oracle.

## Write Scope

Allowed:

- `tests/smoke/import-entrypoints.mjs`
- `worker-progress/worker-127-scheduler-native-smoke-integration.md`

Do not edit scheduler implementation files, oracle artifacts, package manifests,
Rust crates, root scheduler files, mock scheduler files, post-task scheduler
files, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-126-scheduler-native-entry-implementation.md`
- `tests/smoke/import-entrypoints.mjs`
- `tests/conformance/test/scheduler-native-entry-oracle.test.mjs`
- `tests/conformance/oracles/scheduler-0.27.0-native-entry-oracle.json`
- `packages/scheduler/cjs/scheduler.native.development.js`
- `packages/scheduler/cjs/scheduler.native.production.js`
- `/Users/user/Developer/Developer/react-reference/packages/scheduler/npm/index.native.js`
- `/Users/user/Developer/Developer/react-reference/packages/scheduler/src/forks/SchedulerNative.js`

Use the React reference source for readable behavior research, but use the
checked native oracle and local runtime probes for published behavior claims.

## Required Work

1. Find the exact stale smoke assertion for `scheduler/index.native.js`.
2. Update the smoke harness narrowly so it accepts the implemented native
   scheduler entrypoint behavior and still rejects unintended inventory drift.
3. Keep post-task smoke behavior from worker 125 intact.
4. Run the required checks below.
5. Write a concise report with goal evidence, changed files, commands, results,
   risks, and recommended follow-ups.

You may spawn managed subagents, explorers, or nested agents for hypothesis
testing. Nested agents do not count against the top-level worker cap. Summarize
any delegated findings that affect your conclusion.

## Required Verification

Run:

```sh
node --check tests/smoke/import-entrypoints.mjs
node tests/smoke/import-entrypoints.mjs
node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs
npm run check:js
git diff --check
```

Also run a scoped changed-path check proving the only changed files are the
smoke harness and worker report, excluding `.worker-logs/`.

Before final handoff, call `update_goal(status: "complete")` only when the
whole assigned task is complete.
