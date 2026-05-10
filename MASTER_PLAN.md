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
accepted and cleaned up. Workers 715-721 have also been accepted and cleaned
up.

Workers 722-723 were launched from queue base commit `bf5440e` in isolated
`worker/<slug>` branches and worktrees.

- Worker 722: package/private-admission ledger for Workers 715-721.
- Worker 723: test-renderer native serialization identity gate consuming
  Worker 720 evidence.

## Near-Term Sequencing

1. Monitor workers 722 and 723, accepting only scoped private evidence with
   public package behavior and compatibility claims still blocked.
2. Select later work from accepted private blockers only; keep public root,
   act, flushSync, hooks/effects, test-renderer, and React DOM compatibility
   blocked until each private gate is proven.
3. Audit and merge completed workers one at a time or in a small non-conflicting
   batch, with focused reruns before each merge and full workspace checks after
   the batch.
4. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
   after each accepted merge batch.

## Next Queue Candidates

- Private test-renderer native bridge consumption of Worker 720's finished-work
  identity gate, without widening public `toJSON`, `toTree`, `.root`, or
  `TestInstance` behavior.
- Private package/admission ledger coverage for Workers 715-721 so accepted
  hidden capabilities remain closed by default at package boundaries.
- Additional private root/test-renderer bridge gates that require accepted
  `finished_work` / `finished_lanes` handoff before any serialization or native
  bridge execution.

Premature until later gates are green: public React DOM root render/unmount,
public `act`, public `flushSync`, public Scheduler timing, public hydration,
resources, forms, and controlled inputs.
