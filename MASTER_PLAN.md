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

- Worker 233: root commit host mutation apply skeleton in
  `/Users/user/Developer/Developer/fast-react-worker-233-root-commit-host-mutation-apply-skeleton`.
- Worker 234: test-renderer host output update/unmount canary in
  `/Users/user/Developer/Developer/fast-react-worker-234-test-renderer-host-output-update-unmount-canary`.
- Worker 235: test-renderer private fiber inspection API in
  `/Users/user/Developer/Developer/fast-react-worker-235-test-renderer-private-fiber-inspection`.
- Worker 236: test-renderer private JSON serialization skeleton in
  `/Users/user/Developer/Developer/fast-react-worker-236-test-renderer-private-json-serialization`.
- Worker 237: react-test-renderer JS create routing gate in
  `/Users/user/Developer/Developer/fast-react-worker-237-react-test-renderer-js-create-routing-gate`.
- Worker 238: DOM mutation payload applier in
  `/Users/user/Developer/Developer/fast-react-worker-238-dom-mutation-payload-applier`.
- Worker 239: DOM root bridge request admission gate in
  `/Users/user/Developer/Developer/fast-react-worker-239-dom-root-bridge-request-admission-gate`.
- Worker 240: DOM root public facade dual-run blocked gate in
  `/Users/user/Developer/Developer/fast-react-worker-240-dom-root-public-facade-dualrun-blocked-gate`.
- Worker 241: DOM text-content private predicate gaps in
  `/Users/user/Developer/Developer/fast-react-worker-241-dom-text-content-private-predicate-gaps`.
- Worker 242: DOM style/dangerous HTML applier gate in
  `/Users/user/Developer/Developer/fast-react-worker-242-dom-style-dangerous-html-applier-gate`.
- Worker 243: portal reconciler fail-closed admission in
  `/Users/user/Developer/Developer/fast-react-worker-243-portal-reconciler-failclosed-admission`.
- Worker 244: DOM event dispatch plugin skeleton in
  `/Users/user/Developer/Developer/fast-react-worker-244-dom-event-dispatch-plugin-skeleton`.
- Worker 245: DOM ref callback commit gate in
  `/Users/user/Developer/Developer/fast-react-worker-245-dom-ref-callback-commit-gate`.
- Worker 246: hydration container marker parser in
  `/Users/user/Developer/Developer/fast-react-worker-246-hydration-container-marker-parser`.
- Worker 247: function component context read canary in
  `/Users/user/Developer/Developer/fast-react-worker-247-function-component-context-read-canary`.
- Worker 248: React `useContext` dispatcher fail-closed surface in
  `/Users/user/Developer/Developer/fast-react-worker-248-react-usecontext-dispatcher-failclosed`.
- Worker 249: function component single child reconciliation canary in
  `/Users/user/Developer/Developer/fast-react-worker-249-function-component-single-child-reconciliation`.
- Worker 250: hook effect passive commit handoff in
  `/Users/user/Developer/Developer/fast-react-worker-250-hook-effect-passive-commit-handoff`.
- Worker 251: React `useEffect` dispatcher fail-closed surface in
  `/Users/user/Developer/Developer/fast-react-worker-251-react-useeffect-dispatcher-failclosed`.
- Worker 252: sync flush act continuation skeleton in
  `/Users/user/Developer/Developer/fast-react-worker-252-sync-flush-act-continuation-skeleton`.
- Worker 253: public React `act` blocked gate in
  `/Users/user/Developer/Developer/fast-react-worker-253-react-act-public-blocked-gate`.
- Worker 254: React DOM test-utils act package surface in
  `/Users/user/Developer/Developer/fast-react-worker-254-react-dom-test-utils-act-package-surface`.
- Worker 255: test-renderer mock scheduler shell in
  `/Users/user/Developer/Developer/fast-react-worker-255-test-renderer-mock-scheduler-shell`.
- Worker 256: native root bridge request records in
  `/Users/user/Developer/Developer/fast-react-worker-256-native-root-bridge-request-records`.
- Worker 257: benchmark root lifecycle admission manifest in
  `/Users/user/Developer/Developer/fast-react-worker-257-benchmark-root-lifecycle-admission-manifest`.
- Worker 258: react-test-renderer package surface tightening in
  `/Users/user/Developer/Developer/fast-react-worker-258-react-test-renderer-package-surface-tightening`.
- Worker 259: DOM component-tree latest props commit adapter in
  `/Users/user/Developer/Developer/fast-react-worker-259-dom-component-tree-latest-props-commit-adapter`.
- Worker 260: resource/form action internals gate in
  `/Users/user/Developer/Developer/fast-react-worker-260-resource-form-action-internals-gate`.
- Worker 261: DOM HostText commit conformance gate in
  `/Users/user/Developer/Developer/fast-react-worker-261-dom-host-text-commit-conformance-gate`.
- Worker 262: root render E2E private bridge dual-run gate in
  `/Users/user/Developer/Developer/fast-react-worker-262-root-render-e2e-private-bridge-dualrun-gate`.

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
