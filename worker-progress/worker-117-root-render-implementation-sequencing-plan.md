# worker-117-root-render-implementation-sequencing-plan

## Summary

This is a report-only implementation sequencing plan for the first real root
render milestone. No source code was changed.

The milestone should prove one narrow path before broad compatibility claims:
create a non-hydration client root, enqueue `root.render(element)` through a
HostRoot `{element}` update, schedule and flush the work through shared root
scheduler state, build and commit a small host/text tree through mutation host
operations, support a follow-up update and sync unmount, and verify the same
root path through a test-renderer canary and React DOM conformance fixtures.

The root cause to avoid is a facade shortcut. `createRoot`, `root.render`,
`root.unmount`, test-renderer `create/update/unmount`, and DOM output must all
route through the same FiberRoot, HostRoot queue, scheduler, work-loop, commit,
and host-token path. A package-level DOM replacement, a direct test-renderer
snapshot mutation, a FIFO queue, or a per-root sync flush would hide the
missing architecture and make later event priority, transitions, effects,
error callbacks, and cleanup ordering incompatible.

Workers 077, 079, 080, 091, 092, 093, 094, 095, 098, 099, 100, 101, 102, and
103 are present in this worktree and are used as accepted anchors. Worker 106
is not present. Workers 104 through 116 are not present in this worktree, so
any dependency on their intended work is provisional.

## Goal Tool Status

- `create_goal` was available and called before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: `Produce a report-only
  implementation sequencing plan for the first real root render milestone,
  ordering core, reconciler, DOM host, React DOM facade, test-renderer,
  scheduler, and conformance work into mergeable slices with explicit gates and
  conflict boundaries. Write only
  worker-progress/worker-117-root-render-implementation-sequencing-plan.md; do
  not implement source code; anchor in merged workers 077, 079, 080, 091, 092,
  093, 094, 095, 098, 099, 100, 101, 102, 103, and 106 if present; treat
  workers 104-116 as provisional unless their reports are present; include
  delegated checks, changed files, commands run, risks, and quality review.`
- `update_goal(status: "complete")` must be called only after this report and
  the completion audit pass.

## Current Evidence

Required documents read first:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`

Accepted anchor reports present and used:

- `worker-progress/worker-077-core-fiber-topology-plan.md`
- `worker-progress/worker-079-reconciler-fiber-root-model-plan.md`
- `worker-progress/worker-080-reconciler-host-root-update-queue-plan.md`
- `worker-progress/worker-091-dom-mutation-minimum-plan.md`
- `worker-progress/worker-092-react-dom-create-root-facade-plan.md`
- `worker-progress/worker-093-root-render-integration-plan.md`
- `worker-progress/worker-094-root-unmount-flushsync-plan.md`
- `worker-progress/worker-095-hydrate-root-facade-plan.md`
- `worker-progress/worker-098-dom-event-plugin-extraction-plan.md`
- `worker-progress/worker-099-core-hook-state-queue-plan.md`
- `worker-progress/worker-100-reconciler-function-component-render-plan.md`
- `worker-progress/worker-101-test-renderer-root-api-plan.md`
- `worker-progress/worker-102-test-renderer-serialization-plan.md`
- `worker-progress/worker-103-scheduler-mock-implementation-plan.md`

Required or requested reports absent locally:

- `worker-progress/worker-106-root-render-e2e-test-plan.md`
- `worker-progress/worker-104-reconciler-root-model-implementation-plan.md`
- `worker-progress/worker-105-dom-mutation-host-implementation-plan.md`
- `worker-progress/worker-107-core-fiber-topology-implementation-plan.md`
- `worker-progress/worker-108-react-dom-root-facade-implementation-plan.md`
- `worker-progress/worker-109-reconciler-commit-minimum-implementation-plan.md`
- `worker-progress/worker-110-dom-text-content-host-plan.md`
- `worker-progress/worker-111-reconciler-sync-flush-act-plan.md`
- `worker-progress/worker-112-core-hook-queue-implementation-plan.md`
- `worker-progress/worker-113-function-component-implementation-plan.md`
- `worker-progress/worker-114-test-renderer-implementation-plan.md`
- `worker-progress/worker-115-scheduler-mock-source-plan.md`
- `worker-progress/worker-116-dom-event-plugin-implementation-plan.md`

Current source boundaries inspected:

- `crates/fast-react-core/src/lib.rs` and `crates/fast-react-core/src/lane.rs`
  expose compatibility metadata, element placeholders, and React 19.2.6 lane
  bitsets. They do not yet expose fiber topology, root lane bookkeeping, fiber
  flags, hook queues, or event-priority types in this worktree.
- `crates/fast-react-host-config/src/lib.rs` owns capabilities, host errors,
  token types, and token-aware host traits.
- `crates/fast-react-reconciler/src/lib.rs` still validates the mutation host
  boundary and returns loud placeholders. There is no `FiberRoot`, HostRoot
  queue, root scheduler, work loop, commit traversal, or `update_container`.
- `crates/fast-react-test-renderer/src/lib.rs` is a direct in-memory mutation
  host and snapshot helper. It is not reconciler-backed.
- `packages/react-dom/client.js`, `packages/react-dom/index.js`, and
  `packages/react-dom/profiling.js` still expose loud unsupported placeholders
  for root and DOM behavior.
- `packages/scheduler/cjs/scheduler.development.js` and
  `packages/scheduler/cjs/scheduler.production.js` contain public scheduler
  root behavior; `scheduler/unstable_mock` remains a separate package-level
  compatibility track.

## Milestone Definition

In scope for the first real root render milestone:

- Non-hydration `createRoot`.
- `root.render(element)` enqueued through HostRoot update queues.
- A minimal element set: HostRoot, host component, host text, and fragment-like
  flattening only if the chosen child reconciler needs it for simple children.
- Lane selection sufficient for default and sync work.
- Root scheduling and sync flushing sufficient for `root.render`, a follow-up
  update, and `root.unmount`.
- Mutation commit into a fake/test renderer first, then a minimal DOM host.
- DOM creation for owner-document, namespace, initial attributes, text, update,
  and unmount cleanup that is already covered by merged DOM host oracles.
- React DOM facade behavior only after internal root and host gates pass.
- Conformance fixtures for the narrow root render/update/unmount path.

Out of scope for this milestone:

- Hydration and `hydrateRoot` behavior beyond preserving a clean separation
  point from worker 095.
- Hydration event replay.
- Controlled input/select/textarea behavior.
- Suspense, Fizz, resources, singletons, forms, view transitions, native
  bindings, server rendering, or full React compatibility.
- Public event plugin extraction beyond the lane-priority and node-map hooks
  needed to avoid blocking later event work.
- Full function component and hook compatibility unless the orchestrator
  chooses to extend the milestone after the host-only root path is green.

## Sequencing Principles

- Keep source workers mergeable by owning disjoint files wherever possible.
  When a worker must touch `lib.rs`, `client.js`, or smoke/conformance index
  files, schedule it alone and merge before adjacent workers start.
- Make fake/test-renderer roots the first commit canary. React DOM should not
  be wired until the generic reconciler path has proven root creation,
  HostRoot update enqueue, scheduling, work loop, commit ordering, token
  generation, `root.current` switching, and unmount cleanup.
- Treat public facades as consumers of lower layers. They should remove loud
  placeholders only after the corresponding internal behavior and conformance
  gates are green.
- Accept breaking changes at host-config and reconciler boundaries when they
  remove scaffold shortcuts, especially around `HostFiberTokenRef`,
  `EventPriority`, root lifecycle state, and host cleanup hooks.
- Keep hydration, event replay, controlled forms, resources, and native
  bindings behind explicit unsupported or provisional hooks so the first root
  render does not accidentally claim broader behavior.

## Mergeable Future Workers

### 0. Host Token Compile Alignment

Purpose: restore a trustworthy Rust baseline before root implementation work.

Write scope:

- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- optional focused helper modules under `crates/fast-react-test-renderer/src/`
- worker progress report

Dependencies:

- Merged host-config token boundary from earlier workers.
- Worker 077 and worker 101/102 warnings about token-aware host fixtures.

Tasks:

- Add `HostTypes::HostFiberToken` implementations to current fake/test hosts.
- Update test-renderer and reconciler test fixtures to token-aware
  `create_instance`, `create_text_instance`, commit, and detach signatures.
- Keep behavior equivalent to the existing direct host tests.
- Do not introduce root records or public root APIs in this slice.

Verification gates:

- `cargo fmt --all --check`
- `cargo test -p fast-react-host-config --all-features`
- `cargo test -p fast-react-reconciler --all-features`
- `cargo test -p fast-react-test-renderer --all-features`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `cargo clippy -p fast-react-test-renderer --all-targets --all-features -- -D warnings`

Conflict boundaries:

- This worker owns the immediate token signature migration. Later root,
  commit, and serialization workers must not reintroduce compatibility shims
  or token-less host calls.

### 1. Core Root Foundation

Purpose: provide the core data model needed by every root worker.

Write scope:

- `crates/fast-react-core/src/fiber_id.rs`
- `crates/fast-react-core/src/fiber_handles.rs`
- `crates/fast-react-core/src/fiber.rs`
- `crates/fast-react-core/src/fiber_arena.rs`
- `crates/fast-react-core/src/fiber_alternate.rs`
- `crates/fast-react-core/src/fiber_deletions.rs`
- `crates/fast-react-core/src/fiber_bubbling.rs`
- `crates/fast-react-core/src/root_lanes.rs`
- `crates/fast-react-core/src/fiber_flags.rs`
- `crates/fast-react-core/src/hook_effect_flags.rs`
- `crates/fast-react-core/src/event_priority.rs`
- `crates/fast-react-core/src/lib.rs`
- worker progress reports split by module group if parallelism is needed

Dependencies:

- Worker 077 for topology ownership and split.
- Worker 080 and worker 081 for root lane requirements.
- Worker 098 for lane-backed event priority.
- Worker 099/100 for hook queue and function component future fields.

Tasks:

- Add stable `FiberId` and generation validation.
- Add opaque element, props, state, ref, dependency, update-queue, and host
  slots without importing host-config.
- Add `FiberNode`/`FiberArena`, alternates, deletion lists, lane fields, flag
  fields, and pure bubbling helpers.
- Add root lane bookkeeping sufficient for pending, suspended, pinged,
  expired, entangled, sync-flush, default, and transition-lane operations.
- Add lane-backed `EventPriority` distinct from public Scheduler priorities.

Verification gates:

- `cargo fmt --all --check`
- `cargo test -p fast-react-core --all-features fiber`
- `cargo test -p fast-react-core --all-features root_lanes`
- `cargo test -p fast-react-core --all-features event_priority`
- `cargo clippy -p fast-react-core --all-targets --all-features -- -D warnings`
- Tests for stale IDs, alternate immutability, deletion retention, lane
  bubbling, root lane selection, sync-lane extraction, entanglement maps, and
  event-priority-to-lane conversion.

Conflict boundaries:

- Avoid parallel edits to `crates/fast-react-core/src/lib.rs`; merge this as a
  short serial tranche or use one export-owning worker.
- Do not define root scheduling, DOM rules, public Scheduler values, hook
  dispatcher state, or host tokens in core.

### 2. Reconciler FiberRoot And HostRoot Model

Purpose: create the internal root container consumed by React DOM and the test
renderer.

Write scope:

- `crates/fast-react-reconciler/src/root_config.rs`
- `crates/fast-react-reconciler/src/fiber_root.rs`
- `crates/fast-react-reconciler/src/fiber_store.rs`
- `crates/fast-react-reconciler/src/work_in_progress.rs`
- `crates/fast-react-reconciler/src/host_tokens.rs`
- `crates/fast-react-reconciler/src/test_support.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker progress report

Dependencies:

- Slice 0 token compile alignment.
- Slice 1 core IDs, topology, flags, lanes, and opaque slots.
- Worker 079 root model.
- Worker 090 node-map token ownership plan as supporting evidence.

Tasks:

- Add `RootTag`, `RootKind::Client`, `RootOptions`, root lifecycle state,
  callback handle placeholders, and opaque container handles.
- Add `FiberRootId`, root arena/table storage, HostRoot current fiber
  initialization, HostRoot state shell, and `root.current`.
- Add current/WIP alternate creation without switching current outside commit.
- Add phase-scoped host token generation and stale-token validation metadata.
- Keep `RootKind::Hydration` reserved but unsupported for this milestone.

Verification gates:

- `cargo test -p fast-react-reconciler --all-features root_config`
- `cargo test -p fast-react-reconciler --all-features fiber_root`
- `cargo test -p fast-react-reconciler --all-features host_tokens`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- Tests prove root creation does not call host creation, mutation, commit, or
  DOM APIs.

Conflict boundaries:

- This worker owns root records and host tokens. HostRoot queues, scheduler,
  work loop, commit traversal, DOM marker code, and public root objects must
  consume these APIs instead of duplicating root state.

### 3. HostRoot Update Queue And `update_container`

Purpose: make root render and unmount an update-queue operation, not a facade
operation.

Write scope:

- `crates/fast-react-reconciler/src/update_queue.rs`
- `crates/fast-react-reconciler/src/root_updates.rs`
- `crates/fast-react-reconciler/src/update_priority.rs`
- `crates/fast-react-reconciler/src/concurrent_updates.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker progress report

Dependencies:

- Slice 1 root lane bookkeeping and event priority.
- Slice 2 FiberRoot/HostRoot model.
- Worker 080 HostRoot queue plan.
- Worker 093 root render integration plan.
- Worker 094 unmount/flushSync plan.

Tasks:

- Add circular pending/base queue storage, update IDs, queue IDs, `UpdateTag`,
  root payload `{element}`, callback handle storage, and rebase processing.
- Implement internal `update_container` and `update_container_sync`.
- `update_container` asks `request_update_lane`; sync unmount passes
  `Lane::SYNC`.
- Store `RootElementHandle::none()` for unmount as `{element: null}` semantics.
- Mark source fiber/root lanes and call transition entanglement hooks.
- Do not flush work or mutate hosts in this slice.

Verification gates:

- `cargo test -p fast-react-reconciler --all-features update_queue`
- `cargo test -p fast-react-reconciler --all-features root_updates`
- Tests for ring append, pending-to-base transfer, skipped-lane rebasing,
  `NoLane` clones, `{element}` key preservation, sync null update, callback
  storage without invocation, and failed enqueue not scheduling.

Conflict boundaries:

- This worker owns queue semantics and `update_container`. React DOM facade,
  test-renderer root API, scheduler, and work loop workers must call it rather
  than inspecting queue internals.

### 4. Root Scheduler, Sync Flush, And Act Shell

Purpose: provide shared root scheduling before any public `flushSync` or
test-renderer `act` behavior claims.

Write scope:

- `crates/fast-react-reconciler/src/scheduler_bridge.rs`
- `crates/fast-react-reconciler/src/root_scheduler.rs`
- `crates/fast-react-reconciler/src/flush_sync.rs`
- `crates/fast-react-reconciler/src/execution_context.rs`
- `crates/fast-react-reconciler/src/act.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker progress report

Dependencies:

- Slice 2 FiberRoot root state.
- Slice 3 `update_container`.
- Worker 081 root scheduler/act plan.
- Worker 094 root unmount/flushSync plan.
- Worker 101 test-renderer root API plan.

Tasks:

- Add scheduled-root list, microtask scheduling hook, callback node and
  callback priority fields, callback reuse/cancelation, and fake Scheduler
  transport tests.
- Add `schedule_update_on_fiber`.
- Add `flush_sync_work` as a cross-root operation guarded against render/commit
  reentrancy.
- Add act queue routing as a shell, even if public act warning strings remain
  deferred.
- Keep public `scheduler/unstable_mock` isolated from root scheduler state.

Verification gates:

- `cargo test -p fast-react-reconciler --all-features root_scheduler`
- `cargo test -p fast-react-reconciler --all-features flush_sync`
- `cargo test -p fast-react-reconciler --all-features act`
- Tests for callback reuse, callback cancelation, microtask enqueue, two-root
  sync flush, reentrancy refusal, act queue routing, and non-sync lane
  retention.

Conflict boundaries:

- This worker owns root scheduling, act, and sync flush. React DOM `flushSync`,
  root unmount, event batching, and test-renderer act workers must be consumers
  of this API.

### 5. Host-Only Work Loop And Child Reconciliation

Purpose: render a HostRoot element tree to finished work without committing it.

Write scope:

- `crates/fast-react-reconciler/src/work_loop.rs`
- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/complete_work.rs`
- `crates/fast-react-reconciler/src/child_reconciler.rs`
- `crates/fast-react-reconciler/src/host_component.rs`
- `crates/fast-react-reconciler/src/host_text.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- worker progress report

Dependencies:

- Slice 1 core topology and flags.
- Slice 2 root/alternate model.
- Slice 3 queue processing.
- Slice 4 scheduler entry points.
- Worker 072 work-loop plan.
- Worker 091 DOM host minimum plan for host operations expected later.

Tasks:

- Process HostRoot queue into root `memoized_state.element`.
- Reconcile host component and host text children into fibers.
- Create detached host instances/text during complete work using
  `MutationRenderer` and `HostFiberTokenRef`.
- Bubble flags and child lanes.
- Mark unsupported component tags with typed errors or fail-closed placeholders.
- Do not implement function component hooks in this slice.

Verification gates:

- `cargo test -p fast-react-reconciler --all-features work_loop`
- `cargo test -p fast-react-reconciler --all-features host_component`
- Fake host tests prove public render enqueue does not mutate host storage
  until commit.
- Aborted render leaves `root.current` unchanged and performs no host mutation.

Conflict boundaries:

- This worker owns HostRoot, host component, and host text begin/complete
  logic. Function component, hooks, Suspense, hydration, and portals stay
  unsupported or separate.

### 6. Minimal Commit Path

Purpose: turn finished work into mounted host output through mutation host
operations.

Write scope:

- `crates/fast-react-reconciler/src/commit.rs`
- `crates/fast-react-reconciler/src/mutation_effects.rs`
- `crates/fast-react-reconciler/src/deletion.rs`
- `crates/fast-react-reconciler/src/passive.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- optional test support under `crates/fast-react-reconciler/src/test_support.rs`
- worker progress report

Dependencies:

- Slice 2 host tokens.
- Slice 4 scheduler.
- Slice 5 finished work.
- Worker 082 commit ordering plan.
- Worker 091 mutation host operations.
- Worker 101/102 test-renderer root and serialization plans.

Tasks:

- Implement phase-partitioned commit skeleton:
  `prepare_for_commit`, mutation effects, `root.current` switch, layout shell,
  passive scheduling shell, and `reset_after_commit`.
- Implement placement, update payload delivery, text update, deletion cleanup,
  clear-container for unmount, and host token invalidation.
- Preserve structured host errors as `ReconcilerError::HostOperation`.
- Keep refs/effects as explicit placeholders unless their data models exist.

Verification gates:

- `cargo test -p fast-react-reconciler --all-features commit`
- `cargo test -p fast-react-test-renderer --all-features`
- Operation log canaries for phase ordering, placement, text update, deletion,
  clear-container, token stale rejection, and `root.current` switch timing.

Conflict boundaries:

- Commit owns host call ordering. DOM host and test renderer workers should
  provide host implementations and diagnostics, not alternate commit paths.

### 7. Test-Renderer Root Canary

Purpose: verify the shared root path before React DOM depends on it.

Write scope:

- `crates/fast-react-test-renderer/src/operation_log.rs`
- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/options.rs`
- `crates/fast-react-test-renderer/src/error.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `crates/fast-react-test-renderer/Cargo.toml`
- worker progress report

Dependencies:

- Slice 0 token alignment.
- Slices 2 through 6.
- Worker 101 root API plan.

Tasks:

- Add `TestRendererRoot` as a facade over reconciler `create_root`,
  `update_container`, `update_container_sync`, and `flush_sync_work`.
- Add operation logging around existing host methods.
- Prove create/update/unmount enqueue through reconciler roots and do not
  mutate storage directly.
- Keep `toJSON`, `toTree`, and public `TestInstance` querying out of this
  slice.

Verification gates:

- `cargo test -p fast-react-test-renderer --all-features root`
- `cargo test -p fast-react-test-renderer --all-features operation_log`
- `cargo test -p fast-react-reconciler --all-features`
- Tests for root invalidation, update after unmount, sync unmount, cross-root
  flush delegation, and preserved host operation errors.

Conflict boundaries:

- Rename or split low-level host handle types if needed so future public
  `TestInstance` wrappers cannot be confused with storage handles.

### 8. Test-Renderer Serialization Over Committed Fibers

Purpose: add read-only verification over committed roots.

Write scope:

- `crates/fast-react-reconciler/src/inspection.rs`
- `crates/fast-react-test-renderer/src/serialization.rs`
- `crates/fast-react-test-renderer/src/test_instance.rs`
- `crates/fast-react-test-renderer/src/query.rs`
- `crates/fast-react-test-renderer/src/error.rs`
- `crates/fast-react-test-renderer/src/root.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- worker progress report

Dependencies:

- Slice 6 commit current-switch timing.
- Slice 7 test-renderer root.
- Worker 102 serialization plan.

Tasks:

- Expose immutable committed-fiber inspection APIs with generation checks.
- Implement `to_json`, `to_tree`, and typed `TestInstance` traversal over
  committed fibers and test-renderer host storage.
- Preserve typed errors for later JS facade mapping.

Verification gates:

- `cargo test -p fast-react-test-renderer --all-features serialization`
- `cargo test -p fast-react-test-renderer --all-features test_instance`
- Tests prove serialization reads current fibers after commit, rejects stale
  WIP/alternate handles, omits hidden host output where scoped, and never uses
  raw host snapshots as a substitute for fiber traversal.

Conflict boundaries:

- Serialization must not flush work, enqueue updates, mutate host state, or
  own root lifecycle.

### 9. Minimal DOM Host Adapter

Purpose: provide DOM output for the narrow root render path.

Write scope:

- `packages/react-dom/src/dom-host/context.js`
- `packages/react-dom/src/dom-host/namespaces.js`
- `packages/react-dom/src/dom-host/creation.js`
- `packages/react-dom/src/dom-host/properties.js`
- `packages/react-dom/src/dom-host/set-initial-properties.js`
- `packages/react-dom/src/dom-host/diff-properties.js`
- `packages/react-dom/src/dom-host/update-payload.js`
- `packages/react-dom/src/dom-host/mutation.js`
- `packages/react-dom/src/dom-host/text.js`
- `packages/react-dom/src/client/dom-component-tree.js`
- `packages/react-dom/src/client/node-maps.js`
- focused tests and worker progress report

Dependencies:

- Slice 6 commit path.
- Worker 090 node-map plan.
- Worker 091 DOM mutation minimum plan.
- Worker 061/062/063 DOM attribute, style/dangerous HTML, and namespace
  oracles as available.

Tasks:

- Implement owner-document and namespace host contexts.
- Implement element/text creation, token registration, initial properties,
  bounded update payloads, text updates, append/insert/remove/clear, and
  deletion cleanup.
- Support latest props map updates as data, without event dispatch.
- Keep controlled forms, resources, singletons, hydration, and event replay
  unsupported.

Verification gates:

- Focused JS unit/conformance tests for owner document, namespace creation,
  attributes, text, update/removal, append/insert/remove/clear, and cleanup.
- `npm run test:smoke`
- `npm test --workspace @fast-react/conformance`
- Any Rust host bridge tests added by the worker.

Conflict boundaries:

- DOM host owns DOM property and mutation semantics. Core and reconciler must
  not grow DOM-specific prop diffing, namespace, controlled-form, or event
  behavior.

### 10. DOM Container Markers And Root Listener Shell

Purpose: support public root lifecycle side effects without implementing event
dispatch.

Write scope:

- `packages/react-dom/src/client/dom-container.js`
- `packages/react-dom/src/client/root-markers.js`
- `packages/react-dom/src/events/root-listeners.js`
- `packages/react-dom/src/events/listener-registry.js`
- `packages/react-dom/src/events/event-names.js`
- focused conformance files and worker progress report

Dependencies:

- Worker 092 createRoot plan.
- Worker 094 unmount marker ordering.
- Worker 098 event extraction plan.
- Worker 088/089 outputs are absent here, so regenerate or consume equivalent
  marker/listener evidence before implementation claims.

Tasks:

- Validate containers.
- Mark and unmark containers as roots.
- Install root listener markers and owner-document `selectionchange` listener
  where covered.
- Preserve listener installation as a shell; do not implement synthetic event
  extraction or hydration replay.

Verification gates:

- Conformance oracle for invalid containers, duplicate warnings, mark/unmark
  ordering, listener marker dedupe, and no side effects after invalid
  containers.
- `node --test` for focused root marker/listener tests.
- `npm run test:smoke`.

Conflict boundaries:

- Marker/listener shell owns root side effects. Event plugin workers must not
  duplicate root listener installation or container root markers.

### 11. React DOM Client Root Facade

Purpose: expose `createRoot`, `root.render`, and `root.unmount` after the
internal path is real.

Write scope:

- `packages/react-dom/client.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/src/client/create-root.js`
- `packages/react-dom/src/client/root-object.js`
- `packages/react-dom/src/client/root-options.js`
- `packages/react-dom/src/shared/flush-sync.js`
- `packages/react-dom/index.js` for `flushSync` only when scheduler gate is
  green
- `tests/smoke/import-entrypoints.mjs`
- focused conformance comparison files
- worker progress report

Dependencies:

- Slices 2 through 6.
- Slice 9 DOM host.
- Slice 10 markers/listener shell.
- Worker 092 createRoot facade plan.
- Worker 093 root.render plan.
- Worker 094 root.unmount/flushSync plan.
- Worker 058 flushSync oracle as supporting evidence.

Tasks:

- Remove the `createRoot` placeholder only when public behavior can delegate to
  the reconciler root path.
- Implement `ReactDOMRoot` public object shape and `_internalRoot` lifecycle.
- `root.render` warns/throws as covered, then calls `update_container`.
- `root.unmount` clears `_internalRoot`, enqueues sync null update, calls
  cross-root `flush_sync_work`, then unmarks the container.
- Implement public `flushSync` only after the dispatcher can save/restore DOM
  update priority and call shared cross-root flush.
- Keep `hydrateRoot` as a loud unsupported placeholder.

Verification gates:

- Dedicated React DOM root-render/update/unmount conformance oracle.
- `node --test` for focused client root tests.
- `npm run test:smoke`
- `npm test --workspace @fast-react/conformance`
- Rust reconciler and test-renderer root tests still green.

Conflict boundaries:

- This is the only worker that should remove the public `createRoot`
  placeholder. It should be serialized with smoke-test edits and conformance
  expectation changes.

### 12. Root Render E2E Conformance

Purpose: replace worker 106 if it remains absent, or consume it if it lands.

Write scope:

- `tests/conformance/src/react-dom-root-render-e2e-*.mjs`
- `tests/conformance/scripts/*react-dom-root-render-e2e*.mjs`
- `tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-root-render-e2e-oracle.json`
- optional focused Fast React comparison files
- worker progress report

Dependencies:

- If worker 106 lands, consume its accepted report instead of duplicating it.
- Worker 092/093/094 public root plans.
- Slices 9 through 11 for Fast React comparisons.

Tasks:

- Add React 19.2.6 oracle coverage for:
  - `createRoot` root object shape and descriptors
  - `root.render` return value and second-argument warnings
  - host element/text mount
  - update replacing text/props
  - unmount idempotence
  - render-after-unmount throw
  - marker ordering where observable
  - `flushSync`-forced root work only when Slice 11 exposes it
- Keep compatibility claims false until Fast React passes the comparisons.

Verification gates:

- `node tests/conformance/scripts/generate-react-dom-root-render-e2e-oracle.mjs --write`
- `node --test tests/conformance/test/react-dom-root-render-e2e-oracle.test.mjs`
- Deterministic regeneration byte-compare.
- `npm test --workspace @fast-react/conformance`
- Path-leak and status-count checks.

Conflict boundaries:

- This conformance worker owns the root e2e oracle files. DOM attribute,
  event, hydration, test-renderer, and scheduler mock oracles remain separate.

### 13. Function Component And Hook Follow-Up

Purpose: make simple function component roots possible after the host-only root
path is stable.

Write scope:

- `crates/fast-react-core/src/hook_state_queue.rs`
- `crates/fast-react-reconciler/src/hooks/**`
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/context.rs`
- `crates/fast-react-reconciler/src/bailout.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- future conformance files and worker progress reports

Dependencies:

- Slices 1 through 6.
- Worker 099 hook queue plan.
- Worker 100 function component render plan.

Tasks:

- Add hook queues, hook list ownership, dispatcher modes, `render_with_hooks`,
  render-phase rerender cleanup, context dependencies, and function component
  begin-work integration.
- Start with fake value handles and fail closed on unsupported hooks/effects.
- Wire public hook facade only after JS/native value rooting is defined.

Verification gates:

- Focused Rust hook queue and function component tests.
- Later React conformance oracles for `useState`, `useReducer`, and simple
  function component roots.

Conflict boundaries:

- This is not a prerequisite for the first host-only root render. Do not block
  the root path on hooks unless the orchestrator expands the milestone.

### 14. Scheduler Mock Source Follow-Up

Purpose: unblock upstream-style tests that alias `scheduler/unstable_mock`.

Write scope:

- `packages/scheduler/cjs/scheduler-unstable_mock.development.js`
- `packages/scheduler/cjs/scheduler-unstable_mock.production.js`
- `packages/scheduler/unstable_mock.js`
- `tests/smoke/import-entrypoints.mjs`
- scheduler mock conformance files
- worker progress report

Dependencies:

- Worker 103 scheduler mock implementation plan.

Tasks:

- Implement mock-owned virtual time, logs, flush helpers, paint yielding,
  pending-work visibility, reset behavior, and isolation from root scheduler
  mutable state.

Verification gates:

- `node --check packages/scheduler/cjs/scheduler-unstable_mock.development.js`
- `node --check packages/scheduler/cjs/scheduler-unstable_mock.production.js`
- `node tests/conformance/scripts/generate-scheduler-mock-oracle.mjs --write`
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `npm run check:js`

Conflict boundaries:

- This worker must not mix public Scheduler mock state with React lanes,
  FiberRoot scheduling, DOM event priority, or test-renderer act queues.

## Recommended Merge Order

1. Slice 0: host-token compile alignment.
2. Slice 1: core root foundation, preferably as small serial core workers to
   avoid `lib.rs` conflicts.
3. Slice 2: reconciler FiberRoot/HostRoot model.
4. Slice 3: HostRoot update queues and `update_container`.
5. Slice 4: root scheduler, sync flush, and act shell.
6. Slice 5: host-only work loop and child reconciliation.
7. Slice 6: minimal commit path.
8. Slice 7: test-renderer root canary.
9. Slice 8: test-renderer serialization over committed fibers.
10. Slice 9: minimal DOM host adapter.
11. Slice 10: DOM container markers and root listener shell.
12. Slice 12: root render e2e oracle if worker 106 is still absent; if it lands
    first, rebase the oracle plan onto its accepted report.
13. Slice 11: React DOM client root facade.
14. Slice 13: function components/hooks as the next compatibility expansion.
15. Slice 14: scheduler mock source implementation when upstream-style tests
    need it.

The only acceptable reordering is to land conformance oracles earlier when they
do not require source changes and their write scopes are isolated. Public
facade slices should not land before the internal root path and fake/test
renderer gates are green.

## Milestone Gates

Gate A: Rust baseline is trustworthy.

- Host-token trait drift fixed.
- `cargo fmt --all --check` passes.
- `cargo test --workspace --all-features` passes or any failure is isolated to
  a documented non-root package outside the worker's scope.
- Reconciler and test-renderer clippy gates pass for touched crates.

Gate B: Root data model exists.

- Core fiber topology, flags, lanes, event priority, and root lane bookkeeping
  are in core.
- Reconciler `FiberRoot` and HostRoot current fiber exist.
- Root creation does not call host mutation or DOM APIs.

Gate C: Root update semantics exist.

- `update_container` enqueues HostRoot `{element}` payloads.
- `update_container_sync(None)` enqueues sync null updates for unmount.
- Queues are circular pending/base queues with rebase behavior, not FIFO.
- Transition entanglement hooks exist even if transition compatibility remains
  partial.

Gate D: Scheduling and flushing exist.

- `schedule_update_on_fiber` marks root work.
- Scheduled-root list, microtask hook, callback reuse/cancelation, and
  cross-root `flush_sync_work` are tested.
- Render/commit reentrancy is guarded.
- Act queue shell exists for test-renderer routing.

Gate E: Commit canary exists.

- Fake/test mutation host proves create/append/update/text/delete/clear
  operations happen only during commit.
- `root.current` switches after mutation and before layout shell.
- Host tokens are generated, phase-scoped, and invalidated on deletion/unmount.

Gate F: Test renderer consumes the same path.

- `TestRendererRoot::create/update/unmount` delegates to reconciler roots.
- Operation logs prove ordering.
- Serialization reads committed fibers, not raw snapshots.

Gate G: DOM host minimum exists.

- Owner-document and namespace creation are correct.
- Initial attributes, text content, update payloads, and mutation operations
  pass focused oracle-backed tests.
- Node maps and deletion cleanup prevent stale target/public-instance lookup.

Gate H: Public React DOM root is enabled.

- `createRoot` root object shape matches oracle evidence.
- `root.render` delegates to `update_container` and returns `undefined`.
- `root.unmount` clears `_internalRoot`, enqueues sync null update, cross-root
  flushes, then unmarks the container.
- `hydrateRoot` remains unsupported and separate.

Gate I: Conformance owns the claim.

- Root render e2e oracle exists, regenerates deterministically, and has no path
  leaks.
- Fast React comparisons are exact for the scoped root render/update/unmount
  scenarios before any compatibility claim is promoted.
- Existing conformance and smoke suites stay green.

## Conflict Boundaries

High-conflict files:

- `crates/fast-react-core/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-test-renderer/src/lib.rs`
- `packages/react-dom/client.js`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- `tests/smoke/import-entrypoints.mjs`
- `tests/conformance/package.json` if new scripts are added

Conflict rules:

- Serialize workers that touch any high-conflict file.
- Module-creation workers may run in parallel only when they do not touch the
  same `lib.rs` or smoke/conformance index.
- The public facade worker should be last among React DOM root workers because
  it changes placeholder expectations in smoke tests.
- Test-renderer root and serialization workers can run after commit APIs are
  stable, but serialization must wait for committed-fiber inspection.
- Scheduler mock source work can run in parallel with root reconciler work
  because it owns package-level mock files, but it must not share mutable root
  scheduler state.
- Hydration-root work must not share the createRoot facade worker until the
  normal root object is stable; `hydrateRoot` remains a separate root kind.

## Delegated Checks

Two read-only nested explorer agents were used to challenge this plan. They
were instructed not to edit files and not to inspect `ORCHESTRATOR.md`.

- Worker-report inventory agent: confirmed all requested accepted anchors are
  present except worker 106; confirmed no reports for workers 104 through 116
  are present locally; identified stale statements in older reports that said
  workers 080, 092, 099, or 062 were absent even though those reports are now
  present. It found no hard sequencing conflict: the reports converge on
  topology, root model, queues, scheduler/work loop, commit/fake host, DOM
  facade/output.
- Code-boundary agent: confirmed current source state is still scaffolded:
  core has element/lane primitives, host-config has token traits, reconciler is
  placeholder-only, test-renderer is a direct mutation host, React DOM root
  files are placeholders, and public scheduler root behavior exists. It ran
  `cargo fmt --all --check`, which passed; `CARGO_TARGET_DIR=<temp> cargo
  check --workspace --all-targets --all-features`, which failed on the
  host-token mismatch; `npm run test:smoke`, which passed; and
  `npm test --workspace @fast-react/conformance`, which passed with 272 tests.

The delegated results are used as evidence for sequencing risk, not as proof
that this report is complete. Final report hygiene checks are recorded below.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The sequence addresses the root cause: shared root semantics before public
  facade behavior.
- It makes current compile drift an explicit first gate instead of letting
  implementation workers stack new root code on an untrustworthy Rust baseline.
- It avoids accepting smoke tests as proof of compatibility; root behavior
  requires focused oracle and Fast React comparison gates.

Maintainability:

- The plan keeps core, reconciler, DOM host, React DOM facade, test-renderer,
  scheduler mock, and conformance responsibilities separate.
- It names high-conflict files and serial merge points so the orchestrator can
  launch future workers without overlapping write scopes.
- It reserves unsupported future systems behind explicit boundaries rather
  than embedding hydration, events, or controlled forms in the root path.

Performance:

- The plan keeps root scheduling lane-backed and avoids facade-level sync DOM
  mutation shortcuts that would make later scheduling performance meaningless.
- DOM listener work is root-scoped and shell-only for this milestone, avoiding
  per-node listener churn.
- Test-renderer operation logs are diagnostic gates, not a runtime dependency.

Security:

- JS values, callbacks, refs, and component invokers are treated as rooted
  handle work, not raw Rust storage.
- DOM host work keeps property and `dangerouslySetInnerHTML` behavior in
  oracle-backed DOM modules rather than generic string manipulation.
- Token generation, stale-token rejection, and deterministic cleanup are
  explicit gates before public instance lookup or event target lookup can rely
  on DOM maps.

## Risks Or Blockers

- The immediate Rust blocker is host-token trait drift between host-config and
  current reconciler/test-renderer fixtures. Root workers should not proceed
  until Slice 0 lands.
- Worker 106 and workers 104 through 116 are absent locally. Their intended
  outputs may supersede some proposed future worker boundaries if they land
  before this plan is acted on.
- Core root lane bookkeeping, event priority, fiber flags, and hook effect
  flags are not visible in this worktree. The core foundation must be verified
  against actual merged source before scheduling reconciler roots.
- Public React DOM root behavior is blocked by multiple layers: root model,
  HostRoot queues, scheduler, work loop, commit, DOM host, markers, and
  conformance oracles.
- Callback/value rooting across JS/Rust remains unresolved and must be solved
  before function components, hooks, refs, effects, error callbacks, or
  native-boundary public behavior can be compatible.
- Hydration, event replay, controlled forms, resources, Suspense, and Fizz
  share files and concepts with root rendering. They must remain out of the
  first milestone even if adjacent reports are available.
- Scheduler mock compatibility is separate from root scheduling. Upstream-style
  tests may still be blocked by `scheduler/unstable_mock` after root render
  passes.

## Recommended Next Tasks

1. Launch Slice 0 to align host-token signatures and restore Rust compile/test
   gates.
2. Confirm whether workers 104 through 116, especially worker 106, have landed
   in another worktree before assigning duplicate implementation-plan workers.
3. Launch serial core workers for fiber IDs/topology, flags, root lanes, and
   event priority, with a single owner for `fast-react-core/src/lib.rs`.
4. Implement reconciler `FiberRoot`/HostRoot records, then HostRoot queues,
   then root scheduler and work loop in that order.
5. Use the test renderer as the first root commit canary before enabling React
   DOM public roots.
6. Add or consume a dedicated root render e2e oracle before removing the
   public `createRoot` placeholder.
7. Keep hydration, event replay, controlled forms, Suspense, Fizz, resources,
   and native bindings on separate future milestones.

## Commands Run

Commands run directly by this worker:

- `pwd && ls`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `rg --files worker-progress | sort`
- `rg -n "worker-0(77|79|80|91|92|93|94|95|98|99)|worker-10(0|1|2|3|4|5|6|7|8|9)|worker-11[0-6]" MASTER_PLAN.md MASTER_PROGRESS.md WORKER_BRIEF.md`
- `git status --short`
- `rg -n "^(#|##|###)|^(Summary|Dependencies|Implementation|Merge|Conflict|Verification|Risks|Recommended|Next|Gate|Slice|Write scope)|^- \\*?\\*?(Root cause|Root|Gate|Slice|Conflict|Dependency|Verification|Risk|Recommended|Write|Scope)" ...`
- `for n in 104 105 106 107 108 109 110 111 112 113 114 115 116; do rg --files worker-progress | rg "worker-$n-" || true; done`
- `rg --files crates packages tests | sort | sed -n '1,240p'`
- `find crates -maxdepth 3 -type f | sort`
- `find packages -maxdepth 3 -type f | sort`
- `find tests -maxdepth 4 -type f | sort | sed -n '1,260p'`
- `sed -n '1,260p' crates/fast-react-core/src/lib.rs`
- `sed -n '1,320p' crates/fast-react-core/src/lane.rs`
- `sed -n '1,320p' crates/fast-react-host-config/src/lib.rs`
- `sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs`
- `rg -n "^(pub trait|pub struct|pub enum|pub type|impl|    fn|    type)" crates/fast-react-host-config/src/lib.rs`
- `rg -n "^(pub trait|pub struct|pub enum|pub type|pub fn|pub mod|impl|    fn|    type|mod )" crates/fast-react-test-renderer/src/lib.rs`
- `rg -n "^(const|function|class|module\\.exports|exports\\.|import|export|require|function createRoot|function hydrateRoot|const .* = require)" packages/react-dom/*.js packages/scheduler/*.js packages/scheduler/cjs/*.js tests/smoke/import-entrypoints.mjs`
- `cat package.json`
- `cat tests/conformance/package.json`
- `cat Cargo.toml`
- Multiple focused `sed` reads of worker reports 072, 073, 077, 079, 080,
  081, 082, 090, 091, 092, 093, 094, 095, 098, 099, 100, 101, 102, and 103.
- `ls -l worker-progress/worker-117-root-render-implementation-sequencing-plan.md 2>/dev/null || true`
- `git ls-files worker-progress/worker-117-root-render-implementation-sequencing-plan.md --error-unmatch 2>/dev/null || true`
- `git diff -- worker-progress/worker-117-root-render-implementation-sequencing-plan.md`
- `git diff --no-index --check /dev/null worker-progress/worker-117-root-render-implementation-sequencing-plan.md`
- Scoped `rg` scan for trailing whitespace and conflict markers in this report.
- Scoped `rg` scan for concrete local/temp path leaks in this report.
- Prompt-to-artifact section audit with `rg`; the first attempt had shell
  backtick substitution on the literal `update_container` heading, then the
  corrected single-quoted command confirmed the expected sections.
- `tail -n 80 worker-progress/worker-117-root-render-implementation-sequencing-plan.md`
- `wc -l worker-progress/worker-117-root-render-implementation-sequencing-plan.md`

Delegated commands reported by the code-boundary subagent:

- `cargo fmt --all --check`
- `CARGO_TARGET_DIR=<temp> cargo check --workspace --all-targets --all-features`
- `npm run test:smoke`
- `npm test --workspace @fast-react/conformance`

## Changed Files

- `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`

## Completion Audit

Objective deliverables:

- Produce a report-only sequencing plan.
- Write only `worker-progress/worker-117-root-render-implementation-sequencing-plan.md`.
- Do not implement source code.
- Order core, reconciler, DOM host, React DOM facade, test-renderer,
  scheduler, and conformance work.
- Anchor in workers 077, 079, 080, 091, 092, 093, 094, 095, 098, 099, 100,
  101, 102, 103, and 106 if present.
- Treat workers 104 through 116 as provisional unless their reports are
  present.
- Propose concrete future workers, write scopes, dependencies, verification
  gates, and merge-order risks.
- Do not broaden into hydration, event replay, controlled forms, Suspense,
  Fizz, resources, native bindings, or full React compatibility.
- Summarize delegated checks, changed files, commands run, risks, recommended
  next tasks, and quality review.

Prompt-to-artifact checklist:

- Report-only artifact: satisfied by this file and final `git status` check.
- Scoped write path: satisfied if final status shows only this report changed.
- Source-code changes absent: satisfied if final status has no crate/package
  source changes.
- Core sequencing: covered in Slices 1, 13, Gates B/C, and conflict rules.
- Reconciler sequencing: covered in Slices 2 through 6.
- DOM host sequencing: covered in Slices 9 and 10.
- React DOM facade sequencing: covered in Slice 11.
- Test-renderer sequencing: covered in Slices 7 and 8.
- Scheduler sequencing: covered in Slice 4 and Slice 14.
- Conformance sequencing: covered in Slice 12 and Gate I.
- Anchor reports: present/absent status recorded in `Current Evidence`.
- Worker 106 handling: explicitly absent and replaced only if still absent.
- Workers 104-116 handling: explicitly absent and provisional.
- Concrete future workers: Slices 0 through 14 have write scopes,
  dependencies, tasks, verification gates, and conflict boundaries.
- Exclusions: listed in `Milestone Definition` and reiterated in risks and next
  tasks.
- Delegated checks: recorded in `Delegated Checks`.
- Changed files: recorded in `Changed Files`.
- Commands run: recorded in `Commands Run`.
- Risks/follow-ups: recorded in `Risks Or Blockers` and
  `Recommended Next Tasks`.
- Quality, maintainability, performance, and security review: recorded above.

Final verification results:

- `git status --short` shows only this untracked report file.
- Scoped `git diff --no-index --check /dev/null
  worker-progress/worker-117-root-render-implementation-sequencing-plan.md`
  produced no whitespace-error output. The command exits non-zero for
  no-index differences, so absence of diagnostic output is the relevant
  hygiene evidence.
- Scoped trailing-whitespace/conflict-marker scan over this report produced no
  matches.
- Scoped local/temp path leak scan over this report produced no matches.
- Prompt-to-artifact section audit confirmed the expected summary, sequencing
  slices, and completion audit sections are present.
- No source tests were run directly by this worker because this task is
  report-only. The delegated code-boundary subagent reported `cargo fmt`
  passing, workspace `cargo check` failing on pre-existing host-token trait
  drift, `npm run test:smoke` passing, and conformance tests passing with 272
  tests; those results are recorded as sequencing evidence, not as completion
  proof for this report.
