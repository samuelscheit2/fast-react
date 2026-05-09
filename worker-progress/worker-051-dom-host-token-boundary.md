# worker-051-dom-host-token-boundary

## Assigned objective

Add first DOM host token boundary types to `fast-react-host-config` without
implementing DOM behavior.

Write scope:

- `crates/fast-react-host-config/**`
- `worker-progress/worker-051-dom-host-token-boundary.md`

## Sources read

Required first:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`

Dependency reports:

- `worker-progress/worker-008-renderer-host-config.md`
- `worker-progress/worker-012-host-config-traits.md`
- `worker-progress/worker-040-dom-mutation-renderer-plan.md`

Current scoped source:

- `crates/fast-react-host-config/src/lib.rs`

Did not read `ORCHESTRATOR.md`.

## Hypothesis

Worker 040 identified a root-cause gap in the existing host-config boundary:
future DOM adapters need to associate host nodes with reconciler-owned fiber
identity for events, public instance lookup, hydration, diagnostics, and
deletion cleanup, but the core must not expose raw fibers or DOM concepts.

The right first step is a renderer-neutral, phase-scoped host fiber token
boundary in `fast-react-host-config`. This is a breaking trait-shape change by
design because leaving token association to later side channels would make DOM
node maps and deletion cleanup ambiguous.

## Implementation summary

- Added `HostFiberTokenTarget`, `HostFiberTokenPhase`, and
  `HostFiberTokenViolation` diagnostic enums with stable display strings.
- Added `HostOperationError::invalid_fiber_token` and
  `HostOperationErrorKind::InvalidFiberToken` so renderers can reject stale,
  invalid, wrong-renderer, wrong-phase, or wrong-target token use explicitly.
- Added `HostTypes::HostFiberToken` as the opaque token type crossing the host
  boundary.
- Added `HostFiberTokenRef<'_, H>` as a copyable phase-scoped token view. It
  exposes only the opaque token reference, phase, and target category.
- Added token parameters to generic lifecycle hooks where DOM node maps will
  need reconciler identity:
  - `HostCreation::create_instance`
  - `HostCreation::create_text_instance`
  - `HostCommit::commit_mount`
  - `HostCommit::commit_update`
  - `HostCommit::detach_deleted_instance`
  - hydration attachment and hydrated-boundary commit hooks
- Added host-config unit tests proving token diagnostics, opaque token refs,
  and token-aware lifecycle trait bounds compile without any DOM behavior.

## Excluded behavior

No DOM node creation, DOM property diffing, event delegation, hydration marker
traversal, resource/singleton behavior, controlled form behavior, reconciler
fiber production, root scheduling, node maps, or test-renderer migration was
implemented. Those remain owned by future DOM, reconciler, and test-renderer
workers.

## Breaking change

The canonical `HostTypes`, `HostCreation`, `HostCommit`, and `HydrationHost`
trait shapes now require token plumbing. Existing implementors outside this
worker's write scope, such as the reconciler test skeleton and in-memory test
renderer, will need follow-up migration before full workspace checks can pass.

This break is intentional. It removes the root cause of ambiguous host-handle
association before DOM maps, event dispatch, hydration, and deletion cleanup
are added. The legacy `HostConfig` scaffold shim remains unchanged.

## Delegated checks

- Spawned one read-only explorer to compare the partial diff with workers 008,
  012, and 040 and test whether the token boundary remained renderer-neutral.
- Spawned one read-only explorer to inspect the current host-config diff for
  likely formatting, test, clippy, and API-shape failures.

The local verification found and fixed the concrete compile/clippy issues:
manual `Copy`/`Clone` was needed for `HostFiberTokenRef` to avoid an unwanted
renderer bound, and unit-valued placeholders in the compile-only test host had
to be removed for clippy.

## Commands run

- `git status --short`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,240p' worker-progress/worker-008-renderer-host-config.md`
- `sed -n '1,260p' worker-progress/worker-012-host-config-traits.md`
- `sed -n '1,300p' worker-progress/worker-040-dom-mutation-renderer-plan.md`
- `sed -n '1,180p' worker-progress/README.md`
- `sed -n '1,260p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '260,760p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '760,1320p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '1320,2320p' crates/fast-react-host-config/src/lib.rs`
- `git diff -- crates/fast-react-host-config/src/lib.rs`
- `rg "impl HostTypes|create_instance\\(|commit_mount\\(|detach_deleted_instance|hydrate_instance\\("`
- `cargo test -p fast-react-host-config --all-features`
- `cargo fmt -p fast-react-host-config`
- `cargo fmt --all --check`
- `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`

## Verification results

- `cargo fmt --all --check`: passed after formatting
- `cargo test -p fast-react-host-config --all-features`: passed, 16 unit tests
  and 0 doc tests
- `cargo clippy -p fast-react-host-config --all-targets --all-features -- -D warnings`:
  passed after removing unit-valued placeholders

## Final changed files

- `crates/fast-react-host-config/src/lib.rs`
- `worker-progress/worker-051-dom-host-token-boundary.md`

## Risks and follow-up tasks

- Migrate `crates/fast-react-test-renderer` to provide and pass
  `HostFiberTokenRef` values in its canonical mutation host implementation.
- Migrate `crates/fast-react-reconciler` skeletons to the token-aware
  `MutationRenderer` trait shape.
- Decide in the reconciler worker how concrete token values are generated,
  versioned, and invalidated after deletion without exposing raw fiber storage.
- Extend DOM-specific workers to build node-to-token/current-props maps, but
  keep DOM node and event behavior outside `fast-react-host-config`.
