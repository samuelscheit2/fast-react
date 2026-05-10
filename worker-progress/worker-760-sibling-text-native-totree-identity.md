# Worker 760: Sibling Text Native toTree Consumes Identity

## Status

- Complete.
- Worktree:
  `/Users/user/Developer/Developer/fast-react-worker-760-sibling-text-native-totree-identity`
  on branch `worker/760-sibling-text-native-totree-identity`.

## Summary

- Added a Rust-only real-output sibling-text native `toTree` diagnostic path:
  `describe_private_to_tree_after_sibling_text_update_native_execution_for_canary`.
- The path consumes the dedicated Worker 745
  `TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate`, validates it
  against the same route admission, committed finished-work handoff, lanes,
  source report identity, and public/native/package/JS blockers, then records
  that identity consumption in `toTree` native evidence.
- Preserved the generic sibling-text finished-work identity fail-closed behavior
  for both `toJSON` and `toTree`.
- Kept the snapshot-only sibling-text diagnostic path blocked and distinct from
  the real committed sibling-text handoff path.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `worker-progress/worker-760-sibling-text-native-totree-identity.md`

## Evidence

- New `toTree` native evidence records:
  - `source_finished_work_identity_diagnostic_name`
  - `consumes_private_sibling_text_finished_work_identity_gate`
- The real sibling-text `toTree` path requires:
  - real `TestRendererSiblingTextHostOutput`
  - accepted sibling-text update route admission
  - Worker 745 sibling-text finished-work identity gate
  - matching route/render/commit/report handles and lanes
  - current sibling-text host output snapshot
  - sibling-text host output row shape
  - composite-above-multichild `toTree` rendered shape
  - closed public serialization, native bridge/execution, package, JS/CJS, and
    compatibility blockers through the consumed identity gate
- Added tamper coverage for missing identity, wrong source report, wrong
  surface, route/identity mismatch, stale route handoff, lane mismatch,
  package/public claim, stale output snapshot, and generic `toTree` sibling-text
  identity rejection.

## Commands Run

- `cargo test -p fast-react-test-renderer to_tree --all-features --no-run` -
  passed.
- `cargo test -p fast-react-test-renderer sibling_text --all-features` -
  passed, 16 tests.
- `cargo test -p fast-react-test-renderer to_tree --all-features` - passed,
  12 tests.
- `cargo test -p fast-react-test-renderer to_json --all-features` - passed,
  33 tests.
- `cargo fmt --all` - passed and applied formatting.
- `cargo fmt --all --check` - passed.
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
  - passed.
- `npm run check:package-surface` - passed; npm printed the existing unknown
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Risks Or Blockers

- No blocker remains for this Rust-only private diagnostic path.
- This does not open public `toTree`, public serialization, JS/CJS facades,
  native bridge loading/execution, package compatibility, or broad
  multichild/sibling admission.
- The path intentionally consumes Worker 745's `toJSON` sibling-text identity
  gate as the source finished-work identity proof instead of widening the
  generic serialization identity gate.

## Recommended Next Tasks

- Keep public sibling-text `toTree`/`toJSON` serialization blocked until
  separate JS/native/package execution evidence exists.
- Future sibling-text native diagnostics should consume the dedicated Worker 745
  gate instead of opening generic `SiblingText` finished-work identity.
