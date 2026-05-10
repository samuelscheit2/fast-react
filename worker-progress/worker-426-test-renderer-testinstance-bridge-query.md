# Worker 426 - Test Renderer TestInstance Bridge Query

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and again before this
  report.
- Active goal status from `get_goal`: `active`.
- Active goal objective:
  `Route private TestInstance query diagnostics through accepted bridge metadata from the test-renderer root instead of standalone test-authored wrappers.`
- `ORCHESTRATOR.md` was not read.

## Summary

- Routed the hidden private TestInstance query diagnostics through the
  `fast.react_test_renderer.root_request_bridge` create request metadata.
- Added root-scoped TestInstance query diagnostic records cached per private
  root request, exposed through hidden bridge helpers:
  `getTestInstanceQueryDiagnostics`, `getRootTestInstanceQueryDiagnostics`,
  and `getRendererTestInstanceQueryDiagnostics`.
- Attached the same root-scoped record to blocked public root errors as private
  diagnostic evidence while keeping public `.root`, `find*`, `findBy*`,
  `toJSON`, `toTree`, native execution, Rust execution from JS, and
  compatibility claims blocked.
- Refreshed focused conformance gates so private TestInstance readiness now
  requires bridge-routed metadata and rejects standalone wrapper-only evidence.

## Changed Files

- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `worker-progress/worker-426-test-renderer-testinstance-bridge-query.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested prior worker reports present in this checkout: workers 235,
  267, 306, 334, 365, and 393. Worker 423 was not present.
- Confirmed the prior private TestInstance metadata was a static
  symbol-hidden record on renderer objects.
- Confirmed the current JS private root request bridge already owns
  per-renderer create/update/unmount request records and accepted Rust canary
  metadata.
- Used the accepted Rust test-renderer tree metadata and serialization gate
  tests as the Rust-side evidence that the root/fiber diagnostics remain
  available.

## Commands Run

- `get_goal`
- `sed -n '<ranges>' WORKER_BRIEF.md MASTER_PLAN.md MASTER_PROGRESS.md`
- `sed -n '<ranges>' worker-progress/worker-235-test-renderer-private-fiber-inspection.md`
- `sed -n '<ranges>' worker-progress/worker-267-test-renderer-testinstance-query-blocked-gate.md`
- `sed -n '<ranges>' worker-progress/worker-306-test-renderer-testinstance-private-wrapper-skeleton.md`
- `sed -n '<ranges>' worker-progress/worker-334-test-renderer-testinstance-private-query-path.md`
- `sed -n '<ranges>' worker-progress/worker-365-test-renderer-testinstance-multi-child-query-path.md`
- `sed -n '<ranges>' worker-progress/worker-393-test-renderer-update-unmount-js-private-routing.md`
- `rg -n '<react-test-renderer/TestInstance/bridge patterns>' packages tests crates`
- `node --check packages/react-test-renderer/index.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --check tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `cargo fmt --all --check`
- `cargo test -p fast-react-test-renderer --all-features private_tree_metadata -- --nocapture`
- `cargo test -p fast-react-test-renderer --all-features root_serialization_gate_sees_private_committed_fiber_inspection_after_host_output -- --nocapture`
- `git diff --check`

## Verification Results

- JS syntax checks passed for all touched package entrypoints and focused gate
  files.
- Focused JS TestInstance/create-routing/error-surface/serialization gate suite
  passed: 31 tests.
- `npm run check --workspace @fast-react/react-test-renderer`: passed.
- `cargo fmt --all --check`: passed.
- Focused Rust private tree metadata tests passed: 3 tests.
- Focused Rust serialization gate committed-fiber inspection test passed: 1
  test.
- `git diff --check`: passed.
- npm emitted the existing `minimum-release-age` warning during npm commands;
  it did not affect verification.

## Risks Or Blockers

- No blocker remains for this worker objective.
- The JS private TestInstance query diagnostics are still record-only and do
  not execute native/Rust code from JS.
- The actual query path still covers the accepted diagnostic canary shapes
  only; public TestInstance objects and compatibility remain intentionally
  blocked.

## Recommended Next Tasks

- Replace record-only JS bridge metadata with a real native/Rust root execution
  handoff only after the root bridge can execute without changing public
  behavior.
- Keep public `.root`, `find*`, `findBy*`, `toJSON`, and `toTree` blocked until
  real renderer routing, serialization, and TestInstance wrappers have dual-run
  evidence against React 19.2.6.
- Extend private TestInstance diagnostics beyond the current canary shapes only
  after committed-fiber traversal supports those shapes.

## Nested Agents

- Spawned one read-only explorer for an independent bridge-pattern review. It
  did not return findings before implementation and verification completed, so
  it was closed and did not affect conclusions.
