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
prompt_text=""

cd "$repo_root" || exit 2
rm -f "$log_file" "$exit_file"

if [ ! -f "$prompt_file" ]; then
  echo "missing prompt file: $prompt_file" > "$log_file"
  echo "2" > "$exit_file"
  exit 2
fi

prompt_text="$(cat "$prompt_file")

Hard guard from the orchestrator:
- You are running as a real Codex process in a tmux worker session.
- Do not spawn managed Codex subagents, explorers, nested agents, or parallel agent tools from inside this worker.
- If you need independent hypothesis testing, write the requested follow-up in your report so the orchestrator can launch another real tmux worker.
"

script -q "$log_file" codex \
  --yolo \
  --no-alt-screen \
  --search \
  -m gpt-5.5 \
  -c model_reasoning_effort=\"xhigh\" \
  -C "$repo_root" \
  "$prompt_text"
status="$?"
echo "$status" > "$exit_file"
exit "$status"
