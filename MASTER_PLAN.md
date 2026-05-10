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
accepted and cleaned up. Worker 715 restored the Rust 1.95.0 clippy gate after
the post-cleanup `npm run check` baseline failed and has been cleaned up.

- Worker 716: private-admission and package-surface ledger for accepted queue
  685-714.
- Worker 717: private HostRoot render -> finished-work -> commit entrypoint
  hardening.
- Worker 721: DOM text reset / dangerousHTML fake-DOM execution gate.

## Near-Term Sequencing

1. Accept worker 716 only if it adds queue 685-714 admission evidence without
   product code changes and keeps `npm run check` green.
2. Accept worker 717 only if it keeps public render/host mutation blocked while
   hardening private finished-work commit handoff.
3. Accept worker 721 only if it remains fake-DOM/private and keeps public React
   DOM text/dangerousHTML compatibility blocked.
4. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
   after each accepted merge batch.

## Next Queue Candidates

- Worker 716: private-admission and package-surface ledger for accepted queue
  685-714; no product code.
- Worker 717: private HostRoot render -> finished-work -> commit entrypoint
  hardening, dependent on workers 685, 686, and 694.
- Worker 718: sync-flush/root-scheduler finished-work handoff integration,
  dependent on worker 717 if it adds shared helpers.
- Worker 719: function-component effect destroy-handle persistence, dependent
  on workers 688/689 and stable commit ownership from worker 717.
- Worker 720: test-renderer serialization finished-work identity gate,
  dependent on workers 695-702 and 717.
- Worker 721: DOM text reset / dangerousHTML fake-DOM execution gate, dependent
  on worker 704 and existing text-content gates.

Premature until later gates are green: public React DOM root render/unmount,
public `act`, public `flushSync`, public Scheduler timing, public hydration,
resources, forms, and controlled inputs.
