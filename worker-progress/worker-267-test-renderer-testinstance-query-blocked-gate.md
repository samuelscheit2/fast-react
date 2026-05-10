# Worker 267: Test Renderer TestInstance Query Blocked Gate

## Goal Evidence

- `create_goal` was called before research, file reads, implementation, or
  verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status: `active`.
- Active goal objective:
  `Add a fail-closed conformance gate for react-test-renderer TestInstance query surfaces (root, find*, findBy*, toJSON, toTree) that records accepted Rust private prerequisites but keeps public JS instance wrappers and serialization unsupported.`
- `ORCHESTRATOR.md` was not read.

## Summary

- Added a source-backed conformance record for the accepted Rust-private
  react-test-renderer prerequisites: `TestRendererRoot`, host-output
  create/update/unmount canaries, committed-fiber inspection, and private JSON
  serialization diagnostics.
- Kept the public serialization/TestInstance gate fail-closed: the JS package is
  still a placeholder, no public `toJSON`/`toTree` behavior is admitted, and no
  `ReactTestInstance` query wrapper or `find*`/`findBy*` surface is exposed.
- Preserved explicit false scenario admissions and false compatibility claims.
- Did not modify Rust crates or package implementation.

## Changed Files

- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-267-test-renderer-testinstance-query-blocked-gate.md`

`tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs` was
not changed; its existing React oracle coverage for `find`/`findBy` errors was
covered by the full conformance run.

## Evidence Gathered

- Required context read after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Required worker context inspected: workers 085, 178, 209, 210, 234, 235, 236,
  and 237.
- Rust-private source evidence is now checked from conformance:
  `crates/fast-react-test-renderer/src/lib.rs`,
  `crates/fast-react-reconciler/src/lib.rs`, and
  `crates/fast-react-reconciler/src/private_fiber_inspection.rs`.
- Public JS evidence remains fail-closed through the existing placeholder
  renderer shape. The new test proves `.root`, attempted `find*`/`findBy*`
  access through `.root`, `toJSON`, and `toTree` all throw structured
  `FAST_REACT_UNIMPLEMENTED` errors with create-routing gate metadata, while no
  public query methods are own properties or inherited properties of the
  renderer shell.
- A nested read-only explorer was spawned for an independent gate-shape review,
  but it did not return findings before verification completed and was closed;
  it did not affect the implementation conclusions.

## Commands Run

```sh
create_goal
get_goal
sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md
sed -n '<ranges>' worker-progress/worker-085-react-test-renderer-serialization-oracle.md
sed -n '<ranges>' worker-progress/worker-178-test-renderer-serialization-gate.md
sed -n '<ranges>' worker-progress/worker-209-test-renderer-serialization-private-gate.md
sed -n '<ranges>' worker-progress/worker-210-react-test-renderer-js-create-failclosed.md
sed -n '<ranges>' worker-progress/worker-234-test-renderer-host-output-update-unmount-canary.md
sed -n '<ranges>' worker-progress/worker-235-test-renderer-private-fiber-inspection.md
sed -n '<ranges>' worker-progress/worker-236-test-renderer-private-json-serialization.md
sed -n '<ranges>' worker-progress/worker-237-react-test-renderer-js-create-routing-gate.md
sed -n '<ranges>' tests/conformance/src/react-test-renderer-serialization-local-gate*.mjs
sed -n '<ranges>' tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
sed -n '<ranges>' tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
sed -n '<ranges>' packages/react-test-renderer/index.js
rg -n '<react-test-renderer TestInstance/serialization/gate patterns>' tests packages crates worker-progress
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
npm run test:conformance --workspace @fast-react/conformance
npm run test:conformance
npm run check:js
git diff --check
git diff --check --no-index /dev/null worker-progress/worker-267-test-renderer-testinstance-query-blocked-gate.md
get_goal
```

## Verification Results

- Focused touched tests:
  `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
  passed, 9 tests.
- Prompt-specified workspace command:
  `npm run test:conformance --workspace @fast-react/conformance` failed because
  `@fast-react/conformance` has no `test:conformance` script.
- Root equivalent:
  `npm run test:conformance` passed, 541 tests.
- `npm run check:js` passed, including package-surface guard, import smoke,
  benchmark gates, workspace checks, native loader checks, and 541 conformance
  tests.
- `git diff --check` passed.
- `git diff --check --no-index /dev/null worker-progress/worker-267-test-renderer-testinstance-query-blocked-gate.md`
  emitted no whitespace errors; the command exits 1 for a normal no-index
  new-file difference.
- npm emitted the existing `minimum-release-age` config warning during npm
  commands; it did not affect passing results.

## Risks Or Blockers

- The new Rust-private prerequisite record is intentionally source-pattern
  backed. If accepted private canary symbols are renamed, the conformance gate
  will need an explicit update.
- Public JS `react-test-renderer` behavior remains unsupported by design. This
  worker does not add native bridge routing, public serializer methods,
  `ReactTestInstance` wrappers, `createNodeMock`, Scheduler behavior, or `act`.
- The exact prompt-specified workspace command is unavailable because of the
  current package script layout; the root conformance script is the working
  equivalent.

## Recommended Next Tasks

1. Add stable public/native bridge metadata before reopening the create routing
   gate.
2. Keep TestInstance query scenario admissions false until a real public
   wrapper can route through accepted committed-fiber inspection without
   exposing host handles.
3. When public `toJSON` or `toTree` work begins, split JSON serialization,
   `toTree`, and TestInstance wrapper admissions so partial private readiness
   cannot become a broad compatibility claim.
