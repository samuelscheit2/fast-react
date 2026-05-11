# Worker 832 - Rust unmount/nested native execution consumer

## Progress

- Read `WORKER_BRIEF.md` and Worker 816/825 progress reports.
- Found the existing private unmount/nested source-report admission gate and the separate toJSON/toTree unmount native execution evidence paths.
- Added combined toJSON/toTree unmount+nested native execution entry points that require the gate before accepting evidence for that combined path.
- Added explicit native execution evidence fields for the consumed gate diagnostic/status constants and gate-consumption flag.
- Added focused Rust tests for accepted gate consumption plus missing/stale gate rejection.

## Verification

- `cargo test -p fast-react-test-renderer private_unmount_nested_source_report --all-targets --all-features`
  - 5 tests passed, including the new toJSON/toTree native execution gate consumers.
- `cargo test -p fast-react-test-renderer root_private_to_json_unmount --all-targets --all-features`
  - 4 tests passed.
- `cargo test -p fast-react-test-renderer root_private_to_tree_unmount --all-targets --all-features`
  - 1 test passed.
- `cargo test -p fast-react-test-renderer --all-targets --all-features`
  - 168 tests passed.
- `cargo fmt --all`
- `cargo fmt --all --check`
- `cargo check -p fast-react-test-renderer --all-targets --all-features`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `git diff --check`

## Risks

- `crates/fast-react-test-renderer/src/lib.rs` is a high-conflict file with adjacent private diagnostics from other workers.
- The combined-path consumer intentionally does not claim public toJSON/toTree/TestInstance, JS/CJS/package compatibility, native bridge loading/execution, root/act/Scheduler compatibility, or broad multichild identity.
