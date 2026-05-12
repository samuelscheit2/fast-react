# Fast React Master Plan

Last updated: 2026-05-12

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

Top-level cap: 30 workers. Current accepted branch baseline before this docs
refresh is main `15432066`
(`Merge worker 1133 NAPI diagnostic-backed metadata`).
Accepted implementation history still includes the post-Worker-997 batch:
Workers 986, 987, 992, 1000, 998, 978, 999, 990, 967, 996, 994, and 989.
Accepted organization-only cleanup history now includes Workers 1002-1062:
Rust test-module extractions, the test-renderer facade/root/diagnostics splits,
the N-API root bridge request split, the root work-loop test split, the
`root_commit` errors/effects/deletions/refs splits, root-commit/host-work test
splits, the function-component handles/errors, effects, deletions, and hook
records splits, the `complete_work` split, the `root_work_loop`
render/preflight splits, the `host_work` payload/mutation/update helper split,
the `sync_flush` root-record split, the test-renderer test extraction to
`crates/fast-react-test-renderer/src/tests.rs`, and the test-renderer
`root_impl` create-route, update-route, host-output, fixture, unmount,
lifecycle execution, TestInstance, act, and error-boundary splits. The accepted
cleanup history also includes the test-renderer child test-module split,
`root_commit` record split, `root_work_loop` complete-handoff split,
`host_work` root-replacement split, `root_scheduler` act split,
`function_component` effects split, sync-flush test-module split, and
`fast-react-napi` test-module split, plus the accepted Workers 1054-1062
splits for root-commit managed-child canaries, host-work deletions,
root-scheduler continuations, root-work-loop context providers, passive
deleted-subtree cleanup, test-renderer serialization execution, React DOM
resource/form tests, React DOM private root bridge shell tests, and
resource/form internals contracts. These cleanups make no runtime or public
compatibility claim.
Accepted root-render evidence now also includes Worker 1065's source-scanner
repair and Workers 1074-1077: minimal root element resolver records, a
test-only HostRoot mount reconciliation canary, a diagnostic
HostComponent/HostText mutation execution gate that still reports blocked, and
a public render conformance probe that still expects public `createRoot` to
throw before `root.render` and leave the DOM shim empty.
Accepted root-render helper input also includes Workers 1083-1085: the public
facade blocked gate was split into a dedicated conformance module, a narrow
production-compiled HostRoot -> HostComponent -> HostText render-shape helper
was added, and a transactional minimal complete-work host helper was added.
These helpers remain private/crate-internal and do not commit, mutate DOM, or
unblock public React DOM root rendering.
Accepted root-render implementation input now also includes Workers 1090,
1095, 1096, 1097, 1111, 1110, 1116, 1120, 1126, 1130, 1129, and 1133: a private
minimal render->complete handoff, a private minimal HostRoot placement commit
executor, JS admission for Rust-shaped private root work-loop metadata with
capability-claim rejection, a split private host-output conformance gate, a
private minimal render->complete->commit placement diagnostic, a private
symbol-backed native placeholder factory for Rust work-loop metadata, a
repaired native no-load guard ledger source mapping, a doc-hidden reconciler
diagnostic API, a symbol-only native private metadata factory contract, a
crate-private Rust NAPI metadata shape module, and a crate-private NAPI
diagnostic probe through TestRenderer, plus diagnostic-backed `fast-react-napi`
metadata with source-owned execution-surface blocker proof and React DOM native
compatibility alias denylist parity. These are private diagnostics, contract
tests, and helper paths only; no HostNodeStore/private records, N-API `.node`
behavior, or public React DOM root rendering is exposed.
Worker 853's competing test-renderer branch was rejected as redundant after
Worker 844 was accepted; do not use it as accepted input.

Current orchestration queue:

- Accepted facts through main `15432066` are recorded in
  `MASTER_PROGRESS.md`.
- No later worker output is listed as live accepted input in this plan
  snapshot.
- Next root-render sequencing after diagnostic-backed package-private NAPI
  metadata is to preserve the private reconciler diagnostic path, source-owned
  execution-surface blockers, repaired no-load guard ledger evidence, React DOM
  native-compatibility alias denylists, and public/native/DOM capability
  rejection while proving any later private NAPI/adapter handoff. Public root
  lifecycle prerequisites remain required before any public
  `createRoot().render(...)` path.

Current project-owned source/test large-file baseline after main `4d9b7712`,
excluding generated oracle JSON and package CJS published artifacts:

- `packages/react-dom/src/client/root-bridge.js`: 29,521 lines
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`: 18,216 lines
- `packages/react-test-renderer/index.js`: 15,407 lines
- `packages/react-dom/src/resource-form-internals-gate.js`: 14,641 lines
- `packages/react-dom/src/client/controlled-restore-queue.js`: 10,949 lines
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`: 10,258 lines
- `packages/react-dom/src/events/plugin-event-system.js`: 9,533 lines
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`: 8,553 lines
- `crates/fast-react-reconciler/src/function_component.rs`: 8,343 lines
- `packages/react-dom/test/resource-form-unsupported-gates/resource-hints.js`: 8,265 lines

Do not run a broad large-file cleanup lane before public React DOM root/render
work. Prefer a single behavior-preserving `root-bridge.js` facade split only if
the orchestrator can reserve that file; defer unrelated resource/form,
controlled-input, event, hydration, test-renderer, and N-API splits until those
behavior lanes need them.

Do not consume future worker outputs as accepted evidence until reviewed,
verified, and merged to main. When any active repair, audit, or validation lane
lands, move the accepted facts into `MASTER_PROGRESS.md` in the next docs pass.

Accepted private compatibility evidence through `8aee0fcd`, accepted public
root-render blocked evidence and private minimal root-render helpers through
`b99841e3`, accepted private render/complete/commit helper, metadata/gate, and
diagnostic-backed NAPI metadata evidence through `15432066`, accepted
organization-only cleanup through `75fb1a47`, plus audit policy through
`732a6b21`, still keeps public
root/render/unmount, `act`,
`react-dom/test-utils.act`, `flushSync`, Scheduler timing, hydration,
resources/forms, public input/change or controlled-input behavior,
serialization, native/reconciler execution, React Children traversal parity,
unsupported hook behavior, event dispatch, package compatibility, and broad
renderer compatibility blocked.

Future workers may intentionally overlap with accepted areas when that improves
throughput. Resolve merge conflicts by preserving accepted private blockers and
canonical evidence requirements.

## Near-Term Sequencing

1. Treat accepted compatibility evidence through `8aee0fcd`, Worker 1077's
   public root-render blocked gate as preserved through Worker 1083's split,
   Workers 1084-1085 as private minimal render-shape and complete-work helper
   input, Workers 1090, 1096, and 1111 as private render/complete/placement
   execution helpers, Worker 1095 as private JS metadata admission with
   capability-claim rejection, Worker 1097 as conformance-gate organization
   evidence, Worker 1110 as a private native placeholder metadata factory,
   Worker 1116 as the repaired private native no-load guard ledger mapping,
   Worker 1120 as a doc-hidden reconciler placement diagnostic export, Worker
   1126 as native private metadata factory contract evidence, Worker 1130 as
   crate-private Rust metadata shape validation, Worker 1129 as a crate-private
   NAPI diagnostic probe, Worker 1133 as diagnostic-backed NAPI metadata
   admission with source-owned execution-surface blockers and native-compatibility
   alias denylists, and cleanup history through `75fb1a47` as private evidence,
   negative public evidence, or file-organization evidence only.
   Public package, root, native, React DOM, test-renderer, Scheduler, `act`,
   `react-dom/test-utils.act`, hydration, resource/form, public
   controlled-input, serialization, React Children lazy/full traversal,
   unsupported hook, event dispatch, and `flushSync` compatibility still require
   fail-closed gates and dual-run oracle evidence.
2. Review future workers and audits against the accepted source-owned
   lifecycle, hydration, `act`, deletion, sync-flush, HostRoot lane handoff,
   scheduler continuation/currentness, reconciler/test-renderer direct
   multi-child fiber inspection, native-generation/cleanup, worker-thread
   cleanup, concurrent update drain, hook staging failure preservation,
   root-listener dispatch, React Children traversal, resource/form/resource
   hints, input/change extraction, controlled-restore queue currentness,
   host-node currentness, Scheduler variant/root currentness, package-surface,
   private-admission ledger, and public blocker requirements before any merge.
3. Use the current `ORCHESTRATOR.md` audit policy: worker self-reports are
   inputs only, and non-trivial or risky implementation changes get independent
   read-only audits whose number and focus are chosen case by case. Hostile
   source review and regression-command reruns are examples, not a mandatory
   pair.
4. Prefer parallelizable independent proofs even when they may conflict in test
   files. Resolve conflicts during merge by keeping all accepted negative tests,
   blockers, and source-ownership checks.
5. Keep package-surface, benchmark, import-smoke, and broad Rust/JS checks green
   after each accepted merge batch.

## Next Queue Candidates

- Behavior-preserving module/facade cleanup can split large Rust modules and
  JS facade files when the change preserves module paths, exports, public API
  shape, runtime behavior, and existing blocker language. Treat these as
  organization-only workers requiring focused tests, package-surface/import
  smoke when facades are touched, and no compatibility claims. Keep future
  cleanup candidates general until a concrete worker is assigned and reviewed.
- Rust root/sync-flush/function/deletion execution can extend accepted Workers
  855, 860, 862-867, 878-879, 889-890, 896, 898, 904, 906-907, 917-921, 936,
  943, 948, 954, 973, 980, 982, 985, 991, 997, and 998, plus Worker 966's
  refreshed private admission 804 managed-child source-token ledger, Worker
  1074's minimal root element resolver, Worker 1075's test-only HostRoot mount
  reconciliation canary, Worker 1076's blocked host mutation execution gate,
  Worker 1084's narrow production HostRoot/HostComponent/HostText render-shape
  helper, and Worker 1085's transactional minimal complete-work host helper
  plus Worker 1090's private minimal render->complete handoff, Worker 1096's
  private minimal HostRoot placement executor, Worker 1111's private minimal
  render->complete->commit diagnostic, and Worker 1120's doc-hidden reconciler
  diagnostic export toward package-private admission evidence first, then
  managed-child, HostText, multi-child, sync-flush delete/post-passive, root
  child replacement/delete-plus-place continuation, FunctionComponent
  deletion/render-phase update/bailout blocker coverage, HostRoot update-queue
  lane handoff, finished-work commit queue-lane consumer, direct
  committed-fiber inspection, terminal host descendant collection,
  scheduler-owned continuation/currentness, HostNodeStore update payload
  currentness, Worker 925 concurrent update drain currentness, Worker 926 hook
  staging failure preservation, Worker 928 HostRoot container descendant
  currentness, Worker 980 expired queue-lane currentness, Worker 982 root
  work-loop bailout, Worker 985 render-phase root consumption, Worker 991
  HostWork delete/place continuation, Worker 997 hook pending-ring currentness,
  and Worker 998 HostText commit currentness shapes only as private test-host
  canaries or blocked diagnostics with source-owned commit, host-node,
  root/lane, scheduler, queue/handoff, store-backed row lane metadata,
  topology, replay, ref/passive, and cleanup validation. Public React
  DOM/test-renderer roots and public `flushSync` remain blocked.
- Test-renderer package-root/native work should use accepted Worker 844
  package-root native execution parity, Workers 859 and 868 Rust private
  lifecycle/native consumer hardening, and Worker 872 package-root/CJS private
  lifecycle execution evidence, plus accepted Workers 881 and 888 private
  serialization and TestInstance lifecycle gates, Worker 895 private
  multi-child test-renderer native lifecycle evidence, Worker 899 source-owned
  direct multi-child fiber inspection, Worker 902 private act/update lifecycle
  boundary evidence, Worker 932 CJS production private act/update lifecycle
  parity evidence, Worker 936 source-bound reconciler generic direct
  multi-child inspection, Worker 941 CJS production TestInstance currentness,
  Worker 946 private test-renderer direct inspection consumer evidence, Worker
  967 serialization/local oracle repair, and Worker 992 private act/Scheduler
  blocker currentness. Worker 917 remains reconciler-owned inspection context
  that keeps the generic test-renderer boundary fail-closed. Worker 853 remains
  rejected/redundant. Public serialization, `ReactTestInstance`,
  JS/CJS/package compatibility, native bridge loading/execution,
  root/act/Scheduler compatibility, and broad multichild identity remain
  blocked.
- React DOM facade/native handoffs may use accepted Worker 848 nested facade
  native handoff metadata, Worker 869 fake-DOM lifecycle snapshots, Worker 874
  private lifecycle request/snapshot boundary hardening, Worker 880 root update
  execution consumer, Worker 883 resource/form lifecycle boundary hardening,
  Worker 891 source-owned root unmount lifecycle request-boundary consumer, and
  Worker 901 source-owned render/update/nested lifecycle boundary consumer,
  plus Worker 912 root-listener currentness, Worker 927 root-listener dispatch
  currentness, Worker 939 focus/blur dispatch currentness, Worker 944 root
  update native handoff currentness, Worker 947 private root-bridge cleanup
  after accepted host-output update smoke evidence, Worker 910 recoverable-error
  boundary admission, Worker 979 profiling createRoot private facade gate,
  Worker 915 symbol-only client facade gates, Worker 958 private input/change
  extraction and controlled-restore queue currentness, and Worker 990
  controlled input/event blocker hardening as diagnostic input, plus Worker
  1077's public render blocked conformance probe and Worker 1083's
  public-facade gate split as negative evidence only, Worker 1095's Rust-shaped
  private root work-loop metadata admission with public/native/DOM
  capability-claim rejection, Worker 1097's private host-output gate split as
  conformance organization evidence only, Worker 1110's private symbol-backed
  native metadata factory as package-private bridge input only, Worker 1116's
  no-load guard ledger fix as private native-generation currentness evidence,
  Worker 1126's symbol-only factory contract as package-surface evidence,
  Worker 1130's Rust metadata shape validation, Worker 1129's NAPI diagnostic
  probe, and Worker 1133's diagnostic-backed NAPI metadata admission as
  package-private bridge input only.
  Worker 920's HostNodeStore payload currentness can inform fake/native host
  update handoffs only when scoped root/fiber/token/phase/target identity is
  preserved. Workers 958 and 990 input/change evidence is consumable only when
  exact root listener registration, dispatch payload, bridge preflight,
  controlled restore gate identity, fake-DOM target limits, and resource/form
  alias rejection are preserved. Any real native/Rust execution or public facade
  work still must prove scheduling, commit, cleanup, DOM output,
  listener/event/ref behavior, controlled input behavior, hydration boundaries,
  native/bindings metadata export/admission, Worker 1116 no-load guard ledger
  currentness, public/browser
  DOM/hydration/event/ref/package/native/Rust alias rejection, and package
  compatibility.
- Resource and form work can consume accepted Worker 856's root execution
  consumer with Worker 850 ledger/source-token metadata and Worker 883
  lifecycle boundary hardening, plus Worker 893's private root/lifecycle-bound
  reset execution evidence and Worker 942's fulfilled-reset generation
  currentness, Worker 952's source-owned resource root lifecycle
  boundary/currentness evidence, Worker 953's path/token evidence-context
  hardening, and Worker 981's resource/form root currentness. Workers 958 and
  990 resource/form smuggling rejections in input/change bridge paths are
  overlap context only, not resource/form execution evidence. Public resources,
  forms, action/reset invocation, React updates, DOM/head mutation, native/root
  execution, and package compatibility remain blocked.
- React `act` and React DOM test-utils work can consume accepted Worker 857's
  frozen, nested source-owned scheduler-driven passive diagnostics, Worker
  885's source-owned root lifecycle boundary gate, Worker 902's private
  test-renderer act/update lifecycle boundary, Worker 992's private
  act/Scheduler blocker currentness, and Worker 913's public React.act
  blocked-currentness gate, plus Worker 930's public
  `react-dom/test-utils.act` blocked-currentness gate. Public `act`, public
  test-utils act callback/thenable/warning behavior, public root work, passive
  effect execution, Scheduler timing, renderer behavior, and package
  compatibility remain blocked.
- Public `flushSync` follow-ups can consume accepted Worker 933's
  source-owned public `react-dom` and `react-dom/profiling` blocked-currentness
  report and Worker 986's refreshed blocked-currentness rows only as
  negative/private evidence, plus Worker 953's caller-override and
  non-enumerable-claim rejection hardening. Callback execution,
  return/thenable compatibility, public root execution, Scheduler queue
  draining, act/test-utils routing, DOM mutation, passive effects,
  package/profiling compatibility, and hydration-only evidence remain blocked.
- Native lifecycle work can consume accepted Worker 858's Rust JSON lifecycle
  mirror, Worker 870's in-process JSON batch lifecycle executor, Worker 873's
  private generation/replay no-stale guard, and Worker 882's native JS
  generation admission ledger, plus Worker 892's private cleanup-generation
  consumer, Worker 908's cleanup-generation currentness gate, Worker 923's
  cleanup currentness admission ledger, Worker 924's worker-thread/environment
  cleanup currentness, Worker 940's cleanup re-entry/retirement currentness,
  Worker 951's cleanup-hook worker-thread/source-row currentness hardening,
  Worker 953's path/slice evidence-context hardening, Worker 993's cleanup
  worker-thread/source provenance, Worker 1110's private symbol-backed metadata
  factory, Worker 1116's repaired no-load guard source mapping, Worker 1126's
  private native metadata factory contract, Worker 1130's crate-private NAPI
  metadata shape, Worker 1129's crate-private diagnostic probe, and Worker
  1133's diagnostic-backed NAPI metadata with source-owned blocker evidence as
  private native-generation currentness evidence.
  Executable native addon loading, cleanup hooks, scheduling,
  renderer/reconciler output, worker-thread teardown, public no-stale-value
  behavior, public native compatibility, and package exports remain blocked.
- React Children helper work can consume accepted Worker 950's private
  source-owned traversal currentness report, Worker 972's lazy traversal oracle,
  Worker 976's lazy renderer blockers, and Worker 995's portal/ref/owner
  blockers only as fail-closed evidence. Full traversal parity, public package
  compatibility, renderer/root/portal execution, owner/ref integration, and
  package-wide React behavior remain blocked until separately oracle-backed.
- React hook facade work can consume accepted Worker 916 transition blocker
  currentness, Worker 918 render-phase update ownership evidence, Worker 926
  hook staging failure-preservation currentness, Worker 929 unsupported
  placeholder hook blocker currentness, Worker 938 CJS/server unsupported hook
  surface currentness, Worker 943 private render-phase staging currentness,
  Worker 956 private `useRef` dispatcher currentness, Worker 974 private
  `useRef` execution evidence, Worker 977 Rust `useRef` execution canary,
  Worker 988 `useRef` renderer lifecycle blockers, Worker 997 hook
  pending-ring currentness, and Worker 999 context/useContext readiness
  blockers, plus Worker 953's unsupported-hook report override/source-proof
  hardening. Public dispatcher routing, `useRef` execution/ref identity, public
  context/provider rendering, unsupported hook execution, external-store
  subscription, callback invocation, ID generation, root scheduling, renderer
  behavior, `act`, Scheduler timing, and package compatibility remain blocked.
- Scheduler variant and root-scheduler continuation work can consume accepted
  Worker 886 as the variant boundary, Worker 909's live source-currentness seal,
  Worker 914's public root-entry currentness gate, and Worker 937's variant
  currentness parity gate for root, native, mock, postTask, and CJS variant
  diagnostics, plus Worker 949's Scheduler variant currentness, Worker 953's
  factory-owned source-report, Worker 987's public timing blocker currentness,
  Worker 1000's boundary factory fail-closed hardening, and Worker 886
  provenance hardening.
  Root-scheduler follow-ups can build on Worker 904's private HostRoot
  queue/lane continuation gate, Worker 907's
  callback/currentness negative canaries, Worker 906's expired default+sync
  continuation, and Worker 934's transition queue/lane continuation, plus
  Worker 948's finished-work commit queue-lane consumer and Worker 980's
  expired queue-lane consumer, only when preserving scheduler identity, Worker
  898 queue/lane proof, store-backed row lane metadata, sequence IDs,
  applied/skipped counts, resulting element, callback identity,
  expired/selected lane currentness, and root/current/finished-work identity.
  Public Scheduler timing, public root/act/package/native behavior,
  postTask/mock compatibility, and package compatibility remain blocked.
- Conformance harness follow-ups can consume accepted Worker 955's discovery
  gate to keep executable conformance gate files covered by workspace scripts,
  and benchmark harness follow-ups can consume Worker 957's result-schema,
  required-scenario, diagnostic-only, duplicate-row, and command-provenance
  false-green hardening. Full conformance execution still has pre-existing
  serialization and private-admission failures, so discovery coverage and
  benchmark manifest/result validation are not broad conformance or performance
  compatibility claims. Benchmark harness follow-ups can also consume Worker
  994's command-provenance currentness hardening without treating it as a
  performance claim.
- Conformance harness follow-ups can also consume accepted Workers 964 and 978
  private admission 727-728 ledger refreshes, Worker 967's serialization/local
  oracle repair, and Worker 989's private admission 729-731 false-green sweep as
  private fail-closed evidence only.
- Root-render conformance harness follow-ups can consume Worker 1065's repaired
  source scanners, Worker 1077's public render blocked probe, Worker 1083's
  public-facade gate split, Worker 1097's private host-output split, Worker
  1111's private minimal placement diagnostic, Worker 1110's native placeholder
  metadata factory, Worker 1120's reconciler diagnostic export, Worker 1126's
  native factory contract, Worker 1130's Rust metadata shape, Worker 1129's
  NAPI diagnostic probe, and Worker 1133's diagnostic-backed NAPI metadata only
  as current fail-closed, package-private, or organization evidence. Public
  root rendering remains blocked until a later worker proves public
  `createRoot().render(...)` execution, DOM mutation, listener/root marker
  behavior, lifecycle prerequisites, and package compatibility against React
  19.2.6.
- Public `hydrateRoot` remains blocked after accepted marker/listener,
  target-claiming, recoverable-error, replay-target preflights, private
  text-claim patch execution, the text-patch admission ledger, Worker 887's
  private lifecycle boundary admission/currentness evidence, Worker 900's
  corrected private admission 820 source ledger for hydrateRoot lifecycle
  boundary rows, Worker 912's listener currentness gate, Worker 910's
  recoverable-error boundary admission, and Worker 996's replay blocker
  currentness. Future hydration work must prove real root creation,
  marker/listener behavior, recoverable error routing, event replay, browser
  DOM mutation, native/reconciler execution, and package compatibility against
  React 19.2.6.
- Additional private root/test-renderer bridge gates can build on Worker 898's
  accepted `finished_work` / `finished_lanes` queue-lane consumer, Worker 904's
  scheduler-owned continuation evidence, Worker 899's test-renderer direct
  multi-child fiber identity proof, Worker 917's reconciler-owned direct
  committed-fiber inspection, Worker 920's host-node update currentness, Worker
  936's source-bound generic inspection, Worker 941's CJS TestInstance
  currentness, Worker 944's root update native handoff currentness, Worker
  946's private test-renderer direct inspection consumer, and Worker 947's
  private root-bridge cleanup-after-update smoke fix only after preserving
  source-owned handoff rows, store-backed row lane metadata, scheduler/commit
  identity, direct child fiber handles, scoped host update currentness, latest
  accepted host-output update identity, and public blockers before any wider
  serialization or native bridge execution.

Premature until later gates are green: public React DOM root render/unmount,
public `act`, public `react-dom/test-utils.act`, public `flushSync`, public
Scheduler timing, public hydration, resources, forms, controlled inputs,
unsupported hooks, and event dispatch.
