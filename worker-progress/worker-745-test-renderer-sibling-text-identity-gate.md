# Worker 745: Test Renderer Sibling Text Identity Gate

## Summary

- Added a Rust-only private sibling-text `toJSON` finished-work identity gate in
  `fast-react-test-renderer`.
- Kept the generic
  `describe_private_to_json_finished_work_identity_gate_for_canary` fail-closed
  for `SiblingText` with
  `sibling-text-finished-work-identity-gate-not-implemented`.
- Added a sibling-text update route admission helper for the real
  `TestRendererSiblingTextHostOutput` handoff, separate from the regular
  host-text update helper.
- Added `TestRendererPrivateToJsonSiblingTextFinishedWorkIdentityGate`, which
  binds the route admission, Worker 738 sibling-text host-output row, private
  JSON report, committed fiber inspection, current snapshot, render/commit
  handles, and lanes to the same committed sibling-text update.
- Added fail-closed validation for stale reports, wrong host-output shape,
  mismatched route/render/commit handles, lane drift, stale snapshot, missing
  committed fiber inspection, public/native/package/JS compatibility flags, and
  broad multichild identity opening.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `worker-progress/worker-745-test-renderer-sibling-text-identity-gate.md`

## Evidence

- The dedicated sibling-text gate requires:
  - real `TestRendererSiblingTextHostOutput`
  - sibling-text route admission from that output
  - private JSON report from
    `describe_private_json_serialization_after_sibling_text_update_for_canary`
  - Worker 738 row id
    `react-test-renderer-tojson-sibling-text-host-output-private-diagnostic`
  - host-output shape `SiblingText`
  - root node kind `RootArray`
  - three real source nodes: root text, root host component, and component text
  - committed fiber inspection shape
    `HostRoot->[HostText,HostComponent->HostText]`
  - matching render/commit/report finished-work handles and lanes
  - current snapshot evidence
- The new tests prove:
  - accepted real sibling-text output/report/route admission creates the private
    identity gate
  - stale/mismatched route, report, lanes, snapshot, and committed inspection
    are rejected
  - public/native/package/JS compatibility and broad multichild identity remain
    blocked
  - the generic finished-work identity gate still rejects `SiblingText`

## Commands Run

- `cargo fmt --all` - passed and applied formatting.
- `cargo test -p fast-react-test-renderer sibling_text --all-features` -
  passed, 11 tests.
- `cargo test -p fast-react-test-renderer to_json --lib` - passed, 31 tests.
- `cargo test -p fast-react-test-renderer sibling_snapshot --all-features` -
  passed, 2 tests.
- `cargo fmt --all --check` - passed.
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
  - passed.
- `node --test tests/conformance/test/private-admission-734-736-gate.test.mjs`
  - passed, 11 tests.
- `npm run check:package-surface` - passed; npm printed the existing
  `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff --check` - passed.

## Risks Or Blockers

- No blocker remains for this Rust-only private gate.
- The gate intentionally does not promote public `toJSON`, JS/CJS facades,
  native bridge loading/execution, package compatibility, or broad multichild
  identity.
- The existing snapshot-only sibling blocker remains blocked and distinct from
  the real committed sibling-text identity gate.

## Recommended Next Tasks

- Keep public sibling-text serialization blocked until JS/native/package
  admission has real execution evidence and separate compatibility gates.
- If a future worker wants sibling-text native execution, consume this dedicated
  gate explicitly instead of reopening the generic `toJSON` identity gate.
