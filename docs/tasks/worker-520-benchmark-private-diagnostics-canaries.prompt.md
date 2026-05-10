You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add benchmark canaries for accepted private diagnostics from the 480-492 batch
across React DOM root bridge, resource/form/controlled gates, and
react-test-renderer private surfaces without claiming public performance or
compatibility.

Write scope:
- benchmark files under `benchmarks/` or `tests/benchmarks/`
- relevant benchmark conformance tests/scripts
- `worker-progress/worker-520-benchmark-private-diagnostics-canaries.md`

Constraints:
- Benchmark canaries must stay deterministic and metadata-only.
- Do not introduce flaky timers or performance thresholds.
- Do not claim Fast React is faster based on these canaries.

Verification:
- Run focused benchmark checks.
- Run package/import smoke if benchmark inventory changes.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
