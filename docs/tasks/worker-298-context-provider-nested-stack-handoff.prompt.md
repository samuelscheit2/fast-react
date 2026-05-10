You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Extend the context provider begin-work handoff with a nested provider canary that proves push/read/unwind ordering across two providers without broad traversal or public `useContext` compatibility claims.

Write scope:
- `crates/fast-react-core/src/context.rs`
- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/root_work_loop.rs`
- `worker-progress/worker-298-context-provider-nested-stack-handoff.md`

Context to inspect:
Workers 180, 247, 248, 282, and 287.

Constraints:
- Keep unsupported sibling/multiple-child provider shapes fail-closed.
- Do not wire the JS React `useContext` dispatcher to real renderer state.
- Preserve unwind on child invocation error.

Verification:
- `cargo fmt --all --check`
- Focused context, begin-work, function-component, and root-work-loop tests
- `cargo test -p fast-react-reconciler --all-features`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
