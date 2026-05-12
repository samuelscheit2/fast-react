# Worker 1049: fast-react-napi test module split

## Summary

- Extracted the large inline `#[cfg(test)] mod tests` body from `crates/fast-react-napi/src/lib.rs` into `crates/fast-react-napi/src/tests.rs`.
- Left production code behavior untouched; `lib.rs` now only declares `#[cfg(test)] mod tests;`.
- Preserved existing test module paths, names, helper functions, and `use super::*` access pattern.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
- `crates/fast-react-napi/src/tests.rs`
- `worker-progress/worker-1049-napi-tests-split.md`

## Commands Run

- `git status --short --branch`
- `rg -n "#\\[cfg\\(test\\)\\]|mod tests|#\\[test\\]|fn " crates/fast-react-napi/src/lib.rs`
- `cargo test -p fast-react-napi --lib -- --list > /tmp/fast-react-napi-tests-before.txt`
- Mechanical extraction script moving the inline test module body to `crates/fast-react-napi/src/tests.rs`.
- `cargo fmt --package fast-react-napi`
- `cargo test -p fast-react-napi --lib -- --list > /tmp/fast-react-napi-tests-after.txt && diff -u /tmp/fast-react-napi-tests-before.txt /tmp/fast-react-napi-tests-after.txt`
- `cargo test -p fast-react-napi --lib`
- `cargo fmt --all --check`
- `git diff --check && git diff --cached --check`
- `git add -N crates/fast-react-napi/src/tests.rs worker-progress/worker-1049-napi-tests-split.md && git diff --check && git diff --cached --check` followed by index cleanup.
- `wc -l crates/fast-react-napi/src/lib.rs crates/fast-react-napi/src/tests.rs`

## Evidence Gathered

- Test inventory before extraction: 81 output lines ending with `79 tests, 0 benchmarks`.
- Test inventory after extraction: 81 output lines ending with `79 tests, 0 benchmarks`.
- Inventory diff was empty, preserving all cargo-visible test names and paths.
- `cargo test -p fast-react-napi --lib` passed: 79 passed, 0 failed.
- `cargo fmt --all --check` passed.
- `git diff --check && git diff --cached --check` passed after this report was added.
- The same diff check also passed with untracked new files temporarily marked intent-to-add, so the new `tests.rs` and worker report were included in whitespace checking without staging content.
- Post-split line counts: `lib.rs` 1048 lines, `tests.rs` 6640 lines.

## Audit, Review, Or Nested-Agent Findings

- No nested agents were used.
- Manual review confirmed `lib.rs` now ends with the test module facade and the extracted file starts with the former module imports.
- No child test modules were introduced because a single facade file kept the move mechanical and lowest risk.

## Risks Or Blockers

- No blockers.
- The new `tests.rs` file must be included when merging this branch; otherwise `mod tests;` will fail compilation.
- This was intentionally behavior-preserving and did not attempt further test organization inside `src/tests/`.

## Recommended Next Tasks

- Merge alongside the `crates/fast-react-napi/src/tests.rs` addition.
- Consider future focused child-module splits only if the N-API test groups keep growing.
