# worker-093-root-render-integration-plan

## Objective

Produce a report-only plan for root.render integration with HostRoot updates
and scheduling.

Write scope honored: this report is the only intended changed file. No source
code, package metadata, tests, or orchestration files were modified. An
untracked root `Cargo.lock` is present in the worktree and was left in place as
a regenerable artifact under the worker cleanup policy.

Goal tool status: `create_goal` was available and called before research or
file reads. `get_goal` was available immediately after goal setup and returned
status `active` with objective `Produce a report-only plan for root.render
integration with HostRoot updates and scheduling.`

## Summary

`root.render(children)` must be implemented as a public facade over
`updateContainer(children, root, null, null)`, not as a DOM mutation shortcut.
The public method should return `undefined`, warn in development for unsupported
second arguments, throw after unmount, and otherwise enqueue a HostRoot update
whose payload is exactly `{element}`. Everything after that is reconciler work:
lane selection, circular HostRoot queue insertion, transition entanglement,
root scheduling, render/rebase behavior, and host commit traversal.

The root cause is the same one identified by earlier root plans: observable
React DOM behavior depends on the update traveling through HostRoot queues and
the root scheduler before any host operation runs. A direct `container.replace`
or a synchronous facade-level render would skip event priority, transitions,
render-phase reentrancy handling, callback validation, cross-root sync
flushing, error callbacks, passive effect ordering, and `root.current` commit
timing.

Workers 080 and 081 reports are not present in this worktree or adjacent
worker directories checked by this pass, so this plan treats HostRoot update
queues and root scheduler/act routing as explicit unavailable prerequisites.
Worker 092 is also not present in this worktree's `worker-progress` directory,
but its sibling report exists and was read as supporting create-root facade
evidence.

## Current Local State

- `packages/react-dom/client.js` still exports loud placeholders for
  `createRoot` and `hydrateRoot`; no root object or `root.render` facade exists.
- `crates/fast-react-core/src/lane.rs` provides React 19.2.6 lane constants,
  masks, bitset helpers, and `LaneMap<T>`, but no event-priority type, root
  lane bookkeeping, transition lane claiming, or update queues.
- `crates/fast-react-reconciler/src/lib.rs` is still a placeholder. It can
  validate a mutation renderer boundary, but it has no `FiberRoot`, HostRoot
  fiber, update queue, root scheduler, work loop, or commit traversal.
- `crates/fast-react-host-config/src/lib.rs` has the canonical host traits and
  token-aware lifecycle hooks from worker 051, but the reconciler does not yet
  generate host fiber tokens or call commit operations from real root work.
- No local `worker-progress/worker-080-reconciler-host-root-update-queue-plan.md`,
  `worker-progress/worker-081-reconciler-root-scheduler-act-plan.md`, or
  `worker-progress/worker-092-react-dom-create-root-facade-plan.md` exists in
  this worktree.
- A sibling `worker-092-react-dom-create-root-facade-plan` report exists
  outside this worktree and was read during the final audit. No sibling worker
  080 or worker 081 report was found.
- A scoped worker 093 draft already existed as an untracked report. This pass
  audited, corrected, and preserved the valid scoped content rather than
  replacing it with source changes.

## Evidence Gathered

Required documents read first:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-044-react-dom-client-roots-plan.md`
- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`

Related merged evidence:

- Worker 044 documents the React DOM 19.2.6 root contract:
  `root.render(children)` checks for an unmounted root, warns for a second
  argument in development, calls `updateContainer(children, root, null, null)`,
  and returns `undefined`. It also records that `updateContainer` requests a
  lane, creates a HostRoot update with payload `{element}`, enqueues it,
  schedules the root, and entangles transitions.
- Worker 055 concludes that client roots are cross-layer root systems. The
  public object must enqueue root updates; the reconciler owns root records,
  HostRoot queues, scheduling, commit hooks, and error callback dispatch.
- Worker 070 explains why HostRoot queues must use React's circular
  pending/base queue and rebase model rather than FIFO draining.
- Worker 072 lays out root work-loop requirements: scheduled-root list,
  microtask scheduling, callback reuse/cancelation, cross-root sync flush,
  reentrancy guards, render work loops, and phase-partitioned commit.
- Worker 041 and worker 048 provide the event-priority plan and checked
  priority oracle: internal event priorities are lane-backed, separate from
  public Scheduler priorities, with discrete -> `SyncLane`, continuous ->
  `InputContinuousLane`, default -> `DefaultLane`, and idle -> `IdleLane`.
- Worker 040 and worker 051 establish the DOM mutation/token boundary: host
  instances remain opaque, DOM node maps are renderer-owned, and commit hooks
  need reconciler-issued host fiber tokens.
- Worker 036 and worker 037 cover package export/type evidence. The runtime
  client entrypoint exports `createRoot`, `hydrateRoot`, and `version`; type
  declarations expose root `render(children): void` and `unmount(): void`, but
  runtime behavior still needs conformance oracles.
- Sibling worker 092 confirms create-root/root-object prerequisites: the public
  root owns `_internalRoot`, `render` and `unmount` are prototype methods,
  `render` returns `undefined`, render-after-unmount throws, second-argument
  warnings are development-only public behavior, and the facade must not mutate
  DOM directly.

Nested hypothesis checks:

- Spawned a read-only explorer to verify reconciler prerequisites for
  `root.render` HostRoot update integration. Agent id:
  `019e0eea-15c3-70e1-80cd-8bcc1f5d93f9`.
- Spawned a read-only explorer to verify public `root.render` behavior and
  test prerequisites. Agent id: `019e0eea-1619-7be2-bb9b-f6bd149347b4`.
- Initial `wait_agent` timed out after 60 seconds. The reconciler-prerequisite
  explorer later returned and confirmed the dependency ordering: current
  `react-dom/client` and reconciler code are placeholders, core has lane
  primitives but no root lane/update/scheduler state, and worker 044/070/072
  evidence supports rejecting a package-level DOM mutation shortcut. It
  reported no substantive correction to this plan.
- A second `wait_agent` for the public-behavior explorer also timed out before
  final verification. It later returned and confirmed the public-test
  prerequisite hypothesis: no dedicated local root-render oracle covers return
  value, exact second-argument warnings, production no-warning behavior,
  render-after-unmount warning/throw ordering, HostRoot `{element}` payload
  shape, event/transition lane choice, reentrancy, or host commit path. It also
  identified sibling worker 092 as available create-root/root-object evidence;
  that correction is incorporated here.

## Root Render Contract

Public `root.render(children)` should have this behavior:

1. Read `this._internalRoot`.
2. If the internal root is `null`, throw `Cannot update an unmounted root.`
3. In development only, inspect the second argument:
   - function: warn that the callback argument is unsupported and effects
     should be used instead
   - valid DOM container: warn that the container should not be passed again
   - any other defined value: warn that `root.render` accepts only one argument
4. Call `updateContainer(children, root, null, null)`.
5. Return `undefined`.

The integration should preserve argument ordering exactly with a React DOM
oracle before implementation, including whether render-after-unmount throws
before any second-argument warning. It should not support a callback, return a
root object, return the scheduled update, or return a promise.

## HostRoot Update Payload

`root.render` is the public entrypoint; `updateContainer` is the semantic
boundary. The internal update must be shaped as a HostRoot update:

- lane selected by `requestUpdateLane(root.current)`
- update tag equivalent to React's state update for HostRoot
- payload with the exact key `element`
- payload value equal to the `children` argument without facade coercion
- public callback argument always `null`
- root and fiber lane markings applied before scheduling
- transition entanglement applied when the lane is a transition lane

The `{element}` key must be preserved because root state and tooling assume that
shape. A generic payload enum named only `children`, a DOM node replacement, or
a queue that drops skipped updates would be a root-cause mismatch.

The JS/Rust boundary needs a rooted element handle policy before implementation.
The public JS facade may own the public element value, but the reconciler must
be able to hold it across scheduled work, aborts, rebases, and unmount cleanup
without storing raw JS values in Rust without lifetime rules.

## Lane Selection

`root.render` must select lanes through the reconciler, not through
`packages/react-dom/client.js`.

Required lane order:

1. Legacy sync mode shortcut exists in the reconciler helper but should not be
   reachable for `createRoot` concurrent roots.
2. Render-phase updates reuse an arbitrary lane from current render lanes and
   are tracked as render-phase updates.
3. Active React transitions claim or reuse a transition lane. Transitions
   started in one event should share the current event transition lane until
   the root-schedule microtask resets it.
4. Otherwise, DOM current update priority is resolved and mapped to a lane:
   discrete -> `SyncLane`, continuous -> `InputContinuousLane`, default ->
   `DefaultLane`, idle -> `IdleLane`.

The DOM adapter owns `current_update_priority`, `window.event` fallback, and
event-name classification. The reconciler owns `request_update_lane`,
transition lane claiming, event-priority-to-lane conversion, and entanglement.
The public `scheduler` package priority constants must not become lane values.

Important cases to preserve:

- `root.render` outside an event uses default event priority.
- `root.render` inside a discrete event uses `SyncLane`.
- `root.render` inside a continuous event uses `InputContinuousLane`.
- `root.render` inside `startTransition` uses a transition lane even if a DOM
  event priority is also present.
- `flushSync` should later force discrete update priority while its callback
  runs, but the actual sync flush belongs to the root scheduler.

## Reentrancy

The public method should not try to solve reentrancy itself. Reentrancy belongs
to `request_update_lane`, `schedule_update_on_fiber`, the root scheduler, and
commit guards.

Required behavior:

- Updates dispatched during render must not mutate host containers
  immediately. They should be marked as render-phase or interleaved updates and
  handled by the work loop according to current render lanes.
- Updates dispatched during commit/layout callbacks should preserve React's
  synchronous commit priority boundaries without recursively entering an
  unsafe commit.
- `flushSyncWork` and `root.unmount` need render/commit reentrancy detection;
  `root.render` must use the same scheduler state rather than bypassing it.
- `root.current` must not change during render. It switches only during commit,
  after mutation work and before layout effects.
- Errors thrown while processing a render update must unwind and schedule root
  or boundary recovery; they must not leave a partially mutated host tree.

Before implementation, tests should cover render calls from render, layout
effect, passive effect, and nested update contexts. The first Rust tests can
use a fake scheduler and fake host; the public DOM comparison should wait until
the facade and DOM mutation host exist.

## Render After Unmount

`root.unmount` is owned by a separate worker, but `root.render` depends on the
public root lifecycle state it creates:

- the public root object holds `_internalRoot`
- `root.unmount()` sets `_internalRoot = null` before scheduling the sync null
  update
- any later `root.render(...)` on that object throws
  `Cannot update an unmounted root.`
- the old internal root handle must not be resurrected by stale JS references,
  queued callbacks, or pending Scheduler tasks

Implementation should test both `root.render(element)` after unmount and
`root.render(element, callback)` after unmount to lock warning/throw ordering.

## Host Commit Path Requirements

`root.render` compatibility cannot be claimed until at least one host path can
prove that HostRoot updates commit through host-config operations.

Required commit path:

- process HostRoot queue into root `memoized_state.element`
- reconcile child element handles into fibers without host mutation during the
  public `render` call
- create detached host instances/text instances during complete work
- bubble lanes and flags through `subtreeFlags`
- schedule commit only for finished work for the selected lanes
- call `prepare_for_commit` once per root before mutation work
- perform placement, insert, update, text update, deletion, clear-container,
  hide/unhide, and detach operations only in mutation commit
- switch `root.current` after mutation and before layout callbacks/ref attach
- call `reset_after_commit` after mutation/layout commit state is safe
- schedule passive effects for later flushing
- mark finished lanes and reschedule remaining pending lanes

For DOM specifically, this depends on container validation, root markers,
delegated listener installation, DOM node-to-token maps, namespace-aware element
creation, property/style update payloads, text updates, deletion cleanup, and
single-parent move behavior. A test renderer or fake mutation host should prove
generic commit ordering before React DOM uses it.

## Exact Prerequisites Before Implementation

The following must exist, or their worker outputs must be merged, before a
behavior claim for `root.render`:

1. Client-root public behavior oracle:
   - invalid/unmounted root errors
   - root object shape
   - `render` return value
   - second-argument warnings
   - development vs production behavior
   - update timing visible through DOM or a controlled test renderer
2. Create-root facade and root object:
   - DOM container validation and root marking
   - listener installation side effects
   - public `_internalRoot` lifecycle
   - root options and root error callback storage
3. Core event priority and root lane bookkeeping:
   - lane-backed `EventPriority`
   - root pending/suspended/pinged/expired/entangled lane state
   - transition/retry lane claiming
   - `get_next_lanes` and `get_next_lanes_to_flush_sync`
4. Reconciler `FiberRoot` and HostRoot fiber model:
   - arena IDs and alternates
   - root lifecycle status
   - root callback/error handles
   - opaque host container storage
5. HostRoot update queue and update container APIs:
   - circular pending queue
   - base queue rebase
   - `{element}` payload handling
   - callback validation/storage for internal APIs
   - transition entanglement hooks
6. Root scheduler and act routing:
   - `schedule_update_on_fiber`
   - scheduled-root list
   - microtask scheduling
   - Scheduler callback reuse/cancelation
   - cross-root sync flushing
   - render/commit reentrancy guards
   - deterministic fake-scheduler tests
7. Work loop and commit skeleton:
   - HostRoot begin work
   - host component/text complete work or explicit unsupported tags
   - flag/subtreeFlag commit traversal
   - host token generation and invalidation
   - `root.current` switch timing
8. Minimal host verifier:
   - fake/test mutation host logs operations in commit order
   - DOM mutation host minimum exists before React DOM facade claims DOM output
9. JS/native boundary policy:
   - element and callback handles are rooted, disposed, and not called from
     background threads
   - public JS values remain JS-owned where needed

## Tests Required Before Implementation

Public/conformance tests:

- React DOM oracle for `root.render` return value: always `undefined` on
  accepted calls.
- Development warning oracle for second arguments:
  function callback, container-like value, and arbitrary defined value.
- Production oracle proving second-argument warnings are absent while behavior
  remains otherwise equivalent.
- Render-after-unmount oracle for exact thrown message and warning ordering.
- Root object shape tests proving `render` is on the prototype and does not
  expose internal update queue details.
- React DOM event/transition scenarios:
  render outside event, inside click/input, inside scroll/wheel, inside
  `startTransition`, and inside `flushSync` once available.
- Existing indirect `createRoot` or `root.render` usage inside DOM attribute,
  ref, event, namespace, or other renderer oracles is not a substitute for a
  dedicated public root-render oracle. Those scenarios may prove their own DOM
  surfaces against React DOM, but they do not lock exact root-render return
  value, warning order, payload shape, lane choice, or scheduler/commit
  behavior for Fast React.

Rust reconciler tests:

- `update_container` creates a HostRoot update with payload key `element`.
- `root.render` equivalent does not mutate a host container before commit.
- Circular queue insertion preserves order across mixed lanes.
- Skipped lower-priority updates are cloned into the base queue and rebased.
- Transition updates call entanglement hooks.
- `request_update_lane` chooses transition lanes before event lanes.
- Discrete, continuous, default, and idle event priorities map to the expected
  lanes.
- Render-phase updates reuse render lanes and set render-phase markers.
- Scheduler tests cover callback reuse/cancelation, cross-root sync flush, and
  render/commit reentrancy detection.

Host/commit tests:

- Fake mutation host operation log proves detached creation during complete
  work and mounted mutations only during commit.
- Commit order covers `prepare_for_commit`, placement/update/deletion/text
  mutation, `root.current` switch, layout/ref callbacks, passive scheduling,
  and `reset_after_commit`.
- Error-path tests prove aborted renders do not commit partial host mutations.
- Token tests prove node maps can reject stale or wrong-phase host tokens.

Report-only checks for this worker:

- scoped git status distinguishes this report from the untracked regenerable
  root `Cargo.lock`
- scoped diff check passes
- no trailing whitespace in this report
- no concrete local temp/user paths in this report

## Recommended Implementation Sequence

1. Merge or regenerate the missing worker 080 HostRoot update queue plan and
   worker 081 root scheduler/act plan; consume or merge the sibling worker 092
   create-root facade plan before implementing the facade-dependent pieces.
2. Add or consume a client-root/root-render oracle that locks the public
   `root.render` observations before implementation.
3. Implement core event priority and root lane bookkeeping.
4. Implement reconciler root/fiber records.
5. Implement HostRoot update queues and `update_container`.
6. Implement root scheduling, act routing, and cross-root sync flushing.
7. Implement HostRoot-only work-loop processing with explicit unsupported
   component tags.
8. Implement host complete work and commit traversal against a fake/test
   mutation host.
9. Wire the create-root facade to the internal root handle while keeping
   `render` behavior guarded until commit can run.
10. Implement public `root.render` by delegating to `updateContainer` and
    remove the placeholder only when the public oracle and Rust integration
    tests pass.
11. Extend the same path to DOM mutation output after DOM container markers,
    node maps, root listeners, and minimal DOM host operations are merged.

## Risks Or Blockers

- No merged local reports exist for workers 080 or 081, so this report cannot
  rely on their detailed conclusions.
- Worker 092 exists as a sibling report rather than local merged evidence. It
  is useful create-root/root-object support, but implementation should still
  consume the merged/accepted version before treating it as a hard dependency.
- `root.render` cannot be implemented in isolation. It depends on create-root,
  HostRoot queues, root scheduling, and commit traversal.
- Current React DOM package files are placeholders, so any public facade work
  must avoid claiming behavior before the reconciler path exists.
- Event priority and transition lane assignment span DOM adapter, React shared
  internals, root scheduler, and core lanes. A flat priority enum would create
  immediate incompatibility.
- JS callback and element handles crossing into Rust need a lifetime/rooting
  policy before scheduled work can hold them safely.
- DOM output compatibility is blocked on DOM mutation host work, root/listener
  markers, and node maps.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan keeps public facade observations separate from reconciler
  requirements and host commit requirements.
- It identifies missing prerequisite reports instead of filling gaps with
  assumptions.

Maintainability:

- Ownership stays layered: public root object in JS, lane/update/scheduler work
  in the reconciler, DOM node maps and mutation in the DOM adapter, and generic
  host operations behind host-config traits.
- The recommended test slices are narrow enough for future workers to merge
  independently.

Performance:

- Lane bitsets and `LaneMap<T>` remain the hot-path primitives.
- Scheduler callback reuse/cancelation and cross-root flushing are treated as
  required behavior, not optional optimization.
- Direct DOM mutation from `root.render` is rejected because it would over-flush
  and bypass batching/transition work.

Security:

- DOM writes must happen through structured host operations during commit, not
  string-based facade mutation.
- JS element and callback handles must be rooted and invalidated explicitly.
- Stale host tokens and node-map entries must fail closed after deletion or
  unmount.

## Commands Run

Tool actions:

- `create_goal` for the worker 093 objective.
- `get_goal`, which returned the active worker 093 objective and status.
- One rejected `spawn_agent` attempt using a full-history fork with explicit
  explorer type; retried without forking.
- Spawned two read-only nested agents for hypothesis checks.
- `wait_agent` for both nested agents with a 60 second timeout, which timed
  out before either returned findings.
- Received a subagent notification from `019e0eea-15c3-70e1-80cd-8bcc1f5d93f9`
  confirming the reconciler-prerequisite hypothesis and reporting no
  substantive correction.
- `wait_agent` for `019e0eea-1619-7be2-bb9b-f6bd149347b4` with a 60 second
  timeout, which timed out before findings returned.
- Received a subagent notification from `019e0eea-1619-7be2-bb9b-f6bd149347b4`
  confirming the public root-render test prerequisite hypothesis and pointing
  out the sibling worker 092 report.

Shell commands:

```sh
pwd && git status --short && rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/worker-044-react-dom-client-roots-plan.md' -g 'worker-progress/worker-055-react-dom-client-roots-implementation-plan.md' -g 'worker-progress/worker-080-reconciler-host-root-update-queue-plan.md' -g 'worker-progress/worker-081-reconciler-root-scheduler-act-plan.md' -g 'worker-progress/worker-092-react-dom-create-root-facade-plan.md' -g 'worker-progress/worker-093-root-render-integration-plan.md'
sed -n '1,260p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,320p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,360p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,360p' worker-progress/worker-093-root-render-integration-plan.md
for f in worker-progress/worker-080-reconciler-host-root-update-queue-plan.md worker-progress/worker-081-reconciler-root-scheduler-act-plan.md worker-progress/worker-092-react-dom-create-root-facade-plan.md; do if [ -f "$f" ]; then printf '%s\n' "$f: exists"; else printf '%s\n' "$f: missing"; fi; done
sed -n '361,760p' worker-progress/worker-093-root-render-integration-plan.md
rg --files worker-progress | rg 'worker-(036|037|040|041|048|051|070|071|072|073|080|081|092|093)'
sed -n '1,260p' packages/react-dom/client.js
sed -n '1,420p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,260p' crates/fast-react-core/src/lib.rs
sed -n '1,360p' crates/fast-react-core/src/lane.rs
sed -n '1,320p' worker-progress/worker-070-core-update-queue-plan.md
sed -n '1,420p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
sed -n '1,360p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '1,320p' worker-progress/worker-048-react-dom-event-priority-oracle.md
sed -n '1,320p' worker-progress/worker-051-dom-host-token-boundary.md
rg -n "HostFiberToken|HostFiberTokenRef|create_instance\\(|commit_update\\(|detach_deleted_instance|EventPriority" crates/fast-react-host-config/src/lib.rs | sed -n '1,220p'
if [ -f worker-progress/README.md ]; then sed -n '1,240p' worker-progress/README.md; else true; fi
git status --short
git diff --no-index --check /dev/null worker-progress/worker-093-root-render-integration-plan.md; status=$?; if [ "$status" -le 1 ]; then exit 0; else exit "$status"; fi
perl -ne 'if (/[ \t]$/) { print "$ARGV:$.: trailing whitespace\n"; $bad=1 } END { exit($bad ? 1 : 0) }' worker-progress/worker-093-root-render-integration-plan.md
if rg -n '<normalized local/temp path pattern>' worker-progress/worker-093-root-render-integration-plan.md; then exit 1; else exit 0; fi
git diff -- worker-progress/worker-093-root-render-integration-plan.md && git ls-files --others --exclude-standard worker-progress/worker-093-root-render-integration-plan.md Cargo.lock
git diff --no-index --check /dev/null worker-progress/worker-093-root-render-integration-plan.md; rc=$?; if [ "$rc" -le 1 ]; then exit 0; else exit "$rc"; fi
for f in ../fast-react-worker-092-react-dom-create-root-facade-plan/worker-progress/worker-092-react-dom-create-root-facade-plan.md ../fast-react-worker-080-reconciler-host-root-update-queue-plan/worker-progress/worker-080-reconciler-host-root-update-queue-plan.md ../fast-react-worker-081-reconciler-root-scheduler-act-plan/worker-progress/worker-081-reconciler-root-scheduler-act-plan.md; do if [ -f "$f" ]; then printf '%s\n' "$f: exists"; else printf '%s\n' "$f: missing"; fi; done
sed -n '1,260p' ../fast-react-worker-092-react-dom-create-root-facade-plan/worker-progress/worker-092-react-dom-create-root-facade-plan.md
rg -n "root\\.render|render\\(|_internalRoot|Cannot update an unmounted root|second|callback|direct DOM|HostRoot|updateContainer|undefined" ../fast-react-worker-092-react-dom-create-root-facade-plan/worker-progress/worker-092-react-dom-create-root-facade-plan.md
rg -n "root\\.render|react-dom-client-root|root-render|createRoot" tests/conformance worker-progress packages/react-dom | sed -n '1,220p'
sed -n '1,180p' worker-progress/worker-093-root-render-integration-plan.md && sed -n '300,390p' worker-progress/worker-093-root-render-integration-plan.md && sed -n '440,540p' worker-progress/worker-093-root-render-integration-plan.md
```

Verification results:

- `git status --short` shows only untracked `Cargo.lock` and this report.
- Scoped `git diff --no-index --check` on this report passed after rerunning
  with a non-reserved shell variable name. The first wrapper used `status` and
  failed before checking because the shell treats that name as read-only.
- Scoped trailing-whitespace check on this report passed.
- Scoped local/temp path leak check on this report passed.
- `git ls-files --others --exclude-standard` confirms the only untracked
  scoped report artifact is `worker-progress/worker-093-root-render-integration-plan.md`;
  the untracked root `Cargo.lock` remains a regenerable artifact.

No source tests were run because this task is report-only.

## Changed Files

- `worker-progress/worker-093-root-render-integration-plan.md`

## Completion Checklist

- [x] Called `create_goal` before research, file reads, implementation, or
  verification.
- [x] Called `get_goal` after goal setup and recorded the active status and
  objective.
- [x] Read the required worker brief, master docs, and prior root reports.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Checked for worker 080, 081, 092, and prior worker 093 files.
- [x] Read sibling worker 092 after nested-agent review identified it as
  available outside this worktree.
- [x] Used nested read-only agents to test hypotheses.
- [x] Covered render return value, callback warnings, element payload updates,
  event/transition lane selection, reentrancy, render-after-unmount errors, and
  host commit path requirements.
- [x] Identified exact prerequisites and tests before implementation.
- [x] Wrote only the scoped report file.
- [x] Ran scoped report checks after the final edit.
