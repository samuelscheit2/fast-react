# Worker 574: Test Renderer Update Via Root Work Loop

## Objective

Refresh private test-renderer update diagnostics so an update can point at
accepted root work-loop/update-queue metadata rather than only manual host-output
canaries.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 540 and 573 cover update/unmount JS routing and root-create preflight.
Keep all public behavior blocked.

## Write Scope

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-574-test-renderer-update-via-root-work-loop.md`

Avoid React DOM, scheduler package, native, and unrelated conformance files.

## Requirements

- Record a private update route that consumes accepted HostRoot update queue and
  root work-loop metadata for one host text update.
- Keep public `root.update`, actual renderer compatibility, and public
  serialization blocked.
- Preserve existing manual host-output update rows and fail-closed behavior.
- Reject stale root, unmounted root, and incompatible finished-work records.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo test -p fast-react-test-renderer --all-features`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `git diff --check`
