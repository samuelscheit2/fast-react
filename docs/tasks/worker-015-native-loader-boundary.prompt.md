You are worker-015-native-loader-boundary for the Fast React project.

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-006-binding-strategy.md`, and `worker-progress/worker-010-initial-scaffold.md` first. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
Call `create_goal` for this worker task. If you create subtasks, call `create_goal` again for each subtask with context about the parent task. Do not call `update_goal(status: "complete")` until the whole worker task is complete.

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
