You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Tighten native binding guardrails so the current placeholder boundary proves package metadata, platform target planning, and "no accidental native load/build dependency" behavior more explicitly.

Write scope:
`bindings/node/**`, `crates/fast-react-napi/**`, `worker-progress/worker-032-native-boundary-guardrails.md`

Constraints:
- Do not modify files outside your write scope.
- Do not overlap with other workers.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-032-native-boundary-guardrails.md`.
- Before finishing, review your work for quality, maintainability, performance, and security.

Implementation guidance:
- Preserve the current policy: no real N-API dependency, no `.node` addon loading, no postinstall download path, and no direct V8/Node/libuv dependency.
- Add targeted JS and/or Rust tests that make the native target matrix, optional package names, Node-API floor, package engine metadata, and placeholder error shape harder to regress.
- If useful, factor shared metadata or add a deterministic manifest export, but do not introduce package-manager lockfile churn unless it is necessary and scoped.
- Keep React public API behavior, JS facade behavior, reconciler behavior, and package publishing workflows out of scope.

Verification:
- Run `npm run check --workspace @fast-react/native`.
- Run `cargo fmt --all --check`.
- Run `cargo test -p fast-react-napi --all-features`.
- Run any focused no-native-load guard you add.

Handoff requirements:
- Summarize implementation and guardrails.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
