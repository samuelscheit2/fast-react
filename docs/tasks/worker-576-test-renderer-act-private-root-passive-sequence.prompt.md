# Worker 576: Test Renderer Act Private Root Passive Sequence

## Objective

Add private react-test-renderer `act` diagnostics that sequence accepted root
request, scheduler, and passive-effect metadata without executing public act.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
Worker 541 added nested act blockers. Build a more explicit sequence row for
private root/passive prerequisites.

## Write Scope

- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-576-test-renderer-act-private-root-passive-sequence.md`

Avoid Rust unless a tiny metadata constant already exposed by
`fast-react-test-renderer` must be referenced.

## Requirements

- Record ordering for private root request, scheduler flush helper, passive
  scheduling, and public act blocker rows.
- Keep callback execution, thenable awaiting, public warning emission, and
  compatibility claims blocked.
- Preserve production/development act shape assertions.
- Reject missing root/passive/scheduler prerequisite metadata.
- Commit all accepted changes on the worker branch before completing the goal.

## Verification

- `node --test tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `git diff --check`
