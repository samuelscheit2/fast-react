# Worker 527 - Worker Launcher Simplification Diagnostics

## Goal Evidence

- Final pane closeout observed by orchestrator: complete (tmux reported `Goal achieved`).
- `create_goal` was available and was the first action for this worker task.
- `get_goal` was available after setup.
- Active goal status: `active`
- Active goal objective: Audit and simplify the worker launcher now that only
  `scripts/run-worker.sh` remains. Improve crash/exit diagnostics and quoting
  robustness without adding a second launcher path or changing the active
  worker contract.

## Summary

- Kept `scripts/run-worker.sh` as the only launcher and kept the same active
  worker path: interactive Codex TUI launched under `script` in tmux.
- Added preflight diagnostics for invalid worker ids, missing/unreadable prompt
  files, and missing `script` or `codex` commands.
- Constrained worker ids to filename-safe slugs so log and exit-code artifacts
  stay under `worker-progress/`.
- Preserved prompt policy injection, `.codex.log`, and `.exitcode` artifacts.
- Switched the Codex invocation to an argument array so the prompt text remains
  a single quoted argument with literal markdown, backticks, and shell-looking
  text.
- Added an EXIT trap footer that records the final status in the exit-code
  file, appends a one-line diagnostic to the log when possible, and prints the
  log/exit-code paths to stderr for crashed or clean exits.

## Changed Files

- `scripts/run-worker.sh`
- `worker-progress/worker-527-worker-launcher-simplification-diagnostics.md`

No `ORCHESTRATOR.md` or `WORKER_BRIEF.md` policy change was needed because the
launcher still uses one `script ... codex` execution path, preserves the
worker contract, and keeps the existing goal/subagent policy text.

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,240p' MASTER_PLAN.md`
- `sed -n '1,240p' MASTER_PROGRESS.md`
- `git status --short`
- `sed -n '1,260p' scripts/run-worker.sh`
- `sed -n '1,260p' ORCHESTRATOR.md`
- `find worker-progress -maxdepth 1 -type f | sort | tail -40`
- `rg -n "run-worker|worker launcher|codex\\.log|exitcode|Pursuing goal|script -q" .`
- `ls -la scripts worker-progress | sed -n '1,220p'`
- `command -v script && script --version 2>&1 || true`
- `find . -maxdepth 3 -type f \( -name '*worker*.sh' -o -name '*launcher*' -o -name '*smoke*' \) | sort`
- `sed -n '1,220p' docs/tasks/worker-527-worker-launcher-simplification-diagnostics.prompt.md`
- `sed -n '1,110p' worker-progress/worker-003-scaffold.md`
- `git log --oneline -- scripts/run-worker.sh | head -20`
- `git show --stat --oneline --decorate HEAD -- scripts/run-worker.sh`
- `git check-ignore -v worker-progress/worker-527-worker-launcher-simplification-diagnostics.codex.log worker-progress/worker-527-worker-launcher-simplification-diagnostics.exitcode || true`
- `git show --stat --oneline 32c5995 -- scripts/run-worker.sh ORCHESTRATOR.md WORKER_BRIEF.md`
- `git show 32c5995:scripts/run-worker.sh | sed -n '1,260p'`
- `git show 724d2ce:scripts/run-worker.sh | sed -n '1,260p'`
- `git show --stat --oneline 6356203 -- scripts/run-worker.sh ORCHESTRATOR.md WORKER_BRIEF.md`
- `git show 6356203:scripts/run-worker.sh | sed -n '1,260p'`
- `script` temporary exit-status probes with and without `-e`
- `bash -n scripts/run-worker.sh`
- Missing-prompt smoke: `bash scripts/run-worker.sh <unique-smoke-id> docs/tasks/does-not-exist-for-worker-527.md`
- Dry-run smoke with temporary `script` and `codex` shims in `PATH`
- `git diff --check`
- `command -v shellcheck >/dev/null 2>&1 && shellcheck scripts/run-worker.sh || printf 'shellcheck_not_available\n'`

## Evidence Gathered

- Local `script` is `/usr/bin/script` with BSD-style usage:
  `script [-aeFkpqr] [-t time] [file [command ...]]`.
- Temporary `script` probes showed child exit status propagation on this
  machine: `exit 7` returned `7` with and without `-e`.
- `bash -n scripts/run-worker.sh` passed.
- Missing-prompt smoke used a unique worker id, did not launch Codex, returned
  `2`, wrote `.exitcode` containing `2`, and appended a run-worker footer to
  the smoke log. The temporary smoke artifacts were removed.
- Dry-run smoke used temporary `script` and `codex` shims, did not launch the
  real Codex TUI, returned `23`, wrote `.exitcode` containing `23`, passed
  exactly 10 Codex arguments, preserved `--yolo`, model `gpt-5.5`, `-C
  <repo-root>`, and included both orchestrator goal and subagent policy text in
  the single prompt argument. The temporary smoke artifacts were removed.
- `git diff --check` passed.
- `shellcheck scripts/run-worker.sh` passed.
- Final status after this report showed only the intended launcher change and
  this progress file.

## Risks Or Blockers

- I intentionally did not start a real Codex worker, to avoid disrupting
  currently running workers. The dry-run used PATH shims to verify launcher
  argument construction and exit-code behavior without opening a TUI.
- Worker ids with slashes, spaces, shell metacharacters, or leading punctuation
  are now rejected. Existing worker ids are slug-style names, so this keeps the
  active contract intact while preventing artifact path traversal.
- The script still assumes the platform-supported `script -q -F <log>
  <command...>` form already used by the project. This matches the local
  `/usr/bin/script` usage.

## Recommended Next Tasks

- On the next orchestrator-launched worker, confirm the tmux pane and
  `.codex.log` show the final `run-worker` footer after the worker exits.
- Keep future launcher changes in `scripts/run-worker.sh`; do not reintroduce a
  second launcher path.

## Nested Delegation

- No nested agents were spawned for this task.
