# Worker 209: Test Renderer Serialization Private Gate

Objective: add a private Rust test-renderer serialization gate that can
describe the current canary's committed diagnostics and fails closed when real
host output is unavailable, without adding a public JS `create` API, public
`act`, DOM behavior, or compatibility claims.

## Required Context

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 085, 102, 153, 178, 188, 195, and 202.
- Inspect `crates/fast-react-test-renderer/src/lib.rs` and
  `tests/conformance/oracles/react-19.2.6-react-test-renderer-serialization-oracle.json`.

## Write Scope

- Primary: `crates/fast-react-test-renderer/src/lib.rs`.
- Report: `worker-progress/worker-209-test-renderer-serialization-private-gate.md`.
- Do not edit reconciler internals unless a narrow public-private accessor is
  unavoidable; do not edit JS packages or master docs.

## Verification

- `cargo fmt --all --check`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `git diff --check`
