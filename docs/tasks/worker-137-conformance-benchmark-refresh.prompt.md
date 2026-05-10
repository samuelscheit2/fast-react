# Worker 137: Conformance And Benchmark Gate Refresh

You are worker 137 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-137-conformance-benchmark-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for the dual-run conformance and benchmark gates
needed before claiming any root render/update/unmount compatibility.

## Write Scope

Only write `worker-progress/worker-137-conformance-benchmark-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-074-benchmark-react-dom-baseline-plan.md`
- `worker-progress/worker-106-root-render-e2e-test-plan.md`
- `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`
- existing conformance root render/test-renderer/scheduler oracle files
- `package.json` and conformance package scripts

## Required Report

Define the first root-render dual-run gate, exact fixtures, benchmark baseline,
CI/check commands, and what evidence is enough or not enough for compatibility
claims.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
