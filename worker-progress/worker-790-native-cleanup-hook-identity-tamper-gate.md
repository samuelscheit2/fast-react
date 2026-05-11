# Worker 790: Native Cleanup-Hook Identity Tamper Gate

Goal objective: add a Rust-only cleanup-hook identity tamper gate for the
private N-API cleanup-hook preflight without mirroring accepted evidence to JS,
loading native addons, creating worker threads, executing renderer/reconciler
behavior, changing package exports, or claiming public native compatibility.

Started: 2026-05-11

## Summary

Added a private cleanup-hook expected-identity gate inside
`fast-react-napi`. The validator now accepts cleanup-hook evidence only when
the source executable preflight row is one of the canonical root/value cleanup
hook rows and the hook id, function identity token, and argument identity token
exactly match that row's expected private tokens.

Identity tampering now rejects with
`FAST_REACT_NAPI_CLEANUP_HOOK_IDENTITY_MISMATCH` even when the evidence keeps
the canonical executable preflight status, worker/environment ids, source row,
stale-handle error codes, and reverse registration/execution order.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added private expected cleanup-hook identity constants for the canonical
    root and value cleanup-hook source rows.
  - Added a private expected-identity matcher and validation branch before
    cleanup-hook evidence can be accepted.
  - Reused the private constants when constructing accepted cleanup-hook
    preflight rows.
  - Extended accepted-row assertions for value hook function/argument tokens.
  - Added focused tamper coverage for hook id, function identity token, and
    argument identity token on both canonical root and value rows.
- `worker-progress/worker-790-native-cleanup-hook-identity-tamper-gate.md`
  - Recorded implementation notes, verification, risks, and handoff evidence.

## Commands Run

- `pwd && git status --short --branch`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `rg -n "cleanup_hook|cleanup hook|preflight|identity|hook" crates/fast-react-napi/src/lib.rs`
- `ls worker-progress`
- `sed -n ... crates/fast-react-napi/src/lib.rs`
- `rg -n "CleanupHook|cleanup_hook_identity|cleanup-hook-worker|identity tamper|tamper|worker-790" crates/fast-react-napi/src worker-progress`
- `sed -n '1,160p' worker-progress/worker-771-native-cleanup-hook-preflight.md`
- `sed -n '1,140p' worker-progress/worker-784-native-cleanup-hook-js-mirror.md`
- `rg -n "IDENTITY_MISMATCH|TAMPER|tamper gate|mismatch" crates/fast-react-napi/src/lib.rs | head -120`
- `cargo fmt --all --check` (failed before formatting; only new test formatting differed)
- `cargo fmt --all`
- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features cleanup_hook_preflight`
- `cargo test -p fast-react-napi --all-features`
- `git diff --check`
- `git status --short`
- `git add crates/fast-react-napi/src/lib.rs worker-progress/worker-790-native-cleanup-hook-identity-tamper-gate.md`
- `git diff --cached --check`
- `git diff --cached --stat`
- `git commit -m "Gate cleanup hook identity evidence"`

## Evidence Gathered

- Worker 771 established the Rust-only cleanup-hook/order preflight and kept
  cleanup-hook order/identity evidence private.
- Worker 784 mirrored existing cleanup-hook metadata to JS in a separate worker;
  this worker did not touch JS/package files or add any new mirror/export.
- Current `fast-react-napi` tests prove the private preflight still reports all
  native execution, N-API cleanup hook execution, worker-thread execution,
  renderer/reconciler execution, public native compatibility, and React
  behavior flags as false.

## Verification

Passed:

- `cargo fmt --all --check`
- `cargo test -p fast-react-napi --all-features cleanup_hook_preflight`: 4
  focused tests passed.
- `cargo test -p fast-react-napi --all-features`: 55 unit tests and 0 doctests
  passed.
- `git diff --check`
- `git diff --cached --check`

The first `cargo fmt --all --check` run failed before formatting because the
new test cases needed rustfmt line wrapping. `cargo fmt --all` was applied and
the required formatting check passed afterward.

## Risks Or Blockers

- This remains private Rust preflight evidence only. It does not execute real
  `napi_add_env_cleanup_hook`, Node `worker_threads`, JS value rooting, `.node`
  loading, scheduling, renderer/reconciler work, commits, or host output.
- Cleanup hook identities are opaque Rust diagnostic tokens only; no raw native
  function pointer or argument pointer exists yet.
- Public native/root compatibility remains blocked.
- Overlap risk: `crates/fast-react-napi/src/lib.rs` is a shared high-churn file
  for native preflight work. This worker touched only the cleanup-hook preflight
  validator/tests and did not revert or edit JS mirror/package-surface files.

## Recommended Next Tasks

- When real N-API registration/removal code exists, replace these private token
  checks with addon-backed function/argument identity evidence while keeping
  the exact canonical source-row requirement.
- Keep JS mirrors and package-surface claims inert until real native cleanup
  execution is admitted deliberately with no-load and compatibility guards.
