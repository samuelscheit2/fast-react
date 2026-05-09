You are worker-020-element-object-conformance-probes for the Fast React project.

First action: call create_goal for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-001-architecture.md`, `worker-progress/worker-004-api-inventory.md`, `worker-progress/worker-011-core-element-model.md`, and `worker-progress/worker-014-react-entrypoint-placeholders.md`. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, call `create_goal` again for each subtask with context about the parent task. Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Produce an evidence-backed implementation plan for React 19.2.6 element object conformance before package behavior is changed. Focus on exact observable behavior for `createElement`, `cloneElement`, `jsx`, `jsxs`, and `jsxDEV`, including descriptors, enumerability, key/ref behavior, owner fields, dev/prod differences, and warning/freeze behavior.

Write scope:
Only modify:

- `worker-progress/worker-020-element-object-conformance-probes.md`

Constraints:
- Do not modify source files, package manifests, tests, or existing worker reports.
- Do not read `ORCHESTRATOR.md`.
- Use isolated temporary files or directories for probes if needed.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Find root causes; do not patch symptoms.
- Before finishing, review quality, maintainability, performance, and security implications.

Investigation requirements:
- Probe real `react@19.2.6` and relevant JSX runtime entrypoints using Node.
- Capture exact object keys, own property descriptors, symbols, frozen/sealed/extensible state, ref/key handling, and relevant differences between development and production entrypoints.
- Identify which behavior belongs in Rust core records, JS facade, N-API boundary, or future conformance oracle.
- Propose the smallest safe implementation worker that can make package behavior more real without hiding unsupported semantics.

Verification requirements:
- Record the exact Node/npm versions and commands used.
- Include enough probe source snippets or command descriptions for the results to be reproducible.
- If any probe cannot be run, document the blocker and the fallback evidence.

Required report sections:
- Objective
- Sources and commands used
- Probe methodology
- Observed React 19.2.6 element object behavior
- Mapping to Fast React implementation layers
- Recommended implementation sequence
- Risks and root causes
- Proposed follow-up implementation tasks
- Completion checklist
- Handoff summary
