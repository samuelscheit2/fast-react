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

- Worker 126: scheduler native entrypoint implementation is committed on its
  worker branch and pending smoke integration before merge to `main`.
- Worker 127: launch a narrow native scheduler smoke integration worker based
  on current `main` plus worker 126's committed implementation.

## Near-Term Sequencing

1. Keep worker 126's implementation branch out of `main` until native smoke
   integration proves the broad JS gate after its changes.
2. Launch worker 127 in an isolated integration worktree with worker 126's
   commit merged in. Limit its write scope to
   `tests/smoke/import-entrypoints.mjs` and its progress report.
3. After worker 127 passes `npm run check:js`, accept the integration branch
   and close workers 126 and 127 together.
4. Queue the next non-overlapping root/reconciler slices from accepted
   sequencing reports now that worker 124's HostRoot queue model is merged.

## Next Queue Candidates

- Root scheduler/work loop once HostRoot updates are accepted.
- Minimal commit path after root work loop ownership is clear.
- Function component render and hook queue slices after the root queue model is
  stable.
- Test renderer root serialization and act/error surfaces once commit behavior
  exists.
- DOM mutation/text host behavior after host token boundaries remain stable.
