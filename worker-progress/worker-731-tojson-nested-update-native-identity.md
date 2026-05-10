# Worker 731 - toJSON nested update native identity

## Status
- Complete after audit follow-up.
- Read `WORKER_BRIEF.md` and worked only in the assigned worktree.

## Summary
- Added finished-work identity admission to the private nested update `toJSON`
  native execution diagnostic path.
- Bound nested route admission, render/commit handoff, identity handles,
  scheduled update sequence, and finished lanes to the same update.
- Kept the path Rust-only and private canary/diagnostic only; no JS/CJS
  facades, package manifests, public exports, conformance, sibling snapshot
  serialization, unmount, or `toTree` paths were changed.

## Changed Files
- `crates/fast-react-test-renderer/src/lib.rs`
- `worker-progress/worker-731-tojson-nested-update-native-identity.md`

## Evidence
- Existing private update `toJSON`/`toTree` native execution paths already use
  `validate_private_serialization_finished_work_identity_for_native_execution`.
- Existing nested `toJSON` native execution consumed only route metadata plus
  nested host-parent placement evidence and did not require finished-work
  identity.
- Added the nested output scheduled update sequence, a nested update admission
  handoff validator, identity admission for nested `toJSON` native execution,
  and focused rejection coverage for missing identity, stale identity, stale
  route sequence, handoff mismatch, lane mismatch, and route metadata mismatch.
- The success test now passes accepted identity evidence and still proves
  nested/multichild host output row consumption while public/native
  compatibility remains blocked.
- Audit follow-up added two targeted negatives where the identity remains
  internally self-consistent enough to pass the reused finished-work identity
  validator, then fails only in nested handoff comparison:
  `update-admission-finished-work-identity-mismatch` for render-current /
  commit-previous-current drift, and
  `update-admission-finished-work-identity-lane-mismatch` for lane drift.

## Commands Run
- `cargo test -p fast-react-test-renderer root_private_to_json_nested_update_native_execution --lib`
  - Failed before adjusting the nested identity test helper because the generic
    serialization gate fiber inspection only accepts the single-host-text
    shape.
- `cargo test -p fast-react-test-renderer root_private_to_json_nested_update_native_execution --lib`
  - Passed: 2 passed, 0 failed.
- `cargo fmt --all`
  - Passed.
- `cargo test -p fast-react-test-renderer private_to_json_native_execution --lib`
  - Passed: 3 passed, 0 failed.
- `cargo test -p fast-react-test-renderer serialization_finished_work_identity --lib`
  - Passed: 10 passed, 0 failed.
- `cargo test -p fast-react-test-renderer to_json --lib`
  - Passed: 22 passed, 0 failed.
- `cargo fmt --all --check`
  - Passed.
- `git diff --check`
  - Passed.
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" crates/fast-react-test-renderer/src/lib.rs worker-progress/worker-731-tojson-nested-update-native-identity.md`
  - Passed with no matches (`rg` exit 1).
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
  - Passed.
- Audit follow-up:
  `cargo test -p fast-react-test-renderer root_private_to_json_nested_update_native_execution --lib`
  - Passed: 2 passed, 0 failed.
- Audit follow-up: `cargo fmt --all --check`
  - Passed.
- Audit follow-up:
  `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
  - Passed.
- Audit follow-up: `git diff --check`
  - Passed.
- Audit follow-up:
  `rg -n "^(<<<<<<<|=======|>>>>>>>)" crates/fast-react-test-renderer/src/lib.rs worker-progress/worker-731-tojson-nested-update-native-identity.md`
  - Passed with no matches (`rg` exit 1).

## Risks Or Blockers
- No blockers.
- The generic serialization gate fiber-inspection report remains limited to the
  existing minimal single-host-text shape, so the nested test helper builds the
  accepted private identity from the nested commit handoff and nested row
  evidence before passing it through the native-execution validator.
- Public `toJSON`, native bridge execution, and compatibility claims remain
  blocked.

## Recommended Next Tasks
- If nested `toJSON` serialization needs first-class source-report identity
  generation later, extend the committed fiber inspection/report model for
  nested host trees in a dedicated worker.
