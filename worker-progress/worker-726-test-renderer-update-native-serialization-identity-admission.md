# Worker 726 - test renderer update native serialization identity admission

## Status
- Complete; implementation, focused verification, and full workspace check are
  passing.
- Read `WORKER_BRIEF.md` and worked only in the assigned worktree.

## Summary
- Extended private update-path `toJSON` and `toTree` native serialization
  diagnostic admission to require accepted update finished-work identity
  evidence from Worker 725.
- Reused the existing finished-work identity validator for root, current
  finished-work, lane, source-report, and public-compatibility checks.
- Fixed the audit finding where a stale Rust update route admission from an
  earlier same-root update could be paired with a later output/identity by
  binding update admission, output handoff, and identity through the scheduled
  update sequence plus render/commit/lane identity.
- Kept public `toJSON`, `toTree`, `.root`, `update`, `TestInstance`, native
  bridge/addon execution, and compatibility claims blocked.
- Kept unmount identity admission out of scope and rejected development
  multichild/sibling update evidence from the new finished-work identity
  admission path.

## Changed Files
- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `worker-progress/worker-726-test-renderer-update-native-serialization-identity-admission.md`

## Evidence
- Rust update `toJSON` native execution now rejects missing identity, wrong
  update request metadata, foreign root, lane mismatch, source-report mismatch,
  create/unmount identity kind mismatch, public compatibility flags, stale
  same-root update identity after a later update, and stale update route
  admission replayed with a later output/identity.
- Rust update `toTree` native execution now rejects missing identity,
  source-report mismatch, public compatibility flags, and stale update route
  admission replayed with a later output/identity.
- `TestRendererPrivateUpdateRouteAdmissionRecord`,
  `TestRendererUpdatedHostOutput`, and
  `TestRendererPrivateSerializationFinishedWorkIdentityGate` now carry the
  scheduled update sequence needed for same-update admission binding.
- CJS hidden `toJSON`/`toTree` native diagnostic helpers validate update
  identity against the update execution record's own private root request.
- CJS development coverage now proves update native diagnostics require
  identity, reject stale update request identity after a later request, and
  reject multichild/sibling update evidence from the identity admission path.
- Returned diagnostics keep `nativeBridgeAvailable: false`,
  `nativeExecution: false`, and `compatibilityClaimed: false`.

## Commands Run
- `cargo fmt --all`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `cargo test -p fast-react-test-renderer private_to_json_update_native_execution --lib`
- `cargo test -p fast-react-test-renderer private_to_tree_update_native_execution --lib`
- `cargo test -p fast-react-test-renderer private_to_json_native_execution --lib`
- `cargo test -p fast-react-test-renderer private_to_tree_native_execution --lib`
- `cargo test -p fast-react-test-renderer serialization_finished_work_identity --lib`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `cargo fmt --all --check`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `npm run check`
- `rg -n "^(<<<<<<<|=======|>>>>>>>)" crates/fast-react-test-renderer/src/lib.rs packages/react-test-renderer/cjs/react-test-renderer.development.js packages/react-test-renderer/cjs/react-test-renderer.production.js tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs worker-progress/worker-726-test-renderer-update-native-serialization-identity-admission.md`
- `git diff --check`

## Risks Or Blockers
- No current blockers.
- Rust now has its own scheduled update sequence binding for this private
  native serialization path; JS request-sequence validation remains in the
  hidden facade where request records exist.
- Unmount and broader multichild/sibling identity admission remain intentionally
  out of scope.

## Recommended Next Tasks
- Keep unmount native serialization identity admission blocked until it has its
  own accepted finished-work or cleanup-order proof.
- Decide separately whether broader multichild/sibling update diagnostics need
  their own identity evidence or should remain diagnostic-only.
