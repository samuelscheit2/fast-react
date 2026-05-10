# Worker 306 - Test Renderer TestInstance Private Wrapper Skeleton

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective:
  `Add a private ReactTestInstance wrapper skeleton backed by committed fiber inspection metadata. It should expose deterministic private records for root/type/props/children queries while public renderer.root and query methods remain blocked.`
- `ORCHESTRATOR.md` was not read.
- No nested agents were spawned.

## Summary

- Added a frozen, symbol-keyed private TestInstance wrapper skeleton to each
  `react-test-renderer` entrypoint renderer object.
- The private skeleton is backed by worker 235 committed-fiber inspection
  metadata and exposes deterministic record-only `root`, `type`, `props`, and
  `children` query records for the accepted HostRoot -> HostComponent ->
  HostText canary shape.
- Kept public behavior blocked: `renderer.root`, `toJSON`, `toTree`, update,
  unmount, getInstance, flushSync, public TestInstance query methods, native
  bridge loading, and compatibility claims remain unavailable.
- Kept public package surface keys stable. The new record is stored under
  `Symbol.for("fast.react_test_renderer.private_test_instance_wrapper_record")`
  and is non-enumerable.
- Updated the serialization local gate so private record-only TestInstance
  diagnostics are not counted as public TestInstance wrapper support.

## Changed Files

- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `worker-progress/worker-306-test-renderer-testinstance-private-wrapper-skeleton.md`

## Evidence Gathered

- Required files read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Required worker context inspected:
  - Worker 235: accepted read-only committed-fiber inspection over HostRoot,
    HostComponent, and HostText canary fibers.
  - Worker 267: public TestInstance query and serialization surfaces remain
    fail-closed.
  - Worker 291: private serialization diagnostics are ready while public
    serialization compatibility remains blocked.
- `crates/fast-react-reconciler/src/private_fiber_inspection.rs` tests confirm
  the committed-fiber inspection metadata source and exact canary shape.
- Package-surface and import-smoke checks confirmed the symbol-backed private
  record did not add public string keys or public resolver files.

## Commands Run

```sh
create_goal
get_goal
sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
git status --short
rg --files | rg 'worker-progress/worker-(235|267|291)|private_fiber_inspection|react-test-renderer|test-renderer'
rg -n '<react-test-renderer/TestInstance/inspection patterns>' packages tests crates
sed -n '<ranges>' worker-progress/worker-235-test-renderer-private-fiber-inspection.md
sed -n '<ranges>' worker-progress/worker-267-test-renderer-testinstance-query-blocked-gate.md
sed -n '<ranges>' worker-progress/worker-291-test-renderer-serialization-local-gate-ready-private.md
sed -n '<ranges>' packages/react-test-renderer/index.js
sed -n '<ranges>' tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
sed -n '<ranges>' tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
sed -n '<ranges>' crates/fast-react-reconciler/src/private_fiber_inspection.rs
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
npm run check:package-surface
node tests/smoke/import-entrypoints.mjs
npm run check:js
git add -N worker-progress/worker-306-test-renderer-testinstance-private-wrapper-skeleton.md
git diff --check
```

## Verification Results

- `node --check` passed for all touched JS/MJS files.
- Focused create routing gate test passed: 6 tests.
- Focused serialization local gate test passed: 5 tests.
- `npm run check:package-surface`: passed.
- `node tests/smoke/import-entrypoints.mjs`: passed.
- `npm run check:js`: passed, including package surface, import smoke,
  benchmark gates, workspace checks, native loader guards, and 560 conformance
  tests.
- `git diff --check`: passed after marking the new worker report
  intent-to-add.
- npm printed the existing `minimum-release-age` config warning during npm
  commands; it did not affect results.

## Risks Or Blockers

- The private wrapper skeleton is static JS metadata for the accepted canary
  shape. It does not execute Rust, load a native bridge, or inspect live
  committed fibers from JS.
- The canary record uses placeholder `span`, `{}`, and `hello` values that
  mirror accepted private JSON/fiber diagnostics; broader shapes need real
  bridge-backed data.
- The symbol key is intentionally private diagnostic surface, not a public
  TestInstance API. Future public wrapper work must add explicit admissions and
  keep compatibility claims blocked until dual-run evidence exists.

## Recommended Next Tasks

1. Wire private JS create/update/unmount records to an accepted native/Rust
   bridge before replacing any static canary metadata.
2. Add public `toJSON`, `toTree`, and TestInstance wrapper gates separately so
   partial private readiness cannot become a broad compatibility claim.
3. Extend committed-fiber inspection and private records only after broader
   child reconciliation supports more than the single canary tree.
