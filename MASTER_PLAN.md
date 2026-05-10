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

Top-level cap: 30 workers. Queue 443-472 is assigned in isolated worktrees.
Worker 448 has been accepted, leaving 29 active top-level workers from this
queue.

| Worker | Focus |
| --- | --- |
| 443 | Root commit layout-effect handoff canary |
| 444 | Ref cleanup-return execution gate |
| 445 | Root error option callback records |
| 446 | Context change propagation lane gate |
| 447 | Function component `useCallback` private path |
| 449 | Passive effect scheduler flush gate |
| 450 | Sync flush error recovery diagnostics |
| 451 | Root callback invocation execution gate |
| 452 | HostRoot fragment/array reconciliation canary |
| 453 | DOM style and `dangerouslySetInnerHTML` mutation gate |
| 454 | DOM text-content reset/update gate |
| 455 | DOM event currentTarget bubbling gate |
| 456 | DOM event stop-immediate-propagation gate |
| 457 | DOM portal event owner-root gate |
| 458 | Hydration replay queue drain-order gate |
| 459 | Hydration text mismatch boundary gate |
| 460 | Resource preload dedupe/order gate |
| 461 | Form action reset dispatcher gate |
| 462 | Controlled select/textarea restore gate |
| 463 | TestInstance `findAll` private query gate |
| 464 | Test renderer `getInstance` class diagnostic |
| 465 | Test renderer error-boundary diagnostics |
| 466 | Test renderer act passive-effect drain gate |
| 467 | Native JSON transport error diagnostics |
| 468 | Native handle-table sequence teardown gate |
| 469 | Scheduler mock expired continuation gate |
| 470 | Scheduler post-task priority diagnostics |
| 471 | Package-surface private diagnostics audit |
| 472 | Root update benchmark timing canaries |

## Near-Term Sequencing

1. Monitor queue 443-472 for completion and merge completed workers before
   queuing more.
2. Accept code workers opportunistically, resolving merge conflicts after the
   fact when overlapping work lands on different implementation surfaces.
3. After the queue drains, refill up to the 30 top-level worker cap with the
   next narrow implementation or conformance checkpoints.

## Next Queue Candidates

- Minimal commit path after root work loop ownership is clear.
- Sync flush integration once HostRoot render work can produce finished work.
- Function component render and hook queue slices after the root queue model is
  stable.
- Test renderer root serialization and act/error surfaces once commit behavior
  exists.
- DOM mutation/text host behavior after host token boundaries remain stable.
