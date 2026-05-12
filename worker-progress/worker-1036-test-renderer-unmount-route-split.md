# Worker 1036 - Test Renderer Unmount Route Split

## Summary

- Moved the private unmount deletion commit handoff, native bridge admission, and cleanup handoff execution methods out of `crates/fast-react-test-renderer/src/lib.rs`.
- Added `crates/fast-react-test-renderer/src/root_impl/unmount_route.rs` and registered it from `root_impl/mod.rs`.
- Kept the shared passive/ref cleanup ordering evidence helper and deletion handoff validator private in `lib.rs` because serialization and nested unmount identity code still consume them.
- Kept `TestRendererRoot` method names and public visibility unchanged for public canary callers.
- Kept lifecycle, serialization, test instance, act/error boundary, and test modules in `lib.rs`.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-test-renderer/src/root_impl/mod.rs`
- `crates/fast-react-test-renderer/src/root_impl/unmount_route.rs`
- `worker-progress/worker-1036-test-renderer-unmount-route-split.md`

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-test-renderer root_private_unmount --lib`
- `cargo test -p fast-react-test-renderer root_unmount --lib`
- `cargo test -p fast-react-test-renderer --lib`
- `cargo fmt --all --check`
- `git diff --check && git diff --cached --check`

## Evidence Gathered

- `root_private_unmount` passed: 16 passed, 0 failed.
- `root_unmount` passed: 4 passed, 0 failed.
- Full `fast-react-test-renderer --lib` passed: 182 passed, 0 failed.
- Formatting check passed.
- Diff whitespace checks passed.

## Audit / Review Notes

- No nested agents were used.
- After the scout note, the two shared helpers stayed private in `lib.rs`; no helper visibility widening was needed.
- The split is behavior-preserving: code was moved without changing control flow or diagnostics payload fields.

## Risks / Blockers

- Expected overlap: workers 1037-1040 may also edit `crates/fast-react-test-renderer/src/lib.rs`; this branch deletes a large contiguous unmount-route block from that file and adds `root_impl/unmount_route.rs`.
- Merge coordination may need to reconcile nearby `impl TestRendererRoot` deletions if other workers move adjacent lifecycle, serialization, or test code.
- No blockers remain in this worktree.

## Recommended Next Tasks

- During orchestration merge, prefer preserving the new `root_impl/unmount_route.rs` module and only adjust helper visibility if other workers move the remaining lib.rs consumers into sibling modules.
