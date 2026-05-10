#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'usage: scripts/run-worker.sh <worker-id> <prompt-file>\n' >&2
}

die() {
  local status="$1"
  shift

  printf 'run-worker: %s\n' "$*" >&2
  if [ -n "${log_file:-}" ]; then
    printf 'run-worker: %s\n' "$*" >> "$log_file" 2>/dev/null || true
  fi
  exit "$status"
}

if [ "$#" -ne 2 ]; then
  usage
  exit 2
fi

worker_id="$1"
prompt_file="$2"
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
progress_dir="$repo_root/worker-progress"

if [[ ! "$worker_id" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]]; then
  die 2 "invalid worker id '$worker_id' (use a filename-safe slug)"
fi

if [[ "$prompt_file" != /* ]]; then
  prompt_file="$repo_root/$prompt_file"
fi

log_file="$progress_dir/${worker_id}.codex.log"
exit_file="$progress_dir/${worker_id}.exitcode"
codex_command_mode="interactive-tui"
script_command_mode="script -q -F"
start_timestamp=""

timestamp_utc() {
  date -u '+%Y-%m-%dT%H:%M:%SZ' 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S%z'
}

write_ledger_fields() {
  local prefix="$1"
  local event="$2"
  local exit_status="${3:-}"
  local end_timestamp="${4:-}"

  printf '%sevent=%s\n' "$prefix" "$event"
  printf '%sworker_id=%s\n' "$prefix" "$worker_id"
  printf '%sprompt_file=%s\n' "$prefix" "$prompt_file"
  printf '%slog_file=%s\n' "$prefix" "$log_file"
  printf '%sexit_file=%s\n' "$prefix" "$exit_file"
  printf '%sstart_timestamp=%s\n' "$prefix" "$start_timestamp"
  if [ -n "$end_timestamp" ]; then
    printf '%send_timestamp=%s\n' "$prefix" "$end_timestamp"
  fi
  printf '%scodex_command_mode=%s\n' "$prefix" "$codex_command_mode"
  printf '%sscript_command_mode=%s\n' "$prefix" "$script_command_mode"
  if [ -n "$exit_status" ]; then
    printf '%sexit_code=%s\n' "$prefix" "$exit_status"
  fi
}

record_exit_code() {
  local status="$?"
  local end_timestamp

  set +e
  trap - EXIT

  end_timestamp="$(timestamp_utc)"
  {
    printf '%s\n' "$status"
    write_ledger_fields "" "end" "$status" "$end_timestamp"
  } > "$exit_file"
  {
    printf '\n'
    write_ledger_fields "[run-worker] " "end" "$status" "$end_timestamp"
  } >> "$log_file" 2>/dev/null || true

  if [ "$status" -eq 0 ]; then
    printf 'run-worker: worker %s exited with status 0; log: %s; exit-code: %s\n' \
      "$worker_id" "$log_file" "$exit_file" >&2
  else
    printf 'run-worker: worker %s exited with status %s; log: %s; exit-code: %s\n' \
      "$worker_id" "$status" "$log_file" "$exit_file" >&2
  fi

  exit "$status"
}

mkdir -p "$progress_dir"
cd "$repo_root"
trap record_exit_code EXIT
rm -f -- "$log_file" "$exit_file"
start_timestamp="$(timestamp_utc)"
write_ledger_fields "[run-worker] " "start" >> "$log_file"

[ -f "$prompt_file" ] || die 2 "missing prompt file: $prompt_file"
[ -r "$prompt_file" ] || die 2 "prompt file is not readable: $prompt_file"
command -v script >/dev/null 2>&1 || die 127 "script command not found in PATH"
command -v codex >/dev/null 2>&1 || die 127 "codex command not found in PATH"

orchestration_policy="$(cat <<'POLICY'
Goal policy from the orchestrator:
- Your first action must be to use /goal, the Codex create_goal tool, for this worker task using the Objective in the assigned prompt.
- Do that before research, file reads, implementation, or verification.
- On continuation, use /goal / create_goal again if the active goal is not already set for this exact worker task.
- After goal setup, call get_goal if available and record the active goal status/objective in your progress report, or explicitly state if the goal command/tool or get_goal was unavailable.

Subagent policy from the orchestrator:
- You are running as a real Codex process in a tmux worker session.
- You may spawn managed Codex subagents, explorers, nested agents, or parallel agent tools inside this worker when they help test hypotheses or verify work.
- Nested managed agents spawned inside this worker do not count against the orchestrator top-level tmux worker limit, and may make the aggregate agent/process count exceed 30.
- If nested agents affect your conclusions, summarize what you delegated and how you used their results in your report.
POLICY
)"
prompt_text="$(printf '%s\n\n%s' "$(<"$prompt_file")" "$orchestration_policy")"
codex_cmd=(
  codex
  --yolo
  --no-alt-screen
  --search
  -m gpt-5.5
  -c 'model_reasoning_effort="xhigh"'
  -C "$repo_root"
  "$prompt_text"
)

# Use the interactive TUI, not `codex exec`, so the tmux pane remains readable
# (including "Pursuing goal") while `script` also records the session log.
script -q -F "$log_file" "${codex_cmd[@]}"
