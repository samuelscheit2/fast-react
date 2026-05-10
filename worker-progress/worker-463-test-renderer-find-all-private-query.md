# Worker 463 - TestInstance findAll Private Query Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: extend the private TestInstance
  bridge with deterministic findAll query diagnostics for type, props, and
  predicate-like metadata while public queries remain blocked.
- No nested managed agents, explorers, or subagents were spawned.

## Summary

- Added Rust private TestInstance `findAll` diagnostics backed by the accepted
  private tree metadata canary. The new report records deterministic type,
  props, and predicate-like match metadata, traversal order, candidate/skipped
  fiber tags, and public blocker state without exposing public TestInstance
  objects or queries.
- Extended the CJS react-test-renderer private root request bridge metadata with
  hidden `findAll` predicate diagnostics for type, props, and predicate-like
  matching. The root package entrypoint and public keys were not changed.
- Refreshed focused conformance/local-gate tests so the private bridge evidence
  must include the new `findAll` diagnostics while public `.root` and `find*`
  methods remain blocked/absent.

## Changed Files

- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `crates/fast-react-test-renderer/src/lib.rs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `worker-progress/worker-463-test-renderer-find-all-private-query.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested prior reports present in this checkout: workers 333, 365, 426,
  and 440.
- Inspected React 19.2.6 source from the local reference clone for
  `ReactTestInstance.findAll`, `findAllByType`, `findAllByProps`, and
  `propsMatch` behavior.
- Confirmed existing public renderer keys and TestInstance query methods remain
  blocked; new JS metadata is private, frozen, and attached to the existing
  hidden bridge record.
- A first focused Rust run showed the update canary keeps the host component
  type stable while updating text. The test was corrected to avoid claiming type
  replacement support, then rerun successfully.

## Commands Run

```sh
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --check tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
cargo fmt --all
cargo fmt --all --check
cargo test -p fast-react-test-renderer --all-features private_test_instance_find_all -- --nocapture
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
cargo test -p fast-react-test-renderer --all-features
npm run check --workspace @fast-react/react-test-renderer
git add -N worker-progress/worker-463-test-renderer-find-all-private-query.md
git diff --check
```

## Verification Results

- JS syntax checks passed for touched CJS and focused conformance files.
- Focused JS gates passed: create-routing (12 tests), serialization local gate
  (7 tests), and error-surface gate (14 tests).
- Focused Rust `private_test_instance_find_all` tests passed: 2 tests.
- Full `cargo test -p fast-react-test-renderer --all-features` passed: 63
  tests plus doc tests.
- `npm run check --workspace @fast-react/react-test-renderer` passed. npm
  printed the existing `minimum-release-age` warning.
- `git diff --check` passed with the new progress report included via
  intent-to-add.

## Risks Or Blockers

- No blocker remains for this worker objective.
- The Rust diagnostic covers the accepted single HostComponent canary shape.
  The CJS bridge still carries the existing multi-child private metadata, so it
  records deterministic evidence without claiming live Rust-backed JS execution.
- Public `.root`, `find`, `findAll`, `findByType`, `findAllByType`,
  `findByProps`, and `findAllByProps` remain unavailable.

## Recommended Next Tasks

1. Replace record-only CJS TestInstance diagnostics with live native/Rust bridge
   execution only after root request execution is admitted for JS.
2. Extend Rust committed-fiber query diagnostics to multi-root-child trees
   before claiming parity with the current CJS multi-child private metadata.
3. Keep package-surface guards strict for any future private symbols or hidden
   records added to public objects.
