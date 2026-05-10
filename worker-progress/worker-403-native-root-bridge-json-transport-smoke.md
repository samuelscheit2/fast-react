# Worker 403: Native Root Bridge JSON Transport Smoke

Goal status: active
Goal objective: Add a narrow JS-to-Rust JSON transport smoke for native root
bridge handoff records that validates create/render/unmount handle-table
admissions without loading a `.node` addon.

Started: 2026-05-10

## Summary

Added a private JSON transport smoke to the existing `@fast-react/native`
request-shape gate. The gate now serializes validated Rust-shaped native root
bridge request records into a deterministic JSON envelope, parses that envelope
back into normalized handoff records, and reruns handle-table admission smoke
for create/render/unmount from the decoded records.

Added matching Rust-side decoded JSON transport record types and a private
helper that converts snake_case transport records into the existing
`NativeRootBridgeRequestRecord` model before admitting them through
`BridgeHandleTable`.

No `.node` loading, N-API dependency, public native API compatibility, native
renderer execution, reconciler execution, DOM mutation, or platform package
loading was added.

## Goal Setup Evidence

- `create_goal` was called as the first action for this worker objective before
  research, file reads, implementation, or verification.
- `get_goal` immediately after setup returned status `active` for the objective
  recorded above.
- A later `get_goal` before this report still returned status `active` for the
  same objective.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `bindings/node/index.cjs`
  - Added JSON transport smoke metadata under
    `nativeRootBridgeRequestShape`.
  - Extended `createNativeRootBridgeRequestShapeGate()` results with
    `jsonTransportSmoke`.
  - Added a narrow JSON envelope encode/decode pass that revalidates decoded
    records and reruns handle-table admission smoke without native loading.
- `bindings/node/test/native-loader.test.cjs`
  - Added CJS assertions for metadata freezing, JSON envelope shape, decoded
    create/render/unmount request records, and handle-table admission smoke
    parity after JSON decode.
- `bindings/node/test/native-loader-esm.test.mjs`
  - Added ESM coverage for the new JSON transport smoke result.
- `crates/fast-react-napi/src/lib.rs`
  - Added private decoded JSON transport handle/request record types.
  - Added `smoke_admit_js_native_root_bridge_json_transport_records()`.
  - Added JSON transport metadata constants and focused tests for successful
    create/render/unmount admission plus unknown-code rejection.
- `worker-progress/worker-403-native-root-bridge-json-transport-smoke.md`
  - Recorded goal evidence, implementation notes, verification, and risks.

## Commands Run

- `node --check bindings/node/index.cjs`
- `node --check bindings/node/test/native-loader.test.cjs`
- `node --check bindings/node/test/native-loader-esm.test.mjs`
- `node bindings/node/test/native-loader.test.cjs`
- `node bindings/node/test/native-loader-esm.test.mjs`
- `cargo fmt --all`
- `cargo test -p fast-react-napi --all-features native_root_bridge_json_transport_records`
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `npm run check --workspace @fast-react/native`
- `git add --intent-to-add worker-progress/worker-403-native-root-bridge-json-transport-smoke.md`
- `git diff --check`
- Supporting inspection commands: `sed`, `rg`, `git diff`, `git status`,
  and `get_goal`.

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed goal-tool ordering, write scope, verification
  requirements, report requirements, and no orchestrator takeover.
- `MASTER_PLAN.md`: confirmed worker 403 is scoped to native root bridge JSON
  transport smoke.
- `MASTER_PROGRESS.md`: confirmed accepted native request-shape, handle-table,
  preflight, and Rust handle-table admission smoke foundations.
- Worker 166 report: confirmed environment-local typed handles, generation
  checks, stale-handle behavior, wrong-environment rejection, and no N-API
  wiring.
- Worker 318 report: confirmed JS request-shape gate expectations and inert
  native handoff records.
- Worker 345 report: confirmed the JS-only handle-admission preflight and
  no-load policy.
- Worker 376 report: confirmed exact-slot Rust handle-table admission smoke
  for JS native root bridge handoff records.
- Current `bindings/node/index.cjs`: confirmed the existing native loader is a
  placeholder and top-level package exports could remain unchanged.

## Verification

- JS syntax checks passed for `bindings/node/index.cjs`,
  `bindings/node/test/native-loader.test.cjs`, and
  `bindings/node/test/native-loader-esm.test.mjs`.
- Focused CJS and ESM native loader tests passed.
- Focused Rust JSON transport tests passed.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features`: passed, 34 unit tests and 0
  doctests.
- `npm run check --workspace @fast-react/native`: passed CJS loader,
  no-load guard, and ESM loader checks. npm printed the existing
  `minimum-release-age` config warning.
- `git diff --check`: passed with the new progress report included via
  intent-to-add.

## Risks Or Blockers

- The JS JSON transport smoke uses local `JSON.stringify`/`JSON.parse` and an
  inert JS mirror of the Rust admission path. It does not prove an actual
  native addon call boundary.
- The Rust helper accepts decoded JSON-shaped records rather than parsing
  arbitrary JSON bytes. This avoids adding dependencies or widening the native
  boundary while still validating the snake_case transport shape and handle
  admissions.
- No raw JS values are rooted, no cleanup hooks are registered, and no native
  renderer or reconciler work is executed.

## Recommended Next Tasks

- Keep this smoke private until an explicitly scoped worker introduces real
  N-API export wiring and transport invocation.
- Add actual JSON byte parsing only when the native boundary owns a stable
  transport schema and dependency policy.
- Continue blocking public React DOM/native root compatibility until native
  loading, scheduling, commit, and renderer output are admitted together.

## Delegation

No nested agents were spawned for this task.
