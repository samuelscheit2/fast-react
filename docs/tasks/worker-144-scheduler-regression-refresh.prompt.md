# Worker 144: Scheduler Regression Refresh

You are worker 144 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-144-scheduler-regression-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only audit of public scheduler package regression coverage
after workers 120, 125, 126, and 127, and separate it from reconciler-internal
root scheduling.

## Write Scope

Only write `worker-progress/worker-144-scheduler-regression-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- scheduler oracle/progress reports 038, 039, 052, 068, 069, 120, 125, 126, 127
- `packages/scheduler/**`
- scheduler conformance tests and smoke import tests

## Required Report

List covered and uncovered scheduler package surfaces, exact commands, risks,
and which gaps matter for root render work versus public Scheduler API
compatibility.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
