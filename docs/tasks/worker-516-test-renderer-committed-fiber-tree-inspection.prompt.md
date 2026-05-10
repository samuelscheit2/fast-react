You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private react-test-renderer committed-fiber tree inspection diagnostics for
multi-child and function-component-above-host shapes, building on worker 485
without exposing public `toTree` compatibility.

Write scope:
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-reconciler/src/private_fiber_inspection.rs` if needed
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- serialization local gate tests
- `worker-progress/worker-516-test-renderer-committed-fiber-tree-inspection.md`

Constraints:
- Keep all output private/record-only.
- Reject stale snapshots and unsupported shapes fail-closed.
- Do not claim public `toTree`, TestInstance, or renderer root compatibility.

Verification:
- Run focused Rust inspection/test-renderer tests.
- Run serialization conformance.
- Run full `fast-react-test-renderer` tests.
- Run `cargo fmt --all --check`, react-test-renderer workspace check, and
  `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
