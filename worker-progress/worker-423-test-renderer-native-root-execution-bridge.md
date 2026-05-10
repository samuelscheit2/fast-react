# Worker 423 - Test Renderer Native Root Execution Bridge

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after goal setup and again before this report.
- Active goal status from latest `get_goal`: `active`.
- Active goal objective from latest `get_goal`: Replace record-only
  react-test-renderer create/update/unmount diagnostics with a private bridge
  shape that can call the Rust test renderer root execution boundary while
  preserving public fail-closed behavior.
- `ORCHESTRATOR.md` was not read.

## Summary

Replaced the private react-test-renderer root request layer's record-only
diagnostics with a hidden private execution bridge shape.

Rust now has a `fast-react-napi` private test-renderer root execution bridge
that owns a `TestRendererRoot` and calls the accepted Rust create/update/unmount
boundary. It records scheduled updates, lifecycle before/after states, ignored
late updates, idempotent unmounts, and the continued absence of a built `.node`
addon or public compatibility claim.

The JS facade now exposes hidden bridge methods through the existing private
`fast.react_test_renderer.root_request_bridge` symbol. Those methods create a
native/Rust execution handoff, call a supplied private executor, and validate
the returned Rust lifecycle diagnostic for create/update/unmount. Public
`create()`, `create().update()`, and `create().unmount()` remain fail-closed.

No public create/update/unmount, serialization, TestInstance, or act
compatibility is claimed.

## Changed Files

- `Cargo.lock`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-napi/Cargo.toml`
- `crates/fast-react-napi/src/lib.rs`
- `packages/react-test-renderer/index.js`
- `packages/react-test-renderer/cjs/react-test-renderer.development.js`
- `packages/react-test-renderer/cjs/react-test-renderer.production.js`
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`
- `worker-progress/worker-423-test-renderer-native-root-execution-bridge.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read requested prior reports present in this checkout: 153, 304, 307, 363,
  393, 391, and 392.
- Inspected `TestRendererRoot::create`, `update`, `unmount`,
  `TestRendererRootUpdateOutcome`, and scheduled update diagnostics.
- Inspected existing `fast-react-napi` native root request, handle-table, and
  JSON transport smoke paths to keep this bridge private and dependency-light.
- Confirmed package-surface checks still expose no public root bridge export or
  native artifact load.

## Commands Run

```sh
cargo test -p fast-react-test-renderer --all-features root_lifecycle_update_and_outcome_codes_are_stable_for_private_bridges
cargo test -p fast-react-test-renderer --all-features
cargo test -p fast-react-napi --all-features test_renderer_native_root_execution_bridge
cargo test -p fast-react-napi --all-features
node --check packages/react-test-renderer/index.js
node --check packages/react-test-renderer/cjs/react-test-renderer.development.js
node --check packages/react-test-renderer/cjs/react-test-renderer.production.js
node --check tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
node --test tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs
npm run test:react-test-renderer:serialization --workspace @fast-react/conformance
npm run check --workspace @fast-react/react-test-renderer
cargo fmt --all
cargo fmt --all --check
git diff --check
```

## Verification Results

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-test-renderer --all-features`: passed, 57 unit
  tests and 0 doctests.
- Focused Rust test-renderer bridge-code test: passed.
- `cargo test -p fast-react-napi --all-features`: passed, 36 unit tests and 0
  doctests.
- Focused N-API private execution bridge tests: passed.
- JS syntax checks for all touched package/test JS files: passed.
- Focused create/routing gate: passed, 11 tests.
- React-test-renderer serialization workspace gate: passed, 18 tests.
- `npm run check --workspace @fast-react/react-test-renderer`: passed.
- `git diff --check`: passed before adding this progress report.
- npm printed the existing `minimum-release-age` warning; it did not affect
  results.

## Risks Or Blockers

- The Rust bridge is private and Rust-owned. It does not add N-API crates, a
  `.node` export, JS value rooting, cleanup hooks, or platform package loading.
- The JS bridge can call a supplied private executor and validate its Rust
  lifecycle result, but normal public methods still do not invoke native/Rust
  execution.
- Host output, serialization, TestInstance wrappers, act, Scheduler flushing,
  and public compatibility admissions remain blocked.

## Recommended Next Tasks

1. Add an explicitly scoped real N-API export only after JS value rooting and
   cleanup semantics are accepted.
2. Keep public lifecycle compatibility blocked until create/update/unmount can
   run through the private bridge and dual-run React 19.2.6 public scenarios.
3. Wire private serialization/TestInstance consumers to live bridge execution
   only after committed host-output traversal is broadened beyond canaries.

## Nested Agents

- Spawned two read-only explorers for Rust and JS bridge-shape inspection. They
  did not return findings before implementation and verification completed, so
  they were closed and did not affect conclusions.
