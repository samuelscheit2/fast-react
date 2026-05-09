You are a worker for the Fast React project.

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, call create_goal again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Improve host-config capability diagnostics and tests so renderer capability sets are stable, inspectable, and harder to misuse before the reconciler depends on them.

Write scope:
`crates/fast-react-host-config/**`, `worker-progress/worker-031-host-capability-diagnostics.md`

Constraints:
- Do not modify files outside your write scope.
- Do not overlap with other workers.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-031-host-capability-diagnostics.md`.
- Before finishing, review your work for quality, maintainability, performance, and security.

Implementation guidance:
- Keep changes additive unless source evidence shows the existing shape is wrong.
- Add stable capability introspection for `HostCapabilitySet` such as an ordered supported-capability list, iterator, display/debug helper, or equivalent API that helps diagnostics without exposing renderer internals.
- Keep mutation-vs-persistence tree update mode validation exact: zero strategies is missing, both strategies is conflicting, exactly one is valid.
- Add tests covering all defined capability bits, stable ordering, display strings, unsupported-capability errors, and tree update mode diagnostics.
- Do not implement hydration, persistence, resources, scheduler, or renderer behavior in this worker.

Verification:
- Run `cargo fmt --all --check`.
- Run `cargo test -p fast-react-host-config --all-features`.
- Run `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`.

Handoff requirements:
- Summarize implementation and any API decisions.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
