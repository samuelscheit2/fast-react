You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private sync-flush/act continuation gate that records when committed sync work leaves pending passive metadata for a later act continuation, without executing tasks, effects, callbacks, public `act`, DOM/test-renderer facade behavior, or compatibility claims.

Write scope:
- `crates/fast-react-reconciler/src/sync_flush.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/passive_effects.rs` only if needed
- `worker-progress/worker-285-sync-flush-act-continuation-post-passive-gate.md`

Context to inspect:
Workers 176, 179, 196, 197, 207, 225, 250, 252.

Constraints:
- Record-only continuation metadata.
- Do not execute effects or public act work.
- Preserve sync-flush reentry guards.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features sync_flush`
- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
