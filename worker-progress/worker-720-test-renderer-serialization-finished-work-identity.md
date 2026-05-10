# Worker 720 - test renderer serialization finished-work identity

## Status
- Complete. Read `WORKER_BRIEF.md`.
- Added the private serialization finished-work identity gate in Rust and JS.
- Wired the root package entrypoint and both CJS bundles so hidden toJSON/toTree facades can validate accepted committed HostRoot `finished_work` identity/lane evidence.
- Updated serialization and create-routing conformance gates/tests.

## Notes
- Scope remains private serialization evidence only.
- Public `create().toJSON`, `create().toTree`, `.root`, `TestInstance`, native bridge execution, and compatibility claims must stay blocked.

## Changed files
- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`

## Evidence
- Rust gate exposes `TestRendererPrivateSerializationFinishedWorkIdentityGate` with diagnostic/status constants, committed render/commit/report fiber handles, lane bit handoff data, source serialization diagnostic name, and public-blocked flags.
- Rust toJSON/toTree canaries accept matching committed HostRoot handoff evidence and fail closed for missing, foreign, stale, non-committed, and lane-mismatched evidence.
- JS hidden facades expose `validateAcceptedFinishedWorkIdentity` and `canValidateAcceptedFinishedWorkIdentity` for private toJSON/toTree only, with public serializer/root/TestInstance compatibility still false.
- Conformance local gates now require the private finished-work identity gate for toJSON and toTree readiness while public compatibility remains blocked.

## Verification
- `cargo test -p fast-react-test-renderer` passed: 134 tests.
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs` passed: 8 tests.
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs` passed: 31 tests.
- `npm run check --workspace @fast-react/react-test-renderer` passed.
- `cargo fmt --all --check` passed.
- `npm run check:package-surface` passed.
- `node tests/smoke/import-entrypoints.mjs` passed.
- `npm run check` passed.
- `git diff --check` passed.
- Conflict marker scan over touched files/report passed.

## Risks / follow-ups
- This remains metadata-only private validation. Public serialization, root, and TestInstance behavior are intentionally still blocked.
- Future native bridge work should consume the private identity gate result rather than widening the public serializer surfaces.
