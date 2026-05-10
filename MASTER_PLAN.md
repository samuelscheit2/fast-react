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

Top-level cap: 30 workers. Queue workers 263-292 from current `main`, each in
its matching `/Users/user/Developer/Developer/fast-react-worker-*` worktree.

| Worker | Focus | Branch / Worktree |
| --- | --- | --- |
| 263 | Root commit update payload apply canary | `worker/263-root-commit-update-payload-apply-canary` / `/Users/user/Developer/Developer/fast-react-worker-263-root-commit-update-payload-apply-canary` |
| 264 | Root commit host parent deletion applier | `worker/264-root-commit-host-parent-deletion-applier` / `/Users/user/Developer/Developer/fast-react-worker-264-root-commit-host-parent-deletion-applier` |
| 265 | Test renderer private JSON ready diagnostics | `worker/265-test-renderer-private-json-ready-diagnostics` / `/Users/user/Developer/Developer/fast-react-worker-265-test-renderer-private-json-ready-diagnostics` |
| 266 | Test renderer JS update/unmount routing gate | `worker/266-test-renderer-js-update-unmount-routing-gate` / `/Users/user/Developer/Developer/fast-react-worker-266-test-renderer-js-update-unmount-routing-gate` |
| 267 | Test renderer TestInstance query blocked gate | `worker/267-test-renderer-testinstance-query-blocked-gate` / `/Users/user/Developer/Developer/fast-react-worker-267-test-renderer-testinstance-query-blocked-gate` |
| 268 | React test renderer act blocked gate | `worker/268-react-test-renderer-act-blocked-gate` / `/Users/user/Developer/Developer/fast-react-worker-268-react-test-renderer-act-blocked-gate` |
| 269 | DOM root bridge native request handoff | `worker/269-dom-root-bridge-native-request-handoff` / `/Users/user/Developer/Developer/fast-react-worker-269-dom-root-bridge-native-request-handoff` |
| 270 | DOM root public facade update/unmount blocked gate | `worker/270-dom-root-public-facade-update-unmount-blocked-gate` / `/Users/user/Developer/Developer/fast-react-worker-270-dom-root-public-facade-update-unmount-blocked-gate` |
| 271 | DOM property payload mutation adapter | `worker/271-dom-property-payload-mutation-adapter` / `/Users/user/Developer/Developer/fast-react-worker-271-dom-property-payload-mutation-adapter` |
| 272 | DOM host text commit to mutation adapter | `worker/272-dom-host-text-commit-to-mutation-adapter` / `/Users/user/Developer/Developer/fast-react-worker-272-dom-host-text-commit-to-mutation-adapter` |
| 273 | DOM ref callback component tree gate | `worker/273-dom-ref-callback-component-tree-gate` / `/Users/user/Developer/Developer/fast-react-worker-273-dom-ref-callback-component-tree-gate` |
| 274 | DOM event dispatch component tree target gate | `worker/274-dom-event-dispatch-component-tree-target-gate` / `/Users/user/Developer/Developer/fast-react-worker-274-dom-event-dispatch-component-tree-target-gate` |
| 275 | Hydration marker root bridge gate | `worker/275-hydration-marker-root-bridge-gate` / `/Users/user/Developer/Developer/fast-react-worker-275-hydration-marker-root-bridge-gate` |
| 276 | Resource form root bridge blocked gate | `worker/276-resource-form-root-bridge-blocked-gate` / `/Users/user/Developer/Developer/fast-react-worker-276-resource-form-root-bridge-blocked-gate` |
| 277 | React act queue private dispatcher gate | `worker/277-react-act-queue-private-dispatcher-gate` / `/Users/user/Developer/Developer/fast-react-worker-277-react-act-queue-private-dispatcher-gate` |
| 278 | React state hook private dispatcher lane gate | `worker/278-react-state-hook-private-dispatcher-lane-gate` / `/Users/user/Developer/Developer/fast-react-worker-278-react-state-hook-private-dispatcher-lane-gate` |
| 279 | React effect hook passive metadata gate | `worker/279-react-effect-hook-passive-metadata-gate` / `/Users/user/Developer/Developer/fast-react-worker-279-react-effect-hook-passive-metadata-gate` |
| 280 | Scheduler mock flush helper gate | `worker/280-scheduler-mock-flush-helper-gate` / `/Users/user/Developer/Developer/fast-react-worker-280-scheduler-mock-flush-helper-gate` |
| 281 | Native root bridge handle record validation | `worker/281-native-root-bridge-handle-record-validation` / `/Users/user/Developer/Developer/fast-react-worker-281-native-root-bridge-handle-record-validation` |
| 282 | Context provider begin work handoff | `worker/282-context-provider-begin-work-handoff` / `/Users/user/Developer/Developer/fast-react-worker-282-context-provider-begin-work-handoff` |
| 283 | Function component state update render canary | `worker/283-function-component-state-update-render-canary` / `/Users/user/Developer/Developer/fast-react-worker-283-function-component-state-update-render-canary` |
| 284 | Passive effect flush effect ID carry | `worker/284-passive-effect-flush-effect-id-carry` / `/Users/user/Developer/Developer/fast-react-worker-284-passive-effect-flush-effect-id-carry` |
| 285 | Sync flush act continuation post-passive gate | `worker/285-sync-flush-act-continuation-post-passive-gate` / `/Users/user/Developer/Developer/fast-react-worker-285-sync-flush-act-continuation-post-passive-gate` |
| 286 | Root work loop function parent topology canary | `worker/286-root-work-loop-function-parent-topology-canary` / `/Users/user/Developer/Developer/fast-react-worker-286-root-work-loop-function-parent-topology-canary` |
| 287 | Suspense/offscreen root preflight regression | `worker/287-suspense-offscreen-root-preflight-regression` / `/Users/user/Developer/Developer/fast-react-worker-287-suspense-offscreen-root-preflight-regression` |
| 288 | DOM portal root render blocked gate | `worker/288-dom-portal-root-render-blocked-gate` / `/Users/user/Developer/Developer/fast-react-worker-288-dom-portal-root-render-blocked-gate` |
| 289 | Benchmark accepted gates refresh | `worker/289-benchmark-accepted-gates-refresh` / `/Users/user/Developer/Developer/fast-react-worker-289-benchmark-accepted-gates-refresh` |
| 290 | Package surface private diagnostics guard | `worker/290-package-surface-private-diagnostics-guard` / `/Users/user/Developer/Developer/fast-react-worker-290-package-surface-private-diagnostics-guard` |
| 291 | Test renderer serialization local gate ready private | `worker/291-test-renderer-serialization-local-gate-ready-private` / `/Users/user/Developer/Developer/fast-react-worker-291-test-renderer-serialization-local-gate-ready-private` |
| 292 | DOM host text dual-run admission refresh | `worker/292-dom-host-text-dual-run-admission-refresh` / `/Users/user/Developer/Developer/fast-react-worker-292-dom-host-text-dual-run-admission-refresh` |

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
