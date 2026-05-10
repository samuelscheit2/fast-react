# Worker 147: Suspense/Offscreen Refresh

You are worker 147 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-147-suspense-offscreen-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for Suspense, Offscreen, retry lanes, hidden
updates, pinged/suspended root lanes, and what must remain out of scope for the
minimal root render milestone.

## Write Scope

Only write `worker-progress/worker-147-suspense-offscreen-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- core root lane reports and source
- `worker-progress/worker-124-host-root-update-queue.md`
- `worker-progress/worker-128-reconciler-root-scheduler-foundation.md`
- React 19.2.6 Suspense/Offscreen/root lane source as needed

## Required Report

List root-lane and scheduler hooks that already exist, blockers for real
Suspense/Offscreen, and tests needed before those features can enter source
workers.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
