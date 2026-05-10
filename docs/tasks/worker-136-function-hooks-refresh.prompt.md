# Worker 136: Function Components And Hooks Refresh

You are worker 136 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-136-function-hooks-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for the first function component and hook queue
vertical slice, sequenced after the root HostRoot path is stable.

## Write Scope

Only write `worker-progress/worker-136-function-hooks-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-078-hook-effect-ring-plan.md`
- `worker-progress/worker-099-core-hook-state-queue-plan.md`
- `worker-progress/worker-100-reconciler-function-component-render-plan.md`
- `worker-progress/worker-112-core-hook-queue-implementation-plan.md`
- `worker-progress/worker-113-function-component-implementation-plan.md`
- current core fiber/effect flags source
- React 19.2.6 hook and begin-work source as needed

## Required Report

Split hook data structures, dispatcher/render, update queues, and effects into
mergeable source workers with exact boundaries and tests. Keep public React
hook facade compatibility claims out of scope unless proven by oracles.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
