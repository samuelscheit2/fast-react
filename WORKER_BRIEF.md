# Fast React Worker Brief

This file is for workers. `ORCHESTRATOR.md` is for the orchestrator role only.

## Mission And Targets

Fast React is an almost 1-to-1 Rust reimplementation of React intended to be
faster than the JavaScript implementation while staying generic enough for
`react-dom`, `react-native`, and other renderer-dependent libraries.

Current compatibility target:

- `react` 19.2.6
- `react-dom` 19.2.6
- `@types/react` 19.2.14

Local React source reference clone:

- `/Users/user/Developer/Developer/react-reference`
- Upstream `facebook/react` tag `v19.2.6`
- Commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`

Use the clone for readable source-level investigations of React internals,
React DOM, Scheduler, and react-test-renderer. Use npm tarball/runtime oracles
for published package behavior and exact runtime output.

## Worker Rules

- Work only on your assigned objective and write scope.
- Your files may overlap with other active workers when the orchestrator chose
  parallelism. Do not revert or overwrite other workers; make your change
  internally coherent and document overlap risks for the orchestrator.
- Record progress in `worker-progress/<worker-id>.md`.
- You are running as a managed Codex subagent launched by the orchestrator.
- Use the assigned git worktree path from your prompt for all reads (except for the react repo), edits, and
  verification commands. Do not edit the root checkout or another worker's
  worktree unless the prompt explicitly assigns that location.
- The orchestrator monitors your lifecycle through subagent status, progress
  messages, and your `worker-progress/<worker-id>.md` report. There is no tmux
  pane, `.codex.log`, `.exitcode`, or numeric process status for subagent
  workers.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel
  agent tools inside this worker when useful for hypothesis testing or
  verification. Summarize delegated checks that affect your conclusions.
- Worker-internal nested agents do not count against the orchestrator's
  30-top-level-worker cap.
- Plan and research before implementing.
- Find root causes; do not patch symptoms.
- Breaking changes are allowed when necessary, but document the reason and
  tradeoff.
- Regenerable artifacts such as `node_modules/`, `target/`, and root
  `Cargo.lock` do not need cleanup merely because they exist. Remove or
  document them only if stale, ambiguous, or diff-polluting.
- Do not take over orchestration, worker assignment, merge policy, or
  project-wide planning unless your task explicitly asks for a recommendation.
- Call `update_goal(status: "complete")` only after the whole assigned worker
  task is complete.

## Handoff Requirements

Before finishing, review your work for quality, maintainability, performance,
and security implications.

Your final report must include:

- Summary
- Changed files
- Commands run
- Evidence gathered
- Risks or blockers
- Recommended next tasks
