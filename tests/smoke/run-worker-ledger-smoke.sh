#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/run-worker-ledger.XXXXXX")"
worker_id="worker-594-launcher-ledger-smoke-$$"
log_file="$repo_root/worker-progress/${worker_id}.codex.log"
exit_file="$repo_root/worker-progress/${worker_id}.exitcode"

cleanup() {
  rm -rf "$tmp_dir"
  rm -f -- "$log_file" "$exit_file"
}
trap cleanup EXIT

fail() {
  printf 'run-worker-ledger-smoke: %s\n' "$*" >&2
  exit 1
}

require_line() {
  local file="$1"
  local expected="$2"

  grep -F -- "$expected" "$file" >/dev/null || fail "missing line in $file: $expected"
}

require_regex() {
  local file="$1"
  local expected="$2"

  grep -E -- "$expected" "$file" >/dev/null || fail "missing pattern in $file: $expected"
}

shim_dir="$tmp_dir/bin"
prompt_file="$tmp_dir/prompt with spaces.md"
stdout_file="$tmp_dir/stdout.txt"
stderr_file="$tmp_dir/stderr.txt"
mkdir -p "$shim_dir"
printf '# Smoke prompt\n\nDo not run real Codex.\n' > "$prompt_file"

cat > "$shim_dir/script" <<'SHIM'
#!/usr/bin/env bash
set -u

log_file=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    -q)
      shift
      ;;
    -F)
      shift
      [ "$#" -gt 0 ] || exit 64
      log_file="$1"
      shift
      break
      ;;
    *)
      break
      ;;
  esac
done

[ -n "$log_file" ] || exit 64
[ "$#" -gt 0 ] || exit 64
printf '[script-shim] argc=%s\n' "$#" >> "$log_file"
"$@" >> "$log_file" 2>&1
exit "$?"
SHIM

cat > "$shim_dir/codex" <<'SHIM'
#!/usr/bin/env bash
set -u

[ "$#" -eq 10 ] || exit 66
i=1
for arg in "$@"; do
  [ "$arg" != "exec" ] || exit 65
  printf '[codex-shim] arg_%02d=%s\n' "$i" "$arg"
  i=$((i + 1))
done
exit 23
SHIM
chmod +x "$shim_dir/script" "$shim_dir/codex"

set +e
PATH="$shim_dir:$PATH" bash "$repo_root/scripts/run-worker.sh" \
  "$worker_id" "$prompt_file" > "$stdout_file" 2> "$stderr_file"
status="$?"
set -e

[ "$status" -eq 23 ] || fail "expected launcher status 23, got $status"
[ -f "$log_file" ] || fail "missing log file: $log_file"
[ -f "$exit_file" ] || fail "missing exit-code file: $exit_file"

first_exit_line="$(sed -n '1p' "$exit_file")"
[ "$first_exit_line" = "23" ] || fail "expected first exit-code line 23, got $first_exit_line"

require_line "$exit_file" "event=end"
require_line "$exit_file" "worker_id=$worker_id"
require_line "$exit_file" "prompt_file=$prompt_file"
require_line "$exit_file" "log_file=$log_file"
require_line "$exit_file" "exit_file=$exit_file"
require_regex "$exit_file" '^start_timestamp=[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$'
require_regex "$exit_file" '^end_timestamp=[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$'
require_line "$exit_file" "codex_command_mode=interactive-tui"
require_line "$exit_file" "script_command_mode=script -q -F"
require_line "$exit_file" "exit_code=23"

require_line "$log_file" "[run-worker] event=start"
require_line "$log_file" "[run-worker] event=end"
require_line "$log_file" "[run-worker] worker_id=$worker_id"
require_line "$log_file" "[run-worker] prompt_file=$prompt_file"
require_line "$log_file" "[run-worker] log_file=$log_file"
require_line "$log_file" "[run-worker] exit_file=$exit_file"
require_line "$log_file" "[run-worker] codex_command_mode=interactive-tui"
require_line "$log_file" "[run-worker] script_command_mode=script -q -F"
require_line "$log_file" "[run-worker] exit_code=23"
require_line "$log_file" "[script-shim] argc=11"
require_line "$log_file" "[codex-shim] arg_01=--yolo"
require_line "$log_file" "[codex-shim] arg_02=--no-alt-screen"
require_line "$log_file" "[codex-shim] arg_03=--search"
require_line "$log_file" "[codex-shim] arg_04=-m"
require_line "$log_file" "[codex-shim] arg_05=gpt-5.5"
require_line "$log_file" "[codex-shim] arg_08=-C"
require_line "$log_file" "[codex-shim] arg_09=$repo_root"
require_line "$log_file" "Goal policy from the orchestrator:"
require_line "$log_file" "Subagent policy from the orchestrator:"

printf 'run-worker-ledger-smoke: passed\n'
