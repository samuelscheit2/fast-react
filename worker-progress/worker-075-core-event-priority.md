# worker-075-core-event-priority

## Objective

Implement lane-backed core event priority primitives in `fast-react-core`.

## Goal Tool Status

- First worker action used `create_goal` with objective: `Implement lane-backed core event priority primitives in fast-react-core.`
- Immediate `get_goal` result: status `active`, objective `Implement lane-backed core event priority primitives in fast-react-core.`

## Summary

- Added `crates/fast-react-core/src/event_priority.rs` with an opaque `EventPriority` newtype backed by existing `Lane` values.
- Modeled React 19.2.6 event priorities without a renderer-local enum:
  - `NoEventPriority` maps to `Lane::NO`
  - `DiscreteEventPriority` maps to `Lane::SYNC`
  - `ContinuousEventPriority` maps to `Lane::INPUT_CONTINUOUS`
  - `DefaultEventPriority` maps to `Lane::DEFAULT`
  - `IdleEventPriority` maps to `Lane::IDLE`
- Added lane conversion and ordering helpers: `event_priority_to_lane`, `lanes_to_event_priority`, `higher_event_priority`, `lower_event_priority`, and `is_higher_event_priority`.
- Exported the event-priority primitives from `fast-react-core` in `src/lib.rs` for future reconciler, DOM, and test-renderer update-priority work.
- Added focused Rust unit tests covering constants, lane conversion, rejected non-event lanes, ordering helpers, `NoEventPriority` edge cases, `lanes_to_event_priority` thresholds, and highest-lane selection from lane sets.

No breaking source changes were needed inside the scoped files. The implementation is additive and deliberately keeps DOM event-name mapping and public `scheduler` package priority constants out of core.

## Evidence Gathered

- `worker-progress/worker-030-core-lane-model.md`: `Lane`/`Lanes` are the canonical React 19.2.6 lane bitsets and already expose the exact lane constants used by event priorities.
- `worker-progress/worker-041-dom-events-priority-plan.md`: internal React event priorities are lane-backed values, separate from public Scheduler priority constants.
- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`: client roots need core lane-backed event priority before root scheduling and DOM listener slices can map updates correctly.
- `worker-progress/worker-073-test-renderer-update-model-plan.md`: test-renderer updates must share reconciler/root update priority semantics instead of using renderer-local priority shortcuts.
- Current core code inspection confirmed `Lane::SYNC`, `Lane::INPUT_CONTINUOUS`, `Lane::DEFAULT`, `Lane::IDLE`, `Lanes::highest_priority_lane`, and `Lanes::includes_non_idle_work` were already available for a small lane-backed event-priority module.

## Nested Agents

- Spawned read-only explorer `019e0eea-04ee-7cb2-bd1f-08367b475b0a` to independently check the current implementation against React 19.2.6 `ReactEventPriorities` semantics.
- Spawned read-only explorer `019e0eea-13f4-76c2-9c84-f49d274effc0` to independently check the API/layering hypothesis: core should use existing lanes, avoid public Scheduler priority concepts, and stay within worker scope.
- Explorer `019e0eea-13f4-76c2-9c84-f49d274effc0` reported that scheduler separation, lane-backed API design, root exports, and write scope were correct. It noted the untracked root `Cargo.lock`; this is documented below as a regenerable artifact.
- Explorer `019e0eea-04ee-7cb2-bd1f-08367b475b0a` reported no semantic mismatches against React 19.2.6 `ReactEventPriorities`. It suggested optional extra coverage for equal-priority helpers and exhaustive `from_lane` rejection; those tests were added before the final verification run.

## Changed Files

- `crates/fast-react-core/src/event_priority.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-075-core-event-priority.md`

## Commands Run

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-030-core-lane-model.md
sed -n '1,260p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '1,260p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,260p' worker-progress/worker-073-test-renderer-update-model-plan.md
git status --short --untracked-files=all
rg --files crates/fast-react-core/src worker-progress | sort
sed -n '1,260p' crates/fast-react-core/src/lane.rs
sed -n '260,620p' crates/fast-react-core/src/lane.rs
sed -n '1,220p' crates/fast-react-core/src/lib.rs
sed -n '1,260p' crates/fast-react-core/Cargo.toml
sed -n '1,260p' worker-progress/worker-075-core-event-priority.md
sed -n '1,280p' crates/fast-react-core/src/event_priority.rs
sed -n '280,620p' crates/fast-react-core/src/event_priority.rs
git diff -- crates/fast-react-core/src/lib.rs crates/fast-react-core/src/event_priority.rs
rg -n "EventPriority|event_priority|lanes_to_event_priority|higher_event_priority|lower_event_priority|is_higher_event_priority" -S . -g '!ORCHESTRATOR.md'
cargo test -p fast-react-core --all-features
cargo fmt --all --check
cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings
git diff --check
```

## Verification

- `cargo fmt --all --check` passed.
- `cargo test -p fast-react-core --all-features` passed: 28 unit tests and 0 doctests.
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings` passed.
- `git diff --check` passed.

## Completion Audit

| Requirement | Evidence |
| --- | --- |
| Use `create_goal` before research or file reads | `create_goal` was the first worker action in this session with the exact objective. |
| Call `get_goal` and record active goal status/objective | `get_goal` returned status `active` and the exact objective; recorded in this report. |
| Read required planning context, excluding `ORCHESTRATOR.md` | Commands read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, worker 030, worker 041, worker 055, and worker 073 reports. `ORCHESTRATOR.md` was not read. |
| Stay inside write scope | Scoped source/report changes are `crates/fast-react-core/src/event_priority.rs`, `crates/fast-react-core/src/lib.rs`, and this report. Root `Cargo.lock` is untracked and regenerable, left per worker policy. |
| Add lane-backed `EventPriority`, not a renderer-local priority enum | `EventPriority` is a transparent newtype over `Lane` in `event_priority.rs`; no public Scheduler priority type or renderer enum was added. |
| Cover No, Discrete, Continuous, Default, and Idle priorities | Constants map to `Lane::NO`, `Lane::SYNC`, `Lane::INPUT_CONTINUOUS`, `Lane::DEFAULT`, and `Lane::IDLE`; unit tests assert exact bits. |
| Add lane conversion helpers | `EventPriority::from_lane`, `EventPriority::lane`, `EventPriority::lanes`, `event_priority_to_lane`, and `From<EventPriority>` conversions are implemented and tested. |
| Add ordering helpers | `higher_event_priority`, `lower_event_priority`, and `is_higher_event_priority` are implemented and tested, including `NoEventPriority` and equal-priority cases. |
| Add `lanes_to_event_priority` semantics | Implemented using `Lanes::highest_priority_lane()` and React threshold checks; tests cover hydration, sync, continuous, default, transition/retry/selective hydration, idle, offscreen, deferred, and mixed lane sets. |
| Export primitives from `fast-react-core` | `src/lib.rs` declares `mod event_priority` and re-exports the type and helper functions. |
| Add focused Rust unit tests | `event_priority.rs` contains six focused unit tests for the requested surface. |
| Run required checks | `cargo fmt --all --check`, `cargo test -p fast-react-core --all-features`, `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`, and `git diff --check` passed. |
| Record nested agents | Nested read-only explorers and their conclusions are recorded in this report. |

## Quality Review

- Quality: the implementation follows React's lane-backed `EventPriority = Lane` model instead of adding a separate enum that would diverge from root scheduling.
- Maintainability: event-priority logic is isolated in one core module and exports only small, const-friendly helpers that future root scheduling can reuse.
- Performance: all helpers are transparent newtype and bit-operation based; there is no allocation, hashing, or dynamic dispatch.
- Security: this change introduces no unsafe code, no I/O, no JS callback storage, and no host or DOM access.

## Risks Or Blockers

- DOM event-name-to-priority mapping, `current_update_priority`, `resolve_update_priority`, `runWithPriority`, `flushSync` priority overrides, hydration replay, and public Scheduler priority mapping remain out of scope for later DOM/reconciler workers.
- `lanes_to_event_priority(Lanes::NO)` returns `EventPriority::DISCRETE`, matching React's threshold helper behavior; callers that need a no-work sentinel must check empty lanes before calling it.
- Root `Cargo.lock` is currently an untracked regenerable artifact produced by Cargo and left in place per worker cleanup policy.

## Recommended Next Tasks

- Wire this core `EventPriority` into future reconciler update-priority APIs once HostRoot update queues exist.
- Replace renderer-local `EventPriority = ()` host/test fixtures in a dedicated host/reconciler/test-renderer worker, outside this worker's write scope.
- Keep public Scheduler priority constants in the scheduler package/root scheduler bridge rather than in `fast-react-core`.
