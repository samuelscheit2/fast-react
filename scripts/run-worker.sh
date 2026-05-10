#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  printf 'usage: scripts/run-worker.sh <worker-id> <prompt-file>\n' >&2
  exit 2
fi

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

prompt_text="$(<"$prompt_file")"
prompt_text+=$'\n\nGoal policy from the orchestrator:\n'
prompt_text+=$'- Your first action must be to use /goal, the Codex create_goal tool, for this worker task using the Objective in the assigned prompt.\n'
prompt_text+=$'- Do that before research, file reads, implementation, or verification.\n'
prompt_text+=$'- On continuation, use /goal / create_goal again if the active goal is not already set for this exact worker task.\n'
prompt_text+=$'- After goal setup, call get_goal if available and record the active goal status/objective in your progress report, or explicitly state if the goal command/tool or get_goal was unavailable.\n'
prompt_text+=$'\nSubagent policy from the orchestrator:\n'
prompt_text+=$'- You are running as a real Codex process in a tmux worker session.\n'
prompt_text+=$'- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work.\n'
prompt_text+=$'- Nested managed agents spawned inside this worker do not count against the orchestrator top-level tmux worker limit, and may make the aggregate agent/process count exceed 30.\n'
prompt_text+=$'- If nested agents affect your conclusions, summarize what you delegated and how you used their results in your report.\n'

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
