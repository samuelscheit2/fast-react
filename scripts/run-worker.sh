#!/usr/bin/env bash
set -u

if [ "$#" -ne 2 ]; then
  echo "usage: scripts/run-worker.sh <worker-id> <prompt-file>" >&2
  exit 2
fi

worker_id="$1"
prompt_file="$2"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
log_file="$repo_root/worker-progress/${worker_id}.codex.log"
exit_file="$repo_root/worker-progress/${worker_id}.exitcode"
combined_prompt_file="$(mktemp "${TMPDIR:-/tmp}/fast-react-worker-prompt.XXXXXX")"

cleanup() {
  rm -f "$combined_prompt_file"
}
trap cleanup EXIT

cd "$repo_root" || exit 2
rm -f "$log_file" "$exit_file"

if [ ! -f "$prompt_file" ]; then
  echo "missing prompt file: $prompt_file" > "$log_file"
  echo "2" > "$exit_file"
  exit 2
fi

{
  cat "$prompt_file"
  cat <<'PROMPT_APPEND'

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
PROMPT_APPEND
} > "$combined_prompt_file"

export FAST_REACT_WORKER_PROMPT_FILE="$combined_prompt_file"
export FAST_REACT_WORKER_ROOT="$repo_root"

# Use the interactive TUI, not `codex exec`, so the tmux pane remains readable
# (including "Pursuing goal") while `script` also records the session log.
script -q -F "$log_file" bash -lc '
  prompt_text="$(cat "$FAST_REACT_WORKER_PROMPT_FILE")"
  cd "$FAST_REACT_WORKER_ROOT"
  exec codex \
    --yolo \
    --no-alt-screen \
    --search \
    -m gpt-5.5 \
    -c '\''model_reasoning_effort="xhigh"'\'' \
    -C "$FAST_REACT_WORKER_ROOT" \
    "$prompt_text"
'
status="$?"
echo "$status" > "$exit_file"
exit "$status"
