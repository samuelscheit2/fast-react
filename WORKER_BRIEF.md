# Fast React Worker Brief

This file is for workers. `ORCHESTRATOR.md` is for the orchestrator role only.

## Project Mission

Fast React is an almost 1-to-1 Rust reimplementation of React intended to be faster than the JavaScript implementation while staying generic enough for `react-dom`, `react-native`, and other renderer-dependent libraries.

Current compatibility target checked on 2026-05-09:

- `react` 19.2.6
- `react-dom` 19.2.6
- `@types/react` 19.2.14

## Worker Rules

- Work only on your assigned objective.
- Modify only the files in your write scope.
- Record progress in your assigned `worker-progress/<worker-id>.md` file.
- You are already running as a real Codex process in a tmux worker session. You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work.
- If nested agents affect your conclusions, summarize what you delegated and how you used their results in your report.
- Plan and research before implementing.
- Find root causes; do not patch symptoms.
- Breaking changes are allowed when necessary, but document the reason and tradeoff.
- Question your own assumptions and decisions; change course when evidence shows a better path.
- Do not take over orchestration, worker assignment, merge policy, or project-wide planning unless your task explicitly asks for a recommendation.
- Do not call `update_goal(status: "complete")` for intermediate phases. If goal tools are available, call it only once after the whole worker task is complete.

## Handoff Requirements

Before finishing, review your work for quality, maintainability, performance, and security implications.

Your final report must include:

- Summary
- Changed files
- Commands run
- Evidence gathered
- Risks or blockers
- Recommended next tasks
