# Worker 573: Test Renderer Private Root Work Loop Preflight

## Objective

Connect the JS react-test-renderer private root-create preflight to accepted
Rust root work-loop finished-work metadata without enabling public create.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Workers 539 and 565 area work should keep the JS facade blocked while exposing
clear preflight metadata.

## Write Scope

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-573-test-renderer-private-root-work-loop-preflight.md`

Do not edit React DOM, scheduler, native transport, or package-surface guards.

## Requirements

- Add a private JS diagnostic row that references accepted Rust root work-loop
  finished-work/preflight metadata.
- Keep public `create`, `update`, `toJSON`, `toTree`, and `act` compatibility
  blocked.
- Reject missing/stale Rust preflight metadata and unsupported child shapes.
- Preserve existing root-create preflight, toJSON, update, unmount, and act
  route tests.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `cargo test -p fast-react-test-renderer --all-features`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `git diff --check`
