You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a data-only sync-flush post-passive continuation execution gate. It should prove which roots would re-enter sync flush after passive metadata is observed, without running passive effects, callbacks, or public `act` work.

Write scope:
- `crates/fast-react-reconciler/src/sync_flush.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/passive_effects.rs`
- `worker-progress/worker-303-sync-flush-passive-continuation-execution-gate.md`

Context to inspect:
Workers 150, 176, 179, 285, 296, and 301 if present.

Constraints:
- Data-only continuation records.
- Preserve execution-context reentry guards and existing sync lane filtering.
- No public `React.act` or test-renderer act behavior.

Verification:
- `cargo fmt --all --check`
- Focused `sync_flush`, `root_scheduler`, and `passive_effects` tests
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
