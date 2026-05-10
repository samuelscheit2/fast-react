# Worker 135: React DOM Root Bridge Refresh

You are worker 135 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-135-react-dom-root-bridge-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for wiring `react-dom/client` root facade calls
to shared reconciler root/update/scheduler APIs once the internal root path is
ready.

## Write Scope

Only write `worker-progress/worker-135-react-dom-root-bridge-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-044-react-dom-client-roots-plan.md`
- `worker-progress/worker-092-react-dom-create-root-facade-plan.md`
- `worker-progress/worker-093-root-render-integration-plan.md`
- `worker-progress/worker-094-root-unmount-flushsync-plan.md`
- `worker-progress/worker-108-react-dom-root-facade-implementation-plan.md`
- accepted React DOM root/listener/container/oracle reports
- current `packages/react-dom/client.js`

## Required Report

Define facade sequencing, JS object shape boundaries, native/Rust binding
needs, container marker/listener interactions, tests, and hard unsupported
hydration boundaries.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
