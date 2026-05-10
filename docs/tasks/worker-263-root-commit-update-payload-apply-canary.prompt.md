You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add the next narrow private root-commit update payload apply canary: consume already-recorded HostComponent/HostText update metadata into deterministic test-only apply records and safe fake host-config update calls where values are available, without broad commit traversal, DOM/test-renderer public output, effects, refs, callbacks, or compatibility claims.

Write scope:
- `crates/fast-react-reconciler/src/root_commit.rs`
- `crates/fast-react-reconciler/src/host_work.rs`
- `worker-progress/worker-263-root-commit-update-payload-apply-canary.md`

Context to inspect:
Workers 151, 187, 198, 204, 205, 206, 233, 234.

Constraints:
- Keep this private and test-only.
- Do not implement broad mutation traversal or public renderer output.
- Coordinate with accepted deletion, placement, and apply-log metadata.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_commit`
- `cargo test -p fast-react-reconciler --all-features host_work`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
