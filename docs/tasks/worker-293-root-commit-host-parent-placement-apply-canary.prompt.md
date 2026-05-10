You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a narrow RootCommit/host-work canary for applying placement under an existing HostComponent parent, distinct from HostRoot container placement. Preserve the current container placement path and keep unsupported nested placement shapes recorded-only or explicitly blocked.

Write scope:
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/host_work.rs`
- `worker-progress/worker-293-root-commit-host-parent-placement-apply-canary.md`

Context to inspect:
Workers 263, 264, 271, 272, 286, and 287.

Constraints:
- Do not implement broad placement traversal, keyed reconciliation, fragments, portals, or public renderer output.
- The new host-parent placement apply record must validate parent and child host tokens before mutating the fake host.
- Existing container placement/update/deletion tests must keep passing.

Verification:
- `cargo fmt --all --check`
- Focused `cargo test -p fast-react-reconciler host_work --all-features`
- Focused `cargo test -p fast-react-reconciler root_commit --all-features`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
