You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.

Objective:
Implement the lowest-risk `react-dom` root, profiling, and test-utils export behavior against the checked React DOM export oracle, replacing only placeholder behavior that can be made accurate without DOM rendering, client roots, hydration, events, or Fizz.

Write scope:
`packages/react-dom/index.js`
`packages/react-dom/profiling.js`
`packages/react-dom/test-utils.js`
`packages/react-dom/placeholder-utils.js`
`tests/smoke/react-dom-root-exports.mjs`
`worker-progress/worker-054-react-dom-root-export-implementation.md`

Constraints:
- Do not modify files outside your write scope.
- Do not modify package metadata, lockfiles, `tests/conformance/**`, `packages/react-dom/client.js`, server/static entrypoints, or react-server entrypoints.
- Preserve loud unsupported behavior for DOM rendering, client roots, hydration, portals if unsupported, server/static rendering, resource dispatch if unsupported, and form/reset features if unsupported.
- Prefer exact public export/descriptors/version behavior from worker 036 where it is implementable without deeper renderer machinery.
- `unstable_batchedUpdates` is a low-risk passthrough candidate; verify against the checked oracle before changing behavior.
- `test-utils.act` may delegate to React's public `act` only if that matches React DOM 19.2.6 behavior; otherwise keep it loudly unsupported and document why.
- You may spawn nested agents if useful, but if usage-limit errors occur, continue from direct local evidence and do not block on nested agents.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist.
- Record progress in `worker-progress/worker-054-react-dom-root-export-implementation.md`.
- Before finishing, review quality, maintainability, performance, and security.

Verification:
- Run the new smoke test directly.
- Run `npm run check:js` if practical.
- Run scoped whitespace/path/conflict checks over changed files.

Handoff requirements:
- Summarize implemented exports and intentionally unsupported exports.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
