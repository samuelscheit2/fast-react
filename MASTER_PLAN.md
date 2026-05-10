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

- Worker 150: sync flush execution context in
  `/Users/user/Developer/Developer/fast-react-worker-150-sync-flush-execution-context`.
- Worker 151: HostComponent/HostText complete-work skeleton in
  `/Users/user/Developer/Developer/fast-react-worker-151-host-complete-work-skeleton`.
- Worker 153: Rust test-renderer root canary in
  `/Users/user/Developer/Developer/fast-react-worker-153-test-renderer-root-canary`.
- Worker 154: private DOM mutation adapter shell in
  `/Users/user/Developer/Developer/fast-react-worker-154-dom-mutation-adapter-shell`.
- Worker 155: scheduler callback execution in
  `/Users/user/Developer/Developer/fast-react-worker-155-scheduler-callback-execution`.
- Worker 156: root lane selection helpers in
  `/Users/user/Developer/Developer/fast-react-worker-156-root-lane-selection-helpers`.
- Worker 157: core hook effect ring in
  `/Users/user/Developer/Developer/fast-react-worker-157-core-hook-effect-ring`.
- Worker 158: core hook state queue in
  `/Users/user/Developer/Developer/fast-react-worker-158-core-hook-state-queue`.
- Worker 159: function component render skeleton in
  `/Users/user/Developer/Developer/fast-react-worker-159-function-component-render-skeleton`.
- Worker 160: root update callback commit prep in
  `/Users/user/Developer/Developer/fast-react-worker-160-root-update-callback-commit-prep`.
- Worker 161: root error option handles in
  `/Users/user/Developer/Developer/fast-react-worker-161-root-error-option-handles`.
- Worker 162: benchmark manifest gate in
  `/Users/user/Developer/Developer/fast-react-worker-162-benchmark-manifest-gate`.
- Worker 163: root E2E conformance gate in
  `/Users/user/Developer/Developer/fast-react-worker-163-root-e2e-conformance-gate`.
- Worker 164: scheduler regression tests in
  `/Users/user/Developer/Developer/fast-react-worker-164-scheduler-regression-tests`.
- Worker 165: package surface guard in
  `/Users/user/Developer/Developer/fast-react-worker-165-package-surface-guard`.
- Worker 167: React DOM private root bridge in
  `/Users/user/Developer/Developer/fast-react-worker-167-react-dom-private-root-bridge`.
- Worker 168: DOM component tree map shell in
  `/Users/user/Developer/Developer/fast-react-worker-168-dom-component-tree-map-shell`.
- Worker 169: hydration boundary skeleton in
  `/Users/user/Developer/Developer/fast-react-worker-169-hydration-boundary-skeleton`.
- Worker 172: resource/form unsupported gates in
  `/Users/user/Developer/Developer/fast-react-worker-172-resource-form-unsupported-gates`.
- Worker 173: passive pending state in
  `/Users/user/Developer/Developer/fast-react-worker-173-passive-pending-state`.
- Worker 175: Suspense/Offscreen fail-closed markers in
  `/Users/user/Developer/Developer/fast-react-worker-175-suspense-offscreen-fail-closed`.
- Worker 176: act queue routing skeleton in
  `/Users/user/Developer/Developer/fast-react-worker-176-act-queue-routing-skeleton`.
- Worker 178: test-renderer serialization gate in
  `/Users/user/Developer/Developer/fast-react-worker-178-test-renderer-serialization-gate`.
- Worker 179: sync flush commit integration in
  `/Users/user/Developer/Developer/fast-react-worker-179-sync-flush-commit-integration`.
- Worker 180: core context stack foundation in
  `/Users/user/Developer/Developer/fast-react-worker-180-core-context-stack-foundation`.
- Worker 181: React DOM createPortal object in
  `/Users/user/Developer/Developer/fast-react-worker-181-react-dom-create-portal-object`.
- Worker 182: React hook dispatcher guard in
  `/Users/user/Developer/Developer/fast-react-worker-182-react-hook-dispatcher-guard`.
- Worker 183: React transition facade in
  `/Users/user/Developer/Developer/fast-react-worker-183-react-transition-facade`.
- Worker 184: React memo element type guard in
  `/Users/user/Developer/Developer/fast-react-worker-184-react-memo-element-type-guard`.

## Near-Term Sequencing

1. Keep the implementation queue at 30 top-level workers or fewer.
2. Accept code workers opportunistically, resolving conflicts after the fact
   rather than serializing all implementation behind one commit path.
3. Fold scheduler, host complete-work, sync flush, and canary branches onto the
   accepted HostRoot render/commit lifecycle shape.

## Next Queue Candidates

- Minimal commit path after root work loop ownership is clear.
- Sync flush integration once HostRoot render work can produce finished work.
- Function component render and hook queue slices after the root queue model is
  stable.
- Test renderer root serialization and act/error surfaces once commit behavior
  exists.
- DOM mutation/text host behavior after host token boundaries remain stable.
