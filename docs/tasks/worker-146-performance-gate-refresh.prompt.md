# Worker 146: Performance Gate Refresh

You are worker 146 in a real tmux Codex process.

First action: call `create_goal`, then `get_goal` if available and record
evidence in `worker-progress/worker-146-performance-gate-refresh.md`.

Read `WORKER_BRIEF.md` after goal setup. Do not read `ORCHESTRATOR.md`.

## Objective

Produce a report-only refresh for performance and profiling gates needed to
show Fast React is faster without compromising compatibility evidence.

## Write Scope

Only write `worker-progress/worker-146-performance-gate-refresh.md`.
Do not modify source, tests, package files, prompts, master docs, or lockfiles.

## Context To Inspect

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-009-benchmark-strategy.md`
- `worker-progress/worker-074-benchmark-react-dom-baseline-plan.md`
- `Cargo.toml`
- `package.json`
- current test/conformance scripts

## Required Report

Define first benchmark harnesses, comparison baselines, profiler hooks,
measurement pitfalls, and merge gates. Keep benchmark claims separate from
compatibility claims.

Run `git diff --check` and a scoped changed-path check for the single allowed
report file. Call `update_goal(status: "complete")` only when done.
