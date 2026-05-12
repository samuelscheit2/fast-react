# Worker 1038 Test Renderer TestInstance Split

## Summary

- Split the private TestInstance/getInstance root diagnostics out of
  `crates/fast-react-test-renderer/src/lib.rs` into
  `crates/fast-react-test-renderer/src/root_impl/test_instance.rs`.
- Kept the `TestRendererRoot` public method names and behavior intact by moving
  the inherent impl methods unchanged under `root_impl`.
- Preserved the existing crate test reachability for
  `private_test_instance_class_root_query_execution_evidence_from_reports` with
  `pub(crate)` visibility after the scout note and local symbol scan confirmed a
  direct test call.
- Left JSON/tree serialization, unmount route, lifecycle execution,
  error-boundary/act, and tests untouched.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-test-renderer/src/root_impl/mod.rs`
- `crates/fast-react-test-renderer/src/root_impl/test_instance.rs`
- `worker-progress/worker-1038-test-renderer-test-instance-split.md`

## Commands Run

- `cargo fmt --all`
- `cargo test -p fast-react-test-renderer root_private_test_instance --lib`
- `cargo test -p fast-react-test-renderer root_private_get_instance --lib`
- `cargo test -p fast-react-test-renderer --lib`
- `cargo fmt --all --check`
- `git diff --check && git diff --cached --check`
- `git diff --no-index --check -- /dev/null crates/fast-react-test-renderer/src/root_impl/test_instance.rs`
- `git diff --no-index --check -- /dev/null worker-progress/worker-1038-test-renderer-test-instance-split.md`

## Evidence Gathered

- `root_private_test_instance` passed: 10 tests passed, 172 filtered.
- `root_private_get_instance` passed: 2 tests passed, 180 filtered.
- Full `fast-react-test-renderer` library suite passed: 182 tests passed.
- `cargo fmt --all --check` passed.
- `git diff --check && git diff --cached --check` passed.
- No-index whitespace checks passed for the untracked new Rust module and worker
  progress report.
- `rg` confirmed the moved TestInstance/getInstance root methods and helpers now
  live in `root_impl/test_instance.rs`; `lib.rs` retains only callers that use
  the public root facade method.

## Audit Or Scout Findings

- Scout reported one test may directly call
  `private_test_instance_class_root_query_execution_evidence_from_reports`.
  Local `rg` confirmed that direct test call in `src/tests.rs`, so the moved
  helper is `pub(crate)` while other moved helpers remain private to the module.

## Risks Or Blockers

- Expected overlap: other cleanup workers may edit `lib.rs`; this branch removes
  only the TestInstance/getInstance query diagnostics blocks and adds the module
  declaration, so merge conflicts should be mechanical around those deleted
  ranges.
- No blockers remain from this worker's scope.

## Recommended Next Tasks

- Merge with adjacent `lib.rs` split branches carefully, keeping the
  `root_impl/test_instance.rs` module declaration.
- When worker 1040 moves tests, consider narrowing the crate-visible helper if
  the direct test call is relocated or removed.
