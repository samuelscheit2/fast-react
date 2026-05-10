# Worker 540: Test Renderer toJSON Update/Unmount Refresh

## Objective

Refresh private react-test-renderer `toJSON` diagnostics so update and unmount
host-output rows are explicit while public serialization remains blocked.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted serialization, TestInstance query, update/unmount lifecycle, and
committed-fiber metadata.

## Write Scope

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- Serialization/create-routing focused tests
- `worker-progress/worker-540-test-renderer-tojson-update-unmount-refresh.md`

## Requirements

- Add update and unmount private row ids and dependency metadata.
- Keep public `toJSON`, TestInstance, native execution, and compatibility
  claims blocked.
- Reject stale snapshots and mismatched update/unmount records.

## Verification

- `cargo test -p fast-react-test-renderer --all-features to_json -- --nocapture`
- `node --test tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `cargo fmt --all --check`
- `git diff --check`

