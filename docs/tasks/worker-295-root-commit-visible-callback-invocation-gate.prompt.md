You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private commit-phase gate for visible HostRoot update callback invocation metadata. The gate should prove callback records are drained in accepted order while still not invoking user callbacks or exposing public root callback behavior.

Write scope:
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/root_callbacks.rs`
- `worker-progress/worker-295-root-commit-visible-callback-invocation-gate.md`

Context to inspect:
Workers 149, 160, 263, 270, and 285.

Constraints:
- Data-only records only; do not call user callbacks.
- Preserve hidden/deferred callback behavior and existing visible callback snapshots.
- No JS public facade, native bridge, or DOM changes.

Verification:
- `cargo fmt --all --check`
- Focused `root_commit` and `root_callbacks` tests
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
