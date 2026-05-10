# Worker 359: Function Component State Dispatch Root Reschedule

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- Initial `get_goal` returned status `active` with objective:
  `Add a private canary showing a function-component useState dispatch records a lane-backed root reschedule request after initial render, without public hook or event integration.`
- A pre-report `get_goal` check again returned status `active` for the same
  objective.

## Summary

Added a private Rust-only canary proving a function-component `useState`
dispatch after an initial private render can append the hook update, mark the
function fiber and HostRoot path with the dispatch lane, mark the root pending
lane, and record a scheduler reschedule request that later selects the lane for
an async callback.

This stays below public hook compatibility: no JS hook dispatcher, event
handler, DOM/test-renderer public route, commit, host mutation, or root current
switch was added.

## Changed Files

- `crates/fast-react-reconciler/src/concurrent_updates.rs`
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `worker-progress/worker-359-function-component-state-dispatch-root-reschedule.md`

## Evidence Gathered

- Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read worker reports 124, 128, 155, 158, 159, 327, 328, and 330.
- Inspected the current private hook queue/render path in
  `function_component.rs`, lane propagation in `concurrent_updates.rs`, and
  root scheduling in `root_scheduler.rs`.
- Checked React 19.2.6 source for `dispatchSetStateInternal`,
  `enqueueConcurrentHookUpdate`, `markUpdateLaneFromFiberToRoot`,
  `getRootForUpdatedFiber`, and `scheduleUpdateOnFiber`.
- Spawned a read-only explorer for the same local-code question, but it did
  not return usable final guidance before local implementation and
  verification completed, so no conclusions rely on it.

## Implementation Notes

- Made `root_for_updated_fiber` crate-private so scheduler validation can
  confirm non-HostRoot source fibers resolve to the requested root.
- Added a crate-private `RootRescheduleRequestRecord` and
  `ensure_root_is_rescheduled` path in `root_scheduler.rs`. It validates that
  the source fiber belongs to the root and that the root pending lanes already
  contain the reschedule lane before reusing the existing scheduled-root
  insertion and microtask-dedupe machinery.
- Added
  `FunctionComponentHookRenderStore::dispatch_state_update_and_reschedule_root`
  plus a private result/error record. The helper dispatches to the existing
  hook queue, marks the fiber-to-root lane path, and records the scheduler
  reschedule request.
- Added focused canaries for function-component lane propagation,
  scheduler reschedule admission from a function-component source, and the full
  post-initial-render private `useState` dispatch path.

## Commands Run

```sh
# sed/rg reads of WORKER_BRIEF.md, MASTER_PLAN.md, MASTER_PROGRESS.md, worker reports, local reconciler files, and React 19.2.6 reference files
git status --short
cargo fmt --all
cargo test -p fast-react-reconciler --all-features private_use_state_dispatch_after_initial_render_records_root_reschedule_request
cargo test -p fast-react-reconciler --all-features root_scheduler_reschedules_function_component_source_after_lane_mark
cargo test -p fast-react-reconciler --all-features concurrent_updates_mark_function_component_lane_to_root_path
cargo test -p fast-react-reconciler --all-features function_component
cargo test -p fast-react-reconciler --all-features root_scheduler
cargo fmt --all --check
cargo test -p fast-react-reconciler --all-features
git diff --check
```

## Verification

- `cargo fmt --all --check`: passed.
- Focused canaries passed:
  - `private_use_state_dispatch_after_initial_render_records_root_reschedule_request`
  - `root_scheduler_reschedules_function_component_source_after_lane_mark`
  - `concurrent_updates_mark_function_component_lane_to_root_path`
- `cargo test -p fast-react-reconciler --all-features function_component`:
  passed, 56 tests.
- `cargo test -p fast-react-reconciler --all-features root_scheduler`:
  passed, 41 tests.
- `cargo test -p fast-react-reconciler --all-features`: passed, 301 unit tests
  plus 1 compile-fail doctest.
- `git diff --check`: passed.

## Risks Or Blockers

- No blockers.
- The helper is intentionally private and test-driven. It does not install a
  public dispatcher, compute JS actions, integrate event handlers, or expose
  public `useState` compatibility.
- The canary attaches the rendered function-component work-in-progress under a
  HostRoot only to prove lane propagation and scheduling metadata. It does not
  define real commit-time hook-list rebinding or function-component current
  switching.
- Transition entanglement for hook queues remains out of scope; this canary
  proves the lane-backed root reschedule path for a default-lane state update.

## Recommended Next Tasks

- Define commit-time hook-list rebinding before relying on function-component
  state across real current switches.
- Add hook transition entanglement metadata only after hook queues have a
  root-aware ownership path.
- Keep public hook/event integration blocked until a renderer-backed dispatcher
  can run function components end to end.
