# Worker 232: Native Handle Root Lifecycle Canary

Objective: add a private native handle-table lifecycle canary for root-like
handles that proves allocation, lookup, generation retirement, and environment
teardown remain isolated, without Node-API bindings, JS values, reconciler
integration, raw pointers, or public native APIs.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 096, 142, 166, and 190.
- Inspect `crates/fast-react-napi/src/handle_table.rs` and `lib.rs`.

## Write Scope

- Primary: `crates/fast-react-napi/src/handle_table.rs`.
- Secondary: `crates/fast-react-napi/src/lib.rs` only for private exports.
- Report: `worker-progress/worker-232-native-handle-root-lifecycle-canary.md`.
- Do not edit reconciler, JS packages, package surfaces, or master docs.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git diff --check`
