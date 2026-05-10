# Worker 468: Native Handle-Table Sequence Teardown Gate

Goal status: active
Goal objective: Add a native handle-table sequence teardown gate that proves
root, value, and transport handles become stale across environment teardown and
cannot be revived by later sequence records.

Started: 2026-05-10

## Summary

Added a focused private Rust gate for native handle-table sequence teardown.
The native root bridge handoff admission path now preflights lifecycle order
before mutating the handle table, so a later create record cannot repopulate a
torn-down slot with the next generation before the sequence validator rejects
it.

The new tests prove root, value, and JSON-transport-decoded handles report
stale after environment teardown, and that later sequence records cannot revive
either the original handles or next-generation handles in the same slots.

No real host native rendering, N-API loading, public native root compatibility,
or reconciler/root execution was added.

## Goal Setup Evidence

- `create_goal` was called first for the assigned objective before file reads,
  research, implementation, or verification.
- `get_goal` after setup returned status `active` for objective: "Add a native
  handle-table sequence teardown gate that proves root, value, and transport
  handles become stale across environment teardown and cannot be revived by
  later sequence records."
- A later `get_goal` before writing this report still returned status `active`
  for the same objective.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `crates/fast-react-napi/src/handle_table.rs`
  - Added a focused teardown handoff-admission test proving stale root/value
    handles cannot be readmitted after teardown and remain stale after slot
    reuse.
- `crates/fast-react-napi/src/lib.rs`
  - Added lifecycle preflight before JS/native handoff admission mutates the
    Rust handle table.
  - Added private root bridge sequence teardown tests for stale root handles,
    stale value handles, JSON transport-decoded handles, and late
    next-generation create records.
- `worker-progress/worker-468-native-handle-table-sequence-teardown-gate.md`
  - Recorded goal evidence, implementation notes, verification, risks, and
    handoff details.

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-napi --all-features handle_table`
- `cargo test -p fast-react-napi --all-features sequence_teardown`
- `cargo test -p fast-react-napi --all-features native_root_bridge`
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git add --intent-to-add worker-progress/worker-468-native-handle-table-sequence-teardown-gate.md`
- `git diff --check`
- Supporting inspection commands: `sed`, `rg`, `find`, `git status --short`,
  `git branch --show-current`, `git diff --stat`, `git diff`, and `get_goal`.

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed goal-tool ordering, write scope, verification
  commands, progress report requirements, and no orchestrator takeover.
- `MASTER_PLAN.md`: confirmed worker 468 is scoped to the native handle-table
  sequence teardown gate.
- `MASTER_PROGRESS.md`: confirmed accepted private native handle-table,
  environment teardown, JSON transport, parser gate, and test-renderer bridge
  foundations.
- Worker 166 report: confirmed environment-local typed handles, generation
  checks, stale errors, wrong-environment rejection, and no N-API wiring.
- Worker 190 report: confirmed `BridgeHandleTable::teardown_environment`
  drains occupied slots and advances generations so old handles go stale.
- Worker 403 report: confirmed decoded JSON transport records feed the Rust
  handle-table admission smoke without native addon loading.
- Worker 423 report: confirmed native bridge work must remain private and avoid
  public test-renderer/native compatibility claims.
- Worker 435 report: confirmed the private JSON transport parser gate and
  deterministic validation/error model.
- Worker 467 report: not present in this checkout.

## Verification

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features handle_table`: passed, 18
  matching tests.
- `cargo test -p fast-react-napi --all-features sequence_teardown`: passed, 2
  matching tests.
- `cargo test -p fast-react-napi --all-features native_root_bridge`: passed,
  16 matching tests.
- `cargo test -p fast-react-napi --all-features`: passed, 41 unit tests and 0
  doctests.
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`:
  passed.
- `git diff --check`: passed.

## Risks Or Blockers

- The gate remains private Rust-only coverage. It does not prove Node-API
  cleanup hooks, JS value rooting, native addon loading, renderer execution, or
  public native root behavior.
- `BridgeHandleTable` still permits direct local insertion after teardown for
  deterministic skeleton testing. The added sequence preflight specifically
  prevents later handoff records from using that vacancy to revive torn-down
  sequence handles before lifecycle validation rejects them.
- JSON transport coverage continues to use decoded private transport records;
  no `.node` boundary is invoked.

## Recommended Next Tasks

- Keep this private gate in place when future work introduces real N-API
  cleanup hooks.
- Add native cleanup-hook integration only when the crate intentionally adopts
  N-API dependencies and a concrete JS value rooting model.
- Keep public native/root compatibility blocked until native loading,
  scheduling, commit, renderer output, and cleanup semantics are admitted
  together.

## Delegation

No nested agents were spawned for this task.
