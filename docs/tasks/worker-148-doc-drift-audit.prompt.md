# Worker 148: Coordination Doc Drift Audit

You are worker 148 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-148-doc-drift-audit.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only audit of coordination doc drift after workers 118-139
and the current parallel queue. Identify stale current/future work in progress
history, accepted history that still lives in the plan, duplicated policy, and
cleanup recommendations.

## Write Scope

Only write `worker-progress/worker-148-doc-drift-audit.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- recent worker progress reports 118-139 if present
- `docs/tasks/*.prompt.md` for recent workers as needed

## Required Report

Provide a prompt-to-artifact checklist for doc ownership rules, concrete stale
lines or sections, recommended edits, and risks. This is audit-only; do not
edit the docs.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
