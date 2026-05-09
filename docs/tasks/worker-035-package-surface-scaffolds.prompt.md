You are a worker for the Fast React project.

Read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md first. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
Call create_goal for this worker task. If you need to create subtasks, call create_goal again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Add loud-placeholder package scaffolds for the public React DOM 19.2.6 and scheduler 0.27.0 package surfaces. This worker owns the shared package/smoke/root metadata scope so the separate oracle workers can run in parallel without conflicts.

Write scope:
`packages/react-dom/**`
`packages/scheduler/**`
`tests/smoke/**`
optional root `package.json` and `package-lock.json` only if package metadata or workspace lock sync requires it
`worker-progress/worker-035-package-surface-scaffolds.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify `tests/conformance/**`; workers 036-039 own those paths.
- Do not implement DOM rendering, scheduler runtime behavior, Fizz/server rendering, hydration, event handling, resources, forms, or portals.
- Scaffolds must fail loudly and deterministically for unsupported behavior.
- Match package subpaths and resolver behavior from worker 033 and worker 034 reports.
- React DOM and scheduler scaffolds are combined here only because root package metadata, package lock, and smoke entrypoint wiring would otherwise conflict across two workers.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-035-package-surface-scaffolds.md`.
- Before finishing, review your work for quality, maintainability, performance, and security.

Implementation guidance:
- Add `@fast-react/react-dom` with exact public npm subpaths from React DOM 19.2.6, including `react-server` throwing branches where applicable.
- Add `scheduler` package surface with root, `unstable_mock`, `unstable_post_task`, native entrypoint, package metadata, and loud unsupported placeholders.
- Preserve current `@fast-react/react` behavior.
- Smoke tests should verify import/require resolution and unsupported errors, not behavior that belongs to future workers.

Verification:
- Run targeted smoke/package checks that cover the new package surfaces.
- Run `npm run check:js` if practical after the targeted checks.
- Run scoped whitespace/diff checks for changed files.

Handoff requirements:
- Summarize implementation and intentional unsupported surfaces.
- List changed files.
- List commands run.
- List unresolved risks or follow-up tasks.
