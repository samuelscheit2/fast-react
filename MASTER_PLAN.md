# Fast React Master Plan

Last updated: 2026-05-10

This file owns current and future work only. Accepted history belongs in
`MASTER_PROGRESS.md`; durable orchestration policy belongs in `ORCHESTRATOR.md`;
worker-facing rules belong in `WORKER_BRIEF.md`.

## Planning Inputs

- Compatibility target: `react` 19.2.6, `react-dom` 19.2.6,
  `@types/react` 19.2.14.
- Source reference: `/Users/user/Developer/Developer/react-reference`, upstream
  `facebook/react` tag `v19.2.6`, commit
  `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- Use source for internals research. Use npm tarballs and runtime oracles for
  published behavior claims.

## Active And Future Milestones

| Milestone | Focus | Status |
| --- | --- | --- |
| M3 | Element/runtime model and direct React facade behavior | Active |
| M4 | Fiber, root, update queues, lanes, scheduling, commit ordering | Active |
| M5 | Hooks, context, effects, function component render | Active |
| M6 | Host boundary, test renderer, DOM mutation proof renderer | Active |
| M7 | React DOM/test-renderer/scheduler public package integration | Active |
| M8 | Conformance and benchmark harness | Active |
| M9 | Iterative compatibility closure and performance profiling | Future |

## Current Objective

Drive toward a minimal real root render/update/unmount path:

1. Lane-backed priorities, root lane bookkeeping, fiber flags, topology, and
   hook queues.
2. FiberRoot/HostRoot records, HostRoot queues, function component render, sync
   flush/act routing, and minimal commit.
3. Token-aware host config, test-renderer integration, and minimal DOM
   mutation/text host behavior.
4. React DOM roots, hydration facade boundaries, test-renderer
   root/serialization/act/error surfaces, and scheduler package variants.
5. Dual-run conformance tests and focused Rust tests before any compatibility
   claim.

## Active Queue

Top-level cap: 30 workers. Queue 685-714 was launched from queue base commit
`9ec6678` in isolated `worker/<slug>` branches and worktrees and has been
accepted and cleaned up. Workers 715-766 have also been accepted and are no
longer active; accepted private evidence still keeps public root, act,
Scheduler timing, hydration, serialization, native execution, package
compatibility, and broad renderer compatibility blocked.

Workers 767-774 are running in isolated worktrees:

- Worker 767: package-private admission audit ledger for Workers 754-766.
- Worker 768: package-root sibling-text private admission.
- Worker 769: CJS sibling-text `toTree` private admission.
- Worker 770: hydrateRoot target-claiming preflight.
- Worker 771: native cleanup-hook/order preflight.
- Worker 772: Scheduler delayed renderer-root producer gate.
- Worker 773: React DOM test-utils act expired Scheduler handoff.
- Worker 774: native teardown executable preflight JS mirror.

## Near-Term Sequencing

1. Audit and merge Workers 767-774 as they complete. Expect overlap in
   react-test-renderer serialization/create-routing tests and Scheduler/React
   act diagnostics; resolve conflicts by preserving all accepted private
   blockers and canonical evidence requirements.
2. Select the next runtime or research queue from accepted private evidence:
   Worker 745's narrow sibling-text identity gate, Worker 744's 737-738 ledger,
   Worker 742's delayed act/root Scheduler mock diagnostic, Worker 741's
   hydrateRoot preflight, Worker 740's native teardown mirror, Worker 738's
   sibling-text handoff/report, Worker 736's nested source-report identity,
   Worker 735's sibling snapshot blocker, and remaining private blockers. Keep
   public root, act, flushSync, hooks/effects, test-renderer, React DOM, public
   serialization, JS/CJS, native bridge, package compatibility, and broad
   sibling/multichild identity admission blocked until each private gate is
   proven.
3. Audit and merge completed workers one at a time or in a small non-conflicting
   batch, with focused reruns before each merge and full workspace checks after
   the batch.
4. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
   after each accepted merge batch.

## Next Queue Candidates

- Scheduler work can move beyond Worker 742's private delayed act/root mock
  diagnostic only after public Scheduler timing, public `act`/root semantics,
  renderer/effect execution, public flush helper behavior, and compatibility are
  proven together.
- Native worker-thread teardown can move beyond Worker 740's inert package
  mirror only after executable native addon loading, cleanup hooks, scheduling,
  renderer/reconciler output, and no-stale-value behavior are proven together.
- Public `hydrateRoot` remains blocked after Worker 741's private preflight.
  Future hydration work must prove real root creation, marker/listener
  behavior, recoverable error routing, event replay, and DOM mutation semantics
  against React 19.2.6.
- Future sibling-text native execution or JS/CJS serialization work should
  consume Worker 745's dedicated private identity gate explicitly. Public
  sibling-text serialization, package compatibility, native bridge
  loading/execution, and broad multichild identity remain blocked.
- Worker 736's nested `toJSON` source-report identity and Worker 733's unmount
  identity gates remain available private evidence for later native or
  serialization gates. JS/CJS, public serialization, native bridge
  loading/execution, and package compatibility remain blocked.
- Additional private root/test-renderer bridge gates that require accepted
  `finished_work` / `finished_lanes` handoff before any wider serialization or
  native bridge execution.

Premature until later gates are green: public React DOM root render/unmount,
public `act`, public `flushSync`, public Scheduler timing, public hydration,
resources, forms, and controlled inputs.
