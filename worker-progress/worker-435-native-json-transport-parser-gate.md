# Worker 435: Native JSON Transport Parser Gate

Goal status: active
Goal objective: Add a private native JSON transport parser gate that validates
the accepted root bridge transport schema and deterministic parse errors
without invoking public native root execution.

Started: 2026-05-10

## Summary

Added a private JSON transport parser gate for native root bridge handoff
payloads. The Rust N-API crate now parses JSON bytes through `serde_json`,
validates the accepted envelope/request/handle schema with exact required
fields, reports deterministic parser error codes, and feeds accepted records
into the existing handle-table admission smoke without native root execution.

The `@fast-react/native` loader mirror now records inert parser-gate metadata
and deterministic parse-error evidence inside the existing JSON transport smoke
result. It keeps native addon loading, native execution, reconciler execution,
renderer execution, scheduling, commit, and output claims false.

This checkout does not contain `packages/native`; the native package surface is
under `bindings/node`, which already owns the focused loader tests.

## Goal Setup Evidence

- `create_goal` was called as the first action before file reads,
  implementation, or verification.
- `get_goal` immediately after setup returned status `active` for the worker
  objective recorded above.
- A later `get_goal` before this report still returned status `active` for the
  same objective.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `crates/fast-react-napi/Cargo.toml`
  - Added `serde_json` for the private JSON byte parser.
- `Cargo.lock`
  - Recorded the `serde_json` dependency graph.
- `crates/fast-react-napi/src/lib.rs`
  - Added private parser-gate metadata, accepted-schema validation, parser
    error codes, exact object/field/type checks, and Rust tests for accepted
    payloads plus deterministic parse failures.
- `bindings/node/index.cjs`
  - Added inert parser-gate metadata and parse-error evidence under the
    existing JSON transport smoke result.
  - Tightened the private JSON transport parser to exact envelope, request,
    and handle fields.
- `bindings/node/test/native-loader.test.cjs`
  - Added CJS assertions for parser-gate metadata, accepted decoded records,
    frozen evidence, deterministic parse error codes, and no execution flags.
- `bindings/node/test/native-loader-esm.test.mjs`
  - Added ESM coverage for parser-gate metadata and deterministic parse error
    evidence.
- `worker-progress/worker-435-native-json-transport-parser-gate.md`
  - Recorded goal state, implementation notes, evidence, verification, and
    risks.

## Commands Run

- `cargo fmt --all`
- `node --check bindings/node/index.cjs && node --check bindings/node/test/native-loader.test.cjs && node --check bindings/node/test/native-loader-esm.test.mjs`
- `cargo test -p fast-react-napi --all-features native_root_bridge_json_transport_parser_gate`
- `node bindings/node/test/native-loader.test.cjs`
- `node bindings/node/test/native-loader-esm.test.mjs`
- `cargo test -p fast-react-napi --all-features native_root_bridge_json_transport`
- `npm run check --workspace @fast-react/native`
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- Supporting inspection commands: `sed`, `rg`, `find`, `ls`, `cargo tree`,
  `git status --short`, `git diff --stat`, and `get_goal`.

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed first-action goal policy, write scope,
  verification requirements, progress report requirements, and no orchestrator
  takeover.
- `MASTER_PLAN.md`: confirmed worker 435 is scoped to the native JSON
  transport parser gate.
- `MASTER_PROGRESS.md`: confirmed accepted native request-shape,
  handle-table, JSON transport smoke, and no-public-compatibility foundations.
- Worker 166 report: confirmed environment-local typed native bridge handles,
  generation checks, stale-handle behavior, and no N-API wiring.
- Worker 232 report: confirmed root handle lifecycle and teardown canaries stay
  private and environment-local.
- Worker 319 report: confirmed native boundary errors remain distinct from
  React behavior errors and unsupported native execution.
- Worker 376 report: confirmed JS handoff records can be admitted through the
  Rust handle table without native addon loading.
- Worker 403 report: confirmed the previous JSON transport smoke parsed only
  JS-local JSON and Rust accepted decoded structs, leaving byte parsing as the
  next scoped task.
- Current `bindings/node` tests confirmed the native loader remains a
  placeholder with no `.node` addon or platform package loading.

## Verification

- JS syntax checks passed for `bindings/node/index.cjs`,
  `bindings/node/test/native-loader.test.cjs`, and
  `bindings/node/test/native-loader-esm.test.mjs`.
- Focused Rust parser tests passed: 2 parser-gate tests.
- Focused Rust JSON transport tests passed: 4 matching tests.
- Focused CJS and ESM native loader tests passed.
- `npm run check --workspace @fast-react/native`: passed CJS loader,
  no-load guard, and ESM loader checks. npm printed the existing
  `minimum-release-age` warning.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features`: passed, 36 unit tests and 0
  doctests.
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`:
  passed.

## Risks Or Blockers

- The parser gate is private and diagnostic. It does not expose a N-API export,
  load a native addon, root JS values, schedule reconciler work, commit output,
  or prove native renderer execution.
- The loader-side parser evidence is an inert JS mirror of the Rust parser
  schema and error taxonomy, not evidence of a built `.node` boundary.
- Adding `serde_json` widens the N-API crate dependency graph, but avoids
  ad-hoc JSON parsing and keeps all native Node/V8/N-API dependencies absent.

## Recommended Next Tasks

- Reuse the parser gate when a separately scoped worker introduces actual
  N-API transport invocation.
- Keep public native/root compatibility blocked until native loading,
  scheduling, commit, and renderer output are admitted together.
- Add native cleanup-hook and JS value rooting tests only when real N-API
  exports are intentionally introduced.

## Delegation

No nested agents were spawned for this task.
