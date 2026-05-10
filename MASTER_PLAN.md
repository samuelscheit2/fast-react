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

- Worker 185: DOM namespace context helper in
  `/Users/user/Developer/Developer/fast-react-worker-185-dom-namespace-context-helper`.
- Worker 186: DOM property payload helper in
  `/Users/user/Developer/Developer/fast-react-worker-186-dom-property-payload-helper`.
- Worker 187: host node store boundary in
  `/Users/user/Developer/Developer/fast-react-worker-187-host-node-store-boundary`.
- Worker 188: test-renderer commit handoff canary in
  `/Users/user/Developer/Developer/fast-react-worker-188-test-renderer-commit-handoff-canary`.
- Worker 189: core portal record foundation in
  `/Users/user/Developer/Developer/fast-react-worker-189-core-portal-record-foundation`.
- Worker 190: native handle environment teardown in
  `/Users/user/Developer/Developer/fast-react-worker-190-native-handle-environment-teardown`.
- Worker 191: root scheduler lane-selection integration in
  `/Users/user/Developer/Developer/fast-react-worker-191-root-scheduler-lane-selection-integration`.
- Worker 192: core hook list foundation in
  `/Users/user/Developer/Developer/fast-react-worker-192-core-hook-list-foundation`.
- Worker 193: root commit callback handoff in
  `/Users/user/Developer/Developer/fast-react-worker-193-root-commit-callback-handoff`.
- Worker 194: function component begin-work handoff in
  `/Users/user/Developer/Developer/fast-react-worker-194-function-component-begin-work-handoff`.

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
