# Worker 345: Native Root Bridge Real Handle Admission Preflight

Goal status: active
Goal objective: Worker 345: add a private preflight that maps JS root bridge
request-shape records to the Rust native handle validation model more directly,
while still not loading a native addon or executing renderer work.

Started: 2026-05-10

## Summary

Added a private handle-admission preflight to the existing
`@fast-react/native` request-shape gate. The gate still accepts React DOM
private native handoff records or their `nativeRequestRecord` mirrors, but now
also builds an inert JS shadow of the Rust `BridgeHandleTable` admission path:
create admits root/value handles, render validates the active root and admits
or validates value handles, and unmount retires the root then records the
stale-handle proof expected by
`fast-react-napi.NativeRootBridgeRequestSequenceValidator`.

The native loader remains a no-load placeholder. No `.node` loading, platform
package loading, N-API registration, reconciler work, renderer work, DOM
mutation, listener installation, hydration, or public root behavior was added.

## Goal Setup Evidence

- `create_goal` was called as the first action for this worker objective before
  file reads, implementation, or verification.
- `get_goal` immediately after setup returned status `active` for the
  objective recorded above.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `bindings/node/index.cjs`
  - Added frozen handle-admission preflight metadata under
    `nativeRootBridgeRequestShape`.
  - Extended `createNativeRootBridgeRequestShapeGate()` to return
    `handleAdmissionPreflight` without changing top-level native package
    exports.
  - Added a private JS shadow handle-table preflight that validates active
    root handles, value handle generation/kind conflicts, root retirement, and
    the retired-root stale-handle evidence.
- `bindings/node/test/native-loader.test.cjs`
  - Added CJS coverage for the preflight metadata, real React DOM private
    handoff records, unmount stale-handle proof, stale value handle rejection,
    and root/value slot conflict rejection.
- `bindings/node/test/native-loader-esm.test.mjs`
  - Added ESM coverage that the existing CJS gate export exposes the new
    handle-admission preflight result.
- `crates/fast-react-napi/src/lib.rs`
  - Added public metadata constants for the handle-admission preflight status,
    `BridgeHandleTable` model name, Rust validation record fields, and
    admission action codes.
  - Extended the existing Rust metadata alignment test.
- `worker-progress/worker-345-native-root-bridge-real-handle-admission-preflight.md`
  - Recorded goal evidence, implementation notes, verification, risks, and
    handoff.

## Commands Run

- `node --check bindings/node/index.cjs`: passed.
- `node --check bindings/node/test/native-loader.test.cjs`: passed.
- `node --check bindings/node/test/native-loader-esm.test.mjs`: passed.
- `node bindings/node/test/native-loader.test.cjs`: passed.
- `node bindings/node/test/native-no-load-guard.test.cjs`: passed.
- `node bindings/node/test/native-loader-esm.test.mjs`: passed.
- `cargo fmt --all`: passed.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features`: passed, 30 unit tests and 0
  doctests.
- `npm run check --workspace @fast-react/native`: passed. npm printed the
  existing `minimum-release-age` config warning.
- `git diff --check`: passed with the new progress report included via
  intent-to-add, then reset back to untracked.
- `node` one-off `Object.keys(require('./bindings/node/index.cjs'))`: confirmed
  top-level native package exports stayed unchanged.
- Supporting inspection commands: `sed`, `rg`, `git status --short`,
  `git diff --stat`, `git diff`.

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed goal-tool ordering, write scope, verification
  expectations, progress report requirements, and no orchestrator takeover.
- `MASTER_PLAN.md`: confirmed worker 345 is scoped to native root bridge real
  handle admission preflight.
- `MASTER_PROGRESS.md`: confirmed workers 293-322 were accepted, including the
  current native request-shape and boundary-error foundations.
- Worker reports 166, 190, and 232: confirmed the accepted private
  environment-local handle table, teardown invalidation, root lifecycle, stale
  generation, wrong-environment, and wrong-kind behavior.
- Worker reports 256 and 281: confirmed the Rust native root request records
  and sequence validator model for create/render/unmount admission.
- Worker report 269: confirmed React DOM private native handoff records are
  inert mirrors with raw payloads kept behind WeakMaps.
- Worker reports 318 and 319: confirmed the existing JS request-shape gate and
  native boundary error-code mapping that this preflight extends without
  changing package load behavior.
- Current `root-bridge.js`: confirmed JS handoff records carry synthetic
  root/value handles while keeping native/reconciler/DOM execution blocked.

## Risks Or Blockers

- The preflight is still JS-only and diagnostic. It does not prove real N-API
  export registration, native handle-table lookup, JS value rooting, cleanup
  hooks, scheduler transport, reconciler execution, commit, or renderer output.
- The shadow table admits JS handoff handles directly so the current React DOM
  synthetic root/value handle order remains usable. Future real native
  execution must replace this with actual `fast-react-napi` handle allocation
  and lookup semantics.
- Top-level native package exports were intentionally not changed to avoid
  widening the public package surface.

## Recommended Next Tasks

- Reuse the preflight’s admitted/stale handle evidence when a future worker
  introduces actual native request transport.
- Add real handle-table admission tests only in a worker explicitly scoped to
  N-API loading/invocation and platform artifacts.
- Keep public React DOM roots blocked until reconciler scheduling, commit,
  listener setup, and DOM mutation gates are admitted together.

## Delegation

Spawned two explorer agents to inspect the JS native loader gate and Rust
native model. They did not return usable final findings before I closed them,
so no conclusions or implementation choices relied on delegated output.
