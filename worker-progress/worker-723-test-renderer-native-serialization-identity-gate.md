# Worker 723 Progress

## Summary

Added a narrow create-path private native serialization admission gate for
react-test-renderer `toJSON` and `toTree` diagnostics. The Rust create native
diagnostic APIs now require an accepted
`TestRendererPrivateSerializationFinishedWorkIdentityGate` before admitting
private native diagnostic evidence. The hidden CJS helper facades now require
the same finished-work identity evidence for create native diagnostic results,
including root request id/sequence matching in the existing Worker 720 JS
validator.

Public `toJSON`, `toTree`, `.root`, `TestInstance`, `act`, root routing,
native bridge execution, native addon loading, and compatibility claims remain
blocked.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-723-test-renderer-native-serialization-identity-gate.md`

## Evidence Gathered

- Rust create-path `toJSON` native admission now rejects missing, foreign-root,
  stale-handle, lane-mismatched, public-surface-mismatched, and source-report
  mismatched finished-work identity evidence.
- Rust create-path `toTree` native admission now rejects missing and
  source-report mismatched finished-work identity evidence.
- JS hidden native diagnostic helpers now call the existing
  `createPrivateSerializationFinishedWorkIdentityGateResult` validator for
  create native `toJSON` and `toTree` diagnostic results.
- JS conformance covers missing identity, stale request sequence, foreign root,
  missing source report, and wrong public surface on create-path native
  diagnostic admission.
- Returned private diagnostics still report `nativeBridgeAvailable: false`,
  `nativeExecution: false`, and `compatibilityClaimed: false`; update and
  unmount helper semantics were left unchanged.

## Commands Run

- `cargo test -p fast-react-test-renderer serialization_finished_work_identity --lib`
- `cargo test -p fast-react-test-renderer private_to_json_native_execution --lib`
- `cargo test -p fast-react-test-renderer private_to_tree_native_execution --lib`
- `cargo test -p fast-react-test-renderer create_native_execution_requires --lib`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `cargo fmt -p fast-react-test-renderer`
- `npm run check --workspace @fast-react/react-test-renderer`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `npm run check`
- Conflict-marker scan across touched files with `rg`.
- `git diff --check`

## Risks Or Blockers

- Scope is intentionally create-path only for native serialization admission.
  Update, unmount, and multichild native diagnostic admission still use their
  existing route/host-output gates and are not promoted to finished-work
  identity admission here.
- Rust has no root request id/sequence concept for this private crate API; wrong
  request/sequence rejection is covered in the JS facade where root request
  records exist.

## Recommended Next Tasks

- Extend the same finished-work identity admission pattern to update native
  serialization diagnostics once update-path identity evidence is formally
  accepted.
- Decide whether unmount and multichild private diagnostics need distinct
  finished-work identity evidence or should remain behind their existing
  route/host-output gates until broader public serialization work starts.
