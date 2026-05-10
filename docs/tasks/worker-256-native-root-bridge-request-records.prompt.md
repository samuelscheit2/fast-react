You are a worker for the Fast React project.

First action: use `/goal` (create_goal) for this worker task using the Objective below, before research, file reads, implementation, or verification. After setting the goal, call get_goal if available and record the active goal status/objective in your report. Then read WORKER_BRIEF.md, MASTER_PLAN.md, and MASTER_PROGRESS.md. Do not read ORCHESTRATOR.md.

Objective:
Add private native bridge root request records in `fast-react-napi`, tying accepted handle table root-like lifecycle diagnostics to inert create/render/unmount request metadata without N-API bindings, raw JS values, reconciler execution, DOM behavior, or public native APIs.

Write scope:
- `crates/fast-react-napi/src/lib.rs`
- Focused native handle/root tests
- `worker-progress/worker-256-native-root-bridge-request-records.md`

Context to inspect:
Workers 015, 032, 096, 166, 190, 232.

Constraints:
- You are not alone in the codebase. Keep this crate-local and private.
- No N-API dependency, raw pointers, or JS/native package wiring.
- Preserve environment teardown and stale-handle guarantees.

Verification:
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git diff --check`

Report all changed files, commands, risks, and follow-up tasks in the worker-progress report.
