# Worker 141: Event Plugin And Node Map Refresh

You are worker 141 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-141-event-node-map-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for DOM event plugin extraction, host node maps,
public instance lookup, and host fiber token interactions.

## Write Scope

Only write `worker-progress/worker-141-event-node-map-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-041-dom-events-priority-plan.md`
- `worker-progress/worker-065-dom-event-delegation-oracle.md`
- `worker-progress/worker-090-dom-node-map-public-instance-plan.md`
- `worker-progress/worker-098-dom-event-plugin-extraction-plan.md`
- `worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- current host token and React DOM placeholder source

## Required Report

Sequence node-map and event extraction work after generic commit/DOM mutation
without leaking DOM nodes into core. Include exact source boundaries, tests,
and dependencies on host tokens and root container markers.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
