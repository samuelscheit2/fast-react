# Worker 698: Test Renderer toTree Composite Native Execution

## Goal

- Status: active
- Objective: add private react-test-renderer `toTree` native execution evidence for a FunctionComponent-above-host output shape, preserving blocked public `toTree()`.

## Summary

- Added private Rust `toTree` native execution evidence that records the accepted composite `HostRoot -> FunctionComponent -> HostComponent -> HostText` source shape for create/update evidence.
- Kept unmount evidence as an empty-root path with no composite FunctionComponent shape.
- Updated the CJS development private `toTree` native facade to require composite committed-fiber inspection for native execution evidence while leaving public `create().toTree()` blocked.
- Updated focused serialization and create-routing gates to assert the new dev-only composite native evidence without requiring production CJS changes.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-698-test-renderer-totree-composite-native-execution.md`

## Evidence Gathered

- Local React 19.2.6 reference `ReactTestRenderer.js` confirms `toTree` returns a `nodeType: 'component'` record for `FunctionComponent` and delegates rendered children through `childrenToTree(node.child)`.
- Rust focused `to_tree` filter passed, including the new composite host-shape evidence test.
- Rust focused `tree` filter passed, including existing private metadata and committed-fiber inspection coverage.
- Focused JS conformance passed for serialization/local gate plus create-routing gate, with public `toTree()` still fail-closed.

## Commands Run

- `cargo fmt --all`
- `cargo fmt --all --check`
- `node --check packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `node --check tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `cargo test -p fast-react-test-renderer --all-features to_tree -- --nocapture`
- `cargo test -p fast-react-test-renderer --all-features tree -- --nocapture`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `if rg -n "^(<<<<<<<|=======|>>>>>>>)" crates/fast-react-test-renderer/src/lib.rs packages/react-test-renderer/cjs/react-test-renderer.development.js tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs worker-progress/worker-698-test-renderer-totree-composite-native-execution.md; then exit 1; else rg_code=$?; test "$rg_code" -eq 1; fi`
- `git diff --check`

## Risks Or Blockers

- Production CJS was intentionally not edited per worker scope, so new composite native metadata assertions are gated on entries that expose the new development-only private evidence.
- Rust test output still includes pre-existing `fast-react-reconciler` warnings unrelated to this worker.

## Recommended Next Tasks

- Extend the same private composite native evidence to production metadata only in a worker explicitly scoped to production CJS.
- When public `toTree()` is eventually unblocked, add dual-run React oracle coverage for real FunctionComponent roots rather than private metadata-only evidence.
