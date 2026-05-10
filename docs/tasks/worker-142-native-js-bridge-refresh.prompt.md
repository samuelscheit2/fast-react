# Worker 142: Native/JS Bridge Refresh

You are worker 142 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-142-native-js-bridge-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for the native/JS bridge needed for React,
React DOM, scheduler, and test-renderer facades to call Rust internals without
claiming unsupported behavior.

## Write Scope

Only write `worker-progress/worker-142-native-js-bridge-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `bindings/node/index.cjs`
- `bindings/node/index.mjs`
- `worker-progress/worker-015-native-loader-boundary.md`
- `worker-progress/worker-032-native-boundary-guardrails.md`
- `worker-progress/worker-096-native-root-boundary-plan.md`
- current package entrypoints

## Required Report

Define bridge surface slices, data ownership boundaries, error propagation,
test strategy, and which facades should stay placeholder-only until Rust root
behavior is proven.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
