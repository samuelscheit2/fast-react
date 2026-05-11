# Worker 872 - test-renderer JS lifecycle execution consumer

## Status

- Complete.

## Changes

- Added a private package-root/CJS bridge consumer for
  `fast-react-test-renderer.root.private-lifecycle-execution-evidence`.
- The consumer accepts only source-owned
  `FastReactTestRendererPrivateRootExecutionResult` rows for the create,
  update, and unmount sequence, and returns frozen private evidence while
  keeping public root, serialization, TestInstance, act, Scheduler, native
  bridge, native execution, JS package compatibility, and compatibility claims
  blocked.
- Added focused package-root and CJS coverage that consumes bridge-owned
  create/update/unmount rows, then rejects cloned, caller-built, cross-surface,
  and stale rows before any public/native/package compatibility can be implied.

## Verification

- `node --check packages/react-test-renderer/index.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
  - 36 tests passed.
- `npm run check:package-surface`
  - Passed. npm printed the existing `minimum-release-age` config warning.
- `node tests/smoke/import-entrypoints.mjs`
  - Passed.
- `git diff --check`
  - Passed.

## Evidence

- Positive path uses rows returned from the private root request bridge
  execution path and guarded by the package `WeakSet`; raw lifecycle diagnostic
  objects are not accepted as lifecycle execution evidence.
- Negative coverage proves source-owner rejection for cloned/caller-built rows,
  operation-slot rejection for cross-surface rows, and current-root history
  rejection for stale rows.

## Risks

- The consumer is intentionally narrow and only models the accepted
  create/update/unmount lifecycle evidence sequence. It does not admit broader
  multichild identity, public serializer, public root/TestInstance behavior,
  native bridge loading, public native execution, act, or Scheduler
  compatibility.
- The same private implementation is mirrored across package root and CJS
  bundles, so adjacent test-renderer bundle edits may need conflict handling.

## Recommended Next Tasks

- Keep broader public `react-test-renderer` compatibility and native bridge
  loading behind separate dual-run oracles.
- Admit additional lifecycle shapes only through new source-owned rows and
  targeted negative coverage.
