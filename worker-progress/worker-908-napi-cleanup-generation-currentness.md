# Worker 908 - NAPI Cleanup Generation Currentness

## Summary

Added a private `#[cfg(test)]` cleanup-generation currentness canary in
`fast-react-napi`. The canary sits above the existing cleanup-generation
consumer and only accepts cleanup handoff rows when they compose with accepted
batch-lifecycle generation/replay evidence and canonical cleanup-hook identity
evidence.

The canary remains Rust test-only. It does not load native addons, run Node
worker-thread teardown, execute N-API cleanup hooks, schedule work, invoke the
renderer/reconciler, change package exports, or claim public native
compatibility.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added test-only currentness status/error codes, canary structs, validation
    helpers, and cleanup handoff row test mutators.
  - Added focused Rust tests for the positive currentness canary and rejection
    paths.
- `worker-progress/worker-908-napi-cleanup-generation-currentness.md`
  - Worker handoff report.

## Currentness Fields

The canary requires these fields before accepting cleanup handoff metadata:

- Accepted native generation/replay evidence:
  `json_batch_lifecycle_executor_generation`,
  `json_batch_lifecycle_executor_source_rows_validated`,
  `json_batch_lifecycle_executor_replay_guard_consumed`,
  accepted lifecycle row id, render `batch_index`, `request_id`, `kind`,
  `source_environment_id`, `source_root_handle`, `source_root_id`,
  `root_handle_current_generation`, and
  `value_handle_current_generation`.
- Cleanup-generation handoff evidence:
  cleanup consumer `executor_generation`, `cleanup_generation_consumed`,
  `source_rows_validated`, `cleanup_hook_preflight_accepted`, row
  `executor_generation`, `source_environment_id`, `source_root_handle`,
  `source_root_id`, `source_handle_kind`, `source_handle`,
  `executor_handle_current_generation`, and
  `cleanup_hook_source_current_generation`.
- Cleanup-hook identity evidence:
  canonical preflight accepted root/value rows, cleanup hook row id, source row
  id, hook id, function identity token, argument identity token,
  private order/identity flags, and canonical executable evidence flag.

## Evidence

- Positive currentness accepts only the current render handoff for environment
  `764`, executor generation match, root/value handle-table current generation
  `1`, and cleanup current generation `2`.
- Rejection coverage includes:
  - stale cleanup handoff after another accepted native generation step;
  - cloned/forged cleanup rows;
  - cross-environment and cross-table cleanup evidence;
  - cleanup-generation replay and lifecycle retirement after unmount;
  - missing cleanup hook identity;
  - caller-built cleanup metadata;
  - public native execution claims.

## Commands Run

- `cargo fmt --all` - passed.
- `cargo test -p fast-react-napi --all-features cleanup_generation_currentness -- --nocapture` - initially failed before allowing the existing cleanup-hook preflight's expected rejected rows.
- `cargo test -p fast-react-napi --all-features native_root_bridge_cleanup_generation_currentness -- --nocapture` - passed, 6 tests.
- `cargo test -p fast-react-napi --all-features native_root_bridge_batch_lifecycle_cleanup_hook_generation_consumer -- --nocapture` - passed, 4 tests.
- `cargo test -p fast-react-napi --all-features cleanup_hook -- --nocapture` - passed, 13 tests.
- `cargo test -p fast-react-napi --all-features native_root_bridge_batch_lifecycle -- --nocapture` - passed, 7 tests.
- `cargo test -p fast-react-napi --all-features json_batch_lifecycle_executor -- --nocapture` - passed, 0 tests matched.
- `cargo test -p fast-react-napi --all-features` - passed, 73 unit tests and 0 doctests.
- `cargo check -p fast-react-napi --all-features` - passed.
- `cargo fmt --all --check` - passed.
- `git diff --check` - passed.

## Risks Or Blockers

- This is intentionally test-only Rust evidence. It does not prove real
  `napi_add_env_cleanup_hook` execution or public native addon behavior.
- The file `crates/fast-react-napi/src/lib.rs` is a high-churn native lifecycle
  area. Overlap risk exists with workers changing adjacent private native
  lifecycle diagnostics.
- Exact caller-built metadata cannot be distinguished from a byte-for-byte clone
  that preserves all source-owned flags; the canary rejects caller-built rows
  through the local `source_owned_cleanup_handoff` evidence flag and mismatched
  currentness fields.

## Recommended Next Tasks

- When real N-API cleanup hooks exist, replace the private identity tokens with
  addon-owned function/argument identity evidence while preserving the same
  generation/currentness gate.
- Keep package/no-load smoke checks in the merge queue because this worker does
  not touch JS package exports or native loader behavior.
