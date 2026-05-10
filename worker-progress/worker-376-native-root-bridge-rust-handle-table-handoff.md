# Worker 376: Native Root Bridge Rust Handle Table Handoff

Goal status: active
Goal objective: Connect the JS native root bridge handoff records to a narrow Rust
`fast-react-napi` handle-table admission smoke path, proving create/render/
unmount handle state transitions remain aligned.

Started: 2026-05-10

## Summary

Connected the private JS native root bridge handoff metadata to a narrow Rust
handle-table admission smoke path. The JS loader now mirrors the Rust
handle-table smoke metadata and per-request admission records for create,
render, and unmount handoffs while still reporting `nativeExecution: false`.

On the Rust side, `BridgeHandleTable` can admit handoff-supplied exact root and
value handles into deterministic slots, then the private root bridge smoke path
validates the same create/render/unmount records through the existing sequence
validator. The smoke proves `none->active`, `active->active`, and
`active->retired` transitions, including the retired root stale-handle proof.

No `.node` addon loading, N-API dependency, native renderer execution,
reconciler execution, DOM mutation, or public native API was added.

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
  - Added frozen Rust handle-table admission smoke metadata under
    `nativeRootBridgeRequestShape`.
  - Extended `createNativeRootBridgeRequestShapeGate()` results with
    `rustHandleTableAdmissionSmoke`, derived from the existing handoff
    preflight and explicitly marked as no native/reconciler/renderer execution.
- `bindings/node/test/native-loader.test.cjs`
  - Added CJS assertions for the smoke metadata, per-request state
    transitions, root/value admission actions, retired-root stale proof, and
    frozen Rust-shaped smoke records.
- `bindings/node/test/native-loader-esm.test.mjs`
  - Added ESM coverage for the new smoke result.
- `crates/fast-react-napi/src/handle_table.rs`
  - Added exact-slot handoff admission helpers for root/value handles with
    admitted-vs-validated outcomes.
  - Added a focused handle-table test for JS-style root slot 1, container slot
    2, and render value slot 3.
- `crates/fast-react-napi/src/lib.rs`
  - Added private Rust smoke records and a
    `smoke_admit_js_native_root_bridge_handoff_records` helper that admits
    JS-shaped handoff records through `BridgeHandleTable` and validates them
    through `NativeRootBridgeRequestSequenceValidator`.
  - Added Rust metadata constants and a focused create/render/unmount smoke
    test proving handle state alignment.
- `worker-progress/worker-376-native-root-bridge-rust-handle-table-handoff.md`
  - Recorded goal evidence, implementation notes, verification, and risks.

## Commands Run

- `node --check bindings/node/index.cjs && node --check bindings/node/test/native-loader.test.cjs && node --check bindings/node/test/native-loader-esm.test.mjs`
- `cargo test -p fast-react-napi --all-features native_root_bridge_js_handoff_records_smoke_admit_through_rust_handle_table`
- `cargo test -p fast-react-napi --all-features admits_js_handoff_handles_at_explicit_slots`
- `node bindings/node/test/native-loader.test.cjs`
- `node bindings/node/test/native-loader-esm.test.mjs`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `npm run check --workspace @fast-react/native`
- `git diff --check`
- `git add --intent-to-add worker-progress/worker-376-native-root-bridge-rust-handle-table-handoff.md && git diff --check; rc=$?; git reset -- worker-progress/worker-376-native-root-bridge-rust-handle-table-handoff.md >/dev/null; exit $rc`
- Supporting inspection commands: `rg`, `sed`, `git diff`, `git status --short`,
  and `get_goal`.

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed write scope, first-action goal policy,
  verification requirements, report requirements, and no orchestrator takeover.
- `MASTER_PLAN.md`: confirmed worker 376 is scoped to native root bridge Rust
  handle-table handoff.
- `MASTER_PROGRESS.md`: confirmed accepted native bridge/request-shape,
  boundary-error, preflight, and private root-output foundations.
- Worker 166 report: confirmed the environment-local typed handle table, stale
  generation behavior, wrong-environment rejection, and no N-API wiring.
- Worker 318 report: confirmed JS handoff records and request-shape gate
  expectations.
- Worker 319 report: confirmed native boundary errors must remain separate from
  React behavior errors and native execution.
- Worker 345 report: confirmed the existing JS-only handle-admission preflight
  and no-load policy.
- Worker 352 report: confirmed private root diagnostics remain separate from
  public root compatibility claims.
- Current `root-bridge.js`: confirmed React DOM handoff records use root slot 1,
  value slots for create/render payloads, active/retired root states, and
  no native/reconciler/DOM execution.

## Verification

- JS syntax checks passed.
- Focused CJS and ESM native loader tests passed.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features`: passed, 32 unit tests and 0
  doctests.
- `npm run check --workspace @fast-react/native`: passed CJS loader, no-load
  guard, and ESM loader checks. NPM printed the existing
  `minimum-release-age` warning.
- `git diff --check`: passed.
- Report-inclusive `git diff --check`: passed with this progress report added
  via intent-to-add, then unstaged again.

## Risks Or Blockers

- The JS smoke record is a frozen mirror of the Rust admission model; it is not
  evidence that a built `.node` addon executed.
- The Rust smoke path is still private and placeholder-record based. It does
  not root raw JS values, register N-API cleanup hooks, schedule reconciler
  work, commit host output, or run a native renderer.
- Exact-slot admission is intentionally narrow for handoff records. Future real
  native transport must preserve environment and generation validation before
  widening any handle allocation policy.

## Recommended Next Tasks

- Reuse the smoke records when an explicitly scoped worker introduces real
  native request transport.
- Keep public React DOM/native root compatibility blocked until native loading,
  reconciler scheduling, commit, and renderer output are admitted together.
- Add N-API lifetime and cleanup-hook tests only when `.node` exports and
  native dependency wiring are intentionally introduced.

## Delegation

No nested agents were spawned for this task.
