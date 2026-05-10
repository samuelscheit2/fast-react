# Worker 539: Test Renderer Live Rust Root Create Preflight

## Objective

Add a private react-test-renderer JS-to-Rust root-create preflight that validates
the accepted Rust root canary boundary without creating a public renderer root.

## Context

Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first. Build
on accepted test-renderer native/root bridge metadata and keep public
`create()` behavior blocked.

## Write Scope

- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-539-test-renderer-live-rust-root-create-preflight.md`

## Requirements

- Record create input shape, root options metadata, Rust canary API identity,
  and blocked public root status.
- Do not load native addons or expose public root compatibility.
- Fail closed for unsupported children, stale canary metadata, and missing root
  options.

## Verification

- Focused Rust test-renderer tests for the preflight
- `node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `npm run check --workspace @fast-react/react-test-renderer`
- `cargo fmt --all --check`
- `git diff --check`

