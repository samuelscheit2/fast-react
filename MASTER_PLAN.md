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

Top-level cap: 30 workers. Queue 503-532 is assigned in isolated worktrees.

| Worker | Focus |
| --- | --- |
| 503 | Deleted-subtree passive flush execution gate |
| 504 | Fragment/Portal deletion traversal diagnostics |
| 505 | Form action event extraction metadata |
| 506 | Form reset queue/commit metadata |
| 507 | Resource map commit diagnostics |
| 508 | Stylesheet load/error state diagnostics |
| 509 | Controlled restore queue flush ordering |
| 510 | Controlled radio sibling props metadata |
| 511 | React DOM facade update host-output diagnostic |
| 512 | React DOM facade unmount cleanup diagnostic |
| 513 | Broader DOM event type dispatch canaries |
| 514 | Portal event error routing diagnostics |
| 515 | TestInstance query bridge preflight |
| 516 | Test renderer committed fiber tree inspection |
| 517 | Test renderer act warning/thenable blockers |
| 518 | Scheduler mock expired act-route diagnostics |
| 519 | Package surface private audit for 480-492 |
| 520 | Benchmark private diagnostics canaries |
| 521 | Root-render E2E private gate refresh |
| 522 | SuspenseList/Activity blocker diagnostics |
| 523 | Scheduler postTask environment diagnostics |
| 524 | Native transport worker-thread teardown |
| 525 | React hook dispatcher public blocker refresh |
| 526 | Conformance private admission refresh for 473-502 |
| 527 | Worker launcher simplification and diagnostics |
| 528 | Hydration replay error metadata gate |
| 529 | Portal root-render public blocker refresh |
| 530 | Test renderer error-boundary update refresh |
| 531 | Scheduler native entry guard refresh |
| 532 | Native package surface guard refresh |

## Near-Term Sequencing

1. Queue the next independent worker batch below the 30 top-level worker cap.
2. Accept code workers opportunistically, resolving merge conflicts after the
   fact when overlapping work lands on different implementation surfaces.
3. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
   after each accepted merge batch.

## Next Queue Candidates

- Minimal commit path after root work loop ownership is clear.
- Sync flush integration once HostRoot render work can produce finished work.
- Function component render and hook queue slices after the root queue model is
  stable.
- Test renderer root serialization and act/error surfaces once commit behavior
  exists.
- DOM mutation/text host behavior after host token boundaries remain stable.
