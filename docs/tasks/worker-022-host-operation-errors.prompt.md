You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification.
After setting the goal, read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`. Do
not read `ORCHESTRATOR.md`; it is for the orchestrator role, not workers.
If you create subtasks, call
`create_goal` again with all context about the parent task. Do not call
`update_goal(status: "complete")` until this whole worker task is complete.

Objective:

Fix the root cause behind worker-018's remaining panic caveat: invalid handles,
missing children, or impossible mutation operations in the in-memory test
renderer should produce structured host operation errors where the host-config
boundary can represent them, instead of relying on invariant panics for ordinary
diagnosable renderer mistakes.

Write scope:

- `crates/fast-react-host-config/**`
- `crates/fast-react-test-renderer/**`
- If absolutely required to keep the workspace compiling after a host-config
  API change: minimal compile-only adjustments in `crates/fast-react-reconciler/**`
- `worker-progress/worker-022-host-operation-errors.md`

Required sources:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-008-renderer-host-config.md`
- `worker-progress/worker-012-host-config-traits.md`
- `worker-progress/worker-018-test-renderer-mutation-host.md`
- `worker-progress/worker-019-reconciler-host-boundary-migration.md`
- Current source files in the write scope

Constraints:

- Prefer a clear host-config error model over ad hoc string errors in the test
  renderer.
- Preserve explicit unsupported capability errors; do not collapse capability
  failures and renderer operation failures into an ambiguous catch-all.
- Keep renderer-owned handles opaque to callers.
- Do not implement real reconciliation, DOM, React Native, persistence,
  hydration, resources, or scheduler behavior.
- Breaking API changes are allowed if they remove the root cause, but document
  them and keep compatibility shims only when they serve a concrete current
  dependency.
- Workers may spawn nested managed subagents or explorers to test hypotheses;
  summarize useful delegated checks in the report.
- Regenerable artifacts such as `node_modules/`, `target/`, and root
  `Cargo.lock` do not need cleanup merely because they exist. Remove or
  document them only if they are stale, ambiguous, or would pollute your scoped
  final diff/status.

Expected implementation shape:

- Add or refine a structured host operation error type in
  `fast-react-host-config`, while keeping `UnsupportedHostCapability`
  inspectable.
- Update `HostResult<T>` and/or add a second result type only if that is the
  cleanest boundary; justify the choice.
- Update `fast-react-test-renderer` so invalid container/instance/text handles,
  missing insertion targets, and missing removal targets return structured
  errors where feasible.
- Add focused unit tests for unsupported capability errors and operation errors.
- If any remaining panic is intentional, document exactly why it is an internal
  invariant rather than an ordinary operation error.

Verification to run:

- `cargo fmt --all --check`
- `cargo test -p fast-react-host-config --all-features`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo test --workspace --all-features`
- `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `git diff --check -- crates/fast-react-host-config crates/fast-react-test-renderer crates/fast-react-reconciler worker-progress/worker-022-host-operation-errors.md`

Handoff requirements:

- Write `worker-progress/worker-022-host-operation-errors.md`.
- Summarize the chosen error model and any API breaks.
- List changed files and commands run.
- List unresolved risks or follow-up tasks.
- Review quality, maintainability, performance, and security implications.
