# Worker 612: Test Renderer Unmount Native Bridge Admission

## Objective

Extend private test-renderer unmount admission to connect JS unmount route
metadata with accepted Rust deletion commit handoff evidence.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 575 added unmount deletion commit handoff blockers; consume them at the
JS admission boundary only.

## Write Scope

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.*.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-612-test-renderer-unmount-native-bridge-admission.md`

Coordinate with workers 610-611 by keeping unmount-only metadata names distinct.

## Requirements

- Add a private unmount admission record that validates deletion commit handoff
  and lifecycle evidence.
- Reject already-unmounted roots, stale deletion handoffs, and missing cleanup
  blockers.
- Keep public unmount, act flushing, and native execution blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-test-renderer --all-features unmount -- --nocapture`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `git diff --check`
