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

- Worker 129: HostRoot render-phase foundation in
  `/Users/user/Developer/Developer/fast-react-worker-129-host-root-render-phase-foundation`.
- Worker 130: minimal commit slice readiness refresh in
  `/Users/user/Developer/Developer/fast-react-worker-130-commit-readiness-refresh`.
- Worker 131: sync flush and act integration refresh in
  `/Users/user/Developer/Developer/fast-react-worker-131-sync-flush-act-refresh`.
- Worker 132: host component/text render and complete-work slice refresh in
  `/Users/user/Developer/Developer/fast-react-worker-132-host-complete-work-refresh`.
- Worker 133: test-renderer root canary sequencing refresh in
  `/Users/user/Developer/Developer/fast-react-worker-133-test-renderer-root-refresh`.
- Worker 134: DOM mutation adapter canary sequencing refresh in
  `/Users/user/Developer/Developer/fast-react-worker-134-dom-mutation-refresh`.
- Worker 135: React DOM root facade bridge refresh in
  `/Users/user/Developer/Developer/fast-react-worker-135-react-dom-root-bridge-refresh`.
- Worker 136: function component and hook vertical slice refresh in
  `/Users/user/Developer/Developer/fast-react-worker-136-function-hooks-refresh`.
- Worker 137: root render conformance and benchmark gate refresh in
  `/Users/user/Developer/Developer/fast-react-worker-137-conformance-benchmark-refresh`.
- Worker 138: root error/callback surface sequencing refresh in
  `/Users/user/Developer/Developer/fast-react-worker-138-root-error-callback-refresh`.
- Worker 139: passive effects and ref lifecycle sequencing refresh in
  `/Users/user/Developer/Developer/fast-react-worker-139-passive-ref-refresh`.

## Near-Term Sequencing

1. Keep worker 129 limited to HostRoot render-phase queue processing and
   scheduler callback identity validation.
2. Keep worker 129 out of commit, host mutation, JS packages, React DOM,
   test-renderer facades, scheduler-native files, and smoke/conformance tests.
3. Keep workers 130-139 report-only with one progress file each; use them to
   refine the next source slices without touching active implementation files.
4. After worker 129 is accepted, queue the minimal commit/root-current switch
   slice or a sync-flush integration slice depending on the worker's risks.

## Next Queue Candidates

- Minimal commit path after root work loop ownership is clear.
- Sync flush integration once HostRoot render work can produce finished work.
- Function component render and hook queue slices after the root queue model is
  stable.
- Test renderer root serialization and act/error surfaces once commit behavior
  exists.
- DOM mutation/text host behavior after host token boundaries remain stable.
