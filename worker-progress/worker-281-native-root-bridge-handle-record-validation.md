# Worker 281: Native Root Bridge Handle Record Validation

Goal status: active
Goal objective: Extend private `fast-react-napi` native root bridge request
records with handle-table validation for create/render/unmount sequencing,
without N-API bindings, raw JS values, DOM behavior, reconciler execution, or
public native APIs.

Started: 2026-05-10

## Summary

Extended the private `fast-react-napi` native root bridge request-record layer
with a handle-table-backed sequence validator. The validator admits create,
render, and unmount records only in root-local order, validates active root
handles for create/render, validates optional value handles at admission time,
and validates that unmount has retired the root handle through the existing
stale-handle path.

The change remains private and inert. It does not add N-API dependencies,
runtime bindings, raw JS values, raw pointers, DOM behavior, reconciler
execution, package wiring, or public native APIs.

## Goal Setup Evidence

- `create_goal` was called first for the assigned objective before research,
  file reads, implementation, or verification.
- `get_goal` returned status `active` for the objective recorded above.
- The active goal status/objective are recorded at the top of this report.
- `ORCHESTRATOR.md` was not read.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added private native root bridge lifecycle-transition metadata.
  - Added private validation records for admitted request records.
  - Added a private `NativeRootBridgeRequestSequenceValidator` that enforces
    create-first, monotonic request ids, same-root render/unmount sequencing,
    no requests after unmount, handle-table active-root checks, stale retired
    root checks, optional value-handle checks, and wrong-environment rejection.
  - Added focused Rust tests for valid create/render/unmount admission, stale
    value handles after recording, wrong environment isolation, and invalid
    lifecycle order.
- `worker-progress/worker-281-native-root-bridge-handle-record-validation.md`
  - Recorded goal setup, implementation evidence, verification, risks, and
    handoff notes.

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed`/`rg` inspection of worker context reports for workers 166, 190, 232,
  and 256.
- `find`, `git status`, `rg`, and targeted `sed` inspection of worker 269's
  sibling worktree/log context; no checked-in worker 269 report or source diff
  was present.
- `sed`/`rg` inspection of `crates/fast-react-napi/src/lib.rs`,
  `crates/fast-react-napi/src/handle_table.rs`, and private React DOM root
  bridge context.
- `cargo fmt --all`
- `cargo test -p fast-react-napi --all-features native_root_bridge`
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features`
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`
- `rg -n "napi_value|\\*mut|\\*const|napi-derive|napi-build|neon|node-sys|rusty_v8|libuv|uv-sys" crates/fast-react-napi`
- `git add --intent-to-add worker-progress/worker-281-native-root-bridge-handle-record-validation.md && git diff --check; rc=$?; git reset -- worker-progress/worker-281-native-root-bridge-handle-record-validation.md >/dev/null; exit $rc`

## Evidence Gathered

- `WORKER_BRIEF.md`: confirmed first-action goal policy, no
  `ORCHESTRATOR.md` access, write scope, verification commands, and report
  requirements.
- `MASTER_PLAN.md`: confirmed worker 281 is scoped to native root bridge handle
  record validation in `fast-react-napi`.
- `MASTER_PROGRESS.md`: confirmed accepted foundations from workers 166, 190,
  232, 256, and the active queue position for worker 269.
- Worker 166 report: confirmed private environment-local root/value handles,
  generation checks, wrong-environment rejection, stale handles, wrong-kind
  checks, and duplicate-dispose diagnostics.
- Worker 190 report: confirmed environment teardown drains matching occupied
  slots and preserves wrong-environment isolation.
- Worker 232 report: confirmed root-like handle lifecycle canary coverage for
  allocation, lookup, removal, teardown isolation, and post-teardown slot reuse.
- Worker 256 report and current `lib.rs`: confirmed accepted private native
  create/render/unmount request records and their existing recording-time
  handle checks.
- Worker 269 context: the sibling worktree was still at the shared queue commit
  with no source diff or finalized markdown report; its prompt/log context
  described private JS handoff records mirroring native request metadata while
  keeping native execution blocked.
- Current `handle_table.rs`: confirmed validation could reuse private table
  lookup/removal/stale behavior without widening module visibility.
- Current React DOM private root bridge: confirmed the analogous JS admission
  gate validates private create/render/unmount lifecycle metadata while keeping
  native/reconciler/DOM execution blocked.
- Static native-boundary search found only the existing manifest-guard strings
  for forbidden native dependencies; no `napi_value`, raw pointer, N-API, Neon,
  V8, or libuv API usage was introduced.

## Verification

- `cargo test -p fast-react-napi --all-features native_root_bridge`: passed, 8
  focused native root bridge tests.
- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-napi --all-features`: passed, 26 unit tests and 0
  doctests.
- `cargo clippy -p fast-react-napi --all-targets --all-features -- -D warnings`:
  passed.
- Report-inclusive `git diff --check`: passed with this new progress report
  added via intent-to-add for the whitespace check, then unstaged.

## Risks Or Blockers

- The validator is intentionally private and admission-only. It does not prove
  real Node-API exports, JS value rooting, cleanup hooks, scheduler transport,
  reconciler root integration, DOM mutation, or public root behavior.
- Root/value records remain numeric placeholders. Future bridge work must
  replace them with bridge-owned metadata without raw JS value storage or
  public handle exposure.
- Unmount validation proves the private root handle is retired through the
  handle table's stale-handle path. A real root unmount still needs HostRoot
  update enqueueing, sync flush behavior, callback cleanup, and renderer-owned
  host cleanup in separately scoped work.

## Recommended Next Tasks

- Map private native root bridge request validation errors into the native
  boundary error family when real native exports are introduced.
- Reconcile worker 269's eventual accepted JS handoff shape with this private
  Rust validator if it adds finalized native mirror fields.
- Add a future private reconciler enqueue/schedule handoff only after the
  native bridge owner is allowed to integrate with reconciler stores.

## Delegation

No nested agents were spawned for this task.
