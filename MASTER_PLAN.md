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

Top-level cap: 30 workers. Queue 685-714 was launched from queue base commit
`9ec6678` in isolated `worker/<slug>` branches and worktrees and has been
accepted and cleaned up. Workers 715-736 have also been accepted and cleaned
up. Workers 737-738 have been accepted, merged, and cleaned up.

Workers 740-742 are active in isolated worktrees. The static
private-admission ledger follow-up for accepted Workers 737-738 is also
active/current work.

## Near-Term Sequencing

1. Select the next runtime or research queue from accepted Worker 737 ledger
   evidence, accepted Worker 738 sibling-text handoff/report evidence, accepted
   Worker 736 nested source-report identity evidence, Worker 735 sibling
   snapshot blocker evidence, and remaining private blockers; keep public root,
   act, flushSync, hooks/effects, test-renderer, React DOM, public
   serialization, JS/CJS, native bridge, package compatibility, and sibling
   identity admission blocked until each private gate is proven.
2. Audit and merge completed workers one at a time or in a small non-conflicting
   batch, with focused reruns before each merge and full workspace checks after
   the batch.
3. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
   after each accepted merge batch.

## Next Queue Candidates

- Active Worker 740 is investigating the native package worker-thread teardown
  mirror.
- Active Worker 741 is investigating the React DOM `hydrateRoot` private facade
  preflight.
- Active Worker 742 is investigating the Scheduler mock delayed `act` root
  continuation.
- Active static ledger follow-up for accepted Workers 737-738 should pin
  Worker 738's real sibling-text handoff/report evidence and keep every public,
  JS/CJS, native bridge, package-compatibility, and sibling-identity admission
  claim blocked unless separately proven.
- Worker 736 accepts first-class Rust-only nested `toJSON` source-report
  identity generation backed by committed nested fiber inspection. JS/CJS,
  public serialization, native bridge loading/execution, package
  compatibility, and sibling snapshot identity remain blocked.
- Worker 733 accepts narrow Rust-only unmount finished-work identity admission
  for private `toJSON` and `toTree` native diagnostics, consuming Worker 730's
  cleanup evidence. Public unmount, public serialization, native bridge
  loading/execution, JS/CJS admission, and package compatibility remain
  blocked.
- Defer broad multichild/sibling serializer identity admission until the real
  sibling-text committed output/report path is consumed by a dedicated identity
  gate. Worker 735 added only a Rust-private snapshot-path blocker/preflight
  diagnostic; accepted Worker 738 added the real handoff/report prerequisite,
  not identity admission.
- Additional private root/test-renderer bridge gates that require accepted
  `finished_work` / `finished_lanes` handoff before any wider serialization or
  native bridge execution.

Premature until later gates are green: public React DOM root render/unmount,
public `act`, public `flushSync`, public Scheduler timing, public hydration,
resources, forms, and controlled inputs.
