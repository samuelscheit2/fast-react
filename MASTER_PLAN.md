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

Top-level cap: 30 workers. Queue 353-382 is assigned in isolated worktrees with
overlapping implementation allowed where write scopes differ.

| Worker | Focus |
| --- | --- |
| 353 | Root commit HostText update apply |
| 354 | Root commit nested host-parent placement apply |
| 355 | Root commit deletion subtree cleanup apply |
| 356 | Root work-loop host-output commit handoff |
| 357 | Sync flush root host-output commit |
| 358 | Function-component `useMemo`/`useRef` render path |
| 359 | Function-component state dispatch root reschedule |
| 360 | Context consumer propagation through function render |
| 361 | Passive effect mount create execution private gate |
| 362 | Passive effect unmount destroy ordering private gate |
| 363 | Test renderer update `toJSON` private host output |
| 364 | Test renderer `toTree` private host output |
| 365 | Test renderer TestInstance multi-child query path |
| 366 | Test renderer act private flush execution gate |
| 367 | React DOM root private initial render host output |
| 368 | React DOM root private update host output |
| 369 | React DOM root private unmount host output |
| 370 | React DOM event listener invocation private path |
| 371 | React DOM ref attach/detach ordering private path |
| 372 | Hydration marker replay queue private path |
| 373 | Portal private fake-DOM mount gate |
| 374 | Resource hint private DOM insertion gate |
| 375 | Controlled input value tracker private gate |
| 376 | Native root bridge Rust handle-table handoff |
| 377 | Scheduler act queue flush helper private path |
| 378 | Package surface private root execution audit |
| 379 | Benchmark private host-output admissions refresh |
| 380 | Root render E2E private update/unmount admissions |
| 381 | Conformance root public blockers after private host output |
| 382 | React DOM test-utils act after private root output |

## Near-Term Sequencing

1. Refill up to the 30 top-level worker cap with non-overlapping slices that
   turn the accepted private root,
   commit, host-output, function-component, DOM, and package gates into the
   next narrow implementation or conformance checkpoints.
2. Accept code workers opportunistically, resolving merge conflicts after the
   fact when overlapping work lands on different implementation surfaces.

## Next Queue Candidates

- Minimal commit path after root work loop ownership is clear.
- Sync flush integration once HostRoot render work can produce finished work.
- Function component render and hook queue slices after the root queue model is
  stable.
- Test renderer root serialization and act/error surfaces once commit behavior
  exists.
- DOM mutation/text host behavior after host token boundaries remain stable.
