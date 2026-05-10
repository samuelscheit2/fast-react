# Worker 594: Worker Launcher Status Ledger

## Objective

Harden the single worker launcher/status path so future queues can be audited
from `scripts/run-worker.sh` logs and exit-code files without reintroducing a
second launcher script.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and
`ORCHESTRATOR.md` first. The repo intentionally has one launcher:
`scripts/run-worker.sh`. Keep that design.

## Write Scope

- `scripts/run-worker.sh`
- `ORCHESTRATOR.md` and `WORKER_BRIEF.md` only for narrow durable policy text
  matching actual launcher behavior
- A focused shell or smoke test if an existing script-test area is present
- `worker-progress/worker-594-worker-launcher-status-ledger.md`

Do not create another launcher script. Do not edit runtime packages.

## Requirements

- Keep one working launcher path and no duplicate `fast-react-launch-*` script.
- Ensure worker id, prompt file, log file, exit-code file, start/end timestamps,
  and Codex command mode are recorded deterministically.
- Preserve interactive tmux pane readability via `script -q -F`.
- Add a dry-run or shell-check style validation if the repo has an appropriate
  lightweight test pattern.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `bash -n scripts/run-worker.sh`
- Any focused launcher/status test you add
- `rg -n "fast-react-launch-codex-worker|run-worker.sh" ORCHESTRATOR.md WORKER_BRIEF.md scripts`
- `git diff --check`
