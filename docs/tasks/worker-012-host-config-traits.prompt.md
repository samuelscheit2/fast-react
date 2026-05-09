You are worker-012-host-config-traits for the Fast React project.

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-008-renderer-host-config.md`, and `worker-progress/worker-010-initial-scaffold.md`. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, call `create_goal` again for each subtask with context about the parent task. Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Implement the first host-config trait skeleton in Rust, based on the accepted capability-grouped renderer boundary. Keep it renderer-independent and explicit about unsupported capabilities.

Write scope:
Only modify:

- `crates/fast-react-host-config/**`
- `worker-progress/worker-012-host-config-traits.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify root manifests or other crates.
- Do not implement DOM, React Native, hydration, persistence, or reconciler behavior.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Before finishing, review quality, maintainability, performance, and security implications.

Verification requirements:
- Run `cargo fmt --all --check`.
- Run `cargo test -p fast-react-host-config --all-features`.
- Run `cargo test --workspace --all-features` if feasible. If not, document why.

Required report sections:
- Objective
- Sources and commands used
- Files changed
- Host-config implementation summary
- Verification results
- Deviations from worker-008 recommendation, if any
- Risks and root causes
- Proposed follow-up implementation tasks
- Completion checklist
- Handoff summary
