You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Extend benchmark manifest readiness for the next root lifecycle admissions, tying blocked benchmark scenarios to the accepted root/render/test-renderer conformance gates without adding timing runners, result artifacts, speed claims, or compatibility claims.

Write scope:
- `tests/benchmarks/*`
- `worker-progress/worker-257-benchmark-root-lifecycle-admission-manifest.md`

Context to inspect:
Workers 074, 162, 163, 201, 229, 230, 240, 262.

Constraints:
- You are not alone in the codebase. This is manifest/gate work only.
- Do not add benchmark results or claim comparable timing.
- Keep readiness statuses blocked unless referenced conformance gates are green and admitted.

Verification:
- `npm run check:benchmarks`
- `npm run check:js`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
