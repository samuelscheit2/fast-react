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

Top-level cap: 30 workers. Accepted/merged baseline includes Workers 803-837,
842-846, 848-852, 855-860, 862-874, 878-883, 886, 888-890, 892-893, and
896. Current main after the latest accepted batch is
`c9d3fcf94ba0aa48eaef992efbf7072bd8a9285f`.
Worker 853's competing test-renderer branch was rejected as redundant after
Worker 844 was accepted; do not use it as accepted input.

Current active queue:

- Worker 885: active DO NOT MERGE fix for stale same-root `act` lifecycle
  snapshots.
- Worker 887: active DO NOT MERGE fix to preserve both `nodeSnapshot` and
  hydrateRoot `textContent` snapshot fields.
- Worker 891: active DO NOT MERGE fix for unmount lifecycle blocked-behavior
  aliases and source boundary path.
- Worker 895: active implementation worker.
- Worker 897: active docs worker refreshing coordination docs after the latest
  accepted batch.
- Worker 898: active implementation worker.

Implementation workers 885, 887, 891, 895, and 898 are fixing or active
implementation work only. Do not use their branches as accepted input until
they are reviewed, verified, and merged. Worker 897 is docs-only.

Accepted private evidence still keeps public root/render, `act`, `flushSync`,
Scheduler timing, hydration, resources/forms, serialization, native execution,
package compatibility, and broad renderer compatibility blocked.

Future workers may intentionally overlap with accepted areas when that improves
throughput. Resolve merge conflicts by preserving accepted private blockers and
canonical evidence requirements.

## Near-Term Sequencing

1. Treat the accepted baseline through current main
   `c9d3fcf94ba0aa48eaef992efbf7072bd8a9285f` as private evidence only. Public
   package, root, native, React DOM, test-renderer, Scheduler, `act`,
   hydration, resource/form, serialization, and `flushSync` compatibility still
   require fail-closed gates and dual-run oracle evidence.
2. Re-audit Workers 885, 887, and 891 before reconsidering merge; their active
   fixes remain non-input until the stated lifecycle/currentness/source-boundary
   gaps are closed.
3. Review Workers 895 and 898 against the accepted source-owned lifecycle,
   deletion, sync-flush, HostRoot lane handoff, native-generation,
   resource/form, Scheduler variant, package-surface, and public blocker
   requirements before any merge.
4. Prefer parallelizable independent proofs even when they may conflict in test
   files. Resolve conflicts during merge by keeping all accepted negative tests,
   blockers, and source-ownership checks.
5. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
   after each accepted merge batch.

## Next Queue Candidates

- Rust root/sync-flush/function/deletion execution can extend accepted Workers
  855, 860, 862-867, 878-879, 889-890, and 896 toward managed-child, HostText,
  multi-child, sync-flush delete/post-passive continuation,
  FunctionComponent deletion, and HostRoot update-queue lane handoff shapes
  only as private test-host canaries with source-owned commit, host-node,
  root/lane, queue/handoff, topology, replay, ref/passive, and cleanup
  validation. Public React DOM/test-renderer roots and public `flushSync`
  remain blocked.
- Test-renderer package-root/native work should use accepted Worker 844
  package-root native execution parity, Workers 859 and 868 Rust private
  lifecycle/native consumer hardening, and Worker 872 package-root/CJS private
  lifecycle execution evidence, plus accepted Workers 881 and 888 private
  serialization and TestInstance lifecycle gates. Worker 853 remains
  rejected/redundant. Public serialization, `ReactTestInstance`,
  JS/CJS/package compatibility, native bridge loading/execution,
  root/act/Scheduler compatibility, and broad multichild identity remain
  blocked.
- React DOM facade/native handoffs may use accepted Worker 848 nested facade
  native handoff metadata, Worker 869 fake-DOM lifecycle snapshots, Worker 874
  private lifecycle request/snapshot boundary hardening, Worker 880 root update
  execution consumer, and Worker 883 resource/form lifecycle boundary
  hardening as diagnostic input. Worker 891 remains non-input until accepted.
  Any real native/Rust execution or public facade work still must prove
  scheduling, commit, cleanup, DOM output, listener/event/ref behavior,
  hydration boundaries, and package compatibility.
- Resource and form work can consume accepted Worker 856's root execution
  consumer with Worker 850 ledger/source-token metadata and Worker 883
  lifecycle boundary hardening, plus Worker 893's private root/lifecycle-bound
  reset execution evidence. Public resources, forms, action/reset invocation,
  React updates, DOM/head mutation, native/root execution, and package
  compatibility remain blocked.
- React `act` and React DOM test-utils work can consume accepted Worker 857's
  frozen, nested source-owned scheduler-driven passive diagnostics. Worker 885
  remains non-input until accepted. Public `act`, public root work, passive
  effect execution, Scheduler timing, warnings, thenable behavior, renderer
  behavior, and package compatibility remain blocked.
- Native lifecycle work can consume accepted Worker 858's Rust JSON lifecycle
  mirror, Worker 870's in-process JSON batch lifecycle executor, Worker 873's
  private generation/replay no-stale guard, and Worker 882's native JS
  generation admission ledger, plus Worker 892's private cleanup-generation
  consumer. Executable native addon loading, cleanup hooks, scheduling,
  renderer/reconciler output, worker-thread teardown, public no-stale-value
  behavior, public native compatibility, and package exports remain blocked.
- Scheduler variant work can consume accepted Worker 886 only as a static
  private-admission boundary for root, native, mock, postTask, and CJS variant
  diagnostics. Public Scheduler timing, public root/act/package/native
  behavior, postTask/mock compatibility, and package compatibility remain
  blocked.
- Public `hydrateRoot` remains blocked after accepted marker/listener,
  target-claiming, recoverable-error, replay-target preflights, private
  text-claim patch execution, and the text-patch admission ledger. Worker 887
  remains non-input until accepted. Future hydration work must prove real root
  creation, marker/listener behavior, recoverable error routing, event replay,
  and DOM mutation semantics against React 19.2.6.
- Additional private root/test-renderer bridge gates that require accepted
  `finished_work` / `finished_lanes` handoff before any wider serialization or
  native bridge execution.

Premature until later gates are green: public React DOM root render/unmount,
public `act`, public `flushSync`, public Scheduler timing, public hydration,
resources, forms, and controlled inputs.
