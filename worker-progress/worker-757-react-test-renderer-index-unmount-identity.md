# Worker 757 Progress

## Summary

- Added package-root private unmount finished-work identity admission for
  `packages/react-test-renderer/index.js` hidden `toJSON` and `toTree` facades.
- The package-root identity gate now admits `Unmount` only when the caller
  supplies the matching private unmount request plus deletion and cleanup
  handoff identity for the same request id, request sequence, root id,
  operation, and update kind.
- The gate validates the accepted host-only cleanup and ref/passive cleanup
  variants while preserving public serialization, native bridge execution,
  renderer execution, package compatibility, and public API surface blockers.
- Audit follow-up: tightened cleanup-nested deletion handoff matching so the
  nested deletion payload must match the accepted top-level deletion handoff
  across request identity, status, operation/update kind, lifecycle,
  scheduled-element evidence, cleanup counts, and public blocker flags.
- Second audit follow-up: removed the fallback that let nested cleanup deletion
  evidence stand in for the top-level deletion handoff. A distinct accepted
  top-level deletion handoff is now required.
- CJS files were inspected for parity context but intentionally left unchanged
  per worker scope; existing CJS native-unmount behavior remains a separate
  integration concern for merge sequencing.

## Changed Files

- `packages/react-test-renderer/index.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-757-react-test-renderer-index-unmount-identity.md`

## Evidence

- Package-root `validateAcceptedFinishedWorkIdentity` now maps `Unmount` to the
  private unmount root request instead of rejecting the update kind outright.
- `Unmount` identity validation rejects omitted deletion/cleanup handoff
  evidence, mismatched cleanup request sequence, stale identity sequence, and
  foreign root request identity.
- Focused package-root negative coverage now rejects contradictory nested
  cleanup deletion handoff counts and status even when request/root identity
  matches.
- Focused package-root negative coverage also rejects missing top-level
  deletion handoff evidence while a nested cleanup deletion handoff is still
  present.
- `toJSON` package-root coverage accepts the host-only cleanup variant.
- `toTree` package-root coverage accepts the ref/passive cleanup variant.
- Public serialization and tree availability remain false, native bridge and
  native execution remain false, and compatibility remains unclaimed in both
  hidden facades and returned identity records.

## Commands Run

- `node --check packages/react-test-renderer/index.js`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs --test-name-pattern "unmount|finished-work|package-root|index"`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs --test-name-pattern "unmount|finished-work|package-root|index"`
- `npm run check --workspace @fast-react/react-test-renderer`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git diff --check --no-index /dev/null worker-progress/worker-757-react-test-renderer-index-unmount-identity.md || test $? -eq 1`

## Results

- All commands passed.
- `npm` printed the existing unknown `minimum-release-age` config warning
  during npm-backed checks.

## Risks Or Blockers

- The package-root facade now has strict unmount identity admission, while the
  current CJS dev/prod native-unmount serialization paths in this worktree still
  reject unmount finished-work identity evidence. Merge integration should
  reconcile this with Worker 754 if that branch lands separately.
- This remains private diagnostic admission only. It does not implement public
  `toJSON`, public `toTree`, native bridge execution, renderer execution, or a
  compatibility claim.

## Recommended Next Tasks

- Merge with the JS/CJS unmount finished-work identity work and rerun the same
  focused conformance tests across package-root and CJS entrypoints.
- Follow with package-surface, import-smoke, and broader conformance checks
  after merge conflict resolution.
