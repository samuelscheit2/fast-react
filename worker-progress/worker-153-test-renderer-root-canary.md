# Worker 153 - Test Renderer Root Canary

## Goal

- Status: complete
- Objective: add the first Rust test-renderer root canary over shared reconciler root semantics, using the existing in-memory mutation host, without adding a JS react-test-renderer facade or claiming serialization compatibility
- `create_goal` was called before research or file reads.
- `get_goal` returned status `active` for the same objective.

## Plan

- Add a Rust-only `TestRendererRoot` canary object in `fast-react-test-renderer`
  that owns `TestRenderer`, `TestContainer`, and
  `FiberRootStore<TestRenderer>`.
- Route `create`, `update`, and `unmount` through reconciler
  `update_container`, `update_container_sync`, and
  `ensure_root_is_scheduled`.
- Stop diagnostics at scheduled/rendered HostRoot state because this slice does
  not integrate commit, complete-work, serialization, or public output claims.
- Keep JS facade, public act behavior, public error mapping, and serialization
  APIs out of scope.

## Research Notes

- `fast-react-test-renderer` currently provides a token-aware in-memory
  mutation host, not a reconciler-backed root.
- `fast-react-reconciler` exports `FiberRootStore`, `RootOptions`,
  `RootElementHandle`, `update_container`, `update_container_sync`,
  `ensure_root_is_scheduled`, `process_root_schedule_in_microtask`, and
  HostRoot render-phase helpers.
- The integrated `main` has HostRoot current-switch commit and test-only host
  complete-work foundations, but they are not wired into this canary as a
  committed test-renderer output path.

## Summary

Implemented the first Rust test-renderer root canary over shared reconciler
root semantics.

`fast-react-test-renderer` now exposes a Rust-only `TestRendererRoot` that owns
the in-memory `TestRenderer`, its root `TestContainer`, and a
`FiberRootStore<TestRenderer>`. `create`, `update`, and `unmount` enqueue
HostRoot work through `update_container`, `update_container_sync`, and
`ensure_root_is_scheduled`. It does not mutate host storage directly, add a JS
`react-test-renderer` facade, expose serialization, or claim committed host
output compatibility.

The canary includes diagnostic helpers for scheduled roots, root-schedule
microtask processing, HostRoot render-phase handoff, and container snapshots.
The render-phase helper deliberately stops at WIP HostRoot state; committed
host-output assertions remain out of scope until the test renderer is wired to a
real commit/complete-work path.

## Changed Files

- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-test-renderer/Cargo.toml`
- `Cargo.lock`
- `worker-progress/worker-153-test-renderer-root-canary.md`

`Cargo.lock` changed only because Cargo recorded the new workspace dependency
from `fast-react-test-renderer` to `fast-react-reconciler`.

## Tests Added

- `root_create_enqueues_host_root_update_without_host_mutation`
- `root_update_reuses_same_fiber_root_and_shared_scheduler_record`
- `root_render_phase_canary_reaches_wip_state_without_commit_handoff`
- `root_unmount_enqueues_sync_null_update_before_wrapper_invalidation`
- `root_unmount_is_idempotent`
- `root_update_after_unmount_does_not_mutate_or_reschedule`
- `root_options_store_strict_mode_and_create_node_mock_without_invocation`

## Evidence Gathered

- Required context files were read after goal setup.
- `ORCHESTRATOR.md` was not read.
- `FiberRootStore::create_client_root` creates a concurrent client HostRoot and
  stores `RootOptions`.
- `update_container` and `update_container_sync` enqueue HostRoot updates and
  return shared schedule records without rendering, flushing, committing, or
  mutating host containers.
- `ensure_root_is_scheduled` owns the scheduled-root list and scheduler
  microtask/callback bookkeeping.
- `render_host_root_for_lanes` processes HostRoot queued updates into WIP
  state and records render-phase state without switching `root.current`.
- Scope scan found no `toJSON`, `toTree`, act/flushSync, or JS
  `react-test-renderer` package additions in the changed renderer files.
- No nested subagents were spawned.

## Verification

Passed:

```sh
cargo fmt --all --check
cargo test -p fast-react-test-renderer --all-features
cargo test -p fast-react-reconciler --all-features root_work_loop
cargo test -p fast-react-reconciler --all-features host_work
cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings
git diff --check
```

Focused results:

- `fast-react-test-renderer`: 25 unit tests passed; 0 doc tests.
- `fast-react-reconciler root_work_loop`: 7 tests passed; 75 filtered out.
- `fast-react-reconciler host_work`: 3 tests passed; 79 filtered out.

## Risks Or Blockers

- HostRoot commit and test-only host complete-work foundations exist on
  integrated `main`, but no test-renderer commit/output path exists yet, so the
  canary cannot assert committed host output.
- The root facade exposes diagnostic snapshots only. Those snapshots must not
  be treated as public `toJSON`/`toTree` output.
- `create_node_mock` is stored only and intentionally not invokable from this
  slice. Ref attachment/host commit semantics should own invocation later.
- The wrapper lifecycle uses `UnmountScheduled` after enqueue because no commit
  phase exists to prove a completed unmount.

## Recommended Next Tasks

1. Wire the test-renderer canary into the accepted HostRoot commit and
   complete-work foundations.
2. Produce a simple committed host text tree through the in-memory mutation
   host.
3. Extend this canary with committed host-output assertions only after that
   path exists.
4. Add committed-fiber inspection before any public serialization or
   `TestInstance` wrapper APIs.

## Completion Checklist

- [x] Called `create_goal` before reading files.
- [x] Called `get_goal` and recorded active status/objective.
- [x] Read `WORKER_BRIEF.md` and required worker context.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Added a root object that owns `FiberRootStore<TestRenderer>`.
- [x] Routed create/update/unmount through shared reconciler root APIs.
- [x] Stopped canary assertions at scheduled/rendered HostRoot state.
- [x] Kept serialization, public act/error behavior, and JS facade work out of
      scope.
- [x] Ran all requested verification commands.
