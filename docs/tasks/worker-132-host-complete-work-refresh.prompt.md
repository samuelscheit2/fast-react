# Worker 132: Host Complete-Work Refresh

You are worker 132 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-132-host-complete-work-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for the first host component/text render and
complete-work slice that should follow HostRoot render-phase processing.

## Write Scope

Only write `worker-progress/worker-132-host-complete-work-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `worker-progress/worker-091-dom-mutation-minimum-plan.md`
- `worker-progress/worker-110-dom-text-content-host-plan.md`
- `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`
- `worker-progress/worker-128-reconciler-root-scheduler-foundation.md`
- `docs/tasks/worker-129-host-root-render-phase-foundation.prompt.md`
- React 19.2.6 `ReactFiberBeginWork.js` and `ReactFiberCompleteWork.js`
- current core fiber/topology and host-token source

## Required Report

Identify the narrowest generic host component/text WIP/complete-work source
slice, exact file scope, host-token needs, tests, and conflict boundaries. Do
not claim DOM attributes, events, hydration, resources, or public facades.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
