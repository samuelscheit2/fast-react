# worker-030-core-lane-model

## Objective

Implement the first React 19.2.6 lane bitset primitives in `fast-react-core`, without implementing scheduling, fibers, update queues, hooks, root scheduling, JS public scheduler APIs, or reconciler behavior.

## Summary

- Added `Lane`, `Lanes`, and `LaneIndex` as transparent `u32`/`u8` newtypes in `crates/fast-react-core/src/lane.rs`.
- Encoded React 19.2.6 lane constants and masks from `packages/react-reconciler/src/ReactFiberLane.js`, including sync, hydration, input continuous, default, gesture, transition, retry, selective hydration, idle, offscreen, deferred, blocking, loading-indicator, and suspense/view-transition helper masks.
- Added allocation-free helpers for lane/lane-set construction, merge, remove, intersection, subset/contains checks, highest-priority lane selection, lane/index conversion, empty/non-empty checks, and group predicates.
- Added fixed-width `LaneMap<T>` over `[T; 31]` for future root lane bookkeeping, with clone/copy/default construction, array/slice access, and lane-indexed access.
- Exported the lane primitives from `fast-react-core` because downstream root scheduler and reconciler work will need the shared canonical types.

No breaking changes were needed. The new module is additive and keeps scheduler/root selection algorithms out of scope.

## Source Evidence

- Worker-007 accepted finding: React 19.2.6 lanes are 31-bit numeric bitsets, not a flat priority enum; root bookkeeping should use fixed lane maps.
- Direct source inspected locally from worker-007's fetched React tag: `/tmp/fast-react-worker-007-src/react-19.2.6/packages/react-reconciler/src/ReactFiberLane.js`.
- Version evidence from delegated check: `/tmp/fast-react-worker-007-src/react-19.2.6/packages/shared/ReactVersion.js` reports `19.2.6`.
- `ReactFiberLane.js` evidence used:
  - `TotalLanes = 31`.
  - Lane constants from `SyncHydrationLane = 0x00000001` through `DeferredLane = 0x40000000`.
  - Group masks including `SyncUpdateLanes = 0x0000002a`, `TransitionLanes = 0x003fff00`, `RetryLanes = 0x03c00000`, `NonIdleLanes = 0x07ffffff`, `UpdateLanes = 0x0003ff2a`, and `HydrationLanes = 0x0c000095`.
  - Helper semantics: `getHighestPriorityLane(lanes) = lanes & -lanes`, `laneToIndex(lane) = 31 - clz32(lane)`, `mergeLanes = a | b`, `removeLanes = set & ~subset`, `intersectLanes = a & b`, and `createLaneMap` creates exactly 31 entries.

## Delegated Checks

- Spawned read-only explorer `019e0e73-c125-7b93-be00-688ccf22d42f` to independently verify worker-007 and React 19.2.6 lane source evidence.
- Result: confirmed the exact lane constants, masks, helper semantics, fixed `[T; 31]` lane-map requirement, and `u32` gotchas. It also called out that `pickArbitraryLaneIndex` chooses the most significant set bit while `pickArbitraryLane` chooses the lowest set bit; this implementation only exposes the single-lane index conversion and lowest-bit arbitrary lane helper needed for the current primitive layer.

## Changed Files

- `crates/fast-react-core/src/lane.rs`
- `crates/fast-react-core/src/lib.rs`
- `worker-progress/worker-030-core-lane-model.md`

## Verification

- `cargo test -p fast-react-core --all-features` passed: 22 unit tests and 0 doctests.
- `cargo fmt --all --check` passed after formatting.
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings` passed.
- Focused lane unit tests cover:
  - every React 19.2.6 lane bit and lane index
  - React source group masks
  - invalid lane/lane-set construction
  - merge/remove/intersection/subset/highest-priority helpers
  - hydration, transition, retry, idle, offscreen, blocking, loading-indicator, and suspense/view-transition predicates
  - fixed-width `LaneMap<T>` behavior for copy and non-copy values

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-007-scheduler-fiber.md`
- `sed -n '1,220p' crates/fast-react-core/src/lib.rs`
- `sed -n '1,260p' crates/fast-react-core/src/element.rs`
- `sed -n '1,220p' crates/fast-react-core/src/compatibility.rs`
- `sed -n '1,220p' crates/fast-react-core/src/symbols.rs`
- `sed -n '1,220p' crates/fast-react-core/Cargo.toml`
- `rg` and `sed` inspections of `/tmp/fast-react-worker-007-src/react-19.2.6/packages/react-reconciler/src/ReactFiberLane.js`
- `cargo test -p fast-react-core --all-features`
- `cargo fmt --all --check`
- `cargo fmt --all`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- `git status --short --untracked-files=all`

## Quality Review

- Quality: constants stay close to React names and are pinned by tests against exact values, reducing drift risk.
- Maintainability: lane primitives are isolated in one module; scheduling algorithms remain separate future work.
- Performance: helpers are `const fn` bit operations over transparent newtypes, and `LaneMap<T>` is fixed-width array storage with no hashing or heap lookup.
- Security: this change introduces no JS/host callbacks, unsafe code, I/O, or externally supplied memory access. Constructors reject bit 31 and malformed single-lane values where appropriate.

## Risks Or Blockers

- `getHighestPriorityLanes`, `getNextLanes`, entanglement, expiration, warm/pinged/suspended root behavior, transition lane claiming, retry lane claiming, hydration bumping, and root bookkeeping mutations remain unimplemented by design.
- `pickArbitraryLaneIndex(lanes)` semantics from React are not exposed yet because it is mainly needed for later root iteration algorithms; adding it later should preserve the most-significant-set-bit behavior.
- Root `Cargo.lock` is an untracked regenerable artifact produced by Cargo and left in place per worker cleanup policy.

## Recommended Next Tasks

- Implement a tested root lane bookkeeping struct using `LaneMap` for expiration times, entanglements, hidden updates, and transition metadata.
- Add transition/retry lane claimers once root scheduling state exists.
- Implement `getHighestPriorityLanes` and then `getNextLanes` against explicit root state, rather than folding those algorithms into these primitives.
