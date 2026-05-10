# Worker 730 - Test Renderer Unmount Native Cleanup Evidence

## Summary

Implemented a narrow Rust-side canary path that lets the test renderer prove
unmount native cleanup evidence with nonzero deleted ref cleanup and deleted
passive destroy metadata. Public/native compatibility remains blocked:
`public_unmount_compatibility_claimed`, host teardown compatibility, act
flushing, native bridge availability, and native execution all stay false.

## Changed Files

- `crates/fast-react-reconciler/src/lib.rs`
  - Added a hidden test-renderer unmount ref/passive cleanup canary helper.
  - The helper inserts a deleted passive FunctionComponent under the existing
    deleted HostComponent, attaches a deleted ref to the HostComponent, queues
    deleted-subtree passive unmount metadata, and records it into the commit
    after the HostRoot switch.
- `crates/fast-react-test-renderer/src/lib.rs`
  - Added an opt-in private unmount render/commit path and cleanup handoff path
    that consume the new Rust-only ref/passive cleanup canary.
  - Relaxed native bridge cleanup admission from host-only order counts to
    `ref_cleanup_return_count + passive_destroy_count + host_node_cleanup_count`.
  - Added focused acceptance and stale-count rejection tests.

## Evidence

- New nonzero cleanup evidence test:
  - `root_private_unmount_native_bridge_cleanup_handoff_carries_ref_passive_cleanup_evidence`
  - Proves `ref_cleanup_return_count == 1`, `passive_destroy_count == 1`,
    `host_node_cleanup_count == 2`, `cleanup_order_record_count == 4`, and
    ordering `ref cleanup -> passive destroy -> host cleanup`.
- New rejection test:
  - `root_private_unmount_native_bridge_admission_rejects_stale_ref_passive_cleanup_order_count`
  - Mutates the cleanup-order count back to a host-only value and verifies
    admission rejects it with `cleanup-order-count-mismatch`.
- Existing host-only/minimal unmount evidence still passes and remains minimal.

## Commands Run

- `cargo test -p fast-react-test-renderer root_private_unmount_native_bridge_cleanup_handoff_carries_ref_passive_cleanup_evidence --lib`
- `cargo test -p fast-react-test-renderer root_private_unmount_native_bridge_admission_rejects_stale_ref_passive_cleanup_order_count --lib`
- `cargo test -p fast-react-test-renderer unmount_native_bridge --lib`
- `cargo test -p fast-react-test-renderer unmount_passive_ref --lib`
- `cargo test -p fast-react-test-renderer root_host_output_canary_unmounts_committed_output_with_deletion_cleanup_diagnostics --lib`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git status --short`

## Risks And Blockers

- This remains private Rust evidence only. It intentionally does not admit
  public `unmount`, public serialization, native execution, JS bridge behavior,
  finished-work identity consumption, or multichild/sibling identity admission.
- The helper is scoped to the existing single HostComponent plus HostText
  canary shape with one inserted passive FunctionComponent. Broader unmount
  fixture shapes remain blocked.
- No JS/conformance files were touched.

## Recommended Next Tasks

- Add a later, separate identity adapter only after the orchestrator accepts
  finished-work identity for unmount. This worker did not add or consume that
  adapter.
- When public/native compatibility is intentionally opened, add JS hidden
  diagnostic coverage that still rejects identity evidence until unmount
  identity admission is explicitly owned.
