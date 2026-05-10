# Worker 725 - test renderer update serialization finished-work identity

## Status
- Complete after audit follow-up.
- Read `WORKER_BRIEF.md` and worked only in the assigned worktree.

## Summary
- Added private update-path finished-work identity evidence for
  react-test-renderer `toJSON` and `toTree` serialization diagnostics.
- Kept update, unmount, multichild, and native execution admission unchanged.
- Tightened the hidden JS finished-work identity validator so update
  serialization evidence must be validated against the matching private update
  request id/sequence, not the original create request.
- Audit follow-up: the JS validator now also rejects stale same-root update
  request evidence when a later scheduled create/update/unmount request exists.
  The local gate source check requires that latest scheduled request guard.
- Audit follow-up: `toTree` private identity coverage now mirrors the `toJSON`
  fail-closed checks for missing evidence, missing root fields, stale root
  sequence, foreign root, missing source report, stale handles, stale lanes, and
  wrong evidence kind.
- Kept public `toJSON`, `toTree`, `.root`, `update`, `TestInstance`, native
  addon loading, and compatibility claims blocked.

## Changed Files
- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-725-test-renderer-update-serialization-finished-work-identity.md`

## Evidence
- Rust now has focused update `toJSON` and update `toTree` committed handoff
  identity tests that assert `HostOutputUpdateKind::Update`, render-current to
  commit-previous-current identity, finished-work to commit-current identity,
  lane handoff, committed fiber inspection, and public-blocked flags.
- Rust has a stale update identity rejection that fails when a later update has
  already advanced the committed HostRoot current.
- Hidden JS `validateAcceptedFinishedWorkIdentity` and
  `canValidateAcceptedFinishedWorkIdentity` accept an optional private source
  root request. Update evidence now fails without the update request, passes
  with the matching update request, and rejects stale update request sequences.
- Hidden JS update identity evidence now fails if it is tied to an older update
  request after a later same-root update has been scheduled; fresh evidence tied
  to the later update still passes for both `toJSON` and `toTree`.
- The JS validator rejects foreign roots, unscheduled requests, wrong request
  operation for the source host output kind, unmount identity, public
  compatibility flags, stale handles, stale source reports, and lane mismatch.
- `toTree` now has explicit local regression coverage for the same missing,
  stale, foreign, and lane-mismatch identity evidence categories as `toJSON`.

## Commands Run
- `node --check packages/react-test-renderer/index.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `cargo test -p fast-react-test-renderer serialization_finished_work_identity --lib`
- `cargo test -p fast-react-test-renderer private_to_json_native_execution --lib`
- `cargo test -p fast-react-test-renderer private_to_tree_native_execution --lib`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `npm run check --workspace @fast-react/react-test-renderer`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check`
- Conflict-marker scan over touched files and this report with `rg`
- `git diff --check`

## Risks Or Blockers
- No blockers.
- This is private evidence only. Update-native serialization admission is still
  intentionally not widened and should remain a separate worker.
- JS request id/sequence validation exists only in hidden private facades where
  root request records are available; the Rust crate still has no JS request id
  concept.

## Recommended Next Tasks
- A later update-native-admission worker can require this update identity gate
  before admitting update native `toJSON`/`toTree` diagnostic results.
- Keep unmount identity out of admission until a dedicated unmount identity
  proof is scoped and fail-closed separately.
