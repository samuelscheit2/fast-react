# Worker 1033: test renderer update-route split

## Summary

- Split the `TestRendererRoot` update-route, update admission, and update native bridge helper methods out of `crates/fast-react-test-renderer/src/lib.rs`.
- Added `crates/fast-react-test-renderer/src/root_impl/update_route.rs` and registered it from `root_impl/mod.rs`.
- Left create route, host-output, serialization, test-instance, unmount route, and tests in `lib.rs`.
- Left the shared `validate_private_multi_child_host_text_output_for_canary` helper in `lib.rs` because serialization, identity, and direct inspection code still call it.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-test-renderer/src/root_impl/mod.rs`
- `crates/fast-react-test-renderer/src/root_impl/update_route.rs`
- `worker-progress/worker-1033-test-renderer-update-route-split.md`

## Commands Run

- `cargo test -p fast-react-test-renderer root_private_update --lib`
- `cargo test -p fast-react-test-renderer root_private_update_native_bridge_admission --lib`
- `cargo test -p fast-react-test-renderer root_private_update_route_admission --lib`
- `cargo test -p fast-react-test-renderer --lib`
- `cargo fmt --all --check`
- `git diff --check && git diff --cached --check`
- `git -C /Users/user/Developer/Developer/fast-react status --short -- crates/fast-react-test-renderer/src/lib.rs crates/fast-react-test-renderer/src/root_impl/mod.rs crates/fast-react-test-renderer/src/root_impl/update_route.rs`

## Evidence

- `root_private_update --lib`: 10 passed, 0 failed.
- `root_private_update_native_bridge_admission --lib`: 4 passed, 0 failed.
- `root_private_update_route_admission --lib`: 1 passed, 0 failed.
- `fast-react-test-renderer --lib`: 182 passed, 0 failed.
- Formatting check passed.
- Diff whitespace checks passed.
- The root checkout scoped-file status is clean after correcting an initial apply-path mistake.

## Risks Or Blockers

- Expected merge overlap: `crates/fast-react-test-renderer/src/lib.rs` and `root_impl/mod.rs` are likely to conflict with workers 1031/1032/1034 because this worker deletes a contiguous method block and adds one module declaration.
- No behavioral change intended; this is an inherent-impl relocation only.
- No blocker remains.

## Recommended Next Tasks

- During merge, keep this worker's `mod update_route;` declaration and reconcile any neighboring `lib.rs` deletions from the other cleanup workers.
- If another worker moves the shared multi-child host-output validator, ensure all serialization and identity call sites still see it with equivalent visibility.
