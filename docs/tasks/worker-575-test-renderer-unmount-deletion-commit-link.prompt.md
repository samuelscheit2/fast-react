# Worker 575: Test Renderer Unmount Deletion Commit Link

## Objective

Tie private test-renderer unmount diagnostics to accepted root-commit deletion
metadata without opening public unmount compatibility.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 540 and 562 refreshed unmount and host cleanup diagnostics. This task
should connect unmount to deletion commit records.

## Write Scope

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-575-test-renderer-unmount-deletion-commit-link.md`

Do not edit React DOM, native, scheduler, or package-surface files.

## Requirements

- Record private unmount route metadata for deletion commit handoff, host child
  detachment blockers, and lifecycle status.
- Keep public `root.unmount`, host teardown compatibility, and act flushing
  blocked.
- Reject stale or already-unmounted root records deterministically.
- Preserve existing unmount cleanup and toJSON empty-root diagnostics.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo test -p fast-react-test-renderer --all-features`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `git diff --check`
