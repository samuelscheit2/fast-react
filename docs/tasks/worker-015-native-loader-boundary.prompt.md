You are worker-015-native-loader-boundary for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-006-binding-strategy.md`, and `worker-progress/worker-010-initial-scaffold.md`. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, use `/goal` (`create_goal`) again for each subtask with context about the parent task. Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Improve the native binding loader and Rust N-API boundary placeholders without adding real N-API dependencies yet. Focus on clear package-level failure behavior, future platform package shape, Rust boundary errors, and tests that keep native behavior loudly unimplemented.

Write scope:
Only modify:

- `bindings/node/**`
- `crates/fast-react-napi/**`
- `worker-progress/worker-015-native-loader-boundary.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify root manifests or lockfiles.
- Do not add N-API dependencies yet.
- Do not implement real native binding behavior.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Before finishing, review quality, maintainability, performance, and security implications.

Verification requirements:
- Run `cargo fmt --all --check`.
- Run `cargo test -p fast-react-napi --all-features`.
- Run `node -e "require('./bindings/node/index.cjs')"`.
- Run an ESM import check for `bindings/node/index.mjs`.
- Run `npm run check` if feasible. If not, document why.

Required report sections:
- Objective
- Sources and commands used
- Files changed
- Native loader implementation summary
- Verification results
- Deviations from worker-006 recommendation, if any
- Risks and root causes
- Proposed follow-up implementation tasks
- Completion checklist
- Handoff summary
