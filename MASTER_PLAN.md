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

Top-level cap: 30 workers. Queue 383-412 is assigned in isolated worktrees with
overlap allowed where scopes converge on the same implementation path.

| Worker | Focus |
| --- | --- |
| 383 | Root commit HostComponent update apply |
| 384 | Root commit HostComponent deletion apply |
| 385 | Root commit ref callback execution handoff |
| 386 | Context provider begin-work runtime read |
| 387 | Root work-loop context provider handoff |
| 388 | Function-component effect update queue private path |
| 389 | Passive effects error propagation private path |
| 390 | Sync flush act private execution |
| 391 | Test renderer public `toJSON` private facade |
| 392 | Test renderer public `toTree` private facade |
| 393 | Test renderer update/unmount JS private routing |
| 394 | Test renderer act private scheduler consumption |
| 395 | React DOM private root public-facade adapter |
| 396 | React DOM host-output attribute update gate |
| 397 | React DOM event invocation from private root output |
| 398 | React DOM ref ordering from root commit metadata |
| 399 | Controlled input private restore queue gate |
| 400 | Resource hint head singleton private gate |
| 401 | Hydration marker replay event queue private path |
| 402 | Portal private child reconciliation gate |
| 403 | Native root bridge JSON transport smoke |
| 404 | Scheduler mock private callback execution |
| 405 | React act private continuation gate |
| 406 | React DOM test-utils act private root output |
| 407 | Benchmark private root-output timing canaries |
| 408 | Package surface private root-output audit |
| 409 | Context object local gate after provider progress |
| 410 | Root render E2E private `flushSync` admission |
| 411 | Root render E2E private warning boundary |
| 412 | Private root-output gate docs and smoke refresh |

## Near-Term Sequencing

1. Monitor queue 383-412 for completion and merge completed workers before
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
