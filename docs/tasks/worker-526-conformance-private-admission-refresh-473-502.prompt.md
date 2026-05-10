You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Refresh conformance private-admission manifests for the accepted 473-502 queue
so newly accepted diagnostics are represented in local gates while every public
compatibility claim remains blocked.

Write scope:
- `tests/conformance/src/**`
- `tests/conformance/test/**`
- conformance package scripts if needed
- `worker-progress/worker-526-conformance-private-admission-refresh-473-502.md`

Constraints:
- Do not change runtime source files unless a conformance guard proves an
  accepted private diagnostic is missing from a package surface.
- Do not unblock public compatibility rows.
- Keep changes focused and documented.

Verification:
- Run focused conformance gates touched.
- Run `npm run test:conformance -- --runInBand` if feasible.
- Run `npm run check:js` if feasible.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
