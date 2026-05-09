# worker-073-test-renderer-update-model-plan

## Objective

Produce a report-only implementation plan for test-renderer updates, `act` integration, root lifecycle, tree serialization, host operation ordering, error surfaces, and conformance coverage.

Write scope honored: only `worker-progress/worker-073-test-renderer-update-model-plan.md` was written. No source code was implemented.

## Hypothesis Result

The hypothesis is correct with one important boundary: test-renderer public serialization and wrapper APIs are renderer-specific, but root updates, `act` integration, root scheduling, lane selection, update queues, commit ordering, and error propagation must be shared reconciler semantics, not shortcuts inside `fast-react-test-renderer`.

React test renderer 19.2.6 itself supports this conclusion. Its public `create()` builds a reconciler `FiberRoot`, calls `updateContainer`, exposes `update()` by calling `updateContainer` again, and exposes `unmount()` by enqueueing a null root update before dropping the public wrapper's local root/container references. It does not mutate the rendered tree directly from `create`, `update`, or `unmount`.

Fast React should therefore make `fast-react-test-renderer` a mutation host plus test-only serializer over the current fiber tree. It should not become a parallel root scheduler, FIFO update queue, or direct tree mutation API.

## Evidence

### Merged Local Reports

- Worker 044 identifies the React DOM root contract: `createRoot` creates a reconciler `FiberRoot`; `root.render` calls `updateContainer`; `root.unmount` enqueues a synchronous null update and flushes sync work across roots. See `worker-progress/worker-044-react-dom-client-roots-plan.md:11`, `worker-progress/worker-044-react-dom-client-roots-plan.md:13`, and `worker-progress/worker-044-react-dom-client-roots-plan.md:92`.
- Worker 044 rejects direct root-object mutation: the public root object must enqueue root updates, not own/render the host tree directly. See `worker-progress/worker-044-react-dom-client-roots-plan.md:113`.
- Worker 044 records the root update queue contract: `updateContainer` chooses a lane, creates a HostRoot update with payload `{element}`, enqueues it, calls `scheduleUpdateOnFiber`, and entangles transitions. See `worker-progress/worker-044-react-dom-client-roots-plan.md:132`, `worker-progress/worker-044-react-dom-client-roots-plan.md:136`, and `worker-progress/worker-044-react-dom-client-roots-plan.md:139`.
- Worker 044 makes `flushSync` a reconciler/root-scheduler boundary, not a facade helper; `flushSyncWork` must flush sync work across roots with render/commit reentrancy detection. See `worker-progress/worker-044-react-dom-client-roots-plan.md:265`, `worker-progress/worker-044-react-dom-client-roots-plan.md:279`, and `worker-progress/worker-044-react-dom-client-roots-plan.md:281`.
- Worker 044's scheduler section matches the test-renderer tarball: roots are linked, a root-schedule task/microtask recomputes lanes, sync lanes flush at schedule end, and non-sync work maps through event priority to Scheduler priority. See `worker-progress/worker-044-react-dom-client-roots-plan.md:283`, `worker-progress/worker-044-react-dom-client-roots-plan.md:289`, and `worker-progress/worker-044-react-dom-client-roots-plan.md:291`.
- Worker 007 establishes the root cause: lanes, root bookkeeping, root scheduling, circular/rebased queues, and mask-driven commits are first-class semantics. FIFO queues, flat priorities, or global effect lists are wrong abstractions. See `worker-progress/worker-007-scheduler-fiber.md:73`, `worker-progress/worker-007-scheduler-fiber.md:74`, `worker-progress/worker-007-scheduler-fiber.md:87`, `worker-progress/worker-007-scheduler-fiber.md:132`, and `worker-progress/worker-007-scheduler-fiber.md:199`.
- Worker 018 proves the current Rust test renderer is only an in-memory mutation renderer with opaque handles, snapshots, host mutation operations, and unsupported capability errors. It explicitly did not implement reconciliation. See `worker-progress/worker-018-test-renderer-mutation-host.md:75`, `worker-progress/worker-018-test-renderer-mutation-host.md:97`, `worker-progress/worker-018-test-renderer-mutation-host.md:115`, and `worker-progress/worker-018-test-renderer-mutation-host.md:181`.
- Worker 022 fixes host operation errors at the shared host boundary: invalid handles, missing insert/remove targets, and impossible mutations are structured `HostOperationError`s instead of renderer panics. See `worker-progress/worker-022-host-operation-errors.md:40`, `worker-progress/worker-022-host-operation-errors.md:72`, and `worker-progress/worker-022-host-operation-errors.md:86`.
- Worker 041 says event/update priority must be lane-backed and root scheduling must choose lanes before mapping to public Scheduler priority. This directly affects `act` and test-renderer scheduled updates. See `worker-progress/worker-041-dom-events-priority-plan.md:13`, `worker-progress/worker-041-dom-events-priority-plan.md:118`, and `worker-progress/worker-041-dom-events-priority-plan.md:163`.

### Current Rust Code

- `fast-react-core` has `Lane`, `Lanes`, `LaneIndex`, and `LaneMap<T>`, but no root lane bookkeeping algorithms. See `crates/fast-react-core/src/lane.rs:13`, `crates/fast-react-core/src/lane.rs:204`, and `crates/fast-react-core/src/lane.rs:424`.
- `fast-react-reconciler` is still a placeholder: the scheduler module reports no React scheduling semantics, and `render_mutation_placeholder` only validates the mutation boundary before returning an unimplemented error. See `crates/fast-react-reconciler/src/lib.rs:84`, `crates/fast-react-reconciler/src/lib.rs:96`, and `crates/fast-react-reconciler/src/lib.rs:142`.
- `fast-react-host-config` has the right broad capability surface, including `HostScheduling`, but `EventPriority` is still an associated type and the current test renderer binds it to `()`. See `crates/fast-react-host-config/src/lib.rs:747`, `crates/fast-react-host-config/src/lib.rs:952`, and `crates/fast-react-test-renderer/src/lib.rs:595`.
- `fast-react-test-renderer` directly exposes host snapshots and host mutation operations; it is not a reconciler or public React test renderer yet. See `crates/fast-react-test-renderer/src/lib.rs:1`, `crates/fast-react-test-renderer/src/lib.rs:5`, `crates/fast-react-test-renderer/src/lib.rs:55`, and `crates/fast-react-test-renderer/src/lib.rs:844`.
- The test renderer already enforces useful host invariants: same-renderer handle validation, single-parent moves, insert/remove errors before detach, and deletion detachment. See `crates/fast-react-test-renderer/src/lib.rs:209`, `crates/fast-react-test-renderer/src/lib.rs:187`, `crates/fast-react-test-renderer/src/lib.rs:872`, and `crates/fast-react-test-renderer/src/lib.rs:836`.

### Upstream React Test Renderer 19.2.6

Evidence came from the exact `react-test-renderer@19.2.6` npm tarball.

- The package is deprecated but still ships a CJS renderer and depends on `scheduler@^0.27.0`; it peers on `react@^19.2.6`. See `package/package.json:18`, `package/package.json:37`, and `package/package.json:41` from the tarball.
- The public entrypoint exports development/production CJS bundles; `shallow` throws because it was removed. See `package/index.js:3` and `package/shallow.js:10` from the tarball.
- The test renderer's `FiberRootNode` stores `containerInfo`, root scheduling fields, lane bitsets, lane maps, root error callbacks, `formState`, and `incompleteTransitions`, matching the same root family worker 044 describes for React DOM. See `package/cjs/react-test-renderer.development.js:14840`, `package/cjs/react-test-renderer.development.js:14851`, and `package/cjs/react-test-renderer.development.js:14858`.
- `createContainer` builds a HostRoot fiber, initializes root memoized state `{element: null, isDehydrated: false, cache}`, and initializes the update queue. See `package/cjs/react-test-renderer.development.js:14884`, `package/cjs/react-test-renderer.development.js:14909`, and `package/cjs/react-test-renderer.development.js:14916`.
- `updateContainer` requests a lane, creates a HostRoot update payload `{element}`, enqueues the update, calls `scheduleUpdateOnFiber`, and entangles transitions. See `package/cjs/react-test-renderer.development.js:14924`, `package/cjs/react-test-renderer.development.js:14971`, and `package/cjs/react-test-renderer.development.js:14981`.
- Test renderer `create()` creates a test container object, calls `createContainer`, then calls `updateContainer(element, root, null, null)`. See `package/cjs/react-test-renderer.development.js:17335`, `package/cjs/react-test-renderer.development.js:17351`, and `package/cjs/react-test-renderer.development.js:17356`.
- Public `update(newElement)` also calls `updateContainer`; public `unmount()` calls `updateContainer(null, root, null, null)` before dropping local wrapper references. See `package/cjs/react-test-renderer.development.js:17405` and `package/cjs/react-test-renderer.development.js:17410`.
- `act` is exported from React itself, while the renderer integrates with `ReactSharedInternals.actQueue` in root scheduling. See `package/cjs/react-test-renderer.development.js:17182`, `package/cjs/react-test-renderer.development.js:17333`, `package/cjs/react-test-renderer.development.js:2721`, and `package/cjs/react-test-renderer.development.js:2872`.
- React's `act` queue flushes renderer callbacks, preserves continuations, handles async recursion, warns for unawaited async/suspending `act`, and aggregates thrown errors. See `package/cjs/react.development.js:561`, `package/cjs/react.development.js:581`, and `package/cjs/react.development.js:806`.
- Test renderer serialization is renderer-specific and fiber-aware: `toJSON` reads host instances, omits `children` from props, hides hidden nodes, and brands objects with `react.test.json`; `toTree` branches on fiber tags and includes composite components. See `package/cjs/react-test-renderer.development.js:14990`, `package/cjs/react-test-renderer.development.js:15014`, `package/cjs/react-test-renderer.development.js:15053`, and `package/cjs/react-test-renderer.development.js:15060`.
- `ReactTestInstance` wraps current fibers, not raw host handles; `.props`, `.parent`, and `.children` traverse the current fiber tree. See `package/cjs/react-test-renderer.development.js:17184`, `package/cjs/react-test-renderer.development.js:17196`, `package/cjs/react-test-renderer.development.js:17282`, and `package/cjs/react-test-renderer.development.js:17288`.

## Root-Cause Implications

1. `TestRenderer::update` must not mutate `TestRenderer` arenas directly. It should enqueue a HostRoot update through shared `update_container` and let the reconciler perform render/commit.
2. `TestRenderer::unmount` must not only clear `container.children`. It needs the same root null-update path, commit deletion traversal, host detach calls, passive/layout effect ordering, and wrapper invalidation policy.
3. `act` cannot be a test-renderer-only synchronous flush helper. Root scheduling must know when an act queue exists, route scheduled root work into that queue, preserve Scheduler continuations, and emit not-wrapped-in-`act` warnings from the shared update path.
4. Tree serialization must read the committed fiber tree. Host snapshots are valuable for host-operation tests, but they cannot represent composite components, memo/forwardRef wrappers, Suspense/Activity/offscreen behavior, current-fiber resolution, or root wrapper behavior.
5. Host operation ordering belongs in reconciler commit traversal. The test renderer should log and validate host calls, but it should not decide phase order.
6. Error surfaces need two layers: structured Rust boundary errors (`HostError`, `ReconcilerError`) for implementation tests, and React-compatible JS public errors for `.root`, `find*`, `toTree`, invalid renderer states, and `act` warnings.
7. Worker 047 is not merged locally, so this plan does not assume its output. The first root-model slice below must be treated as independently necessary.

## Implementation Slices

These slices are ordered but intentionally narrow. Each can merge with focused Rust tests before any JS package facade claims public compatibility.

1. `core-event-priority`
   - Write scope: `crates/fast-react-core/src/event_priority.rs`, `crates/fast-react-core/src/lib.rs`, `worker-progress/worker-core-event-priority.md`.
   - Task: add a lane-backed `EventPriority` newtype with `No`, `Discrete`, `Continuous`, `Default`, and `Idle` constants plus `event_priority_to_lane`, `lanes_to_event_priority`, and ordering helpers. Replace `()` event-priority use in test fixtures only where needed for compilation.
   - Verification: core unit tests for exact lane mappings from worker 041; `cargo test -p fast-react-core --all-features`; `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`.

2. `core-root-lane-bookkeeping`
   - Write scope: `crates/fast-react-core/src/root_lanes.rs`, `crates/fast-react-core/src/lib.rs`, `worker-progress/worker-core-root-lane-bookkeeping.md`.
   - Task: implement root lane state and algorithms around `LaneMap<T>`: pending/suspended/pinged/warm/expired/entangled/hidden lanes, transition/retry lane claimers, `mark_root_updated`, `mark_root_finished`, `get_next_lanes`, and `get_next_lanes_to_flush_sync`.
   - Verification: pure Rust tests for worker 007/044 lane scenarios; no reconciler or host changes.

3. `reconciler-fiber-root-model`
   - Write scope: `crates/fast-react-reconciler/src/fiber.rs`, `crates/fast-react-reconciler/src/fiber_root.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-reconciler-fiber-root-model.md`.
   - Task: define arena-backed `FiberId`, `Fiber`, `FiberRoot`, HostRoot fiber initialization, root options/error callbacks as typed handles, root container handles, `current`/alternate shape, and root lifecycle state. Do not implement render work.
   - Verification: tests for HostRoot initialization, container storage, root callback storage, and current fiber wiring with a fake mutation host.

4. `reconciler-host-root-update-queue`
   - Write scope: `crates/fast-react-reconciler/src/update_queue.rs`, `crates/fast-react-reconciler/src/root_updates.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-reconciler-host-root-update-queue.md`.
   - Task: implement `create_update`, circular pending queues, base queue/rebase structure, callback storage, HostRoot payload `{element}` semantics at the binding boundary, `update_container`, `update_container_sync`, and transition entanglement hooks.
   - Verification: queue tests for insertion order plus lane skipping/rebase; HostRoot update tests proving updates do not mutate host containers before commit.

5. `reconciler-root-scheduler-act`
   - Write scope: `crates/fast-react-reconciler/src/root_scheduler.rs`, `crates/fast-react-reconciler/src/act.rs`, `crates/fast-react-reconciler/src/scheduler.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-reconciler-root-scheduler-act.md`.
   - Task: implement scheduled-root linked list, root schedule task abstraction, callback node reuse/cancellation, cross-root sync flushing, act queue routing, not-wrapped-in-act diagnostics hooks, and Scheduler continuation handling. Keep public `scheduler` package JS work separate.
   - Verification: Rust tests with a deterministic fake scheduler/act queue for cross-root sync flush, callback cancellation, continuation reuse, and `act` queue capture.

6. `reconciler-commit-ordering-skeleton`
   - Write scope: `crates/fast-react-reconciler/src/commit.rs`, `crates/fast-react-reconciler/src/effects.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-reconciler-commit-ordering-skeleton.md`.
   - Task: implement enough flag/subtree-flag traversal to commit HostRoot/host component placement, update, deletion, text update, visibility, and ref-detach/attach hooks in React phase order. The test renderer should be used as an operation log canary.
   - Verification: operation-order tests over a logging mutation host; tests that `root.current` flips after mutation and before layout-style callbacks.

7. `test-renderer-root-api`
   - Write scope: `crates/fast-react-test-renderer/src/root.rs`, `crates/fast-react-test-renderer/src/options.rs`, `crates/fast-react-test-renderer/src/lib.rs`, `crates/fast-react-test-renderer/Cargo.toml`, `worker-progress/worker-test-renderer-root-api.md`.
   - Task: add a Rust `TestRendererRoot`/`TestRendererOptions` layer that owns a reconciler root handle and exposes `create`, `update`, `unmount`, and `flush_sync` by delegating to reconciler APIs. Preserve existing direct host mutation APIs for lower-level host tests under explicit names.
   - Verification: tests proving `create/update/unmount` enqueue root updates, do not directly edit host storage, and invalidate public root access after unmount.

8. `test-renderer-tree-serialization`
   - Write scope: `crates/fast-react-test-renderer/src/serialization.rs`, `crates/fast-react-test-renderer/src/test_instance.rs`, `crates/fast-react-test-renderer/src/lib.rs`, `worker-progress/worker-test-renderer-tree-serialization.md`.
   - Task: implement Rust data models for `to_json`, `to_tree`, and `TestInstance` over the committed fiber tree. Preserve React test-renderer rules: hidden host nodes serialize to null, `children` is omitted from JSON props, text nodes serialize as strings, component nodes appear in `to_tree`, and `.root` errors after unmount.
   - Verification: serializer unit tests using committed fiber fixtures and the existing in-memory host snapshots as cross-checks.

9. `test-renderer-error-surface`
   - Write scope: `crates/fast-react-test-renderer/src/error.rs`, `crates/fast-react-test-renderer/src/lib.rs`, `crates/fast-react-reconciler/src/error.rs`, `crates/fast-react-reconciler/src/lib.rs`, `worker-progress/worker-test-renderer-error-surface.md`.
   - Task: map `HostError` and `ReconcilerError` into test-renderer-specific public errors without losing structured variants. Add public error kinds for unmounted root access, zero/multiple `find*` matches, unsupported hydration/resources, invalid host handles, and act-environment diagnostics.
   - Verification: Rust tests for structured error preservation and public-message parity fixtures.

10. `test-renderer-conformance-oracle`
    - Write scope: `tests/conformance/src/react-test-renderer-*.mjs`, `tests/conformance/scripts/*react-test-renderer*.mjs`, `tests/conformance/test/react-test-renderer-*.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-test-renderer-*.json`, `worker-progress/worker-test-renderer-conformance-oracle.md`.
    - Task: add exact-tarball probes for export keys, deprecation warning, `create` options, `update`, `unmount`, `.root`, `getInstance`, `toJSON`, `toTree`, `act`, `unstable_flushSync`, and `shallow` removal. This is not a Rust implementation slice, but it should gate any JS facade claim.
    - Verification: checked oracle artifact tests only; do not require Fast React to pass until the Rust slices are wired to a JS package facade.

## Conformance Coverage Needed

- Package surface: `create`, `act`, `_Scheduler`, `unstable_batchedUpdates`, `version`, and removed `shallow`.
- Root lifecycle: deprecation warning, default concurrent behavior, React Native test environment branch, strict-mode option, createNodeMock option, update after unmount, `.root` after unmount, and multiple root children.
- Scheduling and `act`: updates inside/outside act, async act, suspended resource ping warnings, `unstable_flushSync`, callback continuation behavior, and cross-root sync flushing.
- Serialization: empty root, single host child, multiple host children, hidden child handling, text nodes, props excluding `children`, `react.test.json` branding, composite `toTree`, and unsupported tag errors.
- Test instances: `.instance`, `.type`, `.props`, `.parent`, `.children`, `find`, `findAll`, `findByType`, `findAllByType`, `findByProps`, and error messages for zero/multiple matches.
- Host operation ordering: append/insert/remove/clear, text updates, hide/unhide, deletion detach, move invariants, missing target errors before detach, and commit phase order.
- Error surfaces: invalid handle, cross-renderer handle, unsupported host capability, root unmounted, currently mounting component access, invalid portal/container, uncaught/caught/recoverable root callbacks, and thrown callback aggregation in act.

## Quality, Maintainability, Performance, And Security

Quality:

- The plan models the root cause directly: test-renderer public APIs should sit on shared reconciler root semantics.
- The current in-memory host remains useful, but only as a host adapter and operation-order canary.

Maintainability:

- Root model, lane bookkeeping, update queues, scheduler/act integration, commit traversal, and serialization are separate modules with independent tests.
- Worker 047 is not assumed; the root model slice is written as an independently mergeable prerequisite.

Performance:

- Lane and root bookkeeping stay fixed-width and allocation-light on hot paths.
- Test serialization can allocate tree snapshots, but root scheduling and update queues should not be snapshot-driven.

Security:

- JS callback handles for root errors, act continuations, refs, and test callbacks need explicit rooting/lifetime rules before crossing the Rust/native boundary.
- Host handles remain opaque, and structured errors should not leak renderer-local storage IDs unless a future diagnostic policy explicitly allows it.

## Delegated Checks

No nested subagent tool is available in this runtime. To test the hypothesis independently, I split the work into three read-only evidence probes:

- Local merged-report probe: workers 007, 018, 022, 041, and 044.
- Current Rust source probe: `fast-react-core`, `fast-react-host-config`, `fast-react-reconciler`, and `fast-react-test-renderer`.
- Exact upstream tarball probe: `react-test-renderer@19.2.6` and `react@19.2.6`.

All three support the same conclusion: updates and root lifecycle must route through shared root scheduling/update semantics, while tree serialization and test-instance querying remain renderer-specific.

## Commands Run

```sh
pwd
rg --files -g '!ORCHESTRATOR.md'
ls worker-progress
nl -ba worker-progress/worker-044-react-dom-client-roots-plan.md
nl -ba worker-progress/worker-030-core-lane-model.md
nl -ba worker-progress/worker-038-scheduler-root-oracle.md
nl -ba worker-progress/worker-019-reconciler-host-boundary-migration.md
nl -ba worker-progress/worker-018-test-renderer-mutation-host.md
nl -ba worker-progress/worker-022-host-operation-errors.md
nl -ba worker-progress/worker-041-dom-events-priority-plan.md
nl -ba worker-progress/worker-007-scheduler-fiber.md
nl -ba crates/fast-react-core/src/lane.rs
nl -ba crates/fast-react-core/src/lib.rs
nl -ba crates/fast-react-host-config/src/lib.rs
nl -ba crates/fast-react-reconciler/src/lib.rs
nl -ba crates/fast-react-test-renderer/src/lib.rs
nl -ba docs/tasks/worker-073-test-renderer-update-model-plan.prompt.md
rg --files packages crates | rg 'test[-_]renderer|react-test-renderer'
rg -n 'HostConfig|EventPriority = \(\)|HostScheduling|MutationRenderer|render_placeholder|render_mutation_placeholder|snapshot_container|snapshot_instance|HostOperationError|invalid_handle|missing_insertion_target|ImpossibleMutation|HostResult' crates/fast-react-host-config/src/lib.rs crates/fast-react-test-renderer/src/lib.rs crates/fast-react-reconciler/src/lib.rs
npm view react-test-renderer@19.2.6 version dist.tarball dist.integrity dependencies peerDependencies --json
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -tzf - | sort
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/package.json package/index.js package/shallow.js | nl -ba
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/cjs/react-test-renderer.development.js | nl -ba | sed -n '14840,15030p'
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/cjs/react-test-renderer.development.js | nl -ba | sed -n '15030,15185p'
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/cjs/react-test-renderer.development.js | nl -ba | sed -n '17180,17460p'
curl -fsSL https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz | tar -xOzf - package/cjs/react-test-renderer.development.js | nl -ba | sed -n '2700,2935p'
curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz | tar -xOzf - package/cjs/react.development.js | nl -ba | sed -n '556,608p'
curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz | tar -xOzf - package/cjs/react.development.js | nl -ba | sed -n '780,930p'
git status --short --untracked-files=all
```

## Changed Files

- `worker-progress/worker-073-test-renderer-update-model-plan.md`

## Completion Checklist

- [x] Did not read `ORCHESTRATOR.md`.
- [x] Wrote only the worker 073 progress report.
- [x] Used merged evidence from workers 018, 022, and 044.
- [x] Treated worker 047 as unavailable because no merged `worker-progress/worker-047*.md` exists locally.
- [x] Tested the hypothesis against local reports, current Rust code, and exact upstream tarball evidence.
- [x] Split future work into independently mergeable Rust implementation slices.
- [x] Covered quality, maintainability, performance, and security.
