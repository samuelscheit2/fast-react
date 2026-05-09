You are worker-017-runtime-inventory-generation for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, `worker-progress/worker-002-conformance.md`, `worker-progress/worker-004-api-inventory.md`, `worker-progress/worker-013-conformance-inventory-tooling.md`, and `worker-progress/worker-014-react-entrypoint-placeholders.md`. Do not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, use `/goal` (`create_goal`) again for each subtask with context about the parent task. Do not call `update_goal(status: "complete")` until the whole worker task is complete.

Objective:
Replace the placeholder-only conformance inventory with deterministic runtime/package inventory generation for the pinned React 19.2.6 targets. The implementation must generate evidence from real package artifacts and must keep false/unknown conformance claims explicit.

Write scope:
Only modify:

- `tests/conformance/**`
- `worker-progress/worker-017-runtime-inventory-generation.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify root manifests or lockfiles.
- Do not add dependencies that require root manifest or lockfile changes.
- Do not implement the full dual-run oracle harness yet.
- Do not claim Fast React behavior compatibility from inventory data alone.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Before finishing, review quality, maintainability, performance, and security implications.

Implementation guidance:
- Prefer Node built-ins and npm CLI/package tarball data over new dependencies.
- Generate or refresh pinned inventory artifacts for `react@19.2.6` and `react-dom@19.2.6` package metadata, export maps, runtime keys for relevant entrypoints, and condition-specific resolution where feasible.
- Keep manual arrays and generated data clearly separated. If any inventory field remains manual, document why.
- Ensure tests fail if generated inventory claims real Fast React conformance before an oracle exists.

Verification requirements:
- Run `npm test --workspace @fast-react/conformance`.
- Run `npm run test:conformance`.
- Run `npm run check:js` if feasible. If not, document why.

Required report sections:
- Objective
- Sources and commands used
- Files changed
- Inventory generation implementation summary
- Generated inventory evidence and remaining manual fields
- Verification results
- Deviations from worker-002, worker-004, worker-013, or worker-014 recommendations, if any
- Risks and root causes
- Proposed follow-up implementation tasks
- Completion checklist
- Handoff summary
