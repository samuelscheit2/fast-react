You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Implement public `scheduler@0.27.0` root package behavior against the checked scheduler root oracle, replacing the root placeholder operations while keeping variant/mock/native surfaces out of scope.

Write scope:
`packages/scheduler/**`
`tests/smoke/**`
`worker-progress/worker-045-scheduler-root-implementation.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify `tests/conformance/**`; workers 048, 049, 050, and 052 own conformance files in this tranche.
- Do not implement `scheduler/unstable_mock`, `scheduler/unstable_post_task`, native runtime delegation, React lanes, reconciler root scheduling, or React DOM integration.
- Preserve public package constants, task object shape, binary heap ordering, delayed work, cancellation tombstones, continuation callbacks, `didTimeout`, priority context, `shouldYield`, `requestPaint`, `forceFrameRate`, and Node host transport behavior from worker 038.
- Keep public Scheduler priorities separate from internal lane/event priorities.
- You may spawn nested agents if useful, but if usage-limit errors occur, continue from direct local evidence and do not block on nested agents.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist.
- Record progress in `worker-progress/worker-045-scheduler-root-implementation.md`.
- Before finishing, review quality, maintainability, performance, and security.

Verification:
- Run targeted scheduler smoke checks.
- Run `npm run check:js` if practical.
- Run scoped whitespace/path/conflict checks over changed files.

Handoff requirements:
- Summarize implementation and unsupported surfaces.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
