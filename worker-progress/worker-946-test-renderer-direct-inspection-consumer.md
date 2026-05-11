# Worker 946 - Test Renderer Direct Inspection Consumer

## Summary

- Wired the private test-renderer direct multi-child committed-fiber path to the
  accepted Worker 936 source-bound reconciler inspection.
- Added a private
  `TestRendererPrivateDirectMultiChildHostTextReconcilerInspectionEvidence`
  record and made
  `describe_private_direct_multi_child_host_text_committed_fiber_inspection_for_canary`
  require it alongside route, lifecycle, finished-work identity, and row
  identity evidence.
- Preserved public serialization, public TestInstance, native bridge/execution,
  JS/CJS/package, broad multi-child, and generic reconciler inspection blockers.
- Added regressions for missing, stale, foreign, public-claim, and
  caller-shaped direct-child reconciler evidence.

## Changed Files

- `Cargo.lock`
- `crates/fast-react-test-renderer/Cargo.toml`
- `crates/fast-react-test-renderer/src/lib.rs`
- `worker-progress/worker-946-test-renderer-direct-inspection-consumer.md`

## Exact Source-Bound Evidence Path

1. `TestRendererRoot::describe_private_direct_multi_child_host_text_reconciler_inspection_for_canary(output)`
   validates the current private multi-child host-text output.
2. It reads the committed source-current fibers from the real
   `FiberRootStore`: committed HostRoot child `HostComponent`, stable
   `HostText`, and placed sibling `HostText`.
3. It mints Worker 936 evidence with
   `record_reconciler_direct_multi_child_committed_fiber_source(&store, commit, component, stable_text, placed_text)`.
4. It consumes that source through
   `inspect_reconciler_direct_multi_child_committed_fiber_tree(&store, source)`
   and `ReconcilerDirectMultiChildCommittedFiberInspection::validate_against_store`.
5. The private test-renderer committed-fiber inspection accepts only the
   resulting source-current evidence record, while
   `inspect_test_renderer_committed_fiber_tree(&store, root_id)` remains a
   blocker for the direct adjacent-text shape.

## Commands Run

- `cargo test -p fast-react-test-renderer --all-features direct_multi_child_host_text_committed_fiber_inspection --no-run`
- `cargo fmt --all`
- `cargo test -p fast-react-test-renderer --all-features direct_multi_child_host_text_committed_fiber_inspection`
- `cargo test -p fast-react-test-renderer --all-features direct_multi_child`
- `cargo test -p fast-react-test-renderer --all-features multi_child_host_text`
- `cargo test -p fast-react-test-renderer --all-features root_private_multi_child_host_text`
- `cargo test -p fast-react-test-renderer --all-features root_private_to_json_native_execution`
- `cargo test -p fast-react-test-renderer --all-features root_private_to_tree_native_execution`
- `cargo test -p fast-react-test-renderer --all-features test_instance`
- `cargo test -p fast-react-test-renderer --all-features root_private_root_lifecycle_execution`
- `cargo test -p fast-react-reconciler --all-features direct_multi_child`
- `cargo test -p fast-react-reconciler --all-features private_fiber_inspection`
- `cargo check -p fast-react-test-renderer --all-features`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all --check`
- `npm run test:smoke`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings` (blocked by existing `fast-react-core` lint)
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features --no-deps -- -D warnings` (blocked by existing test-renderer enum-size lint)
- `git diff --name-only -- '*.js' '*.mjs' '*.cjs'`
- `git diff --check`
- `cargo test -p fast-react-test-renderer --all-features`

## Results

- Full `fast-react-test-renderer`: 182 unit tests passed; doc tests 0 passed.
- Worker 936 reconciler filters: `direct_multi_child` 11 passed;
  `private_fiber_inspection` 23 passed.
- Test-renderer focused filters passed, including direct multi-child,
  multi-child host text, native serialization, TestInstance query, and lifecycle
  filters.
- `npm run test:smoke`, `cargo check`, `cargo fmt --all --check`, and
  `git diff --check` passed.
- No JS/MJS/CJS files were touched, so there were no files for `node --check`.

## Risks Or Blockers

- This remains private evidence only. Public toJSON/toTree/TestInstance, native
  bridge/execution, JS/CJS/package compatibility, and generic direct
  multi-child inspection remain blocked.
- The Worker 936 source record is still an in-process Rust value; bit-for-bit
  clones before any currentness change remain indistinguishable. This worker
  rejects stale, foreign, caller-shaped, and blocker-tampered evidence.
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
  currently fails before the touched crate on an existing
  `fast-react-core/src/hook_state_queue.rs` `collapsible_if` lint.
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features --no-deps -- -D warnings`
  also reports an existing `large_enum_variant` lint on
  `TestRendererRootUpdateOutcome`; not changed here.

## Recommended Next Tasks

- If a future worker opens additional private direct multi-child toTree or
  TestInstance diagnostics, require this reconciler source-current evidence
  record before accepting adjacent text fibers.
- Keep public serialization/TestInstance/native compatibility blocked until
  there is separate public oracle and package-surface evidence.
