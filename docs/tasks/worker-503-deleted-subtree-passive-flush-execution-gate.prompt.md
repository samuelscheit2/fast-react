You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md unless explicitly asked.

Objective:
Add a private deleted-subtree passive flush execution diagnostic that consumes
the accepted deletion passive/ref cleanup ordering metadata from worker 481 and
proves deleted passive destroy records can be routed into the private passive
flush executor without opening public effect compatibility.

Write scope:
- `crates/fast-react-reconciler/src/passive_effects.rs`
- `crates/fast-react-reconciler/src/root_commit.rs`
- focused reconciler tests in those modules
- `worker-progress/worker-503-deleted-subtree-passive-flush-execution-gate.md`

Constraints:
- Keep the path private and metadata/test-controlled only.
- Do not execute public passive effects, DOM work, refs, or root callbacks.
- Preserve accepted ordering: ref cleanup-return metadata before deleted
  passive destroy metadata before host cleanup metadata.
- You are not alone in the codebase; other workers may touch nearby files. Do
  not revert or overwrite unrelated changes.

Verification:
- Run focused passive/deletion tests you add.
- Run `cargo test -p fast-react-reconciler passive_effects --all-features`.
- Run `cargo test -p fast-react-reconciler root_commit_deletion --all-features`.
- Run `cargo fmt --all --check` and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks in
  the worker progress report.
