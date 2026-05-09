You are worker-011-core-element-model for the Fast React project.

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-001-architecture.md`, `worker-progress/worker-004-api-inventory.md`, and `worker-progress/worker-010-initial-scaffold.md` first. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
Call `create_goal` for this worker task. If you create subtasks, call `create_goal` again for each subtask with context about the parent task. Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Implement the first Rust core data model primitives needed for React 19.2.6 element compatibility. Focus only on renderer-agnostic core types: compatibility targets, React symbol tags, keys/refs as explicit data, placeholder element records, and loud unimplemented behavior for semantics that still require JS conformance.

Write scope:
Only modify:

- `crates/fast-react-core/**`
- `worker-progress/worker-011-core-element-model.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify root manifests or package files.
- Do not implement JS bindings, renderer behavior, hooks, fiber, scheduler, or DOM behavior.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Before finishing, review quality, maintainability, performance, and security implications.

Verification requirements:
- Run `cargo fmt --all --check`.
- Run `cargo test -p fast-react-core --all-features`.
- Run `cargo test --workspace --all-features` if feasible. If not, document why.

Required report sections:
- Objective
- Sources and commands used
- Files changed
- Core model implementation summary
- Verification results
- Deviations from accepted reports, if any
- Risks and root causes
- Proposed follow-up implementation tasks
- Completion checklist
- Handoff summary
