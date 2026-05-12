# Worker 1040: test renderer tests module split

## Summary

- Kept `crates/fast-react-test-renderer/src/tests.rs` as the test hub with shared helpers and child `mod` declarations.
- Moved all 182 test functions into focused child modules under `crates/fast-react-test-renderer/src/tests/`.
- Left production code untouched and preserved test function names.

## Changed Files

- `crates/fast-react-test-renderer/src/tests.rs`
- `crates/fast-react-test-renderer/src/tests/create_route.rs`
- `crates/fast-react-test-renderer/src/tests/host_config.rs`
- `crates/fast-react-test-renderer/src/tests/host_output.rs`
- `crates/fast-react-test-renderer/src/tests/json_serialization.rs`
- `crates/fast-react-test-renderer/src/tests/root_facade_scheduler.rs`
- `crates/fast-react-test-renderer/src/tests/root_lifecycle.rs`
- `crates/fast-react-test-renderer/src/tests/serialization_identity.rs`
- `crates/fast-react-test-renderer/src/tests/test_instance.rs`
- `crates/fast-react-test-renderer/src/tests/tree_serialization.rs`
- `crates/fast-react-test-renderer/src/tests/unmount.rs`
- `crates/fast-react-test-renderer/src/tests/update_route.rs`
- `worker-progress/worker-1040-test-renderer-tests-modules-split.md`

## Commands Run

- `perl -ne 'if (/^#\[test\]/) {$p=1; next} if ($p && /^fn ([A-Za-z0-9_]+)\(/) { print "$1\n"; $p=0 }' crates/fast-react-test-renderer/src/tests.rs > /tmp/fast-react-test-renderer-test-names.before`
- `cargo fmt --all`
- `perl -ne 'if (/^#\[test\]/) {$p=1; next} if ($p && /^fn ([A-Za-z0-9_]+)\(/) { print "$1\n"; $p=0 }' crates/fast-react-test-renderer/src/tests.rs crates/fast-react-test-renderer/src/tests/*.rs | sort | diff -u /tmp/fast-react-test-renderer-test-names.before.sorted -`
- `cargo test -p fast-react-test-renderer --lib`
- `cargo fmt --all --check`
- `git diff --check && git diff --cached --check`
- `rg -n "^fn [A-Za-z0-9_]+\(" crates/fast-react-test-renderer/src/tests.rs crates/fast-react-test-renderer/src/tests/*.rs`

## Evidence Gathered

- Test inventory: 182 `#[test]` functions before and 182 after; sorted name set matched exactly.
- Strict function inventory: 222 `^fn [A-Za-z0-9_]+\(` matches before and 222 after; sorted name set matched exactly.
- `cargo test -p fast-react-test-renderer --lib`: passed, 182 tests passed.
- `cargo fmt --all --check`: passed.
- `git diff --check && git diff --cached --check`: passed.

## Audit Or Review Findings

- No nested agents were used.
- Scout update confirmed the desired shape: keep `src/tests.rs` as a hub, add `src/tests/` child modules, use `use super::*`, and avoid production changes. This implementation follows that shape.

## Risks Or Blockers

- Merge overlap risk is limited to `crates/fast-react-test-renderer/src/tests.rs` if other workers edit the same test hub. Production `TestRendererRoot` impl work by workers 1036-1039 should not conflict with these test-only files, except for normal compile fallout if APIs move.
- Some repeated host-output and serialization domains appeared in multiple places in the original file; they are grouped by focused domain modules while preserving each moved block's test names and relative order within its module.

## Recommended Next Tasks

- Re-run `cargo test -p fast-react-test-renderer --lib` after the production `TestRendererRoot` impl-split branches are merged.
- If future test additions target these areas, add them directly to the matching child module instead of growing `tests.rs`.
