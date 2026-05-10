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

Top-level cap: 30 workers. Queue workers 293-322 from current `main`, each in
its matching `/Users/user/Developer/Developer/fast-react-worker-*` worktree.

| Worker | Focus |
| --- | --- |
| 293 | Root commit host-parent placement apply canary |
| 294 | Root commit host sibling insertion canary |
| 295 | Root commit visible callback invocation gate |
| 296 | Passive effect callback handle flush gate |
| 297 | Begin-work Fragment single-child handoff |
| 298 | Context provider nested stack handoff |
| 299 | Function component useReducer render canary |
| 300 | Function component dispatch eager-state gate |
| 301 | Hook effect destroy handoff metadata |
| 302 | Root scheduler ping/retry lane gate |
| 303 | Sync flush passive continuation execution gate |
| 304 | Test renderer JS private root request bridge |
| 305 | Test renderer toJSON private serialization facade |
| 306 | Test renderer TestInstance private wrapper skeleton |
| 307 | Test renderer update/unmount private JS bridge |
| 308 | Test renderer act scheduler private gate |
| 309 | Test renderer error-surface local gate refresh |
| 310 | DOM root private create mark/listen gate |
| 311 | DOM component-tree latest-props mutation handoff |
| 312 | DOM event listener target lookup gate |
| 313 | DOM ref callback private attach/detach gate |
| 314 | Hydration marker parser root bridge integration |
| 315 | DOM portal private root boundary records |
| 316 | Resource hint private dispatcher metadata gate |
| 317 | Controlled input value tracker private gate |
| 318 | Native root bridge JS request shape gate |
| 319 | Native boundary error code mapping |
| 320 | Benchmark private gate admission refresh |
| 321 | Package surface private file blocklist hardening |
| 322 | React DOM test-utils act private routing gate |

## Near-Term Sequencing

1. Keep the implementation queue at 30 top-level workers or fewer.
2. Accept code workers opportunistically, resolving conflicts after the fact
   rather than serializing all implementation behind one commit path.
3. Refill with non-overlapping slices that turn the accepted private root,
   commit, host-output, function-component, DOM, and package gates into the
   next narrow implementation or conformance checkpoints.

## Next Queue Candidates

- Minimal commit path after root work loop ownership is clear.
- Sync flush integration once HostRoot render work can produce finished work.
- Function component render and hook queue slices after the root queue model is
  stable.
- Test renderer root serialization and act/error surfaces once commit behavior
  exists.
- DOM mutation/text host behavior after host token boundaries remain stable.
