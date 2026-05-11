# Worker 859 - Rust test-renderer native consumer hardening

## Status

- Complete.

## Changes

- Hardened the Rust private unmount+nested source-report admission gate with
  source-owned renderer owner IDs, toJSON identity surfaces/source diagnostic
  IDs, durable nested/unmount host-output row IDs, and scheduled update
  sequences.
- Tightened the toJSON/toTree unmount+nested native execution consumer so the
  gate must match the current unmount renderer, sequence, row ID, empty-root
  unmount shape, nested source-report row ID, cleanup counts, and closed public
  native/package surfaces before it can be consumed.
- Added positive assertions that the accepted gate carries source-owned nested
  and unmount row IDs, identity surfaces, source diagnostics, renderer owners,
  and update sequences.
- Added negative Rust tests for cross-surface toJSON/toTree identity mismatch,
  wrong unmount pairing, stale gate/execution sequence, self-paired cloned
  gates, caller-built/missing durable row IDs, cross-surface caller-built gate
  fields, and missing nested shape counts.

## Verification

- `cargo test -p fast-react-test-renderer root_private_unmount_nested_source_report --all-targets --all-features`
  - 8 tests passed.
- `cargo test -p fast-react-test-renderer root_private_to_json_unmount --all-targets --all-features`
  - 4 tests passed.
- `cargo test -p fast-react-test-renderer root_private_to_tree_unmount --all-targets --all-features`
  - 1 test passed.
- `cargo test -p fast-react-test-renderer --all-targets --all-features`
  - 171 tests passed.
- `cargo check -p fast-react-test-renderer --all-targets --all-features`
  - Passed.
- `cargo fmt --all`
- `cargo fmt --all --check`
  - Passed.
- `git diff --check`
  - Passed.

## Notes

- Optional `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
  still fails on the existing `clippy::large_enum_variant` lint for
  `TestRendererRootUpdateOutcome::Scheduled(TestRendererRootScheduledUpdate)`.
  I left that broader enum/API refactor out of this scoped hardening patch.
- Public serialization, JS/CJS/package compatibility, native bridge loading or
  public native execution, root/act/Scheduler compatibility, and broad
  multichild identity remain blocked.

## Risks

- `crates/fast-react-test-renderer/src/lib.rs` remains a high-conflict file
  with adjacent private admission and native execution work.
- The source-owner guard uses `TestRendererId` because `FiberRootId` is
  store-local and can collide across independent test renderer roots.

## Recommended Next Tasks

- Keep Workers 844/853 package-root JS native parity separate from this Rust
  private consumer path.
- Address the existing `TestRendererRootUpdateOutcome` clippy enum-size lint in
  a dedicated maintenance change if clippy is intended to be a hard gate for the
  crate.
