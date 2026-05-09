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

cd "$repo_root" || exit 2

if [ ! -f "$prompt_file" ]; then
  echo "missing prompt file: $prompt_file" > "$log_file"
  echo "2" > "$exit_file"
  exit 2
fi

codex exec -s danger-full-access -a never -C "$repo_root" - < "$prompt_file" > "$log_file" 2>&1
status="$?"
echo "$status" > "$exit_file"
exit "$status"
