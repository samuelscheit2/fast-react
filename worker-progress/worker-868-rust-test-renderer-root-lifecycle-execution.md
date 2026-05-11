# Worker 868 - Rust test-renderer root lifecycle execution

## Status

- Complete.

## Changes

- Added source-owned renderer IDs to private create/update/unmount native
  bridge execution rows so lifecycle consumers can reject cloned rows from
  another test renderer store, not just another root id.
- Added
  `TestRendererPrivateRootLifecycleExecutionEvidence` for private create,
  update, and unmount root lifecycle execution. The evidence records the source
  row id/status, lifecycle/update kind, host output shape, executed snapshot
  state, cleanup/update counts, source-owned acceptance flags, and explicit
  public root/serialization/test-instance/act/Scheduler/native/JS blockers.
- Added private root lifecycle execution consumers for create, update, and
  unmount rows, with validators for source row identity, renderer/root owner,
  lifecycle/kind/sequence, accepted reconciler host execution, current executed
  snapshots, detached unmount state, cleanup evidence, and blocked public/native
  compatibility claims.
- Added Rust tests proving accepted create/update/unmount rows produce snapshot
  evidence from executed state, and rejecting stale create/update rows,
  cross-surface update rows, cloned/stale unmount rows, foreign renderer owner
  rows, and public native/act compatibility claims.

## Verification

- `cargo test -p fast-react-test-renderer --all-targets --all-features root_private_root_lifecycle_execution`
  - 3 tests passed; re-run after formatting with the same result.
- `cargo test -p fast-react-test-renderer --all-targets --all-features root_private`
  - 124 tests passed; re-run after formatting with the same result.
- `cargo check -p fast-react-test-renderer --all-targets --all-features`
  - Passed after formatting.
- `cargo fmt --all --check`
  - Failed before formatting on rustfmt wrapping only.
- `cargo fmt --all`
- `cargo check -p fast-react-test-renderer --all-targets --all-features`
  - Passed on the formatted final state.
- `cargo fmt --all --check`
  - Passed on the formatted final state.
- `git diff --check`
  - Passed.

## Notes

- The implementation stays in Rust-side `fast-react-test-renderer` private
  diagnostics only. It does not unblock JS/native/public serialization/root
  APIs, public `act`, Scheduler, native bridge loading, or package
  compatibility.
- The source-owner check follows Worker 859 by using `TestRendererId`, since
  `FiberRootId` can collide across independent renderer stores.

## Risks

- `crates/fast-react-test-renderer/src/lib.rs` remains a high-conflict private
  diagnostics file.
- The new lifecycle evidence intentionally consumes only the current minimal
  single-host-text create/update path and empty-root unmount path. Broader
  shapes should be admitted through separate source-owned rows rather than
  widening this gate implicitly.
