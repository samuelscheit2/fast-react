# Worker 139: Passive Effects And Refs Refresh

You are worker 139 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-139-passive-ref-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for passive effects, layout effects, insertion
effects, and ref lifecycle sequencing after minimal commit begins landing.

## Write Scope

Only write `worker-progress/worker-139-passive-ref-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-066-dom-ref-callback-oracle.md`
- `worker-progress/worker-071-core-fiber-flags-effect-plan.md`
- `worker-progress/worker-078-hook-effect-ring-plan.md`
- `worker-progress/worker-082-reconciler-commit-ordering-plan.md`
- `worker-progress/worker-109-reconciler-commit-minimum-implementation-plan.md`
- current core fiber flags and hook effect flags source
- React 19.2.6 commit/effect source as needed

## Required Report

Define source slices and tests for effect flags/rings, ref attach/detach,
passive scheduling, layout ordering, and host token interactions. Keep JS
callback execution and full hook compatibility scoped behind explicit gates.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
