You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Implement the first Rust lane model primitives for React 19.2.6 in `fast-react-core`, based on the accepted worker-007 scheduler/fiber findings and direct React 19.2.6 source evidence.

Write scope:
`crates/fast-react-core/**`, `worker-progress/worker-030-core-lane-model.md`

Constraints:
- Do not modify files outside your write scope.
- Do not overlap with other workers.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-030-core-lane-model.md`.
- Before finishing, review your work for quality, maintainability, performance, and security.

Implementation guidance:
- Add `Lane` and `Lanes` as `#[repr(transparent)]` `u32` newtypes or an equally defensible Rust shape. Do not model lanes as a flat priority enum.
- Encode React 19.2.6 lane constants and group masks from source evidence, including sync, hydration, input continuous, default, gesture, transition, retry, selective hydration, idle, offscreen, and deferred lanes.
- Add allocation-free helpers for merge, remove, subset/intersection, highest-priority lane, index conversion, empty/non-empty checks, and relevant group checks.
- Add a fixed `LaneMap<T>` or equivalent `[T; 31]` wrapper for root lane bookkeeping. Keep it simple and tested.
- Keep scheduling, fibers, update queues, hooks, root scheduling, JS public scheduler APIs, and reconciler behavior out of scope.
- Export the new primitives from `fast-react-core` only if tests or downstream crates need them.

Verification:
- Run `cargo fmt --all --check`.
- Run `cargo test -p fast-react-core --all-features`.
- Run any additional focused checks needed to prove the lane constants and helpers are correct.

Handoff requirements:
- Summarize implementation and source evidence.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
