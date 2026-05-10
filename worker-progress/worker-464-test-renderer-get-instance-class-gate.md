# Worker 464 - Test Renderer getInstance Class Diagnostic

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add private getInstance diagnostics
  for class component root shapes in react-test-renderer while function and
  host roots stay fail-closed as public behavior.
- No nested subagents were spawned.

## Summary

- Added Rust-only private `getInstance` class-root diagnostic records layered
  above the accepted committed host-output canary:
  `HostRoot -> ClassComponent -> HostComponent -> HostText`.
- Added separate fail-closed rows for HostComponent and FunctionComponent root
  shapes so private diagnostics can document React's `getPublicRootInstance`
  boundary without opening Fast React's public `create().getInstance`.
- Added hidden CJS-only private diagnostics on `renderer.getInstance` via
  `Symbol.for("fast.react_test_renderer.private_get_instance_diagnostics")`.
- Kept public behavior blocked: `renderer.getInstance()` still throws the
  placeholder unsupported error in both CJS development and production builds.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs`
- `worker-progress/worker-464-test-renderer-get-instance-class-gate.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Read required worker reports 153, 159, 184, and 425.
- Worker report 463 was not present in this worktree.
- Checked the pinned React 19.2.6 source:
  `ReactFiberReconciler.getPublicRootInstance` returns `null` for empty roots,
  `getPublicInstance` for host roots, and `child.stateNode` for class roots.
- Checked `ReactTestRenderer.js` public `getInstance()` delegates to
  `getPublicRootInstance(root)`.
- Existing local public Fast React `getInstance` behavior was a blocked
  unsupported placeholder; this remains unchanged.

## Commands Run

```sh
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
cargo test -p fast-react-test-renderer --all-features root_private_get_instance -- --nocapture
cargo fmt --all
cargo fmt --all --check
node --test tests/conformance/test/react-test-renderer-root-lifecycle-oracle.test.mjs
node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
cargo test -p fast-react-test-renderer --all-features
npm run check --workspace @fast-react/react-test-renderer
git diff --check
```

## Verification Results

- Focused Rust getInstance tests: passed, 2 tests.
- Focused root lifecycle test: passed, 11 tests.
- Focused error-surface test: passed, 14 tests.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-test-renderer --all-features`: passed, 63 unit
  tests and 0 doc tests.
- `npm run check --workspace @fast-react/react-test-renderer`: passed.
- `git diff --check`: passed.
- npm emitted the existing `minimum-release-age` warning; it did not affect
  verification.

## Risks Or Blockers

- No blockers.
- The class component instance is diagnostic metadata only. It is not public
  class component rendering and is not produced by a live JS-to-Rust render
  bridge.
- The hidden CJS diagnostic consumes accepted report-shaped objects; it does
  not expose public `getInstance`, `createNodeMock`, `ReactTestInstance`, or
  serialization compatibility.

## Recommended Next Tasks

1. Keep public `getInstance` blocked until class component rendering and
   `createNodeMock` public instance routing are implemented end to end.
2. Add live committed class component fiber inspection only after the
   reconciler can commit real class components above host output.
3. Reconcile the package root `index.js` with the CJS private diagnostic only
   when that public entrypoint is assigned for the same private gate.
