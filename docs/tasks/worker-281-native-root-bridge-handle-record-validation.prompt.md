You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Extend private `fast-react-napi` native root bridge request records with handle-table validation for create/render/unmount sequencing, without N-API bindings, raw JS values, DOM behavior, reconciler execution, or public native APIs.

Write scope:
- `crates/fast-react-napi/src/lib.rs`
- `worker-progress/worker-281-native-root-bridge-handle-record-validation.md`

Context to inspect:
Workers 166, 190, 232, 256, 269.

Constraints:
- Keep records private and deterministic.
- No Node-API types or runtime bindings.
- Preserve environment teardown isolation.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git diff --check`

Report changed files, commands, evidence, risks, and follow-up tasks.
