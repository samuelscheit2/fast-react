# Worker 672: Test Renderer Unmount Passive Ref Order

Objective: add private react-test-renderer unmount evidence that ties native cleanup to ref detachment and passive destroy ordering for the minimal tree, while public unmount behavior remains blocked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

Write scope: `crates/fast-react-test-renderer/src/lib.rs`, `packages/react-test-renderer/cjs/react-test-renderer.development.js`, focused conformance tests, and `worker-progress/worker-672-test-renderer-unmount-passive-ref-order.md`.

Do not alter React DOM unmount facade behavior or broad passive Scheduler flushing.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-test-renderer --all-features unmount passive ref -- --nocapture`, `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`, `npm run check --workspace @fast-react/react-test-renderer`, and `git diff --check`.
