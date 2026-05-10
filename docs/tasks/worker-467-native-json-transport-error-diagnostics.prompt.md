# Worker 467: Native JSON Transport Error Diagnostics

Objective: extend native JSON transport parser diagnostics with deterministic
malformed payload, wrong-environment, stale-handle, and lifecycle-order error
rows.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 166, 190, 403, 423, and 435 if
present.

Write scope: `crates/fast-react-napi/src/lib.rs`,
`crates/fast-react-napi/src/handle_table.rs`, `bindings/node/test`, focused
native tests, and
`worker-progress/worker-467-native-json-transport-error-diagnostics.md`.

Do not implement a real native binding loader, public native root execution, or
cross-environment handle reuse.

Verification: run focused N-API/native tests, `cargo test -p fast-react-napi
--all-features`, `npm run check --workspace @fast-react/native`, and `git diff
--check`.
