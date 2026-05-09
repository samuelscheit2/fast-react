You are worker-018-test-renderer-mutation-host for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-008-renderer-host-config.md`, `worker-progress/worker-010-initial-scaffold.md`, and `worker-progress/worker-012-host-config-traits.md`. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, use `/goal` (`create_goal`) again for each subtask with context about the parent task. Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Implement a minimal in-memory mutation test renderer that uses the canonical host-config traits from `fast-react-host-config`. This should prove the host boundary is implementable without DOM/native behavior and without relying on the legacy `HostConfig` shim.

Write scope:
Only modify:

- `crates/fast-react-test-renderer/**`
- `worker-progress/worker-018-test-renderer-mutation-host.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify root manifests or other crates.
- Do not implement real reconciliation, hooks, DOM, React Native, hydration, or persistence behavior.
- Do not change `fast-react-host-config`; if the canonical traits are insufficient, document the exact blocker and propose the smallest follow-up.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Before finishing, review quality, maintainability, performance, and security implications.

Implementation guidance:
- Keep host handles opaque and renderer-owned.
- Start with mutation-only capability and explicit unsupported errors for hydration, persistence, resources, singletons, and view transitions.
- Add unit tests proving capability reporting, basic in-memory instance/text creation, append/insert/remove/clear operations, and structured unsupported capability behavior.

Verification requirements:
- Run `cargo fmt --all --check`.
- Run `cargo test -p fast-react-test-renderer --all-features`.
- Run `cargo test --workspace --all-features` if feasible. If not, document why.

Required report sections:
- Objective
- Sources and commands used
- Files changed
- Test renderer implementation summary
- Verification results
- Deviations from worker-008 or worker-012 recommendations, if any
- Risks and root causes
- Proposed follow-up implementation tasks
- Completion checklist
- Handoff summary
