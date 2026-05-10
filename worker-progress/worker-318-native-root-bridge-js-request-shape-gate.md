# Worker 318: Native Root Bridge JS Request Shape Gate

Goal status: active
Goal objective: Add a native bridge request-shape gate that maps the JS private
root bridge create/render/unmount records onto the accepted `fast-react-napi`
handle validation model, without loading a native addon or executing renderer
work.

Started: 2026-05-10

## Summary

Added a JS-only request-shape gate to the `@fast-react/native` placeholder
loader. The gate accepts React DOM private native handoff records, or their
`nativeRequestRecord` mirrors, validates create/render/unmount sequencing and
handle shape, then emits frozen validation records with both JS camelCase fields
and Rust-model snake_case metadata aligned to the private
`NativeRootBridgeRequestSequenceValidator`.

The loader remains inert. It does not load `.node` artifacts, platform
packages, N-API bindings, the reconciler, or renderer work.

## Goal Setup Evidence

- `create_goal` was called first for this worker objective before file reads,
  research, implementation, or verification.
- `get_goal` returned status `active` for the objective recorded above.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added public request-shape metadata constants for JS record fields, Rust
    model field names, handle fields, request kinds, handle states, handle
    kinds, lifecycle transitions, and the accepted validator model name.
  - Added `NativeRootBridgeRootHandleState::code()` and a focused Rust test
    proving the JS request-shape metadata matches the private handle validation
    model used by the existing Rust tests.
- `bindings/node/index.cjs`
  - Added frozen request-shape metadata to `nativeBindingManifest`.
  - Added `createNativeRootBridgeRequestShapeGate()`, which validates
    create-first, monotonic request ids, same-root render/unmount sequencing,
    post-unmount rejection, root/value handle shapes, active/retired state, and
    blocked handoff flags.
  - The gate returns frozen validation records and Rust-shaped metadata while
    keeping `nativeAddonLoaded`, `nativeExecution`, `rendererExecution`, and
    `reconcilerExecution` false.
- `bindings/node/index.mjs`
  - Re-exported the CJS request-shape metadata and gate.
- `bindings/node/test/native-loader.test.cjs`
  - Added coverage using real React DOM private root bridge handoff records.
  - Asserted canonical JS-to-Rust handle mapping, frozen metadata, rejected
    invalid lifecycle sequences, and no container/listener/mutation side
    effects.
- `bindings/node/test/native-loader-esm.test.mjs`
  - Added ESM re-export and synthetic create/render/unmount shape-gate checks.
- `worker-progress/worker-318-native-root-bridge-js-request-shape-gate.md`
  - Recorded objective, implementation, evidence, verification, and risks.

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `ls worker-progress && rg -n "Worker (166|256|269|281)|native.*bridge|root bridge|request-shape|handle validation|create/render/unmount" worker-progress -S`
- `sed -n '1,220p' worker-progress/worker-166-native-bridge-handle-table.md`
- `sed -n '1,240p' worker-progress/worker-256-native-root-bridge-request-records.md`
- `sed -n '1,220p' worker-progress/worker-269-dom-root-bridge-native-request-handoff.md`
- `sed -n '1,220p' worker-progress/worker-281-native-root-bridge-handle-record-validation.md`
- `sed`/`rg` inspections of `crates/fast-react-napi/src/lib.rs`,
  `crates/fast-react-napi/src/handle_table.rs`, `bindings/node/index.cjs`,
  `bindings/node/index.mjs`, `bindings/node/test/*.cjs`,
  `bindings/node/test/*.mjs`, and `packages/react-dom/src/client/root-bridge.js`.
- `node --check bindings/node/index.cjs && node --check bindings/node/test/native-loader.test.cjs && node --check bindings/node/test/native-loader-esm.test.mjs`
- `node bindings/node/test/native-loader.test.cjs`
- `node bindings/node/test/native-loader-esm.test.mjs`
- `cargo fmt --all`
- `cargo test -p fast-react-napi --all-features`
- `cargo fmt --all --check`
- `npm run check --workspace @fast-react/native`
- `npm run check:js`
- `git add --intent-to-add worker-progress/worker-318-native-root-bridge-js-request-shape-gate.md && git diff --check; rc=$?; git reset -- worker-progress/worker-318-native-root-bridge-js-request-shape-gate.md >/dev/null; exit $rc`
- `git status --short --untracked-files=all`

## Evidence Gathered

- Worker 166 established environment-local root/value handles with
  environment, slot, generation, kind, stale, wrong-environment, and wrong-kind
  validation.
- Worker 256 established inert native create/render/unmount request records
  with request id, kind, environment id, root handle, root id, optional value
  handle, and root handle state.
- Worker 269 established the React DOM private handoff mirror using
  `nativeRequestRecord` with camelCase JS fields and no native/reconciler/DOM
  execution.
- Worker 281 established the private Rust sequence validator:
  create-first, monotonic request ids, same-root sequencing,
  active-to-active render, active-to-retired unmount, retired-root rejection,
  and optional value-handle validation.
- Current `root-bridge.js` confirms private handoff records freeze the native
  request mirror and keep raw source payloads behind WeakMaps.
- Current native no-load guard confirms placeholder imports and
  `loadNativeBinding()` must not load `.node`, platform packages,
  `child_process`, or network modules.

## Verification

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features`: passed, 27 unit tests and 0
  doctests.
- Focused native loader JS tests:
  `npm run check --workspace @fast-react/native` passed CJS loader,
  no-load guard, and ESM loader checks.
- `npm run check:js`: passed package surface, smoke imports, benchmark gates,
  workspace checks, native loader checks, and 559 conformance tests. NPM printed
  the existing `minimum-release-age` config warnings.
- `git diff --check`: passed with the new worker report included via
  intent-to-add, then unstaged again.

## Risks Or Blockers

- The gate validates JS shape and sequence only; it is not evidence of real
  N-API export registration, native handle-table lookup, JS value rooting,
  scheduler transport, reconciler execution, commit, or renderer output.
- JS canonical handle records are shape-normalized snapshots. Future native
  execution must replace this gate with real handle-table admission without
  accepting raw JS payloads as trusted native handles.
- Error codes intentionally mirror current Rust validation diagnostics for this
  gate, but broader native boundary error mapping remains separate work.

## Recommended Next Tasks

1. Map request-shape errors into the native boundary error family when the
   dedicated native error-code worker lands that policy.
2. Replace JS-only handle snapshots with real `fast-react-napi` handle-table
   admission only in a worker explicitly scoped to N-API loading/invocation.
3. Keep public React DOM root APIs blocked until reconciler scheduling, commit,
   listener setup, and DOM mutation gates are admitted together.

## Delegation

No nested agents were spawned for this task.
