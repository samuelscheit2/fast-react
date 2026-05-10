You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Audit and simplify the worker launcher now that only `scripts/run-worker.sh`
remains. Improve crash/exit diagnostics and quoting robustness without adding a
second launcher path or changing the active worker contract.

Write scope:
- `scripts/run-worker.sh`
- `ORCHESTRATOR.md` and `WORKER_BRIEF.md` only if policy text must match the
  launcher behavior
- focused shell smoke/checks if present
- `worker-progress/worker-527-worker-launcher-simplification-diagnostics.md`

Constraints:
- Do not disrupt currently running workers.
- Keep one launcher script, one execution path, and interactive Codex TUI
  sessions in tmux.
- Preserve goal-policy prompt injection and log/exit-code files.

Verification:
- Run `bash -n scripts/run-worker.sh`.
- Run a dry-run or non-invasive shell inspection where feasible.
- Run `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
