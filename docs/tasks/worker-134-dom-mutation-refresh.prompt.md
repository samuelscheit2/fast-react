# Worker 134: DOM Mutation Adapter Refresh

You are worker 134 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-134-dom-mutation-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for the minimal DOM mutation adapter canary that
should follow generic reconciler commit and host component/text completion.

## Write Scope

Only write `worker-progress/worker-134-dom-mutation-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-040-dom-mutation-renderer-plan.md`
- `worker-progress/worker-091-dom-mutation-minimum-plan.md`
- `worker-progress/worker-105-dom-mutation-host-implementation-plan.md`
- `worker-progress/worker-110-dom-text-content-host-plan.md`
- DOM attribute/style/namespace/control oracle reports
- current React DOM package placeholders

## Required Report

Define the first DOM adapter source slice, what it must not claim, exact tests,
and how it will consume generic reconciler commit output without duplicating
scheduler or root facade behavior.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
