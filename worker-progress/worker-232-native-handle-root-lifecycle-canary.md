# Worker 232: Native Handle Root Lifecycle Canary

Goal status: active
Goal objective: Add a private native handle-table lifecycle canary for root-like handles that proves allocation, lookup, generation retirement, and environment teardown remain isolated, without Node-API bindings, JS values, reconciler integration, raw pointers, or public native APIs.

Started: 2026-05-10

## Summary

Added a private Rust unit-test canary for root-like handle-table records. The
canary proves root handle allocation and lookup, wrong-environment lookup
rejection, root generation retirement through removal and slot reuse,
wrong-environment teardown no-op behavior, matching environment teardown
invalidation, and post-teardown slot reuse without reviving stale root handles.

No Node-API bindings, JS values, reconciler integration, raw pointers, package
surfaces, or public native APIs were added.

## Goal Setup Evidence

- `create_goal` was called first for the assigned objective before file reads,
  implementation, or verification.
- `get_goal` returned status `active` for the objective recorded above.
- The active goal status/objective were recorded in this progress report before
  source edits.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `crates/fast-react-napi/src/handle_table.rs`
  - Added `root_lifecycle_canary_isolates_retirement_and_environment_teardown`,
    a private handle-table test covering root allocation, lookup, generation
    retirement, environment-local teardown, and cross-environment isolation.
- `worker-progress/worker-232-native-handle-root-lifecycle-canary.md`
  - Recorded goal setup, implementation evidence, verification, and handoff.

## Commands Run

- `pwd && rg --files | rg '(^WORKER_BRIEF\.md$|^MASTER_PLAN\.md$|^MASTER_PROGRESS\.md$|worker-progress/worker-(096|142|166|190).+\.md$|crates/fast-react-napi/src/(handle_table|lib)\.rs$)'`
- `git status --short`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '261,520p' MASTER_PROGRESS.md`
- `sed -n '521,700p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-096-native-root-boundary-plan.md`
- `sed -n '261,520p' worker-progress/worker-096-native-root-boundary-plan.md`
- `sed -n '1,260p' worker-progress/worker-142-native-js-bridge-refresh.md`
- `sed -n '261,520p' worker-progress/worker-142-native-js-bridge-refresh.md`
- `sed -n '1,260p' worker-progress/worker-166-native-bridge-handle-table.md`
- `sed -n '1,260p' worker-progress/worker-190-native-handle-environment-teardown.md`
- `sed -n '1,320p' crates/fast-react-napi/src/handle_table.rs`
- `sed -n '321,760p' crates/fast-react-napi/src/handle_table.rs`
- `sed -n '761,980p' crates/fast-react-napi/src/handle_table.rs`
- `sed -n '1,260p' crates/fast-react-napi/src/lib.rs`
- `sed -n '261,520p' crates/fast-react-napi/src/lib.rs`
- `wc -l MASTER_PROGRESS.md worker-progress/worker-096-native-root-boundary-plan.md worker-progress/worker-142-native-js-bridge-refresh.md worker-progress/worker-166-native-bridge-handle-table.md worker-progress/worker-190-native-handle-environment-teardown.md crates/fast-react-napi/src/handle_table.rs crates/fast-react-napi/src/lib.rs`
- `wc -l MASTER_PLAN.md WORKER_BRIEF.md`
- `rg -n "canary|lifecycle" crates/fast-react-napi/src crates/fast-react-* -g '*.rs'`
- `nl -ba crates/fast-react-napi/src/handle_table.rs | sed -n '1,980p'`
- `cargo fmt --all`
- `git diff -- crates/fast-react-napi/src/handle_table.rs worker-progress/worker-232-native-handle-root-lifecycle-canary.md`
- `cargo test -p fast-react-napi --all-features handle_table`
- `cargo fmt --all --check`
- `git diff --check`
- `cargo test -p fast-react-napi --all-features`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git status --short`
- `git diff --stat`
- `nl -ba crates/fast-react-napi/src/handle_table.rs | sed -n '750,880p'`
- `nl -ba worker-progress/worker-232-native-handle-root-lifecycle-canary.md | sed -n '1,220p'`

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed goal-tool ordering, write scope, verification
  commands, and report requirements.
- `MASTER_PLAN.md`: confirmed worker 232 is scoped to native handle root
  lifecycle canary work in `fast-react-napi`.
- `MASTER_PROGRESS.md`: confirmed workers 166 and 190 are accepted foundations
  for the private handle table and environment teardown path.
- `worker-progress/worker-096-native-root-boundary-plan.md`: confirmed private
  native root handles must remain opaque, environment-local, and invalidated on
  cleanup without public React DOM behavior claims.
- `worker-progress/worker-142-native-js-bridge-refresh.md`: confirmed the
  private handle-table slice should carry kind, environment id, generation, and
  disposed state before any native exports.
- `worker-progress/worker-166-native-bridge-handle-table.md`: confirmed the
  current skeleton supports environment-local root/value records, generation
  stale checks, wrong-environment checks, and duplicate dispose reporting.
- `worker-progress/worker-190-native-handle-environment-teardown.md`: confirmed
  teardown drains environment-local occupied slots by advancing generations and
  leaves stale handles rejected.
- `crates/fast-react-napi/src/handle_table.rs`: confirmed existing private
  root/value placeholder records, generation-based slot reuse, disposal, and
  teardown behavior.
- `crates/fast-react-napi/src/lib.rs`: confirmed `handle_table` is a private
  module and no public export is needed for this canary.
- The new canary keeps all state inside private Rust test code and uses only
  `PlaceholderRootRecord`, `BridgeHandleTable`, and `BridgeEnvironmentId`.
- A peer table in another environment remains readable after removal, failed
  teardown, matching teardown, and post-teardown insertion in the first table.

## Verification

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features handle_table`: passed, 13
  matching tests.
- `cargo test -p fast-react-napi --all-features`: passed, 18 unit tests and 0
  doctests.
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`:
  passed.
- `git diff --check`: passed after final report update.

## Risks Or Blockers

- The canary is intentionally private and test-only. It does not prove real
  Node-API cleanup hooks, JS value rooting, thread affinity, native export
  behavior, or reconciler root integration.
- Root records remain numeric placeholders until a future bridge owner defines
  real root metadata and lifetime ownership.

## Recommended Next Tasks

- Map private handle-table failures into the crate-level native boundary error
  family once real native exports are assigned.
- Connect future Node-API environment cleanup hooks to
  `teardown_environment` only in a worker explicitly scoped to N-API
  dependencies.
- Replace placeholder root/value records with bridge-owned rooted metadata only
  after the native bridge lifetime model is settled.

## Delegation

No nested agents were spawned for this task.
