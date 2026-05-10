You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add the next narrow private root-commit host mutation apply skeleton: consume already-recorded HostRoot placement/update/deletion metadata into deterministic apply records and test-only host-config calls where safe, without broad commit traversal, effects, refs, callbacks, DOM/test-renderer public output, or compatibility claims.

Write scope:
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/host_work.rs`
- `crates/fast-react-reconciler/src/host_nodes.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- Focused reconciler tests in touched modules
- `worker-progress/worker-233-root-commit-host-mutation-apply-skeleton.md`

Context to inspect:
Accepted workers 149, 151, 187, 198, 203, 205, 206, 226, and 233-adjacent current code.

Constraints:
- You are not alone in the codebase. Other workers may edit nearby commit, DOM, and test-renderer code. Do not revert their work; keep your ownership narrow and document any overlap.
- Preserve validation-before-mutation and existing fail-closed behavior.
- Do not wire public renderer packages, passive/layout effects, callbacks, or real DOM output.

Verification:
- `cargo fmt --all --check`
- Focused `cargo test -p fast-react-reconciler --all-features root_commit host_work host_nodes`
- Full `cargo test -p fast-react-reconciler --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
