# Worker 719: Function Effect Destroy Handle Persistence

## Status

- Complete.
- Branch/worktree: `worker/719-function-effect-destroy-handle-persistence`.
- Scope stayed within `crates/fast-react-reconciler/src/{function_component.rs,passive_effects.rs,root_commit.rs}`
  and this report.

## Findings

- Previous destroy handles live on `HookEffectInstance` and are read through
  `effect_destroy(previous_effect)` during `update_effect_metadata`.
- Update records already carry `previous_effect`, reused `instance`, and
  `destroy`; the missing evidence was explicit previous-effect provenance in
  passive commit handoff/order metadata and a canary that persisted a passive
  create return into the instance before a later update.
- Public `useEffect` / `useLayoutEffect`, public `act`, public `render`, and
  renderer compatibility remain blocked. New helpers are crate-private canaries
  and expose fail-closed booleans.

## Implemented

- Added `FunctionComponentEffectDestroyHandlePersistenceRecord` and
  `FunctionComponentHookRenderStore::effect_destroy_handle_persistence_records`
  to prove update records reuse the previous effect instance and preserve the
  destroy handle for both changed and skipped effects.
- Added `previous_effect` to passive effect metadata, pending passive commit
  records, phase records, validation, and effect-list passive scheduling records.
- Added canary assertions showing:
  - changed dependencies consume the previous destroy handle for passive/layout
    update unmount metadata;
  - unchanged dependencies retain the destroy handle while being skipped from
    pending passive/layout handoff;
  - foreign/stale destroy drift is detectable;
  - a test-controlled passive create returned destroy is stored back on the hook
    effect instance, then consumed by the next update's passive handoff and
    passive unmount commit-order metadata.

## Verification

- `cargo test -p fast-react-reconciler --all-features function_component_effect_update_queue_records_changed_and_unchanged_dependencies -- --nocapture`
  passed.
- `cargo test -p fast-react-reconciler --all-features function_component_effect_destroy_persistence_evidence_detects_foreign_handle_drift -- --nocapture`
  passed.
- `cargo test -p fast-react-reconciler --all-features passive_effects_function_component_update_metadata_execution_gate_runs_destroy_create_pair -- --nocapture`
  passed.
- `cargo test -p fast-react-reconciler --all-features root_commit_queues_function_component_passive_metadata_into_handoff_without_effects -- --nocapture`
  passed.
- `cargo test -p fast-react-reconciler --all-features root_commit_records_function_component_effect_list_phase_order_without_callbacks -- --nocapture`
  passed.
- `cargo test -p fast-react-reconciler --all-features function_component -- --nocapture`
  passed: 105 tests.
- `cargo test -p fast-react-reconciler --all-features passive -- --nocapture`
  passed: 76 tests.
- `cargo test -p fast-react-reconciler --all-features root_commit -- --nocapture`
  passed: 87 tests.
- `cargo fmt --all --check` passed.
- `cargo clippy --workspace --all-targets --all-features -- -D warnings`
  passed.
- `npm run check` passed, including Rust checks, package surface guard, import
  entrypoint smoke, benchmark checks, and workspace JS checks. npm emitted
  existing `minimum-release-age` config warnings.
- Conflict-marker scan over touched files and this report found no markers.
- `git diff --check` passed.

## Risks And Next Tasks

- The returned-destroy persistence helper is intentionally test-controlled. A
  future public passive effect executor still needs scheduler/act integration
  work before any compatibility claim can be made.
- Renderer and JS package surfaces were not changed.
