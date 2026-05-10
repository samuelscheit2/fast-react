# Worker 749: Sibling Text Native toJSON Consumes Identity

## Status

- Complete.
- Worktree:
  `/Users/user/Developer/Developer/fast-react-worker-749-sibling-text-native-tojson-consumes-identity`
  on branch `worker/749-sibling-text-native-tojson-consumes-identity`.

## Summary

- Added a Rust-only real-output sibling-text native `toJSON` diagnostic path:
  `describe_private_to_json_after_sibling_text_update_native_execution_for_canary`.
- The new path requires
  `TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate` from Worker
  745, validates it against the real sibling-text output, route admission,
  committed finished-work handoff, lanes, source JSON report identity, and
  public/native/package/JS blockers, then records identity consumption in the
  native `toJSON` evidence.
- Preserved the existing snapshot-based sibling-text diagnostic path and Worker
  735 blocker behavior. Snapshot diagnostics still do not consume sibling-text
  finished-work identity.
- Kept the generic `SiblingText` finished-work identity gate fail-closed.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `worker-progress/worker-749-sibling-text-native-tojson-consumes-identity.md`

## Evidence

- New native evidence fields record the source finished-work identity
  diagnostic and whether the private sibling-text identity gate was consumed.
- The real-output sibling-text native `toJSON` path sets:
  - `source_finished_work_identity_diagnostic_name` to
    `TEST_RENDERER_PRIVATE_TO_JSON_SIBLING_TEXT_IDENTITY_DIAGNOSTIC_NAME`
  - `consumes_private_sibling_text_finished_work_identity_gate` to `true`
- The snapshot sibling-text diagnostic path continues to report no identity
  source and no sibling identity-gate consumption.
- Added tamper coverage for missing identity, wrong source report, route/identity
  handoff drift, stale route handoff, public/native claim, and stale output
  snapshot.
- Existing generic `SiblingText` finished-work identity rejection remains
  covered by
  `root_private_to_json_sibling_text_report_fails_closed_in_generic_finished_work_identity_gate`.

## Commands Run

- `cargo fmt --all` - passed.
- `cargo test -p fast-react-test-renderer sibling_text --all-features` -
  passed, 13 tests.
- `cargo test -p fast-react-test-renderer to_json --all-features` - passed,
  33 tests.
- `cargo fmt --all --check` - passed.
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
  - passed.
- `npm run check:package-surface` - passed; npm printed the existing unknown
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" crates/fast-react-test-renderer/src/lib.rs worker-progress/worker-749-sibling-text-native-tojson-consumes-identity.md`
  - passed with no matches.

## Risks Or Blockers

- No blockers.
- This remains Rust-only/private. It does not open public serialization,
  JS/CJS admission, native bridge loading/execution, package compatibility, or
  broad multichild/sibling identity admission.
- The snapshot sibling-text path remains diagnostic-only and identity-blocked.

## Recommended Next Tasks

- Keep public sibling-text serialization and native bridge/package admission
  blocked until separate JS/native/package execution evidence exists.
- Continue consuming the dedicated sibling-text identity gate for any future
  sibling-text native diagnostics instead of widening the generic
  finished-work identity gate.
