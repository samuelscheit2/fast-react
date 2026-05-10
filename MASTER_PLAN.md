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

Top-level cap: 30 workers. Remaining workers from queue 323-352 are running in
isolated worktrees with overlapping implementation allowed where write scopes
differ.

| Worker | Focus |
| --- | --- |
| 323 | Root commit host-parent placement apply |
| 324 | Root commit stable-sibling insertion apply |
| 325 | Root commit host deletion cleanup apply |
| 333 | Test renderer `toJSON` host output private path |
| 334 | Test renderer TestInstance private query path |
| 335 | Test renderer act scheduler flush private path |
| 338 | DOM mutation latest-props commit handoff |
| 339 | DOM event plugin target dispatch path |
| 342 | DOM portal private commit boundary |
| 343 | Resource hint private dispatcher DOM adapter gate |
| 344 | Controlled input private wrapper metadata gate |
| 345 | Native root bridge real handle admission preflight |
| 350 | Root work loop complete-work multiple-child handoff |
| 351 | Suspense/Offscreen preflight after child handoff |
| 352 | Root render E2E private admissions after host output |

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
