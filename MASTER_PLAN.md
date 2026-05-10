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

Top-level cap: 30 workers. Queue 655-684 is running in isolated
`worker/<slug>` branches and worktrees from queue base `243817c`.

- 655-666: Rust reconciler execution paths for commit mutation, effects, refs,
  context, Suspense, Offscreen, error recovery, sync flush callbacks, and
  reducer transition lanes.
- 667-672: React test-renderer private native execution evidence for `toTree`,
  TestInstance queries, error boundaries, act/passive flushing, update
  serialization, and unmount ref/passive ordering.
- 673-682: React DOM private root live-container preflight, root unmount
  ref/passive cleanup, fragment/array fake-DOM rendering, controlled-input live
  preflight, hydration recovery/replay, resource execution, and form action
  callback preflight.
- 683-684: Scheduler postTask act/root continuation evidence and package
  surface/private-admission guard refresh.

## Near-Term Sequencing

1. Monitor queue 655-684 from tmux pane state and worker progress reports.
2. Classify completions before accepting work; inspect worker reports,
   worktree status, changed files, verification, and risks.
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
