You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Refresh benchmark manifest accepted-gate metadata after the 233-262 merge batch, tying new private test-renderer, DOM, root, and reconciler gates to blocked benchmark readiness without adding timing runners, result artifacts, speed claims, or compatibility claims.

Write scope:
- `tests/benchmarks/manifests/*.json`
- `tests/benchmarks/src/benchmark-gate.mjs`
- `tests/benchmarks/test/benchmark-gate.test.mjs`
- `worker-progress/worker-289-benchmark-accepted-gates-refresh.md`

Context to inspect:
Workers 162, 229, 257, 233-262.

Constraints:
- Keep all readiness blocked unless conformance is green and admitted.
- No timing artifacts or result JSON.
- No speed claims.

Verification:
- `npm run check:benchmarks`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
