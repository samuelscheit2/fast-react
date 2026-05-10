# Worker 138: Root Error And Callback Refresh

You are worker 138 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-138-root-error-callback-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for root update callbacks, recoverable/uncaught
root errors, and error-surface sequencing across reconciler, React DOM, and
test renderer.

## Write Scope

Only write `worker-progress/worker-138-root-error-callback-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-087-react-test-renderer-error-surface-oracle.md`
- `worker-progress/worker-092-react-dom-create-root-facade-plan.md`
- `worker-progress/worker-109-reconciler-commit-minimum-implementation-plan.md`
- `worker-progress/worker-124-host-root-update-queue.md`
- React 19.2.6 error handling and root callback source as needed

## Required Report

Separate callback collection/invocation, root options, error recovery, facade
warnings, and test renderer surfaces into source slices with clear gates and
non-overlap boundaries.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
