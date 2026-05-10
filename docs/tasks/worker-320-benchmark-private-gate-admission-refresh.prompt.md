You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Refresh benchmark manifests after the accepted private root, DOM mutation/text, test-renderer serialization, React hook/act, and native bridge gates. Admit only diagnostic/private rows that are proven by current conformance gates and keep comparable timing blocked.

Write scope:
- `tests/benchmarks/manifests/*.json`
- `tests/benchmarks/src/benchmark-gate.mjs`
- `tests/benchmarks/test/benchmark-gate.test.mjs`
- `worker-progress/worker-320-benchmark-private-gate-admission-refresh.md`

Context to inspect:
Workers 162, 257, 289, and accepted workers 263-292.

Constraints:
- No green timing claims.
- Accepted gates with blocked compatibility must not become comparable benchmarks.
- Keep manifest schema strict and deterministic.

Verification:
- `npm run check:benchmarks`
- `npm run check:js`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
