You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a private ContextProvider begin-work handoff canary that pushes provider values, delegates one FunctionComponent child context read, and unwinds deterministically, without general child reconciliation, public `useContext` compatibility, renderer output, effects, or DOM/test-renderer integration.

Write scope:
- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-282-context-provider-begin-work-handoff.md`

Context to inspect:
Workers 180, 194, 199, 222, 247, 248, 249.

Constraints:
- Private canary only.
- Fail closed for nested/unsupported provider shapes.
- Do not claim context compatibility.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features begin_work`
- `cargo test -p fast-react-reconciler --all-features function_component`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
