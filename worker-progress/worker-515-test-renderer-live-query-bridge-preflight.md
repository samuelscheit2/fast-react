# Worker 515: TestInstance Query Bridge Preflight

## Goal Evidence

- Final pane closeout observed by orchestrator: complete (tmux reported `Goal achieved`).
- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after goal setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add a private
  react-test-renderer TestInstance query bridge preflight that ties accepted
  Rust `findAll`/`findBy*` diagnostics to the CJS development private wrapper
  without exposing public `.root` or TestInstance query methods.
- No nested managed agents, explorers, or subagents were spawned.

## Summary

- Added Rust private TestInstance query bridge preflight diagnostics derived
  from the accepted `findAll` and `findByType`/`findByProps` reports.
- Wired the CJS development private wrapper with a hidden record-only preflight
  and private bridge helpers to consume accepted diagnostic records without
  native addon loading or Rust execution from JavaScript.
- Extended create-routing, serialization local, and error-surface conformance
  gates so the new preflight is required while public `.root`, `find*`, and
  `findBy*` surfaces remain blocked.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `worker-progress/worker-515-test-renderer-live-query-bridge-preflight.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Reviewed accepted TestInstance query reports from workers 426, 463, and 484.
- Confirmed existing private `findAll`/`findBy*` metadata was static
  record-only bridge evidence and public TestInstance methods were absent.
- Added the preflight as diagnostic consumption only: no public root wrapper,
  no public query methods, no native bridge availability, and no JS-triggered
  Rust execution.

## Commands Run

```sh
cargo fmt --all
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.mjs
node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --check tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
cargo test -p fast-react-test-renderer --all-features private_test_instance -- --nocapture
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
cargo test -p fast-react-test-renderer --all-features
npm run check --workspace @fast-react/react-test-renderer
cargo fmt --all --check
git add -N worker-progress/worker-515-test-renderer-live-query-bridge-preflight.md && git diff --check
```

## Verification Results

- Focused Rust private TestInstance query tests passed: 6 tests.
- Create-routing conformance passed: 14 tests.
- Serialization local conformance passed: 7 tests.
- Error-surface conformance passed: 15 tests.
- Full `cargo test -p fast-react-test-renderer --all-features` passed: 74
  tests plus 0 doc tests.
- `cargo fmt --all --check` passed.
- `npm run check --workspace @fast-react/react-test-renderer` passed. npm
  printed the existing `minimum-release-age` warning.
- `git diff --check` passed with the new progress report included via
  intent-to-add.

## Risks Or Blockers

- No blocker remains for this worker objective.
- The CJS development preflight consumes accepted diagnostic record shapes only;
  it does not execute native/Rust code from JavaScript.
- Public `.root`, `find`, `findAll`, `findByType`, `findAllByType`,
  `findByProps`, and `findAllByProps` remain unavailable.

## Recommended Next Tasks

- Keep the preflight record-only until a real JS-to-Rust TestRendererRoot
  execution route is admitted separately.
- Extend accepted Rust query diagnostics beyond the current canary shapes
  before using the bridge for broader private query evidence.
- Keep package-surface guards strict if future private symbols or bridge helper
  methods are mirrored outside the CJS development wrapper.
