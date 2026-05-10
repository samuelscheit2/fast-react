# Worker 467: Native JSON Transport Error Diagnostics

Goal status: active
Goal objective: Extend native JSON transport parser diagnostics with
deterministic malformed payload, wrong-environment, stale-handle, and
lifecycle-order error rows.

Started: 2026-05-10

## Summary

Extended the private native JSON transport parser gate with deterministic error
diagnostic rows for malformed payloads, wrong-environment handles, stale handle
generations, and lifecycle-order failures.

The Rust gate now builds those rows by running fixed failing JSON payloads
through the same parser/admission path used by accepted payloads. The JS native
loader mirror exposes matching inert rows in the parser-gate smoke metadata and
asserts that all rows keep native addon loading, native execution, renderer
execution, reconciler execution, and React behavior claims false.

No real native binding loader, public native root execution, native renderer
execution, reconciler execution, or cross-environment handle reuse was added.

## Goal Setup Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` immediately after setup returned status `active` for the objective
  recorded above.
- A later `get_goal` before this report returned status `active` for the same
  objective.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added private JSON transport error diagnostic rows.
  - Refactored parser-gate payload parsing so accepted parsing and diagnostic
    rows share the same validation path.
  - Added lifecycle prevalidation before handle admission so render-before-create
    diagnostics deterministically report lifecycle order instead of an invalid
    handle slot.
  - Added focused Rust coverage for row IDs, categories, codes, source error
    codes, boundary error codes, and fail-closed execution flags.
- `bindings/node/index.cjs`
  - Mirrored parser-gate diagnostic row metadata and deterministic row
    generation for the placeholder native loader.
- `bindings/node/test/native-loader.test.cjs`
  - Added CJS assertions for diagnostic row fields, case IDs, codes, boundary
    mappings, frozen rows, and no-execution flags.
- `bindings/node/test/native-loader-esm.test.mjs`
  - Added ESM assertions for diagnostic row IDs, codes, and no-execution flags.
- `worker-progress/worker-467-native-json-transport-error-diagnostics.md`
  - Recorded goal setup, implementation notes, evidence, verification, and
    risks.

## Commands Run

- `cargo fmt --all && cargo test -p fast-react-napi --all-features native_root_bridge_json_transport_parser_gate_reports_error_diagnostic_rows`
- `node --check bindings/node/index.cjs && node --check bindings/node/test/native-loader.test.cjs && node --check bindings/node/test/native-loader-esm.test.mjs && node bindings/node/test/native-loader.test.cjs && node bindings/node/test/native-loader-esm.test.mjs`
- `cargo test -p fast-react-napi --all-features native_root_bridge_json_transport`
- `cargo test -p fast-react-napi --all-features`
- `npm run check --workspace @fast-react/native`
- `cargo fmt --all --check`
- `git add --intent-to-add worker-progress/worker-467-native-json-transport-error-diagnostics.md`
- `git diff --check`
- Supporting inspection commands: `sed`, `rg`, `ls`, `git status --short`,
  `git diff --stat`, `git diff`, and `get_goal`.

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed goal-tool ordering, write scope, verification
  requirements, handoff requirements, and no orchestrator takeover.
- `MASTER_PLAN.md`: confirmed worker 467 is scoped to native JSON transport
  error diagnostics.
- `MASTER_PROGRESS.md`: confirmed accepted native request-shape, handle-table,
  JSON transport, and parser-gate foundations remain private.
- Worker 166 report: confirmed environment-local handles, wrong-environment,
  wrong-kind, stale-generation, disposed, and duplicate-dispose behavior.
- Worker 190 report: confirmed environment teardown invalidates handles through
  stale-generation paths.
- Worker 403 report: confirmed JSON transport smoke remains JS-to-Rust-shaped
  and does not load a `.node` addon.
- Worker 423 report: confirmed private execution bridges must not imply public
  native/root execution.
- Worker 435 report: confirmed accepted parser schema, deterministic parse
  errors, and no public native execution.
- Current `crates/fast-react-napi/src/lib.rs` confirmed parser validation errors
  already wrap handle-table and lifecycle errors.
- Current `bindings/node/index.cjs` and native loader tests confirmed the JS
  mirror owns parser-gate metadata for `@fast-react/native`.

## Verification

- Focused Rust diagnostic row test: passed.
- Focused Rust JSON transport tests: passed, 5 tests.
- JS syntax checks for touched native loader files: passed.
- Focused CJS and ESM native loader tests: passed.
- `cargo test -p fast-react-napi --all-features`: passed, 39 unit tests and 0
  doctests.
- `npm run check --workspace @fast-react/native`: passed CJS loader,
  no-load guard, and ESM loader checks. npm printed the existing
  `minimum-release-age` config warning.
- `cargo fmt --all --check`: passed.
- `git diff --check`: passed after adding this report with intent-to-add.

## Risks Or Blockers

- The diagnostic rows are private and inert. They do not prove a built native
  addon boundary, Node-API cleanup hooks, JS value rooting, native renderer
  execution, reconciler scheduling, commit, or host output.
- The JS rows remain a placeholder mirror of the Rust parser/admission
  diagnostics, not evidence of a `.node` call boundary.
- The lifecycle prevalidation changes private smoke error precedence for
  malformed sequences so lifecycle-order errors win before handle-table
  admission. This is intentional for deterministic diagnostics but still
  private.

## Recommended Next Tasks

- Reuse these diagnostic rows when an explicitly scoped worker introduces real
  N-API transport invocation.
- Keep public native/root compatibility blocked until native loading, cleanup,
  scheduling, commit, and renderer output are admitted together.
- Add cleanup-hook and JS rooting diagnostics only when real N-API exports are
  intentionally introduced.

## Delegation

No nested agents were spawned for this task.
