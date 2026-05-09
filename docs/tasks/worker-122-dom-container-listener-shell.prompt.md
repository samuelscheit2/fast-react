You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless the orchestrator explicitly asks you to inspect it; it is for the orchestrator role, not workers.
If you need to create subtasks, use `/goal` (create_goal) again for each subtask, but with all context about the parent task.
Do not call update_goal(status: "complete") until the whole worker task is complete.
When reference source is useful, inspect the local React source clone at `/Users/user/Developer/Developer/react-reference` (`facebook/react` tag `v19.2.6`, commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`). Use npm tarball/runtime oracles for published package behavior claims.

Objective:
Implement the React DOM container marker and root listener shell as internal source modules, without removing public React DOM root placeholders or implementing event dispatch. This should give future `createRoot`/`hydrateRoot` facade work a real, tested internal layer for container validation, root marker ownership, listener marker dedupe, owner-document `selectionchange` registration, and root/portal listener installation shell behavior.

Write scope:
- `packages/react-dom/src/client/dom-container.js`
- `packages/react-dom/src/client/root-markers.js`
- `packages/react-dom/src/events/root-listeners.js`
- `packages/react-dom/src/events/listener-registry.js`
- `packages/react-dom/src/events/event-names.js`
- focused new tests under `tests/smoke/react-dom-container-listener-shell.mjs`
- `worker-progress/worker-122-dom-container-listener-shell.md`

Do not modify:
- `packages/react-dom/client.js`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/placeholder-utils.js`
- `tests/smoke/import-entrypoints.mjs`
- scheduler mock files
- conformance oracle artifacts unless you prove a focused source test genuinely needs a new local-only fixture

Context to read after goal setup:
- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-088-dom-container-root-markers-oracle.md`
- `worker-progress/worker-089-dom-root-listener-installation-oracle.md`
- `worker-progress/worker-090-dom-node-map-public-instance-plan.md`
- `worker-progress/worker-092-react-dom-create-root-facade-plan.md`
- `worker-progress/worker-094-root-unmount-flushsync-plan.md`
- `worker-progress/worker-098-dom-event-plugin-extraction-plan.md`
- `worker-progress/worker-116-dom-event-plugin-implementation-plan.md`
- `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`

Constraints:
- Do not modify files outside your write scope.
- Do not implement public `createRoot`, `hydrateRoot`, `root.render`, `root.unmount`, `flushSync`, synthetic event dispatch, controlled form restore, hydration replay, portals, DOM mutation commit, or reconciler integration in this slice.
- Keep the implementation internally consumable by future facade/event workers: explicit validation errors, no dependency on raw fibers, no public compatibility claim.
- Root listener installation should be a shell/dedupe layer only. It may register event listeners and owner-document `selectionchange`, but handlers should not synthesize or dispatch React events.
- Use worker 088 and 089 oracle reports as behavior anchors for marker/listener side effects. If you need exact event-name lists or option behavior, verify against checked oracle JSON or the local React reference source.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses. Summarize delegated checks and results in your report.
- Worker-internal nested agents are allowed even if they make the aggregate agent/process count exceed the orchestrator's 30 top-level tmux worker limit.
- Find root causes; do not patch symptoms.
- Introduce breaking changes if necessary, but document why.
- Regenerable generated artifacts such as `node_modules/`, `target/`, and root `Cargo.lock` do not need cleanup merely because they exist. Remove or document them only if they are stale, ambiguous, or would pollute your scoped final diff/status.
- Record progress in `worker-progress/worker-122-dom-container-listener-shell.md`.
- After goal setup, call `get_goal` if available and record the active goal status/objective; if unavailable, state that explicitly.
- Before finishing, review your work for quality, maintainability, performance, and security.

Verification required:
- `node --check packages/react-dom/src/client/dom-container.js`
- `node --check packages/react-dom/src/client/root-markers.js`
- `node --check packages/react-dom/src/events/root-listeners.js`
- `node --check packages/react-dom/src/events/listener-registry.js`
- `node --check packages/react-dom/src/events/event-names.js`
- `node tests/smoke/react-dom-container-listener-shell.mjs`
- `node --test tests/conformance/test/react-dom-container-root-markers-oracle.test.mjs`
- `node --test tests/conformance/test/react-dom-root-listener-installation-oracle.test.mjs`
- `npm run test:smoke`
- `git diff --check`
- scoped path, conflict-marker, and trailing-whitespace checks over all changed files

Handoff requirements:
- Summarize implementation.
- List changed files.
- List commands run.
- Include goal evidence.
- Include a prompt-to-artifact checklist.
- List unresolved risks or follow-up tasks.
