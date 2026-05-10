# Worker 672 - Test Renderer Unmount Passive Ref Order

Goal status: active
Goal objective: add private react-test-renderer unmount evidence that ties native cleanup to ref detachment and passive destroy ordering for the minimal tree, while public unmount behavior remains blocked

## Summary

- Added `TestRendererUnmountPassiveRefCleanupOrderEvidence` in `fast-react-test-renderer` and threaded it through deletion commit handoff, native bridge admission, and native cleanup handoff diagnostics.
- The current minimal test-renderer tree remains host-only: `ref_cleanup_return_count = 0`, `passive_destroy_count = 0`, `host_node_cleanup_count = 2`, `cleanup_order_record_count = 2`. The evidence ties native cleanup to the reconciler order gate without claiming public unmount, ref/effect compatibility, public effect flushing, or act flushing.
- Added Rust validation so native admission rejects a passive/ref order mismatch with `passive-ref-cleanup-order-mismatch` and rejects public/ref/effect claims with `passive-ref-cleanup-order-public-claim`.
- Threaded the worker-672 gate into the CJS development private unmount metadata and root execution bridge. Production CJS conformance assertions remain compatible with the older metadata because production was outside this worker write scope.
- Added conformance fixtures/assertions for the new private passive/ref cleanup order evidence and a negative JS admission case.

## Subagent Note

Explorer `test_renderer_unmount_ref_passive_feasibility` found that producing nonzero ref cleanup or passive destroy records for this minimal tree is blocked within this worker's write scope because it would require changes outside `fast-react-test-renderer`/the CJS dev bridge, notably in reconciler behavior or package wiring. This implementation therefore records truthful host-only minimal-tree evidence instead of fabricating nonzero ref/passive counts.

## Verification

- `cargo fmt --all --check` passed.
- Exact requested cargo command `cargo test -p fast-react-test-renderer --all-features unmount passive ref -- --nocapture` failed before running tests because Cargo accepts only one test filter: `unexpected argument 'passive'`.
- `cargo test -p fast-react-test-renderer --all-features root_private_unmount_passive_ref_order_rejects_native_cleanup_mismatch -- --nocapture` passed.
- `cargo test -p fast-react-test-renderer --all-features root_private_unmount_native_bridge_admission_executes_minimal_cleanup_handoff -- --nocapture` passed.
- `cargo test -p fast-react-test-renderer --all-features unmount -- --nocapture` passed: 17 passed.
- `cargo test -p fast-react-test-renderer --all-features passive -- --nocapture` passed: 2 passed.
- `cargo test -p fast-react-test-renderer --all-features ref -- --nocapture` passed: 10 passed.
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs` passed: 25 passed.
- `npm run check --workspace @fast-react/react-test-renderer` passed.
- `git diff --check` passed.
