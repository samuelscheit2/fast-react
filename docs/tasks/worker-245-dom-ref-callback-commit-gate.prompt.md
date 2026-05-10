You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add a fail-closed DOM ref callback commit gate that connects accepted ref attach/detach metadata to deterministic private gate records without invoking callback refs, mutating object refs, running layout effects, exposing public instances, or claiming React DOM ref compatibility.

Write scope:
- `crates/fast-react-reconciler/src/root_commit.rs`
- Optional private DOM test/gate files under `tests/conformance/src` and `tests/conformance/test`
- `worker-progress/worker-245-dom-ref-callback-commit-gate.md`

Context to inspect:
Workers 066, 174, 226, 245-adjacent root commit code, and DOM ref callback oracle tests.

Constraints:
- You are not alone in the codebase. Worker 233 may edit root commit; keep this focused on ref metadata gates.
- Do not invoke JS callbacks or mutate refs.
- Preserve phase-scoped host token validation.

Verification:
- `cargo fmt --all --check`
- Focused root commit ref tests
- Full `cargo test -p fast-react-reconciler --all-features`
- Reconciler clippy with warnings denied
- Focused JS gate if added
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
