# Worker 143: Resource/Form Boundary Refresh

You are worker 143 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-143-resource-form-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for DOM resources, form actions, controlled
inputs, singletons, and related boundaries so they do not leak into the first
root render milestone.

## Write Scope

Only write `worker-progress/worker-143-resource-form-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-059-react-dom-resource-hints-oracle.md`
- `worker-progress/worker-060-react-dom-form-actions-oracle.md`
- `worker-progress/worker-064-dom-controlled-input-oracle.md`
- `worker-progress/worker-105-dom-mutation-host-implementation-plan.md`
- current React DOM package placeholders

## Required Report

Mark which resource/form/control behavior is out of scope for minimal root
render, what adapter hooks should be reserved, and what conformance gates must
exist before enabling each surface.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
