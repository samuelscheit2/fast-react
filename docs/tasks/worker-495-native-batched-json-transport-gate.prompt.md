# Worker 495: Native Batched JSON Transport Gate

Objective: add native bridge diagnostics for batched JSON transport records,
including deterministic per-record lifecycle validation and error rows.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 403, 435, 467, and 468 if present.

Write scope: `bindings/node/index.cjs`, `crates/fast-react-napi/src/lib.rs`,
native tests, and
`worker-progress/worker-495-native-batched-json-transport-gate.md`.

Do not add real native execution or platform binding claims.

Verification: run focused native loader/N-API tests,
`cargo test -p fast-react-napi --all-features`, `npm run check --workspace
@fast-react/native`, `cargo fmt --all --check`, and `git diff --check`.
