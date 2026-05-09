# worker-094-root-unmount-flushsync-plan

## Summary

The hypothesis is directionally correct and should be implemented as a root scheduler boundary, not as a React DOM facade shortcut.

For React DOM 19.2.6 compatibility, `root.unmount()` must treat the public `ReactDOMRoot` object as a handle over a reconciler `FiberRoot`. The public handle should become unusable before any unmount work can re-enter user code: read the internal root, set `this._internalRoot = null`, read `root.containerInfo`, enqueue a `SyncLane` HostRoot update with `element: null` through `updateContainerSync(null, root, null, null)`, call reconciler `flushSyncWork()` so sync work across all scheduled roots is flushed when outside render/commit, then unmark the DOM container only after that flush completes. A second `root.unmount()` call should be idempotent and return `undefined`.

The root cause is ordering and ownership. Clearing `_internalRoot` late permits reentrant code to call `root.render()` or `root.unmount()` against a root that React would already consider unmounted. Unmarking the container before the sync null update commits creates the opposite bug: duplicate-root checks and DOM event target lookup no longer match the still-mounted tree. A per-root flush or direct DOM removal would hide the symptom in small tests while bypassing transition lanes, passive effects, error callbacks, cross-root sync work, and reentrancy warnings.

No source code was changed. This report is the only intended changed file.

## Changed Files

- `worker-progress/worker-094-root-unmount-flushsync-plan.md`

## Goal Tool Status

- `create_goal` was available and called before research/file reads in this relaunch.
- `get_goal` was available immediately after setup. It reported objective `Produce a report-only plan for root.unmount and flushSync integration.`, status `active`.

## Hypothesis Verdict

- Confirmed by local planning evidence: worker 044 records the exact sequence for `root.unmount`: callback-argument warning, idempotent no-op when `_internalRoot` is `null`, clear `_internalRoot` before scheduling, read `containerInfo`, warn if already rendering/committing, call `updateContainerSync(null, root, null, null)`, call `flushSyncWork()`, then `unmarkContainerAsRoot(container)`.
- Confirmed by architectural evidence: worker 055 repeats that client roots must enqueue HostRoot updates and that `root.unmount` clears the public handle, enqueues a sync null update, flushes sync work across roots, and only then unmarks the container.
- Confirmed as an implementation prerequisite, not current behavior: local `packages/react-dom/client.js`, `packages/react-dom/index.js`, and `packages/react-dom/profiling.js` still expose loud placeholders for `createRoot`, `hydrateRoot`, and `flushSync`.
- Not fully covered by existing checked oracles: worker 058 covers rootless public `flushSync`/`unstable_batchedUpdates` shape, callback behavior, errors, nesting, and public Scheduler priority observations, but intentionally does not cover DOM root commit timing or cross-root flushing. Worker 066 indirectly proves React DOM unmount participates in synchronous commit/ref detach behavior under `flushSync`, but it is not a root-unmount ordering oracle.

## Evidence Gathered

Required local files read:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `docs/tasks/worker-094-root-unmount-flushsync-plan.prompt.md`
- `worker-progress/worker-044-react-dom-client-roots-plan.md`
- `worker-progress/worker-055-react-dom-client-roots-implementation-plan.md`
- `worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md`

Additional relevant local files read:

- `docs/tasks/worker-081-reconciler-root-scheduler-act-plan.prompt.md`
- `docs/tasks/worker-092-react-dom-create-root-facade-plan.prompt.md`
- `docs/tasks/worker-093-root-render-integration-plan.prompt.md`
- `worker-progress/worker-041-dom-events-priority-plan.md`
- `worker-progress/worker-066-dom-ref-callback-oracle.md`
- `worker-progress/worker-072-reconciler-root-work-loop-plan.md`
- `packages/react-dom/client.js`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- `packages/react-dom/placeholder-utils.js`
- `crates/fast-react-core/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `tests/conformance/src/react-dom-flush-sync-batching-scenarios.mjs`
- `tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-flush-sync-batching-oracle.json`
- `tests/conformance/src/dom-ref-callback-scenarios.mjs`
- `tests/conformance/src/dom-ref-callback-probe-runner.mjs`
- `tests/conformance/src/dom-ref-callback-oracle-generator.mjs`
- `tests/conformance/oracles/react-19.2.6-dom-ref-callback-oracle.json`

Reports absent in this worktree:

- `worker-progress/worker-081-reconciler-root-scheduler-act-plan.md`
- `worker-progress/worker-088-dom-container-root-markers-oracle.md`
- `worker-progress/worker-089-dom-root-listener-installation-oracle.md`
- `worker-progress/worker-092-react-dom-create-root-facade-plan.md`
- `worker-progress/worker-093-root-render-integration-plan.md`

I did not inspect orchestration-only instructions.

## Delegated Checks

Two read-only nested agents were used in this relaunch to test the two main hypotheses. Each was instructed to call `create_goal` for its subtask before file reads if available, avoid `ORCHESTRATOR.md`, and not modify files:

- Root-unmount subagent: confirmed worker 044 gives the exact order of callback warning, idempotent no-op, `_internalRoot` clearing, `containerInfo` read, render/commit reentrancy warning, `updateContainerSync(null, root, null, null)`, `flushSyncWork()`, and post-flush `unmarkContainerAsRoot(container)`. It also confirmed worker 055 repeats the architectural contract and current React DOM package files are placeholders. It found no contradiction and recommended tests for idempotence, render-after-unmount, reentrant cleanup observation, marker ordering, cross-root flushing, and reentrancy warnings.
- `flushSync` subagent: confirmed worker 055 gates `flushSync` on root scheduler support for current-priority overrides, cross-root sync flushing, and render/commit reentrancy guards. It confirmed worker 058's oracle covers public callback shape, falsy callback behavior, nonfunction `TypeError`, callback throw propagation, nested calls, root/profiling export shape, and react-server behavior. It also emphasized that the existing oracle does not prove private transition clearing, DOM update-priority save/restore, or DOM root commit timing. It locally ran `node --test tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs` and reported all 12 tests passing.

The subagent results found no contradiction in the direct source/report evidence. I used them as hypothesis checks, not as sole evidence for any conclusion.

## Prerequisites

Implement these prerequisites before claiming `root.unmount` or `flushSync` compatibility:

1. Core root lane bookkeeping on top of `Lane`, `Lanes`, and `LaneMap<T>`:
   `pending_lanes`, suspended/pinged/warm/expired lanes, entanglement maps, transition/retry claiming, `get_next_lanes`, `get_next_lanes_to_flush_sync`, and sync-lane upgrade helpers.
2. Reconciler `FiberRoot` and HostRoot fiber records:
   root lifecycle state, `containerInfo`, `current`, callback node/priority state, root options/error callbacks, HostRoot memoized state, and update queue initialization.
3. HostRoot update queue APIs:
   `create_update(SyncLane)`, payload `{element: null}`, circular pending/base queue rebasing, callback validation/storage, skipped-lane preservation, and transition entanglement hooks.
4. Root scheduler and work loop:
   scheduled-root linked list, microtask scheduling, Scheduler callback reuse/cancellation, passive-effect preflush hooks, cross-root `flush_sync_work`, render/commit phase guards, and act queue routing when that worker lands.
5. Commit skeleton and DOM mutation host:
   deletion traversal, ref detach/cleanup, layout/passive phase ordering, `root.current` switch after mutation and before layout, and host operations for clearing/removing children.
6. DOM container/root marker layer:
   valid container checks, duplicate root diagnostics, `markContainerAsRoot`, `unmarkContainerAsRoot`, `isContainerMarkedAsRoot`, and node-to-root lookup using DOM-owned metadata or token maps.
7. `createRoot` facade/root object:
   option parsing, root object own/prototype shape, event listener installation, public warnings/errors, profiling entrypoint alignment, and hydration kept separate.
8. React DOM internals dispatcher installation:
   `flushSync` must save/restore current transition and DOM update priority, set discrete priority during the callback, then call the reconciler dispatcher hook that delegates to cross-root `flush_sync_work`.

## Implementation Plan

### Public `root.unmount`

Target files for a future implementation worker:

- `packages/react-dom/src/client/root-object.js`
- `packages/react-dom/client.js`
- supporting private binding modules that call reconciler `update_container_sync` and `flush_sync_work`

Required sequence:

1. Warn in development when `root.unmount` receives a function callback argument.
2. Read `const root = this._internalRoot`.
3. If `root === null`, return `undefined`.
4. Set `this._internalRoot = null` before any scheduler or user-code path can run.
5. Read `const container = root.containerInfo`.
6. In development, ask the reconciler whether it is already rendering or committing and warn with React-compatible wording.
7. Call `updateContainerSync(null, root, null, null)` through the reconciler bridge.
8. Call `flushSyncWork()` through the reconciler/root-scheduler dispatcher. This must flush all roots with sync work when not already inside render/commit.
9. Call `unmarkContainerAsRoot(container)` after the flush returns.
10. Return `undefined`.

Do not call DOM mutation helpers directly from the public root object. DOM teardown must happen as the commit result of the HostRoot null update.

### Public `flushSync`

Target files for a future implementation worker:

- `packages/react-dom/src/shared/flush-sync.js`
- `packages/react-dom/index.js`
- `packages/react-dom/profiling.js`
- a private React DOM internals dispatcher bridge into the reconciler

Required sequence:

1. Save `ReactSharedInternals.T` and the DOM current update priority.
2. Set the current transition to `null`.
3. Set DOM current update priority to discrete event priority.
4. If the callback is not provided or is falsy, return `undefined` after still taking the same restoration/flush path React observes.
5. If the callback is truthy but not callable, throw the same `TypeError` shape already captured by worker 058.
6. Run the callback with `this === undefined`, no callback arguments, and ignored extra `flushSync` arguments.
7. Restore transition and DOM update priority in `finally`, including callback throw cases.
8. Call the installed dispatcher flush hook so `flushSync` drains pending sync work across roots.
9. In development, warn if the dispatcher reports the flush was attempted during render/commit.
10. Return the callback value or rethrow the callback error after state restoration.

`unstable_batchedUpdates` should remain a separate batching boundary. Worker 058 shows its callback argument forwarding and public Scheduler observations differ from `flushSync`.

## Focused Tests

### Reconciler Unit Tests

- `update_container_sync(null, root, null, null)` creates a HostRoot update at `SyncLane` with payload `{element: null}`.
- Calling `flush_sync_work` with two scheduled roots flushes sync work for both roots, not only the root that triggered unmount.
- `flush_sync_work` returns or exposes "already rendering" when called during render/commit and does not re-enter the work loop.
- Sync work scheduled during the root-schedule microtask is drained at the correct point, while non-sync lanes retain Scheduler callbacks.
- Passive unmounts run before passive mounts in deferred passive flushing after a root unmount commit.
- Errors thrown by ref cleanup/layout/passive cleanup during unmount reach the root error callback path without reviving the public root handle.

### DOM/Facade Conformance Tests

- `root.unmount()` returns `undefined`.
- Calling `root.unmount()` twice returns `undefined` twice, emits no extra DOM mutation on the second call, and does not throw.
- `root.render(...)` after unmount throws `Cannot update an unmounted root.`
- A function argument to `root.unmount(fn)` warns in development and is ignored.
- `_internalRoot` is `null` before the sync null update can trigger any user code. Use a ref cleanup, layout cleanup, or error callback to attempt `root.render()` and assert it sees the unmounted-root error.
- The container remains marked as a root during the sync null update/commit, then is unmarked after `flushSyncWork()` returns.
- If unmount cleanup re-enters `createRoot(container)` before unmarking, duplicate-root behavior matches React rather than allowing a second root too early.
- Cross-root case: schedule pending sync work on root B, call `rootA.unmount()`, and assert both root A's unmount and root B's sync update commit before `rootA.unmount()` returns.
- Reentrancy case: call `root.unmount()` during render or commit and assert the development warning wording and non-reentrant behavior match React.
- Profiling entrypoint exposes the same `flushSync` behavior as the root `react-dom` entrypoint once profiling roots are wired.

### `flushSync` Conformance Tests

Reuse and extend worker 058:

- Preserve export descriptor and callable shape: `flushSync.length === 1`, enumerable/writable/configurable data export, root and profiling entrypoints.
- Preserve callback return forwarding, no callback args, ignored extra args, falsy callback `undefined` behavior, truthy non-function `TypeError`, callback throw propagation, and restoration after throw.
- Verify current transition is cleared inside `flushSync` and restored afterward.
- Verify DOM current update priority is discrete inside `flushSync` and restored afterward, using an internal test hook or a behavior probe that schedules a root update and observes lane selection.
- Verify `flushSync` drains pending sync work across roots after the callback, including sync work scheduled before the callback.
- Verify nested `flushSync` order and restoration, plus `flushSync` inside `unstable_batchedUpdates` and the reverse.
- Verify development reentrancy warnings when `flushSync` is invoked during render or commit.
- Verify `react-server` condition remains narrowed: root `react-dom` lacks `flushSync`, and `react-dom/profiling` throws the RSC unsupported error.

## Pitfalls

- Clearing `_internalRoot` after `updateContainerSync` is wrong. User code can run during the unmount commit and would observe a still-mounted public root.
- Unmarking the container before `flushSyncWork` is wrong. The DOM still has a mounted root until the sync null update commits.
- Per-root sync flushing is wrong. React's `flushSyncWork` is cross-root and is shared by public `flushSync` and root unmount.
- Implementing `flushSync` as "just call the callback" is wrong. It must alter DOM update priority, clear transition state, restore both under throw, and invoke the renderer dispatcher flush hook.
- Using public Scheduler priority as React event/update priority is wrong. Worker 041 and the event-priority oracle show React DOM update priority is lane-backed and separate from public Scheduler numeric priorities.
- Treating existing rootless `flushSync` oracle coverage as root commit evidence is wrong. Worker 058 intentionally avoids DOM root commit timing.
- Hydration must not be pulled into this slice. `ReactDOMHydrationRoot` shares `unmount`, but hydration root creation, replay, and `unstable_scheduleHydration` belong to worker 095 or equivalent hydration work.
- Profiling entrypoint alignment should not be faked by re-exporting placeholders after normal root behavior exists; it should share the same root scheduler-backed implementation.

## Risks Or Blockers

- No merged `worker-progress/worker-081-reconciler-root-scheduler-act-plan.md` exists in this worktree, so the act queue portion of root scheduling is an explicit missing dependency.
- No merged `worker-progress/worker-092-react-dom-create-root-facade-plan.md` exists in this worktree, so this report cannot depend on a finalized facade/root-object write scope beyond worker 044/055.
- No checked React DOM client-root public behavior oracle is present locally. Worker 046 is listed as running, and worker 044 already recommended such an oracle for root object shape, second-argument warnings, and render/unmount after unmount.
- Current local React DOM files are placeholders; any implementation claim must wait for real reconciler roots, DOM mutation, root markers, and dispatcher installation.
- Existing worker 066 ref-callback oracle uses `flushSync` and `root.unmount` to force deterministic behavior, but it does not isolate the public `_internalRoot` or marker ordering question.

## Recommended Next Tasks

1. Add or consume a checked React DOM client-root oracle that includes root object shape, `root.unmount` arguments, idempotence, render-after-unmount, duplicate-root marker behavior, and reentrancy warning text.
2. Finish root scheduler planning/implementation for cross-root `flush_sync_work`, reentrancy guards, passive preflush hooks, Scheduler callback reuse/cancellation, and act queue routing.
3. Add a DOM container marker oracle or implementation slice before root unmount lands; marker order is part of this contract.
4. Implement `flushSync` only after the dispatcher can call reconciler `flush_sync_work` and the DOM update-priority bridge can save/restore discrete priority.
5. Add a dedicated `react-dom-unmount-flush-sync` conformance suite comparing pinned React DOM and Fast React under the same DOM shim once `createRoot`, root markers, minimal DOM mutation, and scheduler roots exist.

## Commands Run

```sh
pwd && rg --files -g '!ORCHESTRATOR.md' | sed -n '1,160p'
rg -n "root\\.unmount|unmount\\(\\)|_internalRoot|unmarkContainerAsRoot|markContainerAsRoot|updateContainerSync|flushSyncWork|flushSync" -g '!ORCHESTRATOR.md'
find . -maxdepth 3 -type d -name 'worker-progress' -o -name 'oracle*' -o -name 'fixtures' -o -name 'packages'
sed -n '1,220p' docs/tasks/worker-094-root-unmount-flushsync-plan.prompt.md
sed -n '1,220p' packages/react-dom/client.js
sed -n '1,260p' packages/react-dom/index.js
sed -n '1,240p' worker-progress/worker-092-react-dom-create-root-facade-plan.md
sed -n '1,260p' worker-progress/worker-088-dom-container-root-markers-oracle.md
rg --files worker-progress
sed -n '1,220p' WORKER_BRIEF.md
sed -n '250,285p' MASTER_PLAN.md
sed -n '150,165p' MASTER_PROGRESS.md
sed -n '1,180p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '180,340p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,220p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,220p' worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md
sed -n '1,180p' docs/tasks/worker-081-reconciler-root-scheduler-act-plan.prompt.md
sed -n '1,220p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,220p' crates/fast-react-core/src/lib.rs
rg --files crates packages/react-dom tests/conformance/src tests/conformance/test tests/conformance/oracles | rg "(lane|root|flush-sync|container|marker|scheduler|act|unmount)"
sed -n '1,220p' packages/react-dom/profiling.js
sed -n '1,280p' tests/conformance/src/react-dom-flush-sync-batching-scenarios.mjs
sed -n '1,260p' tests/conformance/src/react-dom-flush-sync-batching-oracle.mjs
sed -n '1,260p' tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs
rg -n "unmount|flushSync|cross-root|root|_internalRoot|reentr|already rendering|Cannot update an unmounted|callback argument" tests/conformance/oracles worker-progress tests/conformance/src -g '!ORCHESTRATOR.md'
ls -d node_modules/react-dom node_modules/react node_modules/scheduler 2>/dev/null
rg -n "react-dom.*19\\.2\\.6|node_modules/react-dom|integrity|scheduler.*0\\.27\\.0" package-lock.json package.json tests/conformance/src/react-dom-flush-sync-batching-oracle-generator.mjs
sed -n '150,210p' tests/conformance/src/react-dom-flush-sync-batching-oracle-generator.mjs
sed -n '1,220p' tests/conformance/src/dom-ref-callback-oracle-generator.mjs
sed -n '1,260p' tests/conformance/src/dom-ref-callback-scenarios.mjs
rg -n "root\\.unmount|flushSync|unmount|cleanup|detach" tests/conformance/src/dom-ref-callback-probe-runner.mjs tests/conformance/src/dom-ref-callback-scenarios.mjs tests/conformance/oracles/react-19.2.6-dom-ref-callback-oracle.json
sed -n '1,180p' worker-progress/worker-066-dom-ref-callback-oracle.md
sed -n '1,220p' tests/conformance/src/dom-ref-callback-probe-runner.mjs
sed -n '220,360p' tests/conformance/src/dom-ref-callback-probe-runner.mjs
sed -n '340,440p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '440,540p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,140p' worker-progress/worker-041-dom-events-priority-plan.md
sed -n '1,260p' worker-progress/worker-072-reconciler-root-work-loop-plan.md
test -e worker-progress/worker-094-root-unmount-flushsync-plan.md && sed -n '1,220p' worker-progress/worker-094-root-unmount-flushsync-plan.md
git status --short
sed -n '1,220p' docs/tasks/worker-092-react-dom-create-root-facade-plan.prompt.md
sed -n '1,220p' docs/tasks/worker-093-root-render-integration-plan.prompt.md
command -v codex
codex --help
codex exec --help
codex exec --ephemeral --cd . --sandbox read-only "Read only relevant local files in this worktree. Do not read ORCHESTRATOR.md. Do not write files. Test this hypothesis: React DOM 19.2.6 root.unmount clears public _internalRoot before enqueueing a sync null HostRoot update, then flushes sync work, then unmarks the DOM container, with idempotence and reentrancy warnings matching React. Return concise bullets with file evidence and any gaps."
codex exec --ephemeral --cd . --sandbox read-only "Read only relevant local files in this worktree. Do not read ORCHESTRATOR.md. Do not write files. Test the flushSync half of worker-094: identify evidence and gaps for flushSync priority override, cross-root sync flushing, reentrancy warnings, and focused tests. Use worker-progress reports and checked conformance oracles only. Return concise bullets."
git status --short
sed -n '1,260p' worker-progress/worker-094-root-unmount-flushsync-plan.md
sed -n '260,560p' worker-progress/worker-094-root-unmount-flushsync-plan.md
```

Some exploratory reads intentionally failed because expected in-progress worker reports are absent from this worktree:

```sh
sed: worker-progress/worker-092-react-dom-create-root-facade-plan.md: No such file or directory
sed: worker-progress/worker-088-dom-container-root-markers-oracle.md: No such file or directory
```

Earlier exploratory `codex exec` subagent attempts exited with usage-limit errors before final responses; their visible read-only evidence output was useful for cross-checking, but it is not treated as the sole source for any conclusion. The later nested-agent checks recorded above completed successfully.

Continuation commands on 2026-05-10:

```sh
sed -n '1,260p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '1,260p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
sed -n '1,260p' worker-progress/worker-058-react-dom-flush-sync-batching-oracle.md
sed -n '1,260p' worker-progress/worker-081-reconciler-root-scheduler-act-plan.md
sed -n '1,260p' worker-progress/worker-092-react-dom-create-root-facade-plan.md
git status --short
sed -n '1,260p' worker-progress/worker-094-root-unmount-flushsync-plan.md
sed -n '260,620p' worker-progress/worker-094-root-unmount-flushsync-plan.md
sed -n '260,620p' worker-progress/worker-044-react-dom-client-roots-plan.md
sed -n '260,620p' worker-progress/worker-055-react-dom-client-roots-implementation-plan.md
rg --files packages/react-dom tests/conformance crates/fast-react-core/src crates/fast-react-reconciler/src crates/fast-react-host-config/src
sed -n '1,240p' packages/react-dom/client.js
sed -n '1,280p' packages/react-dom/index.js
sed -n '1,240p' packages/react-dom/profiling.js
sed -n '1,260p' tests/conformance/src/react-dom-flush-sync-batching-scenarios.mjs
sed -n '1,220p' tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs
sed -n '1,240p' crates/fast-react-reconciler/src/lib.rs
sed -n '1,220p' crates/fast-react-core/src/lib.rs
node --test tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs
git diff --check -- worker-progress/worker-094-root-unmount-flushsync-plan.md
git status --short
```

## Verification

Report-only verification run after writing this file:

- Scoped local/temp path leak check over this report: no matches.
- Scoped trailing-whitespace/conflict-marker check over this report: no matches.
- `git status --short`: only `?? worker-progress/worker-094-root-unmount-flushsync-plan.md`.

Continuation verification on 2026-05-10:

- Re-read the required worker context files: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, worker 044, worker 055, worker 058, and this report.
- Confirmed optional prerequisite reports `worker-progress/worker-081-reconciler-root-scheduler-act-plan.md` and `worker-progress/worker-092-react-dom-create-root-facade-plan.md` are absent in this worktree.
- Re-ran scoped report checks: local/temp path leak check, trailing-whitespace check, conflict-marker check, and `git diff --check -- worker-progress/worker-094-root-unmount-flushsync-plan.md`; all passed.
- Re-ran `node --test tests/conformance/test/react-dom-flush-sync-batching-oracle.test.mjs`; all 12 tests passed.
- Re-ran `git status --short`; the only reported change remains `?? worker-progress/worker-094-root-unmount-flushsync-plan.md`.
- Final post-audit checks after the report update also passed: local/temp path leak check found no matches, trailing-whitespace/conflict-marker check found no matches, `git diff --check -- worker-progress/worker-094-root-unmount-flushsync-plan.md` returned clean, and `git status --short` still shows only this report.

## Completion Audit

Objective restated: produce a report-only plan, in `worker-progress/worker-094-root-unmount-flushsync-plan.md`, for integrating `root.unmount` and `flushSync`; do not modify source code; include prerequisites, tests, risks, evidence, and standard report checks.

Prompt-to-artifact checklist:

- Write scope: satisfied. `git status --short` shows only this untracked report.
- Required setup: satisfied. `create_goal` and `get_goal` were available; active goal objective/status are recorded above.
- Required context reads: satisfied. Re-read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, worker 044, worker 055, and worker 058. Worker 081 and worker 092 reports are absent and recorded as blockers/gaps.
- Do not read `ORCHESTRATOR.md`: satisfied. No command or delegated task read it.
- Use subagents to test hypotheses: satisfied. Two read-only nested agents checked root-unmount ordering and `flushSync` priority/flush behavior.
- Report-only scope: satisfied. No source file was modified; package and crate files were read only.
- `_internalRoot` clearing: covered in Summary, Hypothesis Verdict, Public `root.unmount`, Focused Tests, and Pitfalls.
- Sync null update enqueue: covered through `updateContainerSync(null, root, null, null)`, `SyncLane`, and `{element: null}` prerequisite/test language.
- Cross-root sync flush: covered as a prerequisite, implementation requirement, focused reconciler/DOM tests, and pitfall against per-root flushing.
- Marker unmarking: covered as post-flush `unmarkContainerAsRoot(container)`, DOM marker prerequisite, marker-order tests, and pitfall against early unmarking.
- Idempotence/error behavior: covered for second unmount no-op, `render` after unmount throw, callback-argument warnings, cleanup errors, `flushSync` falsy/nonfunction/throw behavior, and post-throw restoration.
- `flushSync` priority override: covered by save/restore transition and DOM current update priority, discrete priority override, dispatcher flush hook, and tests for lane selection/restoration.
- Reentrancy warnings: covered for `root.unmount` and `flushSync` during render/commit in the implementation sequence, tests, risks, and delegated-check findings.
- Exact prerequisites: covered in the numbered Prerequisites section.
- Focused tests: covered in Reconciler Unit Tests, DOM/Facade Conformance Tests, and `flushSync` Conformance Tests.
- Standard report sections: satisfied. The report includes Summary, Changed Files, Commands Run, Evidence Gathered, Risks Or Blockers, Recommended Next Tasks, and Verification.
- Verification coverage: scoped report checks and `git diff --check` cover report hygiene/write scope; the flushSync oracle test covers the existing public rootless oracle only and is explicitly not treated as proof of root commit timing.
