# Worker 147: Suspense/Offscreen Refresh

## Goal Evidence

- `create_goal` was the first tool action in this worker session.
- Goal objective: "Produce a report-only refresh for Suspense, Offscreen, retry lanes, hidden updates, pinged/suspended root lanes, and out-of-scope items for the minimal root render milestone, writing only worker-progress/worker-147-suspense-offscreen-refresh.md."
- `get_goal` immediately returned status `active` for the same objective.
- A final pre-completion `get_goal` call still returned status `active` for the same objective.
- `WORKER_BRIEF.md` was read after goal setup. `ORCHESTRATOR.md` was not read.

## Summary

Fast React already has the right low-level pieces to reserve Suspense and
Offscreen semantics: exact React 19.2.6 lane bits, root lane maps, suspended
and pinged lane fields, retry lane claimers, hidden-update marking hooks,
Suspense/Offscreen fiber tags, capture/visibility/retry flags, HostRoot update
queues, and a data-only root scheduler.

Those pieces are not enough to implement real Suspense or Offscreen yet. The
current root scheduler still chooses `highest_priority_pending_lanes()` and
does not run React's `getNextLanes` algorithm, so it would incorrectly schedule
suspended work and miss ping/prewarm behavior. Real Suspense/Offscreen also
requires begin/complete/unwind/commit behavior, hidden context, wakeable ping
cache, retry listeners, Offscreen state instances, and visibility effects.

For the minimal root render milestone, Suspense, Offscreen, LegacyHidden,
Activity, SuspenseList, hydration, wakeables, retry listeners, hidden subtree
visibility, and retry throttling should remain out of source scope except for
fail-closed handling and narrow data hooks that do not claim compatibility.

## Changed Files

- `worker-progress/worker-147-suspense-offscreen-refresh.md`

Observed but not touched:

- `.worker-logs/`

## Evidence Gathered

- `MASTER_PLAN.md` keeps the current objective focused on minimal real root
  render/update/unmount and explicitly has workers 130-148 as report-only.
- `MASTER_PROGRESS.md` shows accepted source foundations through worker 128:
  lane bookkeeping, event priority, fiber flags, FiberRoot/HostRoot,
  HostRoot update queues, and the root scheduler foundation.
- `worker-progress/worker-030-core-lane-model.md` and
  `crates/fast-react-core/src/lane.rs` confirm exact React 19.2.6 lane bits,
  masks, retry lanes, Offscreen lane, Deferred lane, and lane maps.
- `worker-progress/worker-047-core-root-lane-bookkeeping.md` and
  `crates/fast-react-core/src/root_lanes.rs` confirm root lane fields and
  mutators for pending, suspended, pinged, warm, expired, entangled, hidden,
  transition, and retry bookkeeping.
- `worker-progress/worker-075-core-event-priority.md` confirms internal event
  priorities are lane-backed and separate from public Scheduler priorities.
- `worker-progress/worker-076-core-fiber-flags.md` and
  `crates/fast-react-core/src/fiber_flags.rs` confirm the capture,
  visibility, and retry flags Suspense/Offscreen will need later.
- `worker-progress/worker-124-host-root-update-queue.md` and
  `crates/fast-react-reconciler/src/update_queue.rs` confirm HostRoot queue
  rebasing, hidden callback deferral, Offscreen-lane stripping during queue
  processing, and transition entanglement hooks.
- `worker-progress/worker-128-reconciler-root-scheduler-foundation.md` and
  `crates/fast-react-reconciler/src/root_scheduler.rs` confirm the root
  scheduler owns scheduled-root list, callback identity, microtask requests,
  sync flush plan data, and scheduler bridge records, but intentionally does
  not render or commit.
- React 19.2.6 source checked locally under
  `/Users/user/Developer/Developer/react-reference`, especially
  `ReactFiberLane.js`, `ReactFiberRootScheduler.js`, `ReactFiberWorkLoop.js`,
  `ReactFiberThrow.js`, `ReactFiberBeginWork.js`, `ReactFiberCompleteWork.js`,
  `ReactFiberCommitWork.js`, `ReactFiberHiddenContext.js`,
  `ReactFiberSuspenseComponent.js`, `ReactFiberOffscreenComponent.js`, and
  `ReactFiberConcurrentUpdates.js`.

## Root-Lane And Scheduler Hooks Already Present

- Lane primitives include Sync, InputContinuous, Default, Gesture,
  TransitionHydration, 14 transition lanes, 4 retry lanes, SelectiveHydration,
  IdleHydration, Idle, Offscreen, Deferred, and React-style group masks.
- `RootLaneState` already stores `pending_lanes`, `suspended_lanes`,
  `pinged_lanes`, `warm_lanes`, `expired_lanes`, `indicator_lanes`,
  `error_recovery_disabled_lanes`, `entangled_lanes`, per-lane expiration
  times, per-lane entanglements, and per-lane hidden-update counts.
- Root lane mutators already exist for `mark_updated`, `mark_suspended`,
  `mark_pinged`, `mark_finished`, `mark_entangled`,
  `upgrade_pending_lanes_to_sync`, `mark_starved_lanes_as_expired`,
  `mark_expired`, `mark_error_recovery_disabled`, `mark_hidden_update`, and
  hidden update clearing.
- `LaneClaimers` already cycles through transition update lanes, transition
  deferred lanes, and retry lanes.
- `FiberRoot` embeds `RootLaneState` and root scheduling fields for
  `next_scheduled_root`, callback node/priority, timeout handle,
  pending-commit cancel handle, work-in-progress root/render lanes, render
  exit status, and pending passive state.
- `HostRootState` reserves hydration and pending Suspense boundary handles,
  but these are inert handles only.
- `FiberTag` already reserves `Suspense`, `SuspenseList`, `Offscreen`,
  `LegacyHidden`, `DehydratedFragment`, `Activity`, and `Throw`.
- `FiberFlags` already includes `DidCapture`, `ShouldCapture`,
  `ForceClientRender`, `Visibility`, `ScheduleRetry`, `DidDefer`,
  `ShouldSuspendCommit`, `Hydrating`, and the relevant phase masks.
- HostRoot update queues already support circular pending rings, base queue
  rebasing, skipped-lane cloning, applied `NoLane` clones, callback
  collection, hidden callback deferral, and transition entanglement data.
- `RootUpdate::mark_hidden` and root-lane `mark_hidden_update` reserve the
  Offscreen-lane marker path; queue processing strips `OffscreenLane` before
  priority comparisons and evaluates hidden updates against root render lanes.
- Concurrent update staging already records `(fiber, queue, update, lane)`,
  marks source fiber lanes, bubbles child lanes to the HostRoot, and marks the
  root updated when drained.
- `update_container` / `update_container_sync` already return
  `RootScheduleUpdateRecord` and optional transition entanglement records.
- The root scheduler already models React's global scheduled-root list,
  same-root dedupe, root-schedule microtask request, possible sync-work flag,
  callback priority reuse/cancel/schedule records, and sync callback bypass.

## Missing Or Insufficient Hooks

- There is no Rust `get_next_lanes` equivalent. `root_scheduler.rs` currently
  calls `root.lanes().highest_priority_pending_lanes()` and then
  `entangled_lanes_for`, so suspended lanes are not excluded, pinged lanes are
  not preferred, warm/prewarm lanes are not considered, in-progress render
  lanes are not protected from lower-priority interruption, and pending commit
  status is ignored.
- There is no `get_next_lanes_to_flush_sync` equivalent. `collect_sync_flush_plan`
  only collects roots whose simplified next lanes include sync work.
- There is no `check_if_root_is_prerendering` equivalent. React intentionally
  routes sync-looking prerender work through concurrent scheduling when the
  selected lanes are suspended/pinged in a prerender context.
- There is no root ping cache, wakeable listener registry, ping listener
  idempotency, or `pingSuspendedRoot` path.
- There is no `request_retry_lane` path for Suspense boundary retries. Core
  can claim retry lanes, but no boundary/fiber integration uses it.
- Hidden update state is still split between root lane counts and update queue
  markers. React stores actual hidden update handles per lane and clears the
  Offscreen bit from those updates in `markRootFinished`.
- `mark_update_lane_from_fiber_to_root` does not detect hidden Offscreen
  ancestors or call the root hidden-update hook.
- There is no hidden context stack that adds hidden subtree `baseLanes` into
  `entangledRenderLanes`.
- There are no Offscreen state records for `baseLanes`, cache pool, visibility
  bit, transitions, marker instances, retry cache, or retry queue.
- There is no Suspense state store for dehydrated boundary handles, tree
  context, retry lane, hydration errors, or the normal suspended marker.
- There is no begin-work, complete-work, unwind, or commit implementation for
  Suspense/Offscreen tags.
- There is no commit support for visibility effects, hiding/unhiding host
  nodes, disappearing/reappearing layout effects, passive effect
  disconnect/reconnect, or retry listener attachment.

## React 19.2.6 Source Findings

- `ReactFiberLane.js:getNextLanes` chooses pending work by excluding
  suspended lanes, then considering pinged lanes, then warm/prewarm lanes. It
  also avoids interrupting an in-progress render with equal/lower priority work
  and treats Default vs Transition interruption specially.
- `ReactFiberLane.js:getNextLanesToFlushSync` removes suspended-but-not-pinged
  lanes, includes all lanes at equal or higher priority than the forced sync
  set, and treats matching hydration lanes as a separate batch.
- `ReactFiberLane.js:markRootUpdated` clears suspended/pinged/warm lanes for
  non-idle updates; `markRootSuspended` records suspended/warm lanes and clears
  expiration; `markRootPinged` only pings lanes that were suspended.
- `ReactFiberLane.js:markRootFinished` clears lane maps for no-longer-pending
  lanes and strips `OffscreenLane` from stored hidden updates. It also records
  freshly spawned retry lanes as suspended when no update invalidated the
  render.
- `ReactFiberRootScheduler.js:scheduleTaskForRootDuringMicrotask` runs
  starvation expiration before selecting lanes, uses `getNextLanes`, cancels
  callbacks for no-work or suspended roots, bypasses Scheduler only for sync
  lanes that are not prerendering, and otherwise schedules by event priority.
- `ReactFiberWorkLoop.js` owns render exit statuses, suspended root reasons,
  interleaved updated/pinged lanes, deferred lane, suspended retry lanes, and
  the ping listener path. These states are not modeled by the current Rust
  scheduler foundation.
- `ReactFiberThrow.js` marks Suspense/Offscreen boundaries with
  `ShouldCapture`, `DidCapture`, `ScheduleRetry`, or retry queues depending on
  boundary type and wakeable kind, and attaches ping listeners in concurrent
  mode.
- `ReactFiberBeginWork.js:updateOffscreenComponent` bails hidden trees to
  `OffscreenLane`, records `OffscreenState.baseLanes`, resumes hidden trees at
  Offscreen priority, pushes hidden context, and pushes/reuses Suspense
  handlers.
- `ReactFiberBeginWork.js:updateSuspenseComponent` creates the primary
  Offscreen child and fallback sibling, switches between primary and fallback,
  stores `SUSPENDED_MARKER`, transfers Offscreen state, and handles hydration
  special cases.
- `ReactFiberCompleteWork.js:scheduleRetryEffect` schedules `Update` for
  retry queue listeners and claims retry lanes or `OffscreenLane` for immediate
  retries.
- `ReactFiberCommitWork.js` attaches retry listeners during commit and toggles
  Offscreen visibility, host child visibility, and layout/passive effect
  connectivity.

## Blockers For Real Suspense/Offscreen

- Implementing Suspense now would immediately depend on a real root work loop,
  render lanes, unwinding, render exit status propagation, and commit ordering.
  Those are not available in the accepted source line.
- Implementing Offscreen now would require hidden context and visibility commit
  effects. A data-only Offscreen fiber without those would leave updates
  scheduled on the wrong lanes and host output in the wrong visible state.
- Adding ping/retry behavior without `getNextLanes` would produce incorrect
  scheduling because the scheduler would keep selecting suspended pending
  lanes instead of waiting for pings or prewarm work.
- The current hidden-update count hook is insufficient for source workers that
  mutate update queues. React clears `OffscreenLane` from concrete update
  handles after commit; counts cannot perform that mutation.
- Wakeables require JS/runtime object identity, listener idempotency, and
  callback routing. The current Rust core has opaque callback handles but no
  wakeable/promise integration surface.
- Retry queues span render and commit: render stores wakeables on Suspense,
  SuspenseList, or Offscreen fibers; commit attaches retry listeners; ping
  schedules a boundary update. None of those cross-phase links exist yet.
- Hydrated Suspense boundaries use `SuspenseState.dehydrated`, `retryLane`,
  hydration errors, and host Suspense instances. Hydration must remain a later
  slice, not a prerequisite for minimal client root rendering.
- SuspenseList, Activity, ViewTransition, resources, and suspensey commit
  paths share some of the same flags and lanes but broaden the surface far
  beyond a minimal root render milestone.

## Tests Needed Before Source Workers

- Core `get_next_lanes` tests for fresh unblocked work, suspended work,
  pinged lanes, warm/prewarm lanes, idle-only roots, entangled lanes,
  expired lanes, root pending-commit behavior, WIP non-interruption, and the
  Default-vs-Transition interruption rule.
- Core `get_next_lanes_to_flush_sync` tests for excluding suspended unpinged
  lanes, including pinged lanes, equal-or-higher priority batching, hydration
  lane isolation, and forced sync lane inclusion.
- Root scheduler tests proving `schedule_task_for_root_during_microtask`
  uses full next-lane selection, cancels callbacks when the root is suspended
  or has pending commit work, preserves callback reuse/cancel semantics, and
  keeps prerendering work off the sync fast path.
- Root ping tests with a fake wakeable identity model: attach one ping listener
  per root/wakeable/lane set, delete the ping cache entry on resolution, call
  `mark_pinged`, and ensure a root schedule request is produced.
- Hidden update tests that store real update handles per lane, mark an update
  with `lane | OffscreenLane` when an update originates under a hidden
  Offscreen ancestor, process hidden updates against root render lanes, defer
  hidden callbacks, and strip `OffscreenLane` when those lanes finish.
- Retry lane tests for `request_retry_lane`: sync in non-concurrent roots,
  retry-lane claiming in concurrent roots, boundary retry scheduling through
  source-fiber lane bubbling, and retry-lane suspension on root finish.
- Suspense begin/complete tests before commit behavior: mounting primary
  Offscreen children, switching to fallback after `DidCapture`, preserving
  primary hidden child lanes, setting `Visibility`, storing retry queues, and
  scheduling immediate retry lanes.
- Offscreen begin/complete tests before commit behavior: hidden first pass
  bails to `OffscreenLane`, second pass at Offscreen priority clears base
  lanes, visible reveal includes prior base lanes, hidden suspension preserves
  remaining child lanes, and hidden complete-work does not bubble child flags
  except at Offscreen priority.
- Commit tests before claiming compatibility: Suspense retry listeners,
  Offscreen hide/unhide host operations, layout effect disconnect/reconnect,
  passive effect connect/disconnect, hidden callback release on reveal, and no
  host visibility mutation for LegacyHidden prerender-only cases.
- React 19.2.6 runtime oracles for Suspense fallback/retry timing,
  `startTransition` with shell suspension, hidden Offscreen updates, retry
  throttling, `act` around resolving wakeables, and test-renderer/DOM hidden
  serialization expectations.
- Minimal root render negative tests proving Suspense/Offscreen/Activity/
  SuspenseList fail closed or remain unsupported until the feature source
  slices are explicitly queued.

## Minimal Root Render Out Of Scope

- Real Suspense fallback, wakeable capture, ping, retry, throttling, shell
  suspension, SuspenseList coordination, and suspense callbacks.
- Real Offscreen or LegacyHidden behavior, including hidden context,
  `OffscreenState`, Offscreen instances, visibility effects, and hidden host
  mutations.
- Hydration, dehydrated Suspense/Activity boundaries, selective hydration
  retry lanes, hydration event replay, and Suspense marker clearing.
- Activity, ViewTransition, suspensey commit resources, forms/resources/
  singletons, and any renderer-specific DOM resource readiness path.
- Public React DOM or test-renderer Suspense compatibility claims.
- JS wakeable identity plumbing and runtime promise listener integration.
- Commit-time layout/passive effect hiding and reconnect semantics.

The minimal root render milestone should keep its source workers to HostRoot
queue processing, work-in-progress creation, basic begin/complete for supported
client-render tags, root current switch, minimal commit, sync flush/act routing,
and host text/component mutation proof. Unsupported Suspense/Offscreen tags
should be explicitly rejected or skipped with tests, not partially interpreted.

## Risks Or Blockers

- The biggest scheduling risk is false confidence from existing suspended and
  pinged root lane fields. They are stored, but the scheduler does not consume
  them correctly yet.
- The hidden-update model must move from counts to concrete update handles
  before real Offscreen work; otherwise finished lanes cannot clear the
  `OffscreenLane` marker from queued updates.
- Suspense/Offscreen crosses too many phases to implement safely as a narrow
  source patch. It needs lane selection, work loop, begin/complete, commit,
  and runtime wakeable surfaces in place first.
- Hydration uses several of the same Suspense fields but should not be pulled
  into the client minimal root render milestone.

## Recommended Next Tasks

1. Implement and test core `get_next_lanes`, `get_next_lanes_to_flush_sync`,
   and `check_if_root_is_prerendering` on `RootLaneState`.
2. Update the internal root scheduler to consume those lane-selection helpers
   while preserving its data-only, no-render contract.
3. Replace hidden update counts with lane-indexed update handles once update
   ownership can safely cross root lane state and update queues.
4. Add fail-closed tests for unsupported Suspense/Offscreen/Activity/
   SuspenseList in the minimal root render slice.
5. Build React 19.2.6 black-box oracles for Suspense fallback/retry and
   Offscreen hidden update behavior before assigning source implementation
   workers for those features.

## Commands Run

- `create_goal` tool call for the worker objective.
- `get_goal` tool calls to confirm active status/objective.
- `sed -n '1,240p' WORKER_BRIEF.md`
- `git status --short`
- `if [ -f worker-progress/worker-147-suspense-offscreen-refresh.md ]; then sed -n '1,220p' worker-progress/worker-147-suspense-offscreen-refresh.md; else printf 'MISSING\n'; fi`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-124-host-root-update-queue.md`
- `sed -n '1,300p' worker-progress/worker-128-reconciler-root-scheduler-foundation.md`
- `rg --files crates/fast-react-core/src crates/fast-react-reconciler/src packages`
- `rg -n "Suspense|Offscreen|retry|pinged|suspended|hidden|RootLane|Lane::|RootScheduler|ensure_root|update_container|mark_(root_)?(suspended|pinged|updated|finished)|ping|suspend|retryLane|retry_lane|OffscreenLane" crates/fast-react-core/src crates/fast-react-reconciler/src worker-progress`
- `rg -n "root lane|root-lane|RootLane|suspended|pinged|retry|Offscreen|Suspense|hidden" worker-progress MASTER_PLAN.md MASTER_PROGRESS.md`
- `ls worker-progress | rg '047|075|076|030|root-lane|lane|scheduler|suspense|offscreen|retry|host-root|root-scheduler|work-loop'`
- `sed -n '1,460p' crates/fast-react-core/src/root_lanes.rs`
- `sed -n '460,980p' crates/fast-react-core/src/root_lanes.rs`
- `sed -n '980,1220p' crates/fast-react-core/src/root_lanes.rs`
- `sed -n '1,460p' crates/fast-react-core/src/lane.rs`
- `sed -n '1,420p' crates/fast-react-reconciler/src/root_scheduler.rs`
- `sed -n '420,860p' crates/fast-react-reconciler/src/root_scheduler.rs`
- `sed -n '1,420p' worker-progress/worker-047-core-root-lane-bookkeeping.md`
- `sed -n '1,240p' worker-progress/worker-030-core-lane-model.md`
- `sed -n '1,460p' crates/fast-react-reconciler/src/fiber_root.rs`
- `sed -n '1,720p' crates/fast-react-reconciler/src/update_queue.rs`
- `sed -n '1,300p' crates/fast-react-reconciler/src/root_updates.rs`
- `sed -n '1,360p' crates/fast-react-reconciler/src/work_in_progress.rs`
- `sed -n '1,520p' crates/fast-react-reconciler/src/fiber_store.rs`
- `sed -n '1,360p' crates/fast-react-reconciler/src/concurrent_updates.rs`
- `sed -n '1,300p' crates/fast-react-reconciler/src/update_priority.rs`
- `sed -n '1,560p' crates/fast-react-reconciler/src/root_config.rs`
- `sed -n '1,420p' crates/fast-react-core/src/fiber.rs`
- `sed -n '1,420p' crates/fast-react-core/src/fiber_arena.rs`
- `sed -n '1,380p' crates/fast-react-core/src/fiber_flags.rs`
- `sed -n '1,300p' worker-progress/worker-076-core-fiber-flags.md`
- `sed -n '1,260p' worker-progress/worker-075-core-event-priority.md`
- `rg --files /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src | rg 'ReactFiber(Lane|RootScheduler|WorkLoop|Throw|BeginWork|CompleteWork|CommitWork|Suspense|Offscreen|ClassUpdateQueue|ConcurrentUpdates|NewContext|Hydration)'`
- `rg -n "function getNextLanes|function getNextLanesToFlushSync|function markRootUpdated|function markRootSuspended|function markRootPinged|function markRootFinished|function markHiddenUpdate|function getBumpedLaneForHydration|function claimNextRetryLane|function claimNextTransitionLane|function requestRetryLane|function requestDeferredLane|pingedLanes|suspendedLanes|warmLanes|hiddenUpdates|OffscreenLane|RetryLanes" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js`
- `sed -n '245,360p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js`
- `sed -n '359,435p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js`
- `sed -n '820,1090p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js`
- `sed -n '1086,1188p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberLane.js`
- `sed -n '350,700p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js`
- `rg -n "getNextLanes\\(|getNextLanesToFlushSync|markRootStarved|markStarvedLanesAsExpired|scheduleTaskForRootDuringMicrotask|ensureRootIsScheduled|pingedLanes|suspendedLanes" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js`
- `sed -n '700,820p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberRootScheduler.js`
- `rg -n "function attachPingListener|pingSuspendedRoot|markRootSuspended\\(|markRootPinged\\(|RootSuspended|RootSuspendedWithDelay|RootSuspendedAtTheShell|RootCompleted|retryTimedOutBoundary|retryDehydratedSuspenseBoundary|resolveRetryWakeable|suspendedRetryLanes|spawnedLane" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `sed -n '450,760p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `sed -n '800,925p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `sed -n '920,1035p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `sed -n '1110,1245p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `sed -n '1350,1608p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `sed -n '4731,4920p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberWorkLoop.js`
- `sed -n '1,240p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberOffscreenComponent.js`
- `sed -n '613,930p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js`
- `sed -n '2295,2695p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js`
- `sed -n '2911,3068p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberBeginWork.js`
- `sed -n '1512,1655p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCompleteWork.js`
- `sed -n '1909,1975p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCompleteWork.js`
- `sed -n '628,666p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCompleteWork.js`
- `sed -n '239,365p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberThrow.js`
- `sed -n '381,645p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberThrow.js`
- `rg -n "OffscreenVisible|OffscreenDetached|OffscreenPassiveEffectsConnected|OffscreenInstance|_visibility|retryQueue|detachOffscreenInstance|attachOffscreenInstance" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberOffscreenComponent.js`
- `sed -n '2340,2420p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js`
- `sed -n '2450,2538p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js`
- `sed -n '3270,3315p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberCommitWork.js`
- `rg -n "HiddenContext|pushHiddenContext|reuseHiddenContextOnStack|markHiddenUpdate|OffscreenLane|entangledRenderLanes|baseLanes" /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src`
- `sed -n '1,220p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberHiddenContext.js`
- `sed -n '220,260p' /Users/user/Developer/Developer/react-reference/packages/react-reconciler/src/ReactFiberConcurrentUpdates.js`
- `git diff --check`
- `git diff --no-index --check -- /dev/null worker-progress/worker-147-suspense-offscreen-refresh.md; code=$?; if [ "$code" -le 1 ]; then exit 0; else exit "$code"; fi`
- Scoped changed-path check allowing only `worker-progress/worker-147-suspense-offscreen-refresh.md` and excluding `.worker-logs/`
- `git status --short`

## Verification Results

- `git diff --check` passed.
- `git diff --no-index --check -- /dev/null worker-progress/worker-147-suspense-offscreen-refresh.md` passed with the expected new-file diff status normalized to success.
- Scoped changed-path check passed: the only changed path after excluding `.worker-logs/` is `worker-progress/worker-147-suspense-offscreen-refresh.md`.
- Final `git status --short` shows `.worker-logs/` and `worker-progress/worker-147-suspense-offscreen-refresh.md` as untracked; `.worker-logs/` was preexisting and was not touched.
