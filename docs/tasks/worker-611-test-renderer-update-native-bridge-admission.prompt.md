# Worker 611: Test Renderer Update Native Bridge Admission

## Objective

Refresh private test-renderer update-route admission so JS metadata can consume
accepted Rust update work-loop evidence while public update stays blocked.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 574 added update-via-root-work-loop diagnostics; extend the admission
boundary rather than public behavior.

## Write Scope

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.*.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-611-test-renderer-update-native-bridge-admission.md`

Coordinate with worker 610 by keeping update-only metadata names distinct.

## Requirements

- Add a private update admission record that ties JS update calls to accepted
  Rust update/root-work-loop metadata.
- Reject stale root lifecycle, stale host output, and missing update queue
  evidence.
- Keep public update, serialization, and native execution blocked.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-test-renderer --all-features update -- --nocapture`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `git diff --check`
