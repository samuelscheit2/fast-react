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

Top-level cap: 30 workers. Workers 785-802 have been accepted, verified,
merged, and cleaned up. Workers 803-818 are active in isolated worktrees.
Accepted private evidence still keeps public root, act, Scheduler timing,
hydration, serialization, native execution, package compatibility, and broad
renderer compatibility blocked.

Active workers:

- Worker 803: Rust managed-child sibling-order private canary.
- Worker 804: static admission ledger for Worker 785 managed child evidence.
- Worker 805: static Scheduler diagnostics admission ledger.
- Worker 806: static hydrateRoot admission ledger.
- Worker 807: static native no-load admission ledger.
- Worker 808: static resource/form admission ledger.
- Worker 809: test-renderer sibling-text negative matrix.
- Worker 810: static React act/Scheduler diagnostics ledger.
- Worker 811: React DOM hydration replay/target negative matrix.
- Worker 812: resource/form fake-metadata negative matrix.
- Worker 813: Scheduler mock diagnostics descriptor negative matrix.
- Worker 814: React act expired/delayed Scheduler negative matrix.
- Worker 815: native worker-thread cleanup stale-evidence matrix.
- Worker 816: test-renderer unmount/nested source-report bridge gate.
- Worker 817: root work-loop finished-lanes handoff negative matrix.
- Worker 818: static private-admission ledger for Workers 733/736.

Future workers may intentionally overlap with accepted areas when that improves
throughput. Resolve merge conflicts by preserving accepted private blockers and
canonical evidence requirements.

## Near-Term Sequencing

1. Audit and merge Workers 803-818 as they complete. Expect overlap in
   Scheduler/React act static evidence, React DOM hydration/resource/form
   ledgers and negative matrices, test-renderer sibling-text/unmount/nested
   tests, native no-load cleanup coverage, and Rust managed-child/root
   handoffs.
2. Launch the next parallel batch from accepted private evidence when a task has
   a narrow proof boundary: delayed Scheduler/React act diagnostics, hydrateRoot
   marker/listener/target/recoverable-error rows, resource/form fake metadata,
   sibling-text serialization/native evidence, and managed child host traversal.
3. Prefer parallelizable independent proofs even when they may conflict in test
   files. Resolve conflicts during merge by keeping all accepted negative tests,
   blockers, and source-ownership checks.
4. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
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
  target-claiming, and recoverable-error preflights. Future hydration work must
  prove real root creation, marker/listener behavior, recoverable error routing,
  event replay, and DOM mutation semantics against React 19.2.6.
- Future sibling-text native execution or JS/CJS serialization work should
  consume the dedicated private sibling-text identity gates explicitly. Public
  sibling-text serialization, package compatibility, native bridge
  loading/execution, and broad multichild identity remain blocked.
- Resource and form work remains private/fake after accepted root-map storage
  and rejected-error preflights. Public resources, forms, reset/action
  invocation, DOM/head mutation, and package compatibility remain blocked.
- Worker 736's nested `toJSON` source-report identity and Worker 733's unmount
  identity gates remain available private evidence for later native or
  serialization gates. JS/CJS, public serialization, native bridge
  loading/execution, and package compatibility remain blocked.
- Additional private root/test-renderer bridge gates that require accepted
  `finished_work` / `finished_lanes` handoff before any wider serialization or
  native bridge execution.

Premature until later gates are green: public React DOM root render/unmount,
public `act`, public `flushSync`, public Scheduler timing, public hydration,
resources, forms, and controlled inputs.
