You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the
Objective below, before research, file reads, implementation, or verification.
After setting the goal, call get_goal if available and record the active goal
status/objective in your report, then read WORKER_BRIEF.md, MASTER_PLAN.md, and
MASTER_PROGRESS.md.

Objective:
Add private native transport worker-thread teardown diagnostics that extend the
accepted batched JSON and cross-environment teardown gates without loading a
native addon or changing public native behavior.

Write scope:
- `crates/fast-react-napi/src/lib.rs`
- native package JS loader/test files if needed
- `tests/conformance/test/native-*.mjs` if relevant
- `worker-progress/worker-524-native-transport-worker-thread-teardown.md`

Constraints:
- Do not require a built native addon for JS tests.
- Keep diagnostics private and deterministic.
- Preserve accepted cross-environment teardown metadata.

Verification:
- Run focused `fast-react-napi` tests.
- Run native workspace checks.
- Run `cargo fmt --all --check` and `git diff --check`.

Handoff:
- Record summary, changed files, commands, evidence, risks, and next tasks.
