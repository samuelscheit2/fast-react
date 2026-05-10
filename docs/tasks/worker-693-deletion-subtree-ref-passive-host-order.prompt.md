# Worker 693: Deletion Subtree Ref/Passive/Host Order

Objective: broaden private Rust deletion-subtree evidence to cover ref cleanup, passive destroy scheduling, and host child detachment order for a nested host subtree, while public unmount/passive behavior remains blocked.

First action: call `create_goal` with this worker objective before reading files, researching, or editing. Then call `get_goal` and include the active goal status/objective in your final report.

After goal setup, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do not read `ORCHESTRATOR.md`.

Write scope: `crates/fast-react-reconciler/src/root_commit.rs`, `crates/fast-react-reconciler/src/passive_effects.rs`, `crates/fast-react-reconciler/src/host_nodes.rs`, focused Rust tests, and `worker-progress/worker-693-deletion-subtree-ref-passive-host-order.md`.

Constraints: do not modify test-renderer JS or React DOM unmount facades. Keep evidence private and do not fabricate nonzero ref/passive data if the fixture cannot produce it truthfully.

Verification: `cargo fmt --all --check`, focused `cargo test -p fast-react-reconciler --all-features deletion passive root_commit -- --nocapture` split into valid Cargo filters if needed, conflict-marker scan, and `git diff --check`.
