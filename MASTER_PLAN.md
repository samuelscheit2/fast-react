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

Top-level cap: 30 workers. Queue 685-714 is prepared for launch from the
current `main` commit after the queue prompt commit.

- 685-694: Rust reconciler execution paths for root work-loop finished-work
  handoff, HostRoot update queues, function-component hooks/effects, layout
  effects, context, Suspense, Offscreen, deletion cleanup order, and nested
  sync flush/act continuations.
- 695-702: React test-renderer private native execution and metadata parity for
  root create/update, `toJSON`, `toTree`, TestInstance queries, act, error
  boundaries, and production private metadata.
- 703-711: React DOM private execution for root render/update/unmount,
  delegated events, controlled restore, hydration, portals, resources, and form
  actions.
- 712-713: Scheduler mock and postTask private continuation evidence.
- 714: Package-surface/private-admission audit for accepted queue 655-684
  diagnostics.

## Near-Term Sequencing

1. Launch replacement workers 685-714 up to the 30 top-level cap from the
   queue prompt commit.
2. Monitor tmux pane state and worker progress reports, then classify
   completions before accepting work.
3. Merge accepted completed work in batches, resolving overlap conflicts on
   `main`, then clean accepted sessions/worktrees/branches.
4. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
   after each accepted merge batch.

## Next Queue Candidates

- Minimal commit path after root work loop ownership is clear.
- Sync flush integration once HostRoot render work can produce finished work.
- Function component render and hook queue slices after the root queue model is
  stable.
- Test renderer root serialization and act/error surfaces once commit behavior
  exists.
- DOM mutation/text host behavior after host token boundaries remain stable.
