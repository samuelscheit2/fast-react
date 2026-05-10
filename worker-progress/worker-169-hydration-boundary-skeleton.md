# Worker 169: Hydration Boundary Skeleton

## Goal

- Objective: add fail-closed internal hydration boundary state and tests so future `hydrateRoot` work has typed placeholders, without enabling public hydration or DOM marker consumption
- Status: active
- Recorded after `create_goal` and `get_goal`: yes

## Progress

- Goal initialized and recorded.
- Read `WORKER_BRIEF.md`, worker 140 refresh, worker 095 hydrate-root plan,
  `root_config.rs`, `fiber_root.rs`, local reconciler usages, and pinned React
  19.2.6 hydration references from `/Users/user/Developer/Developer/react-reference`.
- Added internal typed hydration boundary placeholders only in the reconciler
  root config/root state modules.
- Added focused fail-closed tests for root config and fiber root hydration
  placeholders.

## Summary

- Kept normal client roots non-hydrated by default.
- Preserved `RootKind::ReservedUnsupportedHydration(UnsupportedHydrationKind::HydrationRoot)`
  and added accessors to inspect that unsupported state without adding a
  supported hydration root kind.
- Added opaque internal handles for a future dehydrated boundary, hydration
  tree context, and hydration error queue.
- Added reserved Activity/Suspense hydration boundary state with typed
  accessors for dehydrated handle, tree context, retry lane, hydration errors,
  dehydrated fragment, and unsupported kind.
- Did not add public `hydrateRoot`, host-config hydration trait changes, event
  replay, DOM marker parsing, or marker consumption.

## Changed Files

- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `worker-progress/worker-169-hydration-boundary-skeleton.md`

## Evidence Gathered

- React 19.2.6 `createFiberRoot` stores root `isDehydrated` from the hydrate
  constructor path.
- React 19.2.6 `createHydrationContainer` schedules a special initial hydration
  update without the normal `{element}` payload.
- React 19.2.6 `ReactFiberSuspenseComponent` and
  `ReactFiberActivityComponent` store dehydrated boundary handle, tree context,
  retry lane, and hydration errors.
- React 19.2.6 `ReactFiberShellHydration.isRootDehydrated` reads HostRoot
  dehydrated state for DOM event replay.
- Current Fast React reconciler still only constructs concurrent client roots
  through `FiberRootStore::create_client_root`.

## Commands Run

Tool actions:

- `create_goal` for this worker objective.
- `get_goal` immediately after setup.

Shell commands:

- `sed`/`rg` reads for the assigned context files and hydration references.
- `git status --short`
- `git diff -- crates/fast-react-reconciler/src/root_config.rs`
- `git diff -- crates/fast-react-reconciler/src/fiber_root.rs`
- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features root_config`
- `cargo test -p fast-react-reconciler --all-features fiber_root`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

## Verification

- `cargo fmt --all --check`: passed.
- `cargo test -p fast-react-reconciler --all-features root_config`: passed, 5
  tests.
- `cargo test -p fast-react-reconciler --all-features fiber_root`: passed, 6
  tests.
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`:
  passed.
- `git diff --check`: passed.

## Risks Or Blockers

- The boundary placeholders are intentionally not wired into root creation,
  scheduling, host hydration, DOM marker parsing, or event replay.
- The reserved boundary types are internal and lint-allowed as inactive
  placeholders until future hydration work consumes them.
- Public `hydrateRoot` should remain unsupported until a real hydration root
  constructor, initial hydration update path, hydration context, marker parsing,
  and event replay exist.

## Recommended Next Tasks

- Add a real reconciler hydration root constructor only after the HostRoot
  initial hydration update path and scheduling hooks are designed.
- Refine host hydration results to typed marker/boundary/form outcomes before
  DOM marker consumption.
- Add event replay blockers after dehydrated HostRoot, Suspense, and Activity
  state can be produced by real hydration.

## Nested Agents

- None spawned.
