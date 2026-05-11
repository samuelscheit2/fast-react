# Worker 926 - Core Hook Staging Failure Preservation

## Summary

- Hardened `HookUpdateStaging::finish_queueing` so staged hook update rows preflight the full existing pending ring before mutating queue links or clearing staging.
- Tightened circular ring validation to reject a declared tail that is not reachable from `tail.next`, which catches caller-shaped corrupt pending rings that previously looked like a shorter valid cycle.
- Added currentness/failure-preservation canaries for duplicate staged update IDs, stale queue IDs, stale update IDs, already-linked updates, corrupt existing pending rings, and success one-shot clearing of staging entries and lanes.

## Evidence

- React 19.2.6 source anchor: `/Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberConcurrentUpdates.js` `finishQueueingConcurrentUpdates` drains staged `(fiber, queue, update, lane)` rows into each hook queue's circular `pending` ring.
- Fast React currentness path: `finish_queueing` validates generational `HookQueueId` and `HookUpdateId`, rejects linked updates and duplicate staged update IDs, validates existing pending rings with `collect_ring_ids`, then appends and clears staging only after the full preflight succeeds.
- Worker 918 render-phase update gate was used only as verification context through the requested reconciler test filters; no public hook dispatcher, scheduler timing, root scheduling, renderer execution, `act`, or package compatibility surface was opened.

## Checks

- `cargo test -p fast-react-core --all-features hook_state_queue`
- `cargo test -p fast-react-reconciler --all-features function_component_render_phase`
- `cargo test -p fast-react-reconciler --all-features function_component`
- `cargo check -p fast-react-core --all-features`
- `cargo check -p fast-react-reconciler --all-features`
- `cargo fmt --all --check`
- `git diff --check`

## Risks Or Blockers

- This touches the shared core hook queue file, so it may conflict with other hook queue workers if any appear. No docs, NAPI, React DOM events, root scheduling, or reconciler concurrent update files were changed.
- `finish_queueing` now walks each distinct target queue's existing pending ring during preflight. That is intentional for corruption detection, but it adds O(existing pending ring length) validation before staging drain.

## Recommended Next Tasks

- If later workers add public hook dispatch/root scheduling around this core path, keep these currentness canaries as the private regression gate before wiring any scheduler-visible behavior.
