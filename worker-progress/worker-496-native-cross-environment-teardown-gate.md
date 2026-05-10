# Worker 496: Native Cross-Environment Teardown Gate

Goal status: active
Goal objective: Add native handle-table diagnostics proving teardown and
stale-handle rejection stay isolated across environments and root/value handle
generations.

Started: 2026-05-10

## Summary

Added a private native handle-table diagnostic gate for cross-environment
teardown isolation. The gate now records deterministic root/value rows for
mismatched teardown, matched teardown, peer-environment validation,
post-teardown stale rejection, and slot reuse with next-generation handles.

The N-API crate wraps those handle-table diagnostics in an inert native root
bridge gate with explicit false flags for native addon loading, native
execution, renderer execution, reconciler execution, and React behavior errors.
No real native execution, N-API cleanup hook, platform binding, renderer
execution, reconciler execution, or public native root claim was added.

## Goal Setup Evidence

- `create_goal` was called as the first action for this worker objective before
  research, file reads, implementation, or verification.
- `get_goal` immediately after setup returned status `active` for the
  objective recorded above.
- A later `get_goal` before this report still returned status `active` for the
  same objective.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `crates/fast-react-napi/src/handle_table.rs`
  - Added `BridgeHandleTableTeardownIsolationDiagnostics` and deterministic
    diagnostic rows for cross-environment teardown and stale-handle behavior.
  - Added coverage proving mismatched teardown leaves the target table active,
    matched teardown invalidates only the owning environment's root/value
    handles, peer table handles remain active, wrong-environment lookups stay
    wrong-environment, and old root/value handles remain stale after slot reuse.
- `crates/fast-react-napi/src/lib.rs`
  - Added an inert native root bridge teardown gate around the handle-table
    diagnostics.
  - Added metadata constants and tests proving the gate does not imply native
    addon loading, native execution, renderer execution, reconciler execution,
    or React behavior errors.
- `worker-progress/worker-496-native-cross-environment-teardown-gate.md`
  - Recorded goal evidence, implementation notes, verification, risks, and
    handoff details.

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-napi --all-features cross_environment_teardown`
- `cargo test -p fast-react-napi --all-features handle_table`
- `cargo test -p fast-react-napi --all-features`
- `cargo fmt --all --check`
- `git add --intent-to-add worker-progress/worker-496-native-cross-environment-teardown-gate.md`
- `git diff --check`
- Supporting inspection commands: `sed`, `rg`, `git status --short`,
  `git diff --stat`, `git diff`, and `get_goal`.

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed goal-tool ordering, write scope, verification
  requirements, handoff requirements, and no orchestrator takeover.
- `MASTER_PLAN.md`: confirmed worker 496 is scoped to native
  cross-environment teardown.
- `MASTER_PROGRESS.md`: confirmed accepted private native handle-table,
  teardown, JSON transport, parser diagnostics, and sequence teardown gates.
- Worker 403 report: confirmed JSON transport smokes are private and do not
  load a `.node` addon.
- Worker 435 report: confirmed parser diagnostics stay private and
  deterministic.
- Worker 467 report: confirmed malformed, wrong-environment, stale-handle, and
  lifecycle diagnostic rows remain inert.
- Worker 468 report: confirmed sequence teardown already rejects stale root,
  value, and transport handles after teardown and slot reuse.
- Current `handle_table.rs`: confirmed teardown advances generations only for
  matching environments, stale errors carry current generation, and
  wrong-environment checks run before slot access.
- Current `lib.rs`: confirmed native boundary metadata remains a placeholder
  and existing diagnostic rows use explicit no-execution flags.

## Verification

- Focused `cross_environment_teardown` tests passed, including the new
  handle-table diagnostic row test and native wrapper gate test.
- Focused `handle_table` tests passed, 19 matching tests.
- `cargo test -p fast-react-napi --all-features`: passed, 44 unit tests and 0
  doctests.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed with this progress report included via
  intent-to-add.

## Risks Or Blockers

- The gate is private Rust diagnostics only. It does not prove Node-API cleanup
  hooks, JS value rooting, native addon loading, native renderer execution,
  reconciler scheduling, commit, or host output.
- The N-API wrapper intentionally mirrors handle-table facts and no-execution
  flags; it is not a `.node` boundary invocation.
- The diagnostic helper uses fixed synthetic environment IDs and placeholder
  root/value records for deterministic canaries.

## Recommended Next Tasks

- Reuse this diagnostic gate when real N-API cleanup hooks are introduced.
- Add cleanup-hook and JS rooting coverage only when native exports and a
  concrete rooting model are intentionally added.
- Keep public native/root compatibility blocked until native loading,
  scheduling, commit, renderer output, and cleanup semantics are admitted
  together.

## Delegation

Spawned one nested explorer for a quick placement check, but it did not return
a usable final answer before being closed. It did not affect the implementation
or conclusions.
