# worker-113-function-component-implementation-plan

## Objective

Produce a report-only implementation plan for the first function component
rendering slice, including dispatcher state, hook cursors, render-phase retry
loops, bailout boundaries, error cleanup, and fake-host tests that stay below
DOM/test-renderer public APIs.

Write scope: this report only,
`worker-progress/worker-113-function-component-implementation-plan.md`.

## Goal Setup

`create_goal` was called before research, file reads, implementation, or
verification with the assigned worker objective. `get_goal` was available
immediately afterward and reported:

- status: `active`
- objective: "Produce a report-only implementation plan for the first function
  component rendering slice, including dispatcher state, hook cursors,
  render-phase retry loops, bailout boundaries, error cleanup, and fake-host
  tests that stay below DOM/test-renderer public APIs. Write only
  worker-progress/worker-113-function-component-implementation-plan.md; anchor
  the plan in merged workers 007, 070, 071, 078, 081, 099, 100, 107 if present,
  and 112 if present; treat workers 047, 075, 076, 107, and 112 as provisional
  unless reports/changes are present; specify future files, Rust/JS boundary
  assumptions, tests, invariants, risks, and completion gates; use subagents to
  test hypotheses and record results."

## Summary

The first function component rendering slice should be an internal reconciler
slice that proves the render-phase state machine before any public React DOM,
public test-renderer, or hook facade compatibility is claimed.

The root cause is not "invoke a JS function component." React-compatible
function rendering is a lane-aware state machine over double-buffered fibers,
per-fiber hook lists, dispatcher modes, render-phase update retry loops,
context dependency placeholders, bailout boundaries, and unwind cleanup. The
first source implementation should therefore add a fake-invoker/fake-host Rust
path that can mount and update function component fibers, track hook cursor
order, rerender local render-phase updates up to the React limit of 25 passes,
clean queues on error/unwind, and decide whether to bail out without touching
DOM or public test-renderer serialization.

Breaking changes should be introduced if existing or future scaffolds try to
represent hooks as renderer-local vectors, retry render-phase updates through
root scheduling, flatten lanes to a priority enum, store raw JS callbacks in
Rust, or bypass context dependencies during bailouts.

## Evidence Gathered

Required docs read:

- `WORKER_BRIEF.md`: worker reports must record goal setup, use only scoped
  write files, may use nested agents, and must include summary, changed files,
  commands, evidence, risks, and next tasks.
- `MASTER_PLAN.md`: worker 113 is report-only; current active milestone is
  first root/reconciler/renderer closure.
- `MASTER_PROGRESS.md`: workers 007, 070, 071, 078, 081, 099, and 100 are
  merged; workers 107 and 112 are running in separate worktrees and not present
  in this worktree.

Anchored merged worker evidence present in this worktree:

- Worker 007: lane bitsets, double-buffered fibers, circular/rebased update
  queues, render-phase hook updates, and tree/mask commit traversal are root
  invariants; FIFO queues, flat priorities, and global effect lists are
  rejected.
- Worker 070: queue processing must preserve insertion order while lanes
  select eligible work; hook queues are separate from HostRoot/class queues and
  include base state, base queues, eager state, render-phase queues, and
  optimistic revert lanes.
- Worker 071: commit metadata is `flags`, `subtreeFlags`, parent-owned
  deletions, and per-fiber hook effect rings; bailout paths must clear dynamic
  effect flags without erasing static flags.
- Worker 078: function component update queues own per-fiber hook effect rings
  and callback/deps handles; aborted renders must release uncommitted handles.
- Worker 081: root scheduling owns `render_lanes`, sync flushing, Scheduler
  callback routing, act routing, and reentrancy guards; local hook render-phase
  retries must not be scheduled as normal root work.
- Worker 099: hook state queues need pending/base circular rings, lane
  filtering, eager `useState` state, render-phase update cleanup, interleaved
  staging, and optimistic `revertLane` support. This report corrects worker
  100's stale note that worker 099 was absent.
- Worker 100: closest prior plan for function component rendering. Its
  root-cause invariants around hook cursors, dispatcher modes,
  `renderWithHooks`, context dependency bailouts, lane-aware hook processing,
  and hook unwind cleanup are accepted and narrowed here into the first source
  implementation slice.

Provisional or absent dependencies:

- Worker 047/root lane bookkeeping: no report or `root_lanes.rs` is present;
  dependency is provisional.
- Worker 075/event priority: no report or `event_priority.rs` is present;
  dependency is provisional.
- Worker 076/fiber and hook effect flags: no report, `fiber_flags.rs`, or
  `hook_effect_flags.rs` is present; dependency is provisional.
- Worker 107/core fiber topology implementation plan: not present in
  `worker-progress`; dependency is provisional. Earlier worker 077/079/080
  plans remain useful background but are not substitutes for worker 107.
- Worker 112/core hook queue implementation plan: not present in
  `worker-progress`; dependency is provisional. Worker 099 is the current
  merged hook queue anchor.

Current source evidence:

- `crates/fast-react-core/src/lane.rs` has React 19.2.6 `Lane`, `Lanes`,
  `LaneIndex`, and `LaneMap<T>`.
- `crates/fast-react-core/src/lib.rs` exports lanes, symbols, element records,
  and placeholder errors, but no fiber, root, hook queue, flags, context, or
  error-boundary models.
- `crates/fast-react-reconciler/src/lib.rs` is a placeholder with
  `ReconcilerError`, mutation-renderer boundary validation, and a scheduler
  placeholder, but no fiber arena, work loop, hook dispatcher, bailout path, or
  unwind path.
- `crates/fast-react-host-config/src/lib.rs` already has opaque host types,
  `HostCreation`, `HostCommit`, `HostScheduling`, `MutationHost`, and
  `MutationRenderer`, plus structured host errors.
- `crates/fast-react-test-renderer/src/lib.rs` implements an in-memory mutation
  host, but it is not a public React test-renderer root or serialization API.
- `packages/react/index.js` keeps public hooks as loud unimplemented
  placeholders.
- `crates/fast-react-napi/src/lib.rs` and `bindings/node/**` remain placeholder
  native boundaries with no JS callback/value handle bridge.

Nested-agent checks:

- Delegated dependency/report check to a read-only explorer. It confirmed
  reports 007, 070, 071, 078, 081, 099, and 100 are present; reports and source
  changes for 047, 075, 076, 107, and 112 are absent; and those dependencies
  should be labeled provisional.
- Delegated source/test surface check to a read-only explorer. It confirmed the
  reconciler is still a placeholder, public hooks and native callback storage
  are not wired, no fiber or hook queue data model exists, and first tests must
  use fake component invokers and fake handles below public DOM/test-renderer
  APIs.

Neither subagent read `ORCHESTRATOR.md`; both were read-only.

## Scope Boundaries

In scope for the first source slice:

- Internal reconciler dispatcher state.
- Function component hook cursors over fake or provisional hook storage.
- `render_with_hooks` and `render_with_hooks_again` shell behavior.
- Local render-phase update detection, retry loop, retry limit, and cleanup.
- Bailout boundary logic over fake fiber lanes, dependencies, and child lanes.
- Error/throw cleanup hooks that leave captured values opaque.
- Rust unit tests with fake component invokers, fake state/action/reducer
  handles, fake context values, and a fake host boundary.

Out of scope for this first slice:

- Suspense semantics beyond typed captured-value/wakeable placeholders.
- Context propagation beyond placeholders and changed-value bailout checks.
- DOM behavior, DOM attributes, events, hydration, portals, resources, forms,
  or public React DOM roots.
- Public `react-test-renderer` root lifecycle, `toJSON`, `toTree`, or
  `TestInstance` serialization.
- Public `packages/react` hook facade compatibility.
- Public `scheduler` or `scheduler/unstable_mock` APIs.
- Real JS callback invocation through N-API.
- Commit effects beyond bailout flag cleanup placeholders.

## First Source Slice Plan

### 1. Establish provisional fiber and hook IDs

Future files:

- `crates/fast-react-reconciler/src/fiber.rs`
- `crates/fast-react-reconciler/src/hooks/mod.rs`
- `crates/fast-react-reconciler/src/hooks/cursor.rs`
- `crates/fast-react-reconciler/src/lib.rs`

Task:

- Define the minimum internal IDs and records needed for function component
  render tests: `FiberId`, `HookId`, `HookQueueId`, `FakeValueHandle`,
  `FakeActionHandle`, `FakeReducerHandle`, and `FakeChildrenHandle`.
- Store function component fiber fields needed by this slice:
  `tag`, `alternate`, `return`, `child`, `sibling`, `pending_props`,
  `memoized_props`, `memoized_state`, `update_queue`, `dependencies`, `lanes`,
  `child_lanes`, `flags`, and `subtree_flags`.
- Use existing `Lanes` from `fast-react-core`; use local test-only flag shims
  only if worker 076 has not landed, and mark them as temporary in code.
- Keep this storage inside the reconciler until worker 107 or a merged core
  fiber module provides canonical types.

Invariants:

- Current and work-in-progress fibers are distinct records linked by
  `alternate`.
- The current fiber's committed hook list is never mutated by an aborted
  work-in-progress render.
- Hook list links are ID-based, not Rust references.
- Host values remain opaque and are not stored in hook records.

### 2. Add hook render state and cursors

Future files:

- `crates/fast-react-reconciler/src/hooks/cursor.rs`
- `crates/fast-react-reconciler/src/hooks/render.rs`
- `crates/fast-react-reconciler/src/hooks/mod.rs`

Task:

- Add `HookRenderState` with:
  - `currently_rendering_fiber`
  - `current_hook`
  - `work_in_progress_hook`
  - `first_work_in_progress_hook`
  - `render_lanes`
  - `did_schedule_render_phase_update`
  - `did_schedule_render_phase_update_this_pass`
  - `number_of_re_renders`
  - `processed_render_phase_queues`
  - placeholders for future ID and thenable counters
- Implement mount hook allocation, update hook cloning from current, and
  rerender hook reuse from the existing work-in-progress list.
- Detect deterministic hook count errors:
  - more hooks than previous render when update needs a current hook but none
    exists
  - fewer hooks than previous render when finishing leaves unconsumed current
    hooks

Invariants:

- Mount appends hooks in declaration order.
- Update clones current hooks in declaration order and preserves queue sharing.
- Rerender reuses work-in-progress hook slots created in the first pass.
- Hook count errors are returned as structured reconciler errors, not panics.

### 3. Add dispatcher modes

Future files:

- `crates/fast-react-reconciler/src/hooks/dispatcher.rs`
- `crates/fast-react-reconciler/src/hooks/state_queue.rs`
- `crates/fast-react-reconciler/src/hooks/context.rs`
- `crates/fast-react-reconciler/src/hooks/mod.rs`

Task:

- Add an internal dispatcher enum:
  - `ContextOnly`
  - `Mount`
  - `Update`
  - `Rerender`
  - optional `InvalidNestedHooks` sentinel for later DEV checks
- Implement fake dispatcher methods for this slice:
  - `use_state_fake`
  - `use_reducer_fake`
  - `use_ref_fake`
  - `use_memo_fake`
  - `use_context_fake`
  - `register_effect_fake`
- Public `packages/react` hook functions stay unchanged. The dispatcher is a
  reconciler-private state machine, not a public JS API.

Invariants:

- Hooks outside render fail with an invalid-hook structured error.
- Mount/update/rerender modes call separate cursor helpers.
- Context reads may be represented without adding a stateful hook node.
- Registering effects can set temporary flags and update-queue placeholders,
  but real effect callback invocation remains out of scope.

### 4. Implement `render_with_hooks`

Future files:

- `crates/fast-react-reconciler/src/hooks/render.rs`
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/lib.rs`

Task:

- Add a `ComponentInvoker` trait used only by internal tests at first:

```text
trait ComponentInvoker {
  fn invoke(
    &mut self,
    component: FakeComponentHandle,
    props: FakePropsHandle,
    ref_handle: Option<FakeRefHandle>,
    dispatcher: &mut HookDispatcher,
  ) -> Result<FakeChildrenHandle, CapturedRenderValue>;
}
```

- Implement `render_with_hooks(current, work_in_progress, component, props,
  render_lanes, invoker)`.
- Reset work-in-progress `memoized_state`, function component update queue
  fields, and `lanes` at the start of a render attempt.
- Choose mount dispatcher if there is no current fiber or no stateful current
  hook list; otherwise choose update dispatcher.
- Invoke the component through `ComponentInvoker`.
- If a local render-phase update was scheduled, enter `render_with_hooks_again`.
- On successful finish, switch to `ContextOnly`, clear cursors, validate hook
  counts, and return fake children.

Invariants:

- Component invocation is abstract; Rust does not call JS directly.
- Render lanes are full `Lanes` bitsets, not a single priority.
- The work-in-progress fiber owns all render-produced hook and update queue
  metadata until commit.

### 5. Implement render-phase retry loop

Future files:

- `crates/fast-react-reconciler/src/hooks/render_phase.rs`
- `crates/fast-react-reconciler/src/hooks/dispatch.rs`
- `crates/fast-react-reconciler/src/hooks/render.rs`

Task:

- Detect render-phase hook updates when dispatch targets the currently
  rendering fiber or its alternate.
- Append the update to the hook queue's pending ring or to a provisional fake
  render-phase queue if canonical worker 112 types are still absent.
- Set both render-phase flags.
- Implement `render_with_hooks_again`:
  - reset per-pass hook cursors to the start of the work-in-progress hook list
  - reset effect/event/store placeholders for the pass while preserving memo
    cache placeholders
  - use `Rerender` dispatcher
  - invoke again while this pass schedules more local updates
  - stop when stable or when `number_of_re_renders == 25`
- Return an infinite-rerender structured error at the limit.

Invariants:

- Render-phase retries never call root scheduling.
- Render-phase updates are local to the function component render attempt.
- Processed render-phase queues are tracked so unwind cleanup can remove only
  updates created during the aborted render.
- `useOptimistic` render-phase behavior stays an explicit unsupported
  placeholder until worker 099/112 types are merged.

### 6. Add context dependency placeholders for bailout correctness

Future files:

- `crates/fast-react-reconciler/src/context.rs`
- `crates/fast-react-reconciler/src/hooks/context.rs`
- `crates/fast-react-reconciler/src/bailout.rs`

Task:

- Add fake context handles and dependency records:
  - `ContextDependencyId`
  - `FakeContextHandle`
  - `FakeContextValueHandle`
  - dependency `lanes`
  - `first_context` linked list
- Implement `prepare_to_read_context`, `read_context_fake`, and
  `check_if_context_changed_fake`.
- Use deterministic fake `Object.is`-equivalent comparison in Rust tests.
- Do not implement provider propagation beyond a typed placeholder hook that
  marks consumers as needing propagation.

Invariants:

- Context reads are recorded on the fiber dependency list, not in the stateful
  hook list.
- A function component with no stateful hooks can still have context
  dependencies.
- Bailout must check context changes when props and lanes alone would skip.

### 7. Add function component begin-work and bailout boundaries

Future files:

- `crates/fast-react-reconciler/src/begin_work.rs`
- `crates/fast-react-reconciler/src/function_component.rs`
- `crates/fast-react-reconciler/src/bailout.rs`
- `crates/fast-react-reconciler/src/hooks/render.rs`

Task:

- Add an internal `begin_function_component` path that calls
  `prepare_to_read_context`, `render_with_hooks`, and then either bails out or
  records fake children for later reconciliation.
- Add `did_receive_update` state driven by:
  - props identity changes
  - scheduled update lanes
  - context dependency changes
  - capture/incomplete flags once provisional flags exist
- Implement `bailout_hooks`:
  - copy current function component update queue to work-in-progress
  - clear only dynamic hook effect flags from work-in-progress
  - preserve static flags
  - remove rendered lanes from the current fiber's lanes
- Implement `bailout_on_already_finished_work`:
  - copy current dependencies
  - mark skipped update lanes from work-in-progress lanes
  - if child lanes do not intersect `render_lanes`, return no child work
  - if child lanes intersect, clone children and continue

Invariants:

- Bailout is tree/lane/context driven, not just props equality.
- Child lanes can force descent even when the function component itself bails
  out.
- Memo and forward-ref wrappers should later call this same render-with-hooks
  path after wrapper-specific compare/ref logic.

### 8. Add error and unwind cleanup hooks

Future files:

- `crates/fast-react-reconciler/src/error.rs`
- `crates/fast-react-reconciler/src/unwind.rs`
- `crates/fast-react-reconciler/src/hooks/render.rs`
- `crates/fast-react-reconciler/src/work_loop.rs`

Task:

- Add opaque `CapturedRenderValue` variants for thrown error handles,
  wakeable handles, and fatal placeholder values.
- Implement:
  - `reset_hooks_after_throw`
  - `reset_hooks_on_unwind`
  - `clear_render_phase_updates_from_processed_queues`
- `reset_hooks_after_throw` should switch the dispatcher to `ContextOnly` and
  clear the current rendering fiber enough to prevent further hook calls from
  corrupting state.
- `reset_hooks_on_unwind` should clear render lanes, hook cursors, rerender
  flags, per-pass counters, and render-phase queue updates created during the
  failed render.
- Surface captured values to the future work-loop error path without logging,
  converting, or invoking JS callbacks.

Invariants:

- Aborted work-in-progress hook lists do not mutate current committed hook
  lists.
- Render-phase updates from a thrown render do not leak into the next render.
- Suspense-like wakeables remain typed captured placeholders, not ordinary
  errors, but Suspense boundary selection stays out of this slice.
- Error cleanup is deterministic in unit tests with fake invokers.

## Rust/JS Boundary Assumptions

- The first slice uses fake handles for components, props, children, state,
  actions, reducers, refs, effects, contexts, errors, and wakeables.
- Rust must not store raw `napi_value`, raw JS callbacks, or unrooted JS values
  in fibers, hooks, queues, effect records, or captured errors.
- Real component invocation, reducer/action evaluation, effect callbacks,
  ref callbacks, context value identity, thenable reads, and error object
  creation require a later private JS/native handle boundary in
  `crates/fast-react-napi/**`, `bindings/node/**`, and selected private
  `packages/react` internals.
- User JS must run on the owning JS environment and never from a background
  Rust scheduler callback.
- Public hook functions in `packages/react/index.js` should remain loud
  placeholders until the private dispatcher bridge can safely route through
  tested Rust semantics.

## Fake-Host Test Strategy

Tests for this slice should be Rust unit or crate integration tests in
`fast-react-reconciler`. They should stay below public DOM and test-renderer
APIs.

Suggested future test files:

- `crates/fast-react-reconciler/src/hooks/cursor.rs` unit tests
- `crates/fast-react-reconciler/src/hooks/dispatcher.rs` unit tests
- `crates/fast-react-reconciler/src/hooks/render.rs` unit tests
- `crates/fast-react-reconciler/src/bailout.rs` unit tests
- `crates/fast-react-reconciler/src/unwind.rs` unit tests
- `crates/fast-react-reconciler/tests/function_component_fake_host.rs`

Fake fixtures:

- `FakeComponentInvoker`: scripted component calls that record dispatcher mode,
  call fake hooks in controlled order, schedule local render-phase updates, or
  throw fake captured values.
- `FakeHookStorage`: deterministic hook/value/action/reducer handles with
  stale-ID checks.
- `FakeContextStore`: deterministic context value equality and changed-value
  checks.
- `FakeRenderHost`: a minimal `MutationRenderer` implementation only if a host
  trait bound is needed. It should record that no host mutation, snapshot, or
  serialization APIs were called.
- `FakeRootScheduler`: a counter/assertion fixture that proves local
  render-phase updates do not schedule root work.

Required tests:

- Mount appends hooks in call order.
- Update clones current hooks in call order.
- Rerender reuses work-in-progress hooks from the previous pass.
- More-hooks and fewer-hooks errors are deterministic.
- Hooks outside render fail in `ContextOnly` mode.
- Dispatcher chooses mount, update, and rerender helpers correctly.
- Local render-phase `setState` rerenders until stable.
- Render-phase loop stops at 25 rerenders with a structured error.
- Render-phase updates do not call root scheduling.
- Throw during component invocation switches dispatcher to `ContextOnly`.
- Unwind removes render-phase updates from processed queues.
- Aborted render does not mutate the current hook list.
- Context dependency reads append records and reset on rerender.
- Changed fake context value prevents bailout.
- No changed props, no scheduled lanes, and unchanged context bails out.
- Child lanes intersecting render lanes clone or continue child work rather
  than skipping the subtree.
- `bailout_hooks` copies update queues and clears only dynamic effect flags.
- Fake host records no DOM operation, no public React DOM root call, and no
  test-renderer serialization call.

Commands future implementation workers should run:

- `cargo fmt --all --check`
- `cargo test -p fast-react-reconciler --all-features function_component`
- `cargo test -p fast-react-reconciler --all-features hooks`
- `cargo clippy -p fast-react-reconciler --all-targets --all-features -- -D warnings`
- `git diff --check`

Public conformance oracles should wait until public JS dispatcher/root
integration exists. This slice should not add `tests/conformance/**` hook
compatibility claims.

## Completion Gates For Future Source Slice

A future implementation of this first function component rendering slice is
complete only when all gates below pass:

- No files outside the approved source worker write scope are modified.
- The implementation compiles without introducing DOM, public React DOM root,
  or public test-renderer serialization dependencies.
- Dispatcher state has explicit mount/update/rerender/context-only modes.
- Hook cursor tests prove mount, update, rerender, and hook-count errors.
- `render_with_hooks` resets WIP state, invokes through a fake invoker, and
  finishes by clearing dispatcher/cursor state.
- Render-phase retry loop is local, capped at 25, and never schedules root
  work.
- Bailout tests cover props/lanes/context/child-lane boundaries.
- Error and unwind tests prove dispatcher cleanup and render-phase queue
  cleanup.
- Fake-host tests assert that no DOM behavior or public test-renderer API is
  used.
- Provisional dependencies are either replaced by merged canonical types or
  isolated behind temporary adapters with explicit follow-up removal gates.
- `cargo fmt`, targeted `cargo test`, targeted `cargo clippy`, and
  `git diff --check` all pass.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan follows React 19.2.6's root invariants from merged reports:
  lane-filtered work, double-buffered fibers, per-fiber hooks, local
  render-phase retries, tree-driven bailouts, and unwind cleanup.
- It avoids symptom patches such as directly mutating host trees or treating
  setState during render as a normal root update.

Maintainability:

- Keep React-like names for render lanes, hook cursors, dispatcher modes,
  render-phase updates, bailout hooks, and unwind hooks so future comparisons
  to React source stay mechanical.
- Keep provisional adapters small and delete them when workers 047, 075, 076,
  107, or 112 land canonical types.
- Keep public facade work out of the first Rust slice so hook semantics can be
  tested without JS object descriptor or N-API lifetime noise.

Performance:

- Use `Lanes` bitsets and arena IDs on hot paths.
- Avoid hash maps in hook cursor and render retry loops.
- Reuse fake/test staging buffers in unit tests to match the intended arena
  shape.

Security:

- Do not store raw JS values or callbacks in Rust records.
- Validate stale or wrong-owner IDs in fake handles now so real handles fail
  closed later.
- Keep captured errors and wakeables opaque to avoid leaking local paths,
  arena internals, or renderer-private IDs through public errors.

## Risks Or Blockers

- Canonical root lane bookkeeping from worker 047 is absent; render and bailout
  tests can use explicit `Lanes`, but root lane selection must remain
  provisional.
- Canonical event priority from worker 075 is absent; first slice should not
  claim event-priority or public Scheduler behavior.
- Canonical fiber/hook effect flags from worker 076 are absent; dynamic/static
  effect flag bailout tests need temporary shims or must wait for merged flags.
- Worker 107's implementation plan for core fiber topology is absent; the first
  source slice should avoid freezing a public core fiber layout until topology
  is merged.
- Worker 112's implementation plan for core hook queues is absent; use worker
  099 as the merged semantic anchor and isolate any temporary queue fixtures.
- Real JS callback/value rooting is not implemented; public hook facade work is
  blocked until that boundary exists.
- Context propagation, Suspense, Offscreen, passive effects, and commit
  ordering interact with function components but are intentionally below the
  first slice. Placeholders must fail closed.

## Recommended Next Tasks

1. Merge or replace provisional workers 047, 075, 076, 107, and 112 where
   their outputs exist in other worktrees.
2. Implement minimal fiber topology and hook queue primitives, consuming worker
   099 and worker 100 invariants.
3. Implement `hooks/cursor.rs`, `hooks/dispatcher.rs`, and `hooks/render.rs`
   with fake handles and fake component invokers.
4. Add `bailout.rs`, `context.rs`, and `unwind.rs` placeholders sufficient to
   test bailout and cleanup boundaries.
5. Add fake-host/fake-scheduler Rust tests that prove no public DOM or
   test-renderer behavior is involved.
6. Only after the internal Rust state machine is green, plan the private
   JS/native dispatcher bridge and public hook facade routing.

## Completion Audit

Concrete success criteria from the prompt:

- Produce a report-only implementation plan.
- Modify only
  `worker-progress/worker-113-function-component-implementation-plan.md`.
- Cover dispatcher state, hook cursors, render-phase retry loops, bailout
  boundaries, error cleanup, and fake-host tests below DOM/test-renderer public
  APIs.
- Anchor in workers 007, 070, 071, 078, 081, 099, 100, plus 107/112 only if
  present.
- Treat workers 047, 075, 076, 107, and 112 as provisional unless visible in
  this worktree.
- Keep the slice below Suspense, context propagation beyond placeholders, DOM
  behavior, public React DOM roots, and test-renderer serialization.
- Specify future source files, Rust/JS boundary assumptions, tests,
  invariants, risks, and completion gates.
- Summarize delegated hypothesis checks.
- Include handoff sections and quality/maintainability/performance/security
  review.

Prompt-to-artifact checklist:

- Report-only artifact: this file is the only changed file reported by
  `git status --short`; no source code was modified.
- Dispatcher state: covered in `Add dispatcher modes`,
  `render_with_hooks`, and fake-host test requirements.
- Hook cursors: covered in `Add hook render state and cursors` and completion
  gates.
- Render-phase retry loops: covered in `Implement render-phase retry loop`,
  required tests, and completion gates.
- Bailout boundaries: covered in context placeholders, function component
  begin-work/bailout boundaries, required tests, risks, and completion gates.
- Error cleanup: covered in `Add error and unwind cleanup hooks`, required
  tests, and security review.
- Fake-host tests below public APIs: covered in `Fake-Host Test Strategy`, out
  of scope boundaries, and completion gates.
- Worker anchors: merged workers 007, 070, 071, 078, 081, 099, and 100 are
  cited in `Evidence Gathered`; workers 107 and 112 are explicitly absent.
- Provisional dependency labels: workers 047, 075, 076, 107, and 112 are listed
  as provisional in evidence and risks.
- Scope exclusions: Suspense, context propagation beyond placeholders, DOM,
  public React DOM roots, public test-renderer lifecycle/serialization, public
  scheduler, and public hook facade compatibility are listed out of scope.
- Future source files: exact future Rust files are listed in each source slice
  and test file suggestions.
- Rust/JS boundary assumptions: covered in its own section.
- Invariants: listed under each implementation sub-slice.
- Risks and follow-ups: covered in `Risks Or Blockers` and
  `Recommended Next Tasks`.
- Delegated checks: summarized in `Nested-agent checks`, including read-only
  status and conclusions.
- Quality/security review: covered in `Quality, Maintainability, Performance,
  And Security Review`.
- Verification commands: file inspection, status, keyword coverage,
  whitespace check, and `git diff --check` were run after drafting. Because the
  report is untracked, `git diff --check` has no tracked diff to inspect;
  trailing whitespace was checked separately with `rg -n "[ \t]+$"` and
  returned no matches.

No source tests were run because this task is report-only and changed no Rust
or JavaScript source.

## Commands Run

```bash
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
git status --short
rg --files worker-progress | sort
rg --files crates packages tests bindings | sort
wc -l worker-progress/worker-007-scheduler-fiber.md worker-progress/worker-070-core-update-queue-plan.md worker-progress/worker-071-core-fiber-flags-effect-plan.md worker-progress/worker-078-hook-effect-ring-plan.md worker-progress/worker-081-reconciler-root-scheduler-act-plan.md worker-progress/worker-099-core-hook-state-queue-plan.md worker-progress/worker-100-reconciler-function-component-render-plan.md
sed -n '1,220p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,260p' crates/fast-react-core/src/lib.rs
sed -n '1,260p' crates/fast-react-test-renderer/src/lib.rs
rg -n "Fiber|Hook|UpdateQueue|Dispatcher|renderWithHooks|render-phase|bailout|lane|Lanes|useState|useReducer|function component|FunctionComponent" crates packages tests worker-progress/worker-007-scheduler-fiber.md worker-progress/worker-070-core-update-queue-plan.md worker-progress/worker-071-core-fiber-flags-effect-plan.md worker-progress/worker-078-hook-effect-ring-plan.md worker-progress/worker-081-reconciler-root-scheduler-act-plan.md worker-progress/worker-099-core-hook-state-queue-plan.md worker-progress/worker-100-reconciler-function-component-render-plan.md
sed -n '1,260p' crates/fast-react-core/src/lane.rs
sed -n '1,260p' crates/fast-react-host-config/src/lib.rs
rg -n "^#|^##|^###" worker-progress/worker-007-scheduler-fiber.md worker-progress/worker-070-core-update-queue-plan.md worker-progress/worker-071-core-fiber-flags-effect-plan.md worker-progress/worker-078-hook-effect-ring-plan.md worker-progress/worker-081-reconciler-root-scheduler-act-plan.md worker-progress/worker-099-core-hook-state-queue-plan.md worker-progress/worker-100-reconciler-function-component-render-plan.md
rg -n "Provisional|provisional|Worker 047|worker 047|worker-047|Worker 075|worker-075|Worker 076|worker-076|Worker 107|worker-107|Worker 112|worker-112|Dependency|Dependencies|Future files|tests|Invariants|Risks|Completion|Recommended" worker-progress/worker-070-core-update-queue-plan.md worker-progress/worker-071-core-fiber-flags-effect-plan.md worker-progress/worker-078-hook-effect-ring-plan.md worker-progress/worker-081-reconciler-root-scheduler-act-plan.md worker-progress/worker-099-core-hook-state-queue-plan.md worker-progress/worker-100-reconciler-function-component-render-plan.md
rg -n "pub trait|pub struct|pub enum|type |impl .* for TestRenderer|fn .*\\(" crates/fast-react-host-config/src/lib.rs crates/fast-react-test-renderer/src/lib.rs crates/fast-react-reconciler/src/lib.rs crates/fast-react-core/src/*.rs
sed -n '13,650p' worker-progress/worker-100-reconciler-function-component-render-plan.md
sed -n '22,716p' worker-progress/worker-099-core-hook-state-queue-plan.md
sed -n '9,260p' worker-progress/worker-078-hook-effect-ring-plan.md
sed -n '13,620p' worker-progress/worker-070-core-update-queue-plan.md
sed -n '12,590p' worker-progress/worker-071-core-fiber-flags-effect-plan.md
sed -n '12,560p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '77,265p' worker-progress/worker-007-scheduler-fiber.md
sed -n '1,260p' packages/react/index.js
sed -n '1,260p' packages/react/placeholder-utils.js
test -e worker-progress/worker-047-core-root-lane-bookkeeping.md; printf 'worker047_report=%s\n' $?
test -e worker-progress/worker-075-core-event-priority.md; printf 'worker075_report=%s\n' $?
test -e worker-progress/worker-076-core-fiber-flags.md; printf 'worker076_report=%s\n' $?
test -e worker-progress/worker-107-core-fiber-topology-implementation-plan.md; printf 'worker107_report=%s\n' $?
test -e worker-progress/worker-112-core-hook-queue-implementation-plan.md; printf 'worker112_report=%s\n' $?
test -e crates/fast-react-core/src/root_lanes.rs; printf 'root_lanes_rs=%s\n' $?
test -e crates/fast-react-core/src/event_priority.rs; printf 'event_priority_rs=%s\n' $?
test -e crates/fast-react-core/src/fiber_flags.rs; printf 'fiber_flags_rs=%s\n' $?
test -e crates/fast-react-core/src/hook_effect_flags.rs; printf 'hook_effect_flags_rs=%s\n' $?
test -e crates/fast-react-core/src/fiber.rs; printf 'core_fiber_rs=%s\n' $?
test -e crates/fast-react-core/src/hook_state_queue.rs; printf 'hook_state_queue_rs=%s\n' $?
sed -n '1,260p' worker-progress/worker-113-function-component-implementation-plan.md
sed -n '261,620p' worker-progress/worker-113-function-component-implementation-plan.md
sed -n '621,900p' worker-progress/worker-113-function-component-implementation-plan.md
git diff --name-only
git diff --check
rg -n "dispatcher|hook cursors|render-phase|bailout|error|fake-host|DOM|test-renderer|worker 047|worker 075|worker 076|Worker 107|Worker 112|Rust/JS|Completion Gates|Nested-agent|Changed Files|Commands Run|Risks Or Blockers|Recommended Next Tasks" worker-progress/worker-113-function-component-implementation-plan.md
rg -n "[ \t]+$" worker-progress/worker-113-function-component-implementation-plan.md
wc -l worker-progress/worker-113-function-component-implementation-plan.md
```

Subagent commands are summarized in the nested-agent findings above.

## Changed Files

- `worker-progress/worker-113-function-component-implementation-plan.md`

No source code was modified.
