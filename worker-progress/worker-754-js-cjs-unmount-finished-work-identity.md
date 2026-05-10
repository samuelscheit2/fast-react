# Worker 754 - JS/CJS unmount finished-work identity

## Summary

Replaced the old JS/CJS hidden-facade behavior that rejected unmount finished-work identity evidence with strict private admission for Worker 733 toJSON/toTree evidence. The CJS private native unmount serialization path now requires a current unmount finished-work identity plus accepted unmount deletion and cleanup handoff evidence, while public/native compatibility claims remain rejected.

## Changed Files

- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`

## Evidence Added

- Added CJS gate metadata for private unmount finished-work identity admission:
  - `privateUnmountFinishedWorkIdentityGateAvailable`
  - `unmountNativeExecutionFinishedWorkIdentityAdmissionWorker`
  - `unmountNativeExecutionRequiresFinishedWorkIdentity`
  - `rejectsStaleUnmountFinishedWorkIdentity`
  - `requiresUnmountDeletionCleanupHandoffEvidence`
- Added Worker 733 Rust canary ids to CJS native execution evidence lists for private toJSON and toTree unmount admission.
- Made private native unmount toJSON/toTree consume `createPrivateSerializationFinishedWorkIdentityGateResult(...)` instead of rejecting identity evidence.
- Added strict CJS validation for unmount identity request id, sequence, root id, operation, update kind, empty-root source report, cleanup handoff, deletion commit handoff, and false public/native compatibility claims.
- Extended conformance tests so unmount without identity fails, strict identity succeeds, and stale/tampered/public-claim/missing-cleanup evidence fails.
- Addressed post-audit fail-closed gaps:
  - production unmount admission records now expose the cleanup ordering fields required by unmount identity validation;
  - deletion and cleanup handoffs must carry matching request id, request sequence, and root id;
  - development and production CJS accept the Worker 733 ref/passive cleanup variant with `refCleanupReturnCount = 1`, `passiveDestroyCount = 1`, and cleanup order count `4`;
  - development now requires `passiveRefCleanupOrder.rootId` to match the deletion handoff, matching production;
  - host-only and ref/passive cleanup variants now require internally consistent counts, ordering metadata, and `minimalTreeCleanupHandoff`;
  - contradictory ref/passive cleanup counts/order with `minimalTreeCleanupHandoff: true` is rejected;
  - production now normalizes and validates the same passive/ref cleanup positional fields and ordering booleans as development;
  - cleanup-level `privateUnmountNativeBridgeCleanupHandoff.passiveRefCleanupOrder` is required and validated independently from the deletion handoff order in development and production;
  - development now reads the direct cleanup-level `refCleanupReturnCount`, `passiveDestroyCount`, and `nativeCleanupAfterRefAndPassiveOrdering` fields and requires them to match the cleanup-level passive/ref order, matching production;
  - focused tests now cover omitted/mismatched handoff identity for request id, request sequence, and root id on both deletion and cleanup handoffs, omitted/mismatched cleanup-order root identity, deletion-level contradictory ordering, missing cleanup-level order evidence, cleanup-level foreign root identity, cleanup-level contradictory ordering, stale direct cleanup counts/order fields, and blocked public/native/package-compatibility surfaces.

## Verification

- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`

All commands passed. `npm` printed the existing `minimum-release-age` config warning during npm script runs.

## Risks / Blockers

- No blockers.
- Scope intentionally stayed in JS/CJS react-test-renderer facades and focused conformance tests. Rust, React DOM, Scheduler, package manifests, and master docs were not edited.
- Package-root `packages/react-test-renderer/index.js` parity is being handled separately by Worker 757; this worker remains CJS-scoped.

## Recommended Next Tasks

- Have the integration owner compare this CJS admission surface with Worker 733 Rust evidence before merging.
- Coordinate with Worker 757 before lifting the CJS-only assertions in the conformance helpers to all entrypoints.
