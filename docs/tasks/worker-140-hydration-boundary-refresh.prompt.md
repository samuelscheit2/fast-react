# Worker 140: Hydration Boundary Refresh

You are worker 140 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-140-hydration-boundary-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for hydration boundaries around `hydrateRoot`,
dehydrated HostRoot state, event replay, and DOM markers. Keep the first real
root render path non-hydration unless evidence shows a safe narrow boundary.

## Write Scope

Only write `worker-progress/worker-140-hydration-boundary-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-043-react-dom-hydration-plan.md`
- `worker-progress/worker-049-react-dom-hydration-marker-oracle.md`
- `worker-progress/worker-095-hydrate-root-facade-plan.md`
- `worker-progress/worker-123-reconciler-fiber-root-host-root.md`
- current root config/fiber root source
- React 19.2.6 hydration source as needed

## Required Report

Define what hydration hooks or placeholders must exist before public
`hydrateRoot`, which files a future source worker may touch, and which
hydration claims remain explicitly unsupported.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
