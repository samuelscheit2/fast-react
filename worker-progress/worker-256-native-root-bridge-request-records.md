# Worker 256: Native Root Bridge Request Records

Goal status: active
Goal objective: Add private native bridge root request records in `fast-react-napi`, tying accepted handle table root-like lifecycle diagnostics to inert create/render/unmount request metadata without N-API bindings, raw JS values, reconciler execution, DOM behavior, or public native APIs.

Started: 2026-05-10

## Summary

Added a private `fast-react-napi` native root bridge request-record layer inside
`lib.rs`. The new records model inert create, render, and unmount requests with
deterministic request ids, environment ids, root handles, optional rooted value
handles, root ids, and active/retired root handle state.

The request recorder reuses the accepted private handle table: create validates
an optional container value handle before allocating a placeholder root handle,
render validates the root and optional element value handles without mutating
state, and unmount removes the root handle so later request attempts fail
through stale-handle diagnostics. Environment teardown continues to invalidate
root and value handles through the existing stale-handle path.

No N-API dependencies, raw JS values, raw pointers, package wiring, reconciler
execution, host/DOM behavior, or public native APIs were added.

## Goal Setup Evidence

- `create_goal` was called first for this worker objective before reading files,
  researching, implementing, or verifying.
- `get_goal` returned status `active` for the objective recorded above.
- The active goal status/objective are recorded at the top of this report.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added a private `root_bridge_requests` module for create/render/unmount
    request metadata and request recording.
  - Added focused unit tests covering inert request records, handle validation,
    unmount retirement, wrong-environment/wrong-kind/stale errors, and
    environment teardown stale guarantees.
- `worker-progress/worker-256-native-root-bridge-request-records.md`
  - Recorded goal setup, implementation evidence, verification, risks, and
    handoff notes.

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `rg --files worker-progress`
- `sed -n '1,240p' worker-progress/worker-015*.md`
- `sed -n '1,240p' worker-progress/worker-032*.md`
- `sed -n '1,260p' worker-progress/worker-096*.md`
- `sed -n '1,260p' worker-progress/worker-166*.md`
- `sed -n '1,280p' worker-progress/worker-190*.md`
- `sed -n '1,280p' worker-progress/worker-232*.md`
- `sed -n '1,280p' worker-progress/worker-142-native-js-bridge-refresh.md`
- `rg --files crates/fast-react-napi`
- `sed -n '1,260p' crates/fast-react-napi/src/lib.rs`
- `sed -n '221,520p' crates/fast-react-napi/src/lib.rs`
- `sed -n '1,360p' crates/fast-react-napi/src/handle_table.rs`
- `sed -n '361,760p' crates/fast-react-napi/src/handle_table.rs`
- `sed -n '761,1040p' crates/fast-react-napi/src/handle_table.rs`
- `sed -n '1,220p' crates/fast-react-napi/Cargo.toml`
- `rg -n "BridgeHandleTable|PlaceholderRootRecord|RootLifecycle|Request|root bridge|create_native_root|render|unmount|insert_root|teardown_environment" crates worker-progress -g '*.rs' -g '*.md'`
- `git status --short`
- `git status --short --branch`
- `cargo fmt --all`
- `cargo test -p fast-react-napi --all-features native_root_bridge`
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `git diff --check`
- `git add --intent-to-add worker-progress/worker-256-native-root-bridge-request-records.md`
- `git diff --check`
- `rg -n "napi|napi-derive|napi-build|neon|node-sys|rusty_v8|\\bv8\\b|libuv|uv-sys|napi_value|\\*mut|\\*const" crates/fast-react-napi`
- `git diff --stat`
- `git diff -- crates/fast-react-napi/src/lib.rs`
- `git reset -- worker-progress/worker-256-native-root-bridge-request-records.md`

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed first-action goal policy, write scope,
  verification commands, progress-report requirements, and no
  `ORCHESTRATOR.md` access.
- `MASTER_PLAN.md`: confirmed worker 256 is scoped to native root bridge
  request records in `fast-react-napi`.
- `MASTER_PROGRESS.md`: confirmed workers 166 and 190 are accepted foundations
  for the private handle table and environment teardown.
- Worker 015 and 032 reports: confirmed native loading must remain a typed
  placeholder with no real N-API/native loader dependency path.
- Worker 096 report: confirmed public JS roots and native root handles must stay
  distinct, environment-local, opaque, and invalidated on unmount/cleanup.
- Worker 166 report: confirmed root/value handle records, kind checks,
  generation retirement, wrong-environment checks, and duplicate-dispose
  diagnostics.
- Worker 190 report: confirmed teardown drains environment-local occupied slots
  and turns old handles into stale handles.
- Worker 232 report: confirmed the root lifecycle canary for allocation,
  lookup, removal, teardown isolation, and post-teardown slot reuse.
- `crates/fast-react-napi/src/handle_table.rs`: confirmed the new request
  records can reuse private table operations instead of widening exports.
- `crates/fast-react-napi/src/lib.rs`: confirmed the crate still exposes only
  placeholder metadata and `native_export_placeholder`.
- Static search found no new native dependency names, `napi_value`, or raw
  pointer patterns beyond existing metadata/test guard strings.

## Verification

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features native_root_bridge`: passed, 4
  focused root bridge tests.
- `cargo test -p fast-react-napi --all-features`: passed, 22 unit tests and 0
  doctests.
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`:
  passed.
- `git diff --check`: passed after the final report edit, with temporary
  intent-to-add so the untracked worker report was included.

## Risks Or Blockers

- The request recorder is intentionally private and unwired, so it does not
  prove real Node-API exports, JS value rooting, cleanup hooks, thread affinity,
  scheduler transport, or reconciler root integration.
- The root and value records remain placeholder numeric handles. Future bridge
  work must replace these with bridge-owned root/value/callback metadata without
  storing raw JS values or exposing handles publicly.
- Unmount currently retires the private root handle only by removing the
  placeholder root table entry. Real root unmount will also need HostRoot null
  update enqueueing, sync flush behavior, callback cleanup, and renderer-owned
  host cleanup once those scopes are assigned.

## Recommended Next Tasks

1. Map private root bridge request errors into the native boundary error family
   when real native exports are introduced.
2. Replace placeholder root/value ids with bridge-owned root, value, and
   callback metadata after the lifetime model is finalized.
3. Wire future N-API environment cleanup hooks to the existing private teardown
   operation only in a worker explicitly scoped to N-API dependencies.
4. Add private reconciler enqueue/schedule records behind this request layer
   only after the native bridge owner is allowed to integrate with reconciler
   stores.

## Delegation

No nested agents were spawned for this task.
