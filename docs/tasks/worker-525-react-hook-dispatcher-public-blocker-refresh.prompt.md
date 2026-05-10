You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Refresh React package hook dispatcher public-blocker gates for accepted private
`useMemo`, `useEffect`, `useCallback`, `useState`, and context diagnostics so
public hooks remain blocked without a marked private dispatcher.

Write scope:
- `packages/react/*`
- `tests/conformance/test/react-*-hook*.mjs`
- `tests/smoke/import-entrypoints.mjs` only if guard inventory changes
- `worker-progress/worker-525-react-hook-dispatcher-public-blocker-refresh.md`

Constraints:
- Do not make public hooks compatible.
- Do not change public React export keys.
- Keep private dispatcher markers explicit.

Verification:
- Run focused React hook dispatcher conformance.
- Run React workspace check/import smoke.
- Run `npm run check:js` if relevant and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
