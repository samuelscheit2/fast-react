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

- Worker 204: host work text update diff in
  `/Users/user/Developer/Developer/fast-react-worker-204-host-work-text-update-diff`.
- Worker 205: root commit mutation log skeleton in
  `/Users/user/Developer/Developer/fast-react-worker-205-root-commit-mutation-log-skeleton`.
- Worker 206: root commit deletion metadata in
  `/Users/user/Developer/Developer/fast-react-worker-206-root-commit-deletion-metadata`.
- Worker 208: test renderer host output canary in
  `/Users/user/Developer/Developer/fast-react-worker-208-test-renderer-host-output-canary`.
- Worker 209: test renderer serialization private gate in
  `/Users/user/Developer/Developer/fast-react-worker-209-test-renderer-serialization-private-gate`.
- Worker 210: react-test-renderer JS create fail-closed surface in
  `/Users/user/Developer/Developer/fast-react-worker-210-react-test-renderer-js-create-failclosed`.
- Worker 211: DOM host text-content local gate integration in
  `/Users/user/Developer/Developer/fast-react-worker-211-dom-host-text-content-local-gate`.
- Worker 213: DOM property payload style/dangerous HTML slice in
  `/Users/user/Developer/Developer/fast-react-worker-213-dom-property-payload-style-dangerous-html`.
- Worker 214: DOM component tree mounted map helpers in
  `/Users/user/Developer/Developer/fast-react-worker-214-dom-component-tree-mounted-map`.
- Worker 215: DOM root bridge private update path in
  `/Users/user/Developer/Developer/fast-react-worker-215-dom-root-bridge-private-update-path`.
- Worker 216: DOM event listener priority wrappers in
  `/Users/user/Developer/Developer/fast-react-worker-216-dom-event-listener-priority-wrapper`.
- Worker 217: DOM createPortal local gate in
  `/Users/user/Developer/Developer/fast-react-worker-217-dom-create-portal-local-gate`.
- Worker 218: hydration boundary fail-closed gate in
  `/Users/user/Developer/Developer/fast-react-worker-218-hydration-boundary-failclosed`.
- Worker 219: resource/form unsupported gates in
  `/Users/user/Developer/Developer/fast-react-worker-219-resource-form-unsupported-gates`.
- Worker 220: React hook dispatcher useState fail-closed surface in
  `/Users/user/Developer/Developer/fast-react-worker-220-react-hook-dispatcher-usestate-failclosed`.
- Worker 221: React context provider object coverage in
  `/Users/user/Developer/Developer/fast-react-worker-221-react-context-provider-object-coverage`.
- Worker 222: core context stack reconciler canary in
  `/Users/user/Developer/Developer/fast-react-worker-222-core-context-stack-reconciler-canary`.
- Worker 223: function component useState private dispatch in
  `/Users/user/Developer/Developer/fast-react-worker-223-function-component-usestate-private-dispatch`.
- Worker 224: function component effect registration private slice in
  `/Users/user/Developer/Developer/fast-react-worker-224-function-component-effect-registration`.
- Worker 225: passive effects flush skeleton in
  `/Users/user/Developer/Developer/fast-react-worker-225-passive-effects-flush-skeleton`.
- Worker 226: ref attach/detach commit metadata in
  `/Users/user/Developer/Developer/fast-react-worker-226-ref-attach-detach-commit-metadata`.
- Worker 227: Suspense/Offscreen fail-closed lane tests in
  `/Users/user/Developer/Developer/fast-react-worker-227-suspense-offscreen-failclosed-lane-tests`.
- Worker 229: benchmark root render manifest gate expansion in
  `/Users/user/Developer/Developer/fast-react-worker-229-benchmark-root-render-manifest-gate`.
- Worker 230: DOM text dual-run conformance gate in
  `/Users/user/Developer/Developer/fast-react-worker-230-dom-text-dual-run-conformance-gate`.
- Worker 231: package surface React DOM subpath tightening in
  `/Users/user/Developer/Developer/fast-react-worker-231-package-surface-react-dom-subpath-tightening`.

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
