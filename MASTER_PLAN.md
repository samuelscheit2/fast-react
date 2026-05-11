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

Top-level cap: 30 workers. Accepted/merged baseline for this branch includes
Workers 803-837, 842-846, 848-852, 855-860, 862-874, 878-883, 885-893,
895-896, 898-902, 904, 906-909, 912-930, and docs refresh Worker 922.
Current baseline is `9af7741e`
(`Merge worker 930 react dom test utils act blocked currentness`). Worker
853's competing test-renderer branch was rejected as redundant after Worker
844 was accepted; do not use it as accepted input.

Current active queue:

- Worker 910: fixing after DO NOT MERGE for hydration recoverable-error
  boundary admission; do not treat it as accepted input.
- Worker 931: docs-only refresh for the `9af7741e` baseline.
- Worker 932: active test-renderer CJS `act` lifecycle parity worker.
- Worker 933: active public `flushSync` blocked-currentness worker.
- Worker 934: active transition queue-lane scheduler continuation worker.

If Workers 910 or 932-934 merge after this branch point, update this section
and move their accepted facts into `MASTER_PROGRESS.md` in the next docs pass.

Accepted private evidence through `9af7741e` still keeps public
root/render/unmount, `act`, `react-dom/test-utils.act`, `flushSync`, Scheduler
timing, hydration, resources/forms, serialization, native/reconciler execution,
unsupported hook behavior, event dispatch, package compatibility, and broad
renderer compatibility blocked.

Future workers may intentionally overlap with accepted areas when that improves
throughput. Resolve merge conflicts by preserving accepted private blockers and
canonical evidence requirements.

## Near-Term Sequencing

1. Treat the accepted branch baseline through `9af7741e` as private evidence
   only. Public package, root, native, React DOM, test-renderer, Scheduler,
   `act`, `react-dom/test-utils.act`, hydration, resource/form,
   serialization, unsupported hook, event dispatch, and `flushSync`
   compatibility still require fail-closed gates and dual-run oracle evidence.
2. Review Workers 910 and 932-934 against the accepted source-owned lifecycle,
   hydration, `act`, deletion, sync-flush, HostRoot lane handoff, scheduler
   continuation/currentness, reconciler/test-renderer direct multi-child fiber
   inspection, native-generation/cleanup, worker-thread cleanup, concurrent
   update drain, hook staging failure preservation, root-listener dispatch,
   resource/form, host-node currentness, Scheduler variant/root currentness,
   package-surface, and public blocker requirements before any merge. Do not
   consume their outputs until reviewed, verified, and merged.
3. Prefer parallelizable independent proofs even when they may conflict in test
   files. Resolve conflicts during merge by keeping all accepted negative tests,
   blockers, and source-ownership checks.
4. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
   after each accepted merge batch.

## Next Queue Candidates

- Rust root/sync-flush/function/deletion execution can extend accepted Workers
  855, 860, 862-867, 878-879, 889-890, 896, 898, 904, 906-907, 917-921 toward
  managed-child, HostText, multi-child, sync-flush delete/post-passive
  continuation, FunctionComponent deletion/render-phase update/bailout blocker
  coverage, HostRoot update-queue lane handoff, finished-work commit queue-lane
  consumer, direct committed-fiber inspection, terminal host descendant
  collection, scheduler-owned continuation/currentness, HostNodeStore update
  payload currentness, Worker 925 concurrent update drain currentness, Worker
  926 hook staging failure preservation, and Worker 928 HostRoot container
  descendant currentness shapes only as private test-host canaries with
  source-owned commit, host-node, root/lane, scheduler, queue/handoff,
  store-backed row lane metadata, topology, replay, ref/passive, and cleanup
  validation. Public React DOM/test-renderer roots and public `flushSync`
  remain blocked.
- Test-renderer package-root/native work should use accepted Worker 844
  package-root native execution parity, Workers 859 and 868 Rust private
  lifecycle/native consumer hardening, and Worker 872 package-root/CJS private
  lifecycle execution evidence, plus accepted Workers 881 and 888 private
  serialization and TestInstance lifecycle gates, Worker 895 private
  multi-child test-renderer native lifecycle evidence, Worker 899 source-owned
  direct multi-child fiber inspection, Worker 902 private act/update lifecycle
  boundary evidence, and Worker 917 only as reconciler-owned inspection context
  that keeps the generic test-renderer boundary fail-closed. Worker 853 remains
  rejected/redundant. Public serialization, `ReactTestInstance`, JS/CJS/package
  compatibility, native bridge loading/execution, root/act/Scheduler
  compatibility, and broad multichild identity remain blocked.
- React DOM facade/native handoffs may use accepted Worker 848 nested facade
  native handoff metadata, Worker 869 fake-DOM lifecycle snapshots, Worker 874
  private lifecycle request/snapshot boundary hardening, Worker 880 root update
  execution consumer, Worker 883 resource/form lifecycle boundary hardening,
  Worker 891 source-owned root unmount lifecycle request-boundary consumer, and
  Worker 901 source-owned render/update/nested lifecycle boundary consumer,
  plus Worker 912 root-listener currentness, Worker 927 root-listener dispatch
  currentness, and Worker 915 symbol-only client facade gates, as diagnostic
  input. Worker 920's HostNodeStore payload currentness can inform fake/native
  host update handoffs only when scoped
  root/fiber/token/phase/target identity is preserved. Any real native/Rust
  execution or public facade work still must prove scheduling, commit, cleanup,
  DOM output, listener/event/ref behavior, hydration boundaries,
  public/browser DOM/hydration/event/ref/package/native/Rust alias rejection,
  and package compatibility.
- Resource and form work can consume accepted Worker 856's root execution
  consumer with Worker 850 ledger/source-token metadata and Worker 883
  lifecycle boundary hardening, plus Worker 893's private root/lifecycle-bound
  reset execution evidence. Public resources, forms, action/reset invocation,
  React updates, DOM/head mutation, native/root execution, and package
  compatibility remain blocked.
- React `act` and React DOM test-utils work can consume accepted Worker 857's
  frozen, nested source-owned scheduler-driven passive diagnostics, Worker
  885's source-owned root lifecycle boundary gate, Worker 902's private
  test-renderer act/update lifecycle boundary, and Worker 913's public
  React.act blocked-currentness gate, plus Worker 930's public
  `react-dom/test-utils.act` blocked-currentness gate. Public `act`, public
  test-utils act callback/thenable/warning behavior, public root work, passive
  effect execution, Scheduler timing, renderer behavior, and package
  compatibility remain blocked.
- Native lifecycle work can consume accepted Worker 858's Rust JSON lifecycle
  mirror, Worker 870's in-process JSON batch lifecycle executor, Worker 873's
  private generation/replay no-stale guard, and Worker 882's native JS
  generation admission ledger, plus Worker 892's private cleanup-generation
  consumer, Worker 908's cleanup-generation currentness gate, Worker 923's
  cleanup currentness admission ledger, and Worker 924's worker-thread/
  environment cleanup currentness. Executable native addon loading, cleanup
  hooks, scheduling, renderer/reconciler output, worker-thread teardown, public
  no-stale-value behavior, public native compatibility, and package exports
  remain blocked.
- React hook facade work can consume accepted Worker 916 transition blocker
  currentness, Worker 918 render-phase update ownership evidence, Worker 926
  hook staging failure-preservation currentness, and Worker 929 unsupported
  placeholder hook blocker currentness. Public dispatcher routing, unsupported
  hook execution, external-store subscription, callback invocation, ID
  generation, root scheduling, renderer behavior, `act`, Scheduler timing, and
  package compatibility remain blocked.
- Scheduler variant and root-scheduler continuation work can consume accepted
  Worker 886 as the variant boundary, Worker 909's live source-currentness seal,
  and Worker 914's public root-entry currentness gate for root, native, mock,
  postTask, and CJS variant diagnostics. Root-scheduler follow-ups can build on
  Worker 904's private HostRoot queue/lane continuation gate, Worker 907's
  callback/currentness negative canaries, and Worker 906's expired default+sync
  continuation only when preserving scheduler identity, Worker 898 queue/lane
  proof, store-backed row lane metadata, sequence IDs, applied/skipped counts,
  resulting element, callback identity, expired/selected lane currentness, and
  root/current/finished-work identity. Public Scheduler timing, public
  root/act/package/native behavior, postTask/mock compatibility, and package
  compatibility remain blocked.
- Public `hydrateRoot` remains blocked after accepted marker/listener,
  target-claiming, recoverable-error, replay-target preflights, private
  text-claim patch execution, the text-patch admission ledger, Worker 887's
  private lifecycle boundary admission/currentness evidence, Worker 900's
  corrected private admission 820 source ledger for hydrateRoot lifecycle
  boundary rows, and Worker 912's listener currentness gate. Worker 910 remains
  unaccepted in this baseline. Future hydration work must prove real root
  creation, marker/listener behavior, recoverable error routing, event replay,
  browser DOM mutation, native/reconciler execution, and package compatibility
  against React 19.2.6.
- Additional private root/test-renderer bridge gates can build on Worker 898's
  accepted `finished_work` / `finished_lanes` queue-lane consumer, Worker 904's
  scheduler-owned continuation evidence, Worker 899's test-renderer direct
  multi-child fiber identity proof, Worker 917's reconciler-owned direct
  committed-fiber inspection, and Worker 920's host-node update currentness
  only after preserving source-owned handoff rows, store-backed row lane
  metadata, scheduler/commit identity, direct child fiber handles, scoped host
  update currentness, and public blockers before any wider serialization or
  native bridge execution.

Premature until later gates are green: public React DOM root render/unmount,
public `act`, public `react-dom/test-utils.act`, public `flushSync`, public
Scheduler timing, public hydration, resources, forms, controlled inputs,
unsupported hooks, and event dispatch.
