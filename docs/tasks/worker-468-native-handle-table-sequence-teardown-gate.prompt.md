# Worker 468: Native Handle-Table Sequence Teardown Gate

Objective: add a native handle-table sequence teardown gate that proves root,
value, and transport handles become stale across environment teardown and
cannot be revived by later sequence records.

Context to read after goal setup: `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
`MASTER_PROGRESS.md`, and worker reports 166, 190, 403, 423, 435, and 467 if
present.

Write scope: `crates/fast-react-napi/src/handle_table.rs`,
`crates/fast-react-napi/src/lib.rs`, focused Rust tests, and
`worker-progress/worker-468-native-handle-table-sequence-teardown-gate.md`.

Do not implement real host native rendering, N-API loading, or public native
root compatibility.

Verification: run focused handle_table/native bridge tests, `cargo test -p
fast-react-napi --all-features`, `cargo clippy -p fast-react-napi
--all-targets --all-features -- -D warnings`, and `git diff --check`.
