# Worker 496: Native Cross-Environment Teardown Gate

Objective: add native handle-table diagnostics proving teardown and stale-handle
rejection stay isolated across environments and root/value handle generations.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 403, 435, 467, and 468 if present.

Write scope: `crates/fast-react-napi/src/handle_table.rs`,
`crates/fast-react-napi/src/lib.rs`, native tests, and
`worker-progress/worker-496-native-cross-environment-teardown-gate.md`.

Do not add real native execution or platform binding claims.

Verification: run focused native handle-table tests,
`cargo test -p fast-react-napi --all-features`, `cargo fmt --all --check`, and
`git diff --check`.
