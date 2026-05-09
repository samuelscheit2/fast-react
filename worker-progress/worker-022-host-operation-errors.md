# worker-022-host-operation-errors

## Objective

Fix the root cause behind worker-018's remaining panic caveat: invalid handles,
missing children, and impossible mutation operations in the in-memory test
renderer now produce structured host operation errors where the host-config
boundary can represent them. Unsupported host capabilities remain explicit and
inspectable as a separate error category.

Write scope honored:

- `crates/fast-react-host-config/**`
- `crates/fast-react-test-renderer/**`
- Minimal compile-only/host-error propagation adjustment in
  `crates/fast-react-reconciler/**`
- `worker-progress/worker-022-host-operation-errors.md`

## Sources read

Read first, as required:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-008-renderer-host-config.md`
- `worker-progress/worker-012-host-config-traits.md`
- `worker-progress/worker-018-test-renderer-mutation-host.md`
- `worker-progress/worker-019-reconciler-host-boundary-migration.md`

Other local sources inspected:

- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/README.md`

Did not read `ORCHESTRATOR.md`.

## Implementation summary

- Replaced `HostResult<T> = Result<T, UnsupportedHostCapability>` with
  `HostResult<T> = Result<T, HostError>`.
- Added `HostError` with distinct variants:
  - `UnsupportedCapability(UnsupportedHostCapability)`
  - `Operation(HostOperationError)`
- Kept `UnsupportedHostCapability` unchanged and inspectable through
  `HostError::as_unsupported_capability()`.
- Added structured host operation diagnostics:
  - `HostHandleKind`
  - `HostParentKind`
  - `HostChildKind`
  - `HostMutationViolation`
  - `HostOperationError`
  - `HostOperationErrorKind`
- Made `HostIdentityAndContext::get_public_instance`,
  `root_host_context`, and `child_host_context` fallible so invalid handles can
  cross the boundary as host operation errors instead of panics.
- Updated `fast-react-test-renderer` handles with private renderer owner IDs so
  same-index cross-renderer handles are rejected without exposing handle
  internals.
- Converted test-renderer storage lookups and insert/remove target checks from
  `expect`/`assert` into structured `HostOperationError` returns.
- Added cycle guards for self-parent and ancestor-under-descendant mutations.
- Ordered mutation validation before detach/move, so failed insert/remove/cycle
  operations leave the in-memory tree unchanged.
- Updated test-renderer snapshots to return `HostResult<_>` so invalid
  snapshot handles are diagnosable too.
- Updated `fast-react-reconciler` minimally for the host-config API break by
  adding `ReconcilerError::HostOperation` and `From<HostError>`.

## API breaks

- `HostResult<T>` now returns `HostError`, not
  `UnsupportedHostCapability` directly. Existing callers must match
  `HostError::UnsupportedCapability(error)` or call
  `as_unsupported_capability()`.
- `HostIdentityAndContext` public-instance and host-context hooks now return
  `HostResult<_>`.
- `TestRenderer::snapshot_container`, `snapshot_instance`, and `snapshot_text`
  now return `HostResult<_>` instead of panicking on invalid renderer-owned
  handles.
- `TestContainer`, `TestInstance`, and `TestTextInstance` gained private owner
  identity fields. Handles remain opaque to callers.

These breaks remove the root cause: the shared host boundary previously had no
type-level way to represent ordinary renderer operation failures.

## Intentional panics or invariants

No non-test panic, `expect`, `assert`, `todo`, `unimplemented`, or
`unreachable` sites remain in `fast-react-test-renderer`.

Remaining panics in that crate are test-only assertion helpers that fail when a
test fixture expects a text child but receives an element, or vice versa. Those
are test invariants, not renderer operation behavior.

## Focused test coverage

- `fast-react-host-config`:
  - capability absence still reports an inspectable unsupported capability
    error.
  - host operation errors are distinct from unsupported capabilities.
- `fast-react-test-renderer`:
  - invalid same-renderer container, instance, and text handles return
    `InvalidHandle`.
  - cross-renderer handles are rejected even when indices match.
  - missing instance insertion targets return `MissingInsertionTarget` without
    detaching the moving child.
  - missing container insertion targets return `MissingInsertionTarget` without
    detaching the moving child.
  - missing instance and container removal targets return
    `MissingRemovalTarget` without changing the tree.
  - self-parent and ancestor-under-descendant mutations return
    `ImpossibleMutation`.
  - unsupported capabilities still return
    `HostError::UnsupportedCapability`.
- `fast-react-reconciler`:
  - `From<HostError>` preserves operation errors separately from unsupported
    capability errors.

## Delegated checks

- Spawned one read-only explorer to classify every renderer panic/expect site.
  It identified the insert target assertion, removal target expect, handle
  lookup expects, and the missing cycle guard as the diagnosable operation
  failures.
- Spawned one read-only explorer to test the host-config error-model
  hypothesis. It recommended one widened `HostResult<T> = Result<T, HostError>`
  rather than a second result type, while preserving
  `UnsupportedHostCapability` as an inspectable distinct variant.

Both delegated checks avoided `ORCHESTRATOR.md` and made no edits.

## Commands run

- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,240p' worker-progress/worker-008-renderer-host-config.md`
- `sed -n '1,260p' worker-progress/worker-012-host-config-traits.md`
- `sed -n '1,260p' worker-progress/worker-018-test-renderer-mutation-host.md`
- `sed -n '1,260p' worker-progress/worker-019-reconciler-host-boundary-migration.md`
- `rg --files crates/fast-react-host-config crates/fast-react-test-renderer crates/fast-react-reconciler worker-progress | sort`
- `rg -n "panic!|expect\\(|assert!\\(|unreachable!|todo!|unimplemented!" crates/fast-react-host-config/src/lib.rs crates/fast-react-test-renderer/src/lib.rs crates/fast-react-reconciler/src/lib.rs`
- `cargo fmt --all`
- `cargo fmt --all --check`
- `cargo test -p fast-react-host-config --all-features`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo test --workspace --all-features`
- `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`
- `git diff --check -- crates/fast-react-host-config crates/fast-react-test-renderer crates/fast-react-reconciler worker-progress/worker-022-host-operation-errors.md`
- `git status --short --untracked-files=all`

## Verification results

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-host-config --all-features`: passed.
  - 8 unit tests passed; doc tests passed.
- `cargo test -p fast-react-test-renderer --all-features`: passed.
  - 17 unit tests passed; doc tests passed.
- `cargo test --workspace --all-features`: passed.
  - 50 workspace unit tests passed.
  - 1 compile-fail doctest passed.
  - All doc tests passed.
- `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`: passed.
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`: passed.
- `git diff --check -- crates/fast-react-host-config crates/fast-react-test-renderer crates/fast-react-reconciler worker-progress/worker-022-host-operation-errors.md`: passed.

Cargo generated a transient root `Cargo.lock` during verification. It is a
regenerable artifact outside this worker's scope and is not part of the staged
handoff.

## Files changed

- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `worker-progress/worker-022-host-operation-errors.md`

## Risks and follow-up tasks

- Reconciler still has no real host operation path, so `ReconcilerError` only
  preserves operation errors for future use; real propagation will need more
  coverage once reconciliation starts issuing host calls.
- `HostOperationError` intentionally describes renderer-neutral categories, not
  renderer-specific object IDs. That keeps handles opaque but means detailed
  per-handle diagnostics remain renderer-local.
- Persistence, hydration, resources, singletons, and real DOM/native behavior
  remain unimplemented by design.

Recommended next tasks:

1. When the real reconciler commit path lands, use `?` on `HostResult` and add
   tests proving host operation errors surface through the reconciler boundary.
2. Add operation error categories only when a real renderer needs a new
   diagnosable failure mode; avoid renderer-specific string variants.
3. Revisit generational handle IDs if the test renderer ever reuses storage
   slots after deletion.

## Review

- Quality: the root cause is addressed at the host-config boundary rather than
  by local panic guards or ad hoc strings.
- Maintainability: unsupported capabilities and ordinary operation failures are
  separate variants, so future renderers can handle them independently.
- Performance: private owner IDs add one integer comparison per handle lookup,
  which is appropriate for a diagnostic test renderer and not a hot DOM/native
  path.
- Security: handles remain opaque; no DOM, native, FFI, network, filesystem,
  hydration, resource, singleton, or scheduler behavior was added.
