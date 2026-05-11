# Worker 977: Rust useRef Hook Execution Canary

## Summary

- Added a private Rust `useRef`-only render path in the function-component
  skeleton.
- Added test-only source/currentness evidence for private mount/update `useRef`
  execution that proves:
  - the same ref object handle is returned across update;
  - the ref current value is initialized from the mount value;
  - the update initial value is recorded as ignored;
  - no public hook/root/renderer/Scheduler/act compatibility is claimed.
- Added fail-closed validation for stale current-list evidence,
  cross-component records, cross-list ref hook records,
  caller-shaped/ref-overridden records, and ambiguous same-initializer
  evidence.
- Audit repair: bound supplied mount/update ref hook records to the exact
  `HookListId` from the mount/update render states before identity acceptance.
- Audit repair 2: bound each evidence record's claimed
  `render.work_in_progress` and `render.current` to the exact hook state's
  `render_fiber` and `current` before identity acceptance.
- Audit repair 3: bound each supplied hook state's `work_in_progress_list`
  owner to the hook state's `render_fiber` before accepting private `useRef`
  identity evidence.
- Left public hook facades, root rendering compatibility, renderer behavior,
  Scheduler timing, and `act` compatibility untouched.

## Changed Files

- `crates/fast-react-reconciler/src/function_component.rs`
- `worker-progress/worker-977-rust-useref-hook-execution-canary.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`.
- Inspected accepted Worker 956 report:
  `worker-progress/worker-956-react-useref-private-dispatcher-currentness.md`.
- Inspected accepted Worker 974 report:
  `worker-progress/worker-974-useref-private-execution-evidence.md`.
- Inspected existing function-component hook tests and private Rust `useRef`
  helpers:
  - `FunctionComponentRefObjectHandle`
  - `FunctionComponentUseRefRenderRequest`
  - `FunctionComponentHookRenderStore::mount_ref_hook`
  - `FunctionComponentHookRenderStore::update_ref_hook`
  - existing `useMemo + useRef` mount/update tests
- Confirmed existing render-phase staging and failure-preservation tests still
  pass under the function-component filter and full reconciler suite.
- Added audit regression coverage that pairs component A render states with
  component B real private `useRef` records and rejects the forged evidence
  before ref identity acceptance.
- Added audit regression coverage that reuses component A's real hook
  state/hooks while forging component B's work-in-progress identity and rejects
  the forged evidence before ref identity acceptance.
- Added audit regression coverage that forges both component A evidence
  records and hook states to claim component B's work-in-progress identity
  while reusing component A's real hook lists/ref records; the validator rejects
  the hook-list owner mismatch before ref identity acceptance.

## Commands Run

```sh
cargo fmt --all
cargo test -p fast-react-reconciler --all-features use_ref -- --nocapture
cargo test -p fast-react-reconciler --all-features function_component
cargo test -p fast-react-reconciler --all-features render_phase
cargo test -p fast-react-reconciler --all-features hook_staging
cargo test -p fast-react-reconciler --all-features
cargo check -p fast-react-reconciler --all-features
git diff --check
```

## Verification Results

- Focused `use_ref` tests: passed, 5 tests.
- Function-component filtered tests: passed, 134 tests.
- Render-phase filtered tests: passed, 17 tests.
- Hook-staging filtered tests: passed, 6 tests.
- Full reconciler tests: passed, 859 tests plus 1 doctest.
- `cargo check -p fast-react-reconciler --all-features`: passed.
- `git diff --check`: passed.

## Risks Or Blockers

- No blockers.
- The canary is private/test-only Rust evidence. It does not claim public
  `React.useRef` compatibility, public root/render integration, renderer
  dispatcher lifecycle, Scheduler timing, package compatibility, or `act`.
- The Rust ref object is still modeled as an internal handle plus a stored
  initial current value; it is not a public JS mutable `{ current }` object.

## Recommended Next Tasks

1. Keep public `useRef` compatibility blocked until renderer/root-backed
   hook-list rebinding and dispatcher lifecycle are admitted together.
2. When public hook execution is admitted, replace this private handle canary
   with renderer/root-backed evidence for real JS ref object identity and
   mutability.
