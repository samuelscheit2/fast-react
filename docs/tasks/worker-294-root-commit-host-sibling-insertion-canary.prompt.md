You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a fail-closed canary for host sibling insertion metadata during root commit placement. Prove that insertion-before information is recorded and validated without enabling broad sibling search, arrays, keys, fragments, portals, or public DOM/test-renderer compatibility.

Write scope:
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/host_work.rs`
- `worker-progress/worker-294-root-commit-host-sibling-insertion-canary.md`

Context to inspect:
Workers 263, 264, 293 if present, and root commit placement/deletion tests.

Constraints:
- Keep append placement behavior unchanged.
- If a safe insertion target cannot be proven from existing metadata, add deterministic recorded-only diagnostics instead of guessing.
- Do not implement generalized `getHostSibling`.

Verification:
- `cargo fmt --all --check`
- Focused root commit and host work tests
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
