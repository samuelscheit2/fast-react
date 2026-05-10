# Worker 667: Test Renderer toTree Native Execution

Goal status: active

Goal objective: add private react-test-renderer `toTree` evidence that consumes accepted native create/update/unmount execution records for the minimal tree, while public `toTree()` compatibility stays blocked.

## Changes

- Added Rust `TestRendererPrivateToTreeNativeExecutionEvidence` plus create, update, and unmount diagnostic APIs on `TestRendererRoot`.
- Threaded `toTree` evidence through accepted private native create/update/unmount records while preserving blocked public `toTree()` behavior.
- Exposed CJS development and production private `toTree` facade metadata/methods for native execution evidence consumption.
- Added conformance coverage for the private CJS development `toTree` facade consuming accepted native execution records and still throwing for public `toTree()`.

## Verification

- `cargo fmt --all --check` passed.
- `cargo test -p fast-react-test-renderer --all-features to_tree -- --nocapture` passed.
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs` passed.
- `npm run check --workspace @fast-react/react-test-renderer` passed.
- `git diff --check` passed.

## Notes

- The top-level `packages/react-test-renderer/index.js` remains unchanged because this worker's write scope was limited to the CJS bundles for JS metadata parity.
- Existing unrelated Rust warnings from `fast-react-reconciler` appeared during the focused cargo test; no new test failures were introduced.
