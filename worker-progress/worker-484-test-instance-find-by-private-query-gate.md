# Worker 484: TestInstance findBy Private Query Gate

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Goal status after final pane closeout: `complete`.
- Active goal objective from `get_goal`: add private TestInstance
  `findByType` and `findByProps` diagnostics that build on accepted `findAll`
  metadata without exposing public query compatibility.
- No nested managed agents, explorers, or subagents were spawned.

## Summary

- Added Rust private TestInstance `findByType` / `findByProps` diagnostics
  derived from the accepted private `findAll` diagnostic report. The new report
  records `expectOne`, `{deep: false}`, criteria, matched candidates, skipped
  text fibers, and fail-closed public state.
- Mirrored the diagnostics in the development CJS react-test-renderer bridge as
  frozen, hidden, record-only metadata on the existing private TestInstance
  wrapper record and root request metadata.
- Extended focused conformance/local gates so the private bridge must include
  the new `findBy` diagnostic evidence while public `.root` and TestInstance
  query methods remain blocked.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `worker-progress/worker-484-test-instance-find-by-private-query-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read requested prior reports present in this checkout: workers 426, 463, 464,
  and 465.
- Checked the pinned React 19.2.6 source for `ReactTestInstance.findByType`,
  `findByProps`, `findAllByType`, `findAllByProps`, `expectOne`, and
  `propsMatch`.
- Confirmed the existing private `findAll` diagnostics were accepted metadata
  only and that public TestInstance objects/query methods remain blocked.

## Commands Run

```sh
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --check tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
cargo fmt --all
cargo test -p fast-react-test-renderer --all-features private_test_instance_find_by -- --nocapture
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
cargo test -p fast-react-test-renderer --all-features
cargo fmt --all --check
npm run check --workspace @fast-react/react-test-renderer
git add -N worker-progress/worker-484-test-instance-find-by-private-query-gate.md && git diff --check
```

## Verification Results

- JS syntax checks passed for the touched development CJS and focused
  conformance files.
- Focused Rust `private_test_instance_find_by` tests passed: 2 tests.
- Focused JS gates passed: create-routing (13 tests), serialization local gate
  (7 tests), and error-surface gate (15 tests).
- Full `cargo test -p fast-react-test-renderer --all-features` passed: 69
  tests plus 0 doc tests.
- `cargo fmt --all --check` passed.
- `npm run check --workspace @fast-react/react-test-renderer` passed. npm
  printed the existing `minimum-release-age` warning.
- `git diff --check` passed with the new progress report included via
  intent-to-add.

## Risks Or Blockers

- No blocker remains for this worker objective.
- The CJS diagnostics are development-only record metadata and do not execute
  native/Rust query code from JS.
- Public `.root`, `find`, `findAll`, `findByType`, `findAllByType`,
  `findByProps`, and `findAllByProps` remain unavailable.

## Recommended Next Tasks

- Replace record-only JS TestInstance diagnostics with live native/Rust bridge
  execution only after the root request execution path is admitted for JS.
- Extend Rust private TestInstance query diagnostics beyond the current
  accepted canary shape before claiming broader traversal behavior.
- Keep package-surface guards strict if future workers add new hidden symbols or
  development-only metadata.
