# Worker 145: Package Surface Refresh

You are worker 145 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-145-package-surface-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh of React, React DOM, scheduler, and future
test-renderer package export/type surfaces that may be affected by root render
milestone work.

## Write Scope

Only write `worker-progress/worker-145-package-surface-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- runtime inventory and type inventory reports
- `packages/react/package.json`
- `packages/react-dom/package.json`
- `packages/scheduler/package.json`
- `tests/conformance/inventory/**`
- relevant export oracle reports

## Required Report

Identify export/type gaps, package entrypoint risks, and a source-worker order
that avoids claiming root/test-renderer surfaces before internals exist.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
