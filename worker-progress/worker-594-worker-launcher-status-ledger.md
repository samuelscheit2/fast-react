# Worker 594 - Worker Launcher Status Ledger

## Goal Evidence

- `create_goal` was available and was my first action for this worker task.
- `get_goal` was available immediately after setup.
- Active goal status: `active`
- Active goal objective: Harden the single worker launcher/status path so
  future queues can be audited from `scripts/run-worker.sh` logs and exit-code
  files without reintroducing a second launcher script.

## Summary

- Kept `scripts/run-worker.sh` as the single worker launcher and preserved the
  interactive Codex TUI path under `script -q -F`.
- Added deterministic start/end ledger fields to `.codex.log` and `.exitcode`
  artifacts: worker id, prompt file, log file, exit-code file, timestamps,
  Codex command mode, script command mode, and final exit code.
- Kept the `.exitcode` first line as the numeric process status, then appended
  key-value audit fields.
- Documented the single-launcher artifact contract narrowly in
  `ORCHESTRATOR.md` and `WORKER_BRIEF.md`.
- Added a focused smoke validation using temporary `script` and `codex` shims
  so the launcher can be checked without starting a real Codex TUI.

## Changed Files

- `scripts/run-worker.sh`
- `ORCHESTRATOR.md`
- `WORKER_BRIEF.md`
- `tests/smoke/run-worker-ledger-smoke.sh`
- `worker-progress/worker-594-worker-launcher-status-ledger.md`

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' ORCHESTRATOR.md`
- `git status --short --branch`
- `sed -n '1,260p' scripts/run-worker.sh`
- `rg --files`
- `rg -n "fast-react-launch-codex-worker|run-worker.sh|shellcheck|bash -n|bats|shunit|script -q -F|exit-code|exit code|worker-progress" .`
- `sed -n '1,220p' package.json`
- `find . -maxdepth 3 -type d \( -name test -o -name tests -o -name scripts \) | sort`
- `find . -maxdepth 4 -type f \( -name '*run-worker*' -o -name '*shell*' -o -name '*launcher*' -o -name '*.bats' -o -name '*script*.sh' \) | sort`
- `sed -n '1,220p' worker-progress/worker-527-worker-launcher-simplification-diagnostics.md`
- `sed -n '1,220p' docs/tasks/worker-594-worker-launcher-status-ledger.prompt.md`
- `git log --oneline --decorate -- scripts/run-worker.sh ORCHESTRATOR.md WORKER_BRIEF.md | head -30`
- `git check-ignore -v worker-progress/worker-594-worker-launcher-status-ledger.codex.log worker-progress/worker-594-worker-launcher-status-ledger.exitcode || true`
- `find tests/smoke -maxdepth 2 -type f -print | sort | sed -n '1,120p'`
- `find tests -maxdepth 3 -type f \( -name '*.sh' -o -name '*.test.sh' -o -name '*.mjs' \) | sort | sed -n '1,180p'`
- `rg -n "\.exitcode|exitcode|exit-code|exit_file|codex\.log|run-worker" . -g '!node_modules' -g '!target'`
- `sed -n '1,220p' .gitignore`
- `git show ef34de1:scripts/run-worker.sh | sed -n '1,220p'`
- `bash -n scripts/run-worker.sh`
- `bash -n tests/smoke/run-worker-ledger-smoke.sh`
- `command -v shellcheck >/dev/null 2>&1 && shellcheck scripts/run-worker.sh tests/smoke/run-worker-ledger-smoke.sh || printf 'shellcheck_not_available\n'`
- `bash tests/smoke/run-worker-ledger-smoke.sh`
- Missing-prompt smoke with worker id `worker-594-missing-prompt-smoke`
- `rg -n "fast-react-launch-codex-worker|run-worker.sh" ORCHESTRATOR.md WORKER_BRIEF.md scripts`
- `git diff --check`

## Evidence Gathered

- `bash -n scripts/run-worker.sh` passed.
- `bash -n tests/smoke/run-worker-ledger-smoke.sh` passed.
- `shellcheck scripts/run-worker.sh tests/smoke/run-worker-ledger-smoke.sh`
  passed.
- `bash tests/smoke/run-worker-ledger-smoke.sh` passed. The shimmed run
  returned `23`, kept the `.exitcode` first line as `23`, recorded all required
  ledger fields in both artifacts, passed Codex ten arguments, avoided
  `codex exec`, preserved `--no-alt-screen`, and kept the orchestrator goal and
  subagent policy text in the prompt argument.
- Missing-prompt smoke returned `2`; the `.exitcode` first line remained `2`
  and the appended ledger recorded the absolute prompt path, log path,
  exit-code path, start/end timestamps, `interactive-tui` mode, and
  `script -q -F` mode.
- `rg -n "fast-react-launch-codex-worker|run-worker.sh" ORCHESTRATOR.md
  WORKER_BRIEF.md scripts` found only the intended `run-worker.sh`
  references and no duplicate `fast-react-launch-*` launcher.
- `git diff --check` passed.

## Risks Or Blockers

- I did not launch a real Codex worker; the focused smoke test uses PATH shims
  to avoid opening a TUI while still validating the launcher path, ledger, and
  argument construction.
- `.exitcode` is now multi-line by design. The first line remains the numeric
  status for simple consumers; audit consumers should read subsequent
  key-value lines.

## Recommended Next Tasks

- On the next real worker launch, inspect the live `.codex.log` and
  `.exitcode` artifacts once to confirm the same ledger shape appears with the
  real `script` binary.

## Nested Delegation

- No nested agents were spawned for this task.
