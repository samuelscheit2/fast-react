# Worker 435: Native JSON Transport Parser Gate

Objective: add a private native JSON transport parser gate that validates the
accepted root bridge transport schema and deterministic parse errors without
invoking public native root execution.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 166, 232, 319, 376, and 403 if present.

Write scope: `crates/fast-react-napi`, `packages/native`, focused native loader
tests, focused N-API tests, and
`worker-progress/worker-435-native-json-transport-parser-gate.md`.

Do not add public native root compatibility, scheduling, commit execution, or
renderer output claims.

Verification: run `cargo fmt --all --check`, focused N-API/native tests,
`cargo test -p fast-react-napi --all-features`, package native loader tests, and
`git diff --check`.
