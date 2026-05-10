# Worker 131: Sync Flush And Act Integration Refresh

You are worker 131 in a real tmux Codex process.

First action: call `create_goal` for this objective, then `get_goal` if
available and record evidence in
`worker-progress/worker-131-sync-flush-act-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for sync flushing and `act` integration now that
the root scheduler foundation is accepted and HostRoot render-phase work is
active in worker 129.

## Write Scope

Only write `worker-progress/worker-131-sync-flush-act-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-081-reconciler-root-scheduler-act-plan.md`
- `worker-progress/worker-111-reconciler-sync-flush-act-plan.md`
- `worker-progress/worker-128-reconciler-root-scheduler-foundation.md`
- `docs/tasks/worker-129-host-root-render-phase-foundation.prompt.md`
- React 19.2.6 `ReactFiberRootScheduler.js` and `ReactAct.js`
- current `root_scheduler.rs` and scheduler bridge source

## Required Report

Define mergeable source slices for cross-root sync flushing, execution-context
guards, act queue routing, fake callback nodes, and facade call points. Keep
public React DOM/test-renderer behavior separate from reconciler internals.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
