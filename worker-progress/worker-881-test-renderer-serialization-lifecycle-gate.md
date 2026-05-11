# Worker 881 - test-renderer serialization lifecycle gate

Date: 2026-05-11

## Status

- Complete.

## Changes

- Hardened package-root and CJS private `react-test-renderer` serialization
  currentness so unmount `toJSON` and `toTree` admission requires source-owned
  Worker 872 root lifecycle execution evidence.
- Stored consumed lifecycle execution evidence in package-local `WeakSet`
  ownership gates and threaded optional lifecycle evidence through the private
  serialization/native execution facade methods.
- Added current-root validation for create, latest update before unmount, and
  unmount lifecycle rows, including stale, cloned, cross-entrypoint, and
  public/native/package claim rejection.
- Kept public serialization, TestInstance, root/act/Scheduler compatibility,
  native bridge/public execution, and broad multichild identity blocked.
- Updated unmount serialization fixtures to include accepted lifecycle evidence
  and valid empty-root unmount source rows for package-root and CJS coverage.

Audit follow-up:

- Aligned CJS development and production finished-work identity currentness with
  package root by applying the latest scheduled request check to all operations
  and requiring unmount deletion/cleanup handoff identity evidence.
- Closed the raw private serialization bypass by threading source-owned
  lifecycle evidence through `serializeAcceptedHostOutputDiagnostic`,
  `createAcceptedHostOutputDiagnosticResult`, and
  `serializeAcceptedTreeMetadata`; accepted unmount raw serialization now fails
  before returning output unless the same lifecycle evidence gate accepts it.
- Strengthened `toTree` negative coverage for cloned lifecycle evidence and raw
  unmount serialization without lifecycle evidence.

Second audit follow-up:

- Closed the `privateToTreeHostOutputMetadataSymbol` bypass by threading the
  same lifecycle evidence/currentness check through
  `canDescribeAcceptedHostOutputDiagnostic` and
  `describeAcceptedHostOutputDiagnostic` in package root, CJS development, and
  CJS production.
- Added focused negative coverage for that metadata object so an unmount
  `toTree` report cannot return accepted metadata without source-owned
  create/latest-update/unmount lifecycle evidence.

## Verification

Final audit follow-up re-run:

- `node --check packages/react-test-renderer/index.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
  - 37 tests passed.
- `npm run check:package-surface`
  - Passed. npm printed the existing `minimum-release-age` config warning.
- `node tests/smoke/import-entrypoints.mjs`
  - Passed.
- `git diff --check`
  - Passed.

## Evidence

- Positive coverage consumes bridge-owned create/update/unmount execution rows,
  passes the resulting lifecycle evidence into private serialization
  currentness, and asserts the finished-work identity records the lifecycle
  evidence and latest-update-before-unmount acceptance.
- Negative coverage rejects missing lifecycle evidence, cloned evidence,
  public/native/package compatibility claims, stale evidence after a later
  unmount, cross-entrypoint evidence, and stale update evidence when a newer
  update precedes unmount.
- Package-root unmount currentness now accepts the unmount-specific cleanup and
  deletion handoff shape already admitted by the private unmount bridge while
  still matching it back to the source unmount request.
- Raw `toJSON`/`toTree` unmount serialization uses the renderer create request
  to validate the same source-owned create/latest-update/unmount lifecycle
  evidence before returning `null` or a raw diagnostic result.
- The separate `toTree` host-output metadata object now uses the same unmount
  lifecycle evidence gate before reporting accepted metadata.

## Risks

- The lifecycle gate is intentionally narrow and only covers unmount
  serialization currentness after accepted create/update/unmount lifecycle
  execution. Broader public compatibility and native execution remain separate
  blocked surfaces.
- The package root and CJS bundles are edited in parallel; adjacent
  `react-test-renderer` private admission work may need careful conflict
  handling.
