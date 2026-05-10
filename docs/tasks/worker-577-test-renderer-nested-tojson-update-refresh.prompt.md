# Worker 577: Test Renderer Nested ToJSON Update Refresh

## Objective

Extend private test-renderer toJSON diagnostics for nested host-output updates
and sibling text rows while public serialization stays blocked.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 540 and 542 added update/unmount and nested host-output diagnostics.
Keep this scoped to test-renderer serialization metadata.

## Write Scope

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `tests/conformance/src/react-test-renderer-serialization-local-gate.mjs`
- `worker-progress/worker-577-test-renderer-nested-tojson-update-refresh.md`

Do not edit React DOM, scheduler, native, or package-surface files.

## Requirements

- Record nested HostComponent/HostText update rows used by private toJSON
  diagnostics.
- Preserve empty-root, multi-child, updated-text, and unmount toJSON rows.
- Keep public `toJSON` compatibility and native bridge execution blocked.
- Reject stale snapshots and mismatched update rows.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo test -p fast-react-test-renderer --all-features`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `git diff --check`
