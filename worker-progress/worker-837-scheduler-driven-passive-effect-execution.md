# Worker 837 Progress

## Objective

Move private passive effect flushing from scheduler-request metadata only to scheduler-driven create/destroy callback execution for accepted hook effect handles, while keeping public `act`, public root work, and public Scheduler behavior blocked.

## Progress

- Read `WORKER_BRIEF.md`.
- Mapped existing private passive flush, scheduler gate, committed-fiber validation, and scheduler preflight tests.
- Found current scheduler flush consumes committed passive metadata without validating the scheduler gate/request against the pending passive handoff, and callback invocation is only a separate preflight snapshot.
- Updated the scheduler-gated committed-fiber passive flush to validate the scheduler gate/request before consuming pending passive state.
- Wired optional private destroy/create executors into that scheduler-gated flush path and marked the flush as scheduler-driven only when private callbacks execute.
- Added focused coverage for successful scheduler-driven destroy/create execution plus stale fiber, foreign gate, wrong pending order, and missing scheduled-request handoff rejection.

## Verification

- `cargo fmt -p fast-react-reconciler`
- `cargo test -p fast-react-reconciler passive_effects --all-targets --all-features`
- `cargo test -p fast-react-reconciler sync_flush --all-targets --all-features`
- `cargo test -p fast-react-reconciler root_scheduler_passive_effect_scheduler_flush_gate --all-targets --all-features`
- `node --test tests/conformance/test/act-passive-local-gate.test.mjs`

## Notes

- Work stayed scoped to `passive_effects.rs` and this progress file; `root_scheduler.rs` did not need changes.
- Public effect execution, public act compatibility, public root work, and public Scheduler package behavior remain blocked in the new evidence.
