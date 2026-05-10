#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: scripts/run-worker.sh <worker-id> <prompt-file>" >&2
  exit 2
}

[ "$#" -eq 2 ] || usage

worker_id="$1"
prompt_file="$2"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
log_file="$repo_root/worker-progress/${worker_id}.codex.log"
exit_file="$repo_root/worker-progress/${worker_id}.exitcode"

cd "$repo_root"
rm -f "$log_file" "$exit_file"

record_exit_code() {
  printf '%s\n' "$?" > "$exit_file"
}
trap record_exit_code EXIT

[ -f "$prompt_file" ] || {
  printf 'missing prompt file: %s\n' "$prompt_file" | tee "$log_file" >&2
  exit 2
}

prompt_text="$(cat "$prompt_file")

Goal policy from the orchestrator:
- Your first action must be to use /goal, the Codex create_goal tool, for this worker task using the Objective in the assigned prompt.
- Do that before research, file reads, implementation, or verification.
- On continuation, use /goal / create_goal again if the active goal is not already set for this exact worker task.
- After goal setup, call get_goal if available and record the active goal status/objective in your progress report, or explicitly state if the goal command/tool or get_goal was unavailable.

Subagent policy from the orchestrator:
- You are running as a real Codex process in a tmux worker session.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work.
- Nested managed agents spawned inside this worker do not count against the orchestrator's 30 top-level tmux worker limit, and may make the aggregate agent/process count exceed 30.
- If nested agents affect your conclusions, summarize what you delegated and how you used their results in your report.
"

# Use the interactive TUI, not `codex exec`, so the tmux pane remains readable
# (including "Pursuing goal") while `script` also records the session log.
script -q -F "$log_file" codex \
  --yolo \
  --no-alt-screen \
  --search \
  -m gpt-5.5 \
  -c 'model_reasoning_effort="xhigh"' \
  -C "$repo_root" \
  "$prompt_text"
