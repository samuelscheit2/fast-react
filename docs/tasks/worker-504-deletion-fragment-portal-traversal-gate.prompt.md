You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private deletion traversal diagnostics for Fragment and Portal deleted
subtrees, building on accepted deletion cleanup and portal ownership records
while keeping real portal DOM mutation and broad deletion traversal blocked.

Write scope:
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/host_work.rs` only if needed for existing
  deletion record validation
- focused Rust tests in those modules
- `worker-progress/worker-504-deletion-fragment-portal-traversal-gate.md`

Constraints:
- Do not implement real Fragment/Portal deletion mutation.
- Do not change public renderer APIs.
- Keep diagnostics explicit about unsupported Suspense/Offscreen deletion
  traversal.
- Other workers may be editing adjacent root commit paths; preserve their work.

Verification:
- Run focused root commit deletion tests.
- Run `cargo test -p fast-react-reconciler root_commit --all-features`.
- Run `cargo fmt --all --check` and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
