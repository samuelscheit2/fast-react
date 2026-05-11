# Worker 993 - NAPI Cleanup Worker Thread Blocker

## Summary

Added a private source-provenance token for the deterministic cleanup-hook
executable-preflight rows used by the Rust test-only cleanup-generation and
currentness canaries. Cleanup-hook evidence, cleanup-generation handoff rows,
and currentness rows now carry and validate that token alongside the existing
environment, worker-thread, lifecycle, row-id, generation, handle, and reentry
guard evidence before cleanup evidence can be consumed.

This remains private/test-only evidence. It does not load native addons,
execute `napi_add_env_cleanup_hook`, run Node worker-thread teardown, invoke
renderer or reconciler output, change JS package exports, or claim public
native/package compatibility.

## Changed Files

- `crates/fast-react-napi/src/lib.rs`
  - Added cleanup-hook source provenance tokens for the canonical root/value
    executable-preflight rows.
  - Threaded provenance through cleanup-hook evidence/preflight rows,
    cleanup-generation consumer rows, currentness canary rows, and both
    cleanup-generation/currentness replay keys.
  - Rejected forged source provenance before cleanup-generation replay-key
    insertion and before currentness reentry-guard consumption.
  - Added focused regressions for forged cleanup-hook source provenance at
    cleanup-generation consumption and currentness consumption.
- `worker-progress/worker-993-napi-cleanup-worker-thread-blocker.md`
  - Worker handoff report.

## Evidence Gathered

- Accepted cleanup-hook rows now expose provenance tokens:
  - root: `cleanup-hook-source-provenance:worker-764:env-764:render-root:slot-1:g1-current-2`
  - value: `cleanup-hook-source-provenance:worker-764:env-764:render-value:slot-3:g1-current-2`
- Cleanup-generation consumption rejects caller-shaped root/value provenance
  tokens as forged cleanup evidence, does not consume the replay key, and the
  canonical preflight can still consume and then replay normally.
- Cleanup currentness rejects caller-shaped cleanup-hook source provenance
  before reentry guard consumption, then accepts the canonical rows.
- Existing stale/cross-environment/cross-thread/caller-built/replay/public
  native-package blocker coverage remains green.

## Commands Run

- `cargo test -p fast-react-napi --all-features cleanup -- --nocapture` - passed, 25 tests.
- `cargo fmt --all` - passed.
- `cargo test -p fast-react-napi --all-features cleanup -- --nocapture` - passed, 25 tests.
- `cargo test -p fast-react-napi --all-features` - passed, 79 unit tests and 0 doctests.
- `cargo check -p fast-react-napi --all-features` - passed.
- `cargo fmt --all --check` - passed.
- `git diff --check` - passed.

## Risks Or Blockers

- No blockers.
- This is still Rust-private/test-only provenance evidence. It is not proof of
  real Node worker-thread teardown or real N-API cleanup-hook execution.
- `crates/fast-react-napi/src/lib.rs` remains a high-overlap native lifecycle
  file; future workers should preserve the provenance token checks when
  replacing diagnostic cleanup-hook identities with real addon-owned evidence.

## Recommended Next Tasks

- If real cleanup-hook registration is admitted later, bind the same
  provenance/currentness checks to addon-owned hook function, argument,
  environment, and worker-thread source records.
- Keep package no-load/package-surface smoke checks in the merge queue because
  this worker intentionally did not touch JS exports or native loader behavior.
