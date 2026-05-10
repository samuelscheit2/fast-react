# Worker 166: Native Bridge Handle Table

Goal status: active
Goal objective: add a private native bridge handle-table skeleton in fast-react-napi with deterministic environment-local handle behavior, without adding real N-API dependencies or wiring JS packages to native code

Started: 2026-05-10

## Summary

Implemented a private `fast-react-napi` handle-table skeleton for future native
bridge rooted records. Handles are environment-local opaque values carrying
environment id, slot, generation, and kind. The table supports insert/get/remove
for placeholder root and value records, explicit dispose state, stale generation
detection after removal/reuse, wrong-environment rejection, wrong-kind
rejection, and duplicate-dispose reporting.

No N-API dependencies, native loaders, package wiring, platform artifacts, or
reconciler root operations were added.

## Goal Setup Evidence

- `create_goal` was called first for the assigned objective before reading
  files or making edits.
- `get_goal` returned status `active` for objective: "add a private native
  bridge handle-table skeleton in fast-react-napi with deterministic
  environment-local handle behavior, without adding real N-API dependencies or
  wiring JS packages to native code".
- This progress file was created immediately after goal setup and before
  implementation.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added private `mod handle_table;`.
- `crates/fast-react-napi/src/handle_table.rs`
  - Added private environment id, handle kind, opaque handle, placeholder root
    and value records, generational slot table, typed private table errors, and
    focused unit tests.
- `worker-progress/worker-166-native-bridge-handle-table.md`
  - Recorded goal state, implementation notes, evidence, and verification.

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-napi --all-features`
- `cargo fmt --all --check`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git diff --check`
- Supporting inspection commands: `sed`, `rg --files`, `rg`, `git status --short`

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed write scope, verification commands, and no
  `ORCHESTRATOR.md` access.
- `worker-progress/worker-096-native-root-boundary-plan.md`: confirmed private
  native handles must be environment-local and invalidated on cleanup/dispose.
- `worker-progress/worker-142-native-js-bridge-refresh.md`: confirmed the
  handle-table slice should carry kind, environment id, generation, and disposed
  state before native exports.
- `crates/fast-react-napi/src/lib.rs`: confirmed the crate is still a
  placeholder with no N-API dependency surface.
- `bindings/node/package.json`: confirmed package scripts/metadata remain
  loader-placeholder oriented and were not changed.

## Verification

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features`: passed, 12 tests.
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`:
  passed.
- `git diff --check`: passed.

## Risks Or Blockers

- The handle table is intentionally private and unwired, so it does not yet
  prove N-API lifetime rooting, environment cleanup hooks, thread affinity, or
  reconciler root integration.
- The placeholder records are numeric stand-ins only. Future bridge work should
  replace them with real rooted value/callback/root metadata without exposing
  the handles publicly.
- Disposed entries remain occupied to provide deterministic duplicate-dispose
  and disposed-handle errors. A future cleanup path may need a separate
  environment teardown operation that drains disposed entries without permitting
  stale handles to revive.

## Recommended Next Tasks

- Add an environment teardown API that marks all root-owned handles disposed and
  drains table storage according to the final cleanup policy.
- Map private handle-table errors into the crate-level native boundary error
  family once real native exports exist.
- Connect the private root handle record to `FiberRootStore` only after the
  native bridge owner adds actual N-API dependency and export wiring.

## Delegation

No nested agents were spawned for this task.
