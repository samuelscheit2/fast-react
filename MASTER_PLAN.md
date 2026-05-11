# Fast React Master Plan

Last updated: 2026-05-11

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

Top-level cap: 30 workers. Workers 803-819 have been accepted, verified,
merged, and cleaned up. Workers 820-825 are active in isolated worktrees.
Accepted private evidence still keeps public root, act, Scheduler timing,
hydration, serialization, native execution, package compatibility, and broad
renderer compatibility blocked.

Active workers:

- Worker 820: static private-admission ledger for accepted Workers 803/817.
- Worker 821: static native cleanup stale-evidence admission ledger.
- Worker 822: React DOM test-utils act negative matrix.
- Worker 823: resource/form reset-action private preflight.
- Worker 824: hydrateRoot private execution-preflight boundary.
- Worker 825: static test-renderer private-admission ledger for accepted
  Workers 816/818.

Future workers may intentionally overlap with accepted areas when that improves
throughput. Resolve merge conflicts by preserving accepted private blockers and
canonical evidence requirements.

## Near-Term Sequencing

1. Audit and merge Workers 820, 821, 822, 823, 824, and 825 as they complete.
   Expect overlap in conformance ledgers, React DOM hydration/resource/form
   tests, React DOM test-utils act gates, and test-renderer private evidence.
2. Prefer parallelizable independent proofs even when they may conflict in test
   files. Resolve conflicts during merge by keeping all accepted negative tests,
   blockers, and source-ownership checks.
3. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
   after each accepted merge batch.

## Next Queue Candidates

- Scheduler work can move beyond the accepted delayed renderer-root producer and
  React delayed mock preflight only after public Scheduler timing, public
  `act`/root semantics, renderer/effect execution, public flush helper
  behavior, and compatibility are proven together.
- Native worker-thread teardown can move beyond Worker 740's inert package
  mirror only after executable native addon loading, cleanup hooks, scheduling,
  renderer/reconciler output, and no-stale-value behavior are proven together.
- Public `hydrateRoot` remains blocked after accepted marker/listener,
  target-claiming, recoverable-error, and replay-target preflights. Future
  hydration work must prove real root creation, marker/listener behavior,
  recoverable error routing, event replay, and DOM mutation semantics against
  React 19.2.6.
- Future sibling-text native execution or JS/CJS serialization work should
  consume the dedicated private sibling-text identity gates explicitly. Public
  sibling-text serialization, package compatibility, native bridge
  loading/execution, and broad multichild identity remain blocked.
- Resource and form work remains private/fake after accepted root-map storage
  and rejected-error preflights. Public resources, forms, reset/action
  invocation, DOM/head mutation, and package compatibility remain blocked.
- Worker 736's nested `toJSON` source-report identity and Worker 733's unmount
  identity gates are now connected by an accepted static bridge ledger and are
  active input for Worker 825. JS/CJS, public serialization, native bridge
  loading/execution, and package compatibility remain blocked.
- Additional private root/test-renderer bridge gates that require accepted
  `finished_work` / `finished_lanes` handoff before any wider serialization or
  native bridge execution.

Premature until later gates are green: public React DOM root render/unmount,
public `act`, public `flushSync`, public Scheduler timing, public hydration,
resources, forms, and controlled inputs.
