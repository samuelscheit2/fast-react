# Worker 334 - Test Renderer TestInstance Private Query Path

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective:
  `Extend the private TestInstance wrapper skeleton with deterministic query metadata over accepted committed fiber inspection records, keeping public .root, find*, and serialization behavior fail-closed.`
- No nested managed agents were spawned.

## Summary

- Extended the private symbol-backed TestInstance wrapper skeleton in all
  `react-test-renderer` entrypoints with deterministic query-path metadata for
  the accepted HostRoot -> HostComponent -> HostText committed-fiber inspection
  shape.
- Added private inspection records, query traversal metadata, a single accepted
  HostComponent query candidate, a skipped HostText record, and private
  metadata rows for `find`, `findAll`, `findByType`, `findAllByType`,
  `findByProps`, and `findAllByProps`.
- Kept public behavior fail-closed: renderer `.root`, public `find*` access
  through `.root`, `toJSON`, `toTree`, native bridge execution, and compatibility
  claims remain blocked.
- Refreshed the local serialization/error gates so private query-path metadata
  is recognized only as private diagnostic evidence, not public TestInstance
  wrapper support.

## Changed Files

- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `worker-progress/worker-334-test-renderer-testinstance-private-query-path.md`

## Evidence Gathered

- Required context read: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Required worker context inspected:
  - Worker 235: accepted read-only committed-fiber inspection over the
    HostRoot/HostComponent/HostText canary.
  - Worker 267: public TestInstance query and serialization surfaces remain
    fail-closed.
  - Worker 291: private serialization diagnostics are ready while public
    serialization compatibility remains blocked.
  - Worker 306: current private symbol-backed TestInstance wrapper skeleton.
  - Worker 309: error-surface local gate admits only private diagnostics.
- Upstream React 19.2.6 source was inspected locally for TestInstance query
  traversal: wrapper nodes are searched, HostText children are string children
  and skipped by query recursion, and `find`/`findBy*` use `expectOne` over
  `findAll*` with `deep: false`.

## Commands Run

```sh
create_goal
get_goal
sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
sed -n '<ranges>' worker-progress/worker-235-test-renderer-private-fiber-inspection.md
sed -n '<ranges>' worker-progress/worker-267-test-renderer-testinstance-query-blocked-gate.md
sed -n '<ranges>' worker-progress/worker-291-test-renderer-serialization-local-gate-ready-private.md
sed -n '<ranges>' worker-progress/worker-306-test-renderer-testinstance-private-wrapper-skeleton.md
sed -n '<ranges>' worker-progress/worker-309-test-renderer-error-surface-local-gate-refresh.md
sed -n '<ranges>' packages/react-test-renderer/index.js
sed -n '<ranges>' tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
sed -n '<ranges>' tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
sed -n '<ranges>' /Users/user/Developer/Developer/react-reference/packages/react-test-renderer/src/ReactTestRenderer.js
rg -n '<react-test-renderer/TestInstance/query patterns>' packages tests crates worker-progress
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --check tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
npm run check --workspace @fast-react/react-test-renderer
npm run test:conformance --workspace @fast-react/conformance
npm run check:package-surface
git add -N worker-progress/worker-334-test-renderer-testinstance-private-query-path.md
git diff --check
```

## Verification Results

- JS syntax checks for all touched package and conformance files: passed.
- Focused create/TestInstance/serialization/error gate suite: passed, 28 tests.
- `npm run check --workspace @fast-react/react-test-renderer`: passed.
- `npm run test:conformance --workspace @fast-react/conformance`: passed,
  579 tests.
- `npm run check:package-surface`: passed.
- `git diff --check`: passed after marking the new progress report
  intent-to-add.
- npm emitted the existing `minimum-release-age` config warning during npm
  commands; it did not affect passing results.

## Risks Or Blockers

- The query metadata is still static JS diagnostic metadata for the accepted
  canary shape. It does not load a native bridge, execute Rust, inspect live
  JS-created fibers, or expose public ReactTestInstance objects.
- The private query path only covers the single HostComponent candidate and
  skipped HostText child. Broader roots, composite boundaries, arrays,
  multi-match errors, and retained unmounted TestInstance behavior remain
  future public work.
- Public compatibility remains intentionally unclaimed.

## Recommended Next Tasks

1. Replace static canary query metadata with bridge-backed committed-fiber
   records once JS create routing has an accepted native/Rust handoff.
2. Add separate fail-closed gates for public `.root`, `toTree`, and
   ReactTestInstance query method admission before any public comparison row is
   opened.
3. Extend committed-fiber inspection beyond the single HostComponent/HostText
   canary only after broader child reconciliation is accepted.
