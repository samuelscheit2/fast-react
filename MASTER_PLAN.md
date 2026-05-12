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

Top-level cap: 30 workers. Current accepted branch baseline is main
`88ce0ff4` (`Merge worker 1206 report follow-up`). Accepted
implementation, cleanup, planning, and docs-only history through that commit is
recorded in `MASTER_PROGRESS.md`; this plan lists only current/future work.
Worker 853's competing test-renderer branch was rejected as redundant after
Worker 844 was accepted; do not use it as accepted input.

Current orchestration queue:

- Accepted facts through main `88ce0ff4` are recorded in
  `MASTER_PROGRESS.md`.
- No implementation workers are active in this snapshot.
- Next root-render sequencing after the accepted private NAPI metadata JSON
  adapter/roundtrip, private HTML-like host commit canary, and native React DOM
  render handoff admission, plus the minimal public
  `react-dom/client.createRoot(container)` ->
  `root.render(React.createElement('div', {id?}, text|number))` fake-DOM
  host-output path, same-root repeat div/text fake-DOM update, rendered-root
  unmount cleanup, aligned public-unmount smoke, and test/conformance/smoke-only
  public fake-DOM observability for that already accepted lifecycle, is to
  preserve hostile escaped public conformance for that same fake-DOM lifecycle,
  the private reconciler diagnostic path, source-owned execution-surface
  blockers, repaired no-load guard ledger evidence, React DOM
  native-compatibility alias denylists, React Children source-owned currentness
  hardening, and public/native/browser-DOM capability rejection while proving
  any later private NAPI/adapter handoff or broader public root lifecycle
  extension.

Current project-owned source/test large-file baseline after main `88ce0ff4`,
excluding generated oracle JSON and package CJS published artifacts:

- `packages/react-dom/src/client/root-bridge.js`: 29,521 lines
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`: 18,216 lines
- `packages/react-test-renderer/index.js`: 15,407 lines
- `packages/react-dom/src/resource-form-internals-gate.js`: 14,641 lines
- `packages/react-dom/src/client/controlled-restore-queue.js`: 10,949 lines
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`: 10,277 lines
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

Accepted compatibility evidence through current main `88ce0ff4` includes only
the minimal public fake-DOM div/text `createRoot().render(...)` path above,
Worker 1194's same-root repeat fake-DOM div/text update and rendered-root
unmount cleanup, Worker 1200's smoke alignment with those expectations, and
Worker 1202's narrow test/conformance/smoke-only public fake-DOM observability
for that accepted lifecycle: `children`, `firstElementChild`, `innerHTML`,
`tagName`, escaped text/id serialization, and unsupported `className` plus
object-id fail-closed output-leakage checks. Worker 1204 adds hostile escaped
public facade conformance and false-green coverage for that same narrow
fake-DOM lifecycle only. Worker 1205 adds private React Children traversal
currentness hardening only: helper-owned reports must remain frozen, mutable
helper-created reports fail closed, caller-shaped evidence/proxies fail source
proof first, and public compatibility flags stay false. Worker 1208 adds only
private hook currentness source-proof/freeze validation for
`validateUseRefHookCurrentnessReport`,
`validateUseRefHookExecutionEvidence`,
`validateUseRefHookRendererLifecycleBlockerReport`,
`validateContextHookRendererReadinessReport`, and
`validateUnsupportedPlaceholderHookCurrentnessReport`. Worker 1207 adds only
public `React.act` blocked-currentness source-proof/freeze validation; its
`reactDomClientRootPlaceholder: false` assertion is justified by the accepted
minimal `react-dom/client.createRoot` fake-DOM lifecycle, while public
`React.act` remains blocked. Worker 1210 documents that assertion as audit
repair evidence only. Worker 1206 adds only a conformance Scheduler
native-entry currentness gate that reruns current local native-entry
observations and binds native wrapper/direct native CJS source rows to accepted
Worker 937/886 private Scheduler variant context.
Broader public root render/update/unmount compatibility, real `.node`
loading/N-API runtime, browser DOM compatibility, refs/events/hydration/listeners,
public `React.act` compatibility, act queue flushing, callbacks, thenables,
renderer/root/Scheduler execution, `react-dom/test-utils.act`, `flushSync`,
Scheduler timing,
test-renderer public behavior, resources/forms, public input/change or
controlled-input behavior, serialization, React Children traversal parity,
unsupported hook behavior, broad hook/useRef/context compatibility, package
compatibility, and broad renderer compatibility remain blocked.

Future workers may intentionally overlap with accepted areas when that improves
throughput. Resolve merge conflicts by preserving accepted private blockers and
canonical evidence requirements.

## Near-Term Sequencing

1. Treat accepted compatibility evidence through current main `88ce0ff4` as
   private evidence, negative public evidence, package-private adapter evidence,
   file-organization/planning evidence, Worker 1176's narrow public fake-DOM
   host-output proof, Worker 1194's narrow public same-root repeat div/text
   fake-DOM update and rendered-root unmount cleanup proof, or Worker 1200's
   smoke repair for that lifecycle slice only, or Worker 1202's narrow public
   fake-DOM observable evidence for that same accepted lifecycle only. In
   particular, Worker 1148 is
   large-file planning only; Workers 1144 and 1147 only add crate-private NAPI
   metadata JSON adapter/admission paths; Worker 1157 proves only a private
   HTML-like host commit canary; Worker 1156 only admits symbol-private native
   React DOM render handoff metadata; Worker 1176 proves only minimal public
   `react-dom/client.createRoot(container)` plus one initial div/text
   `root.render(...)` through the fake-DOM adapter; Worker 1194 proves only the
   repeat div/text fake-DOM update and rendered-root `root.unmount()` cleanup;
   Worker 1200 only repairs a smoke test to match those accepted expectations;
   Worker 1202 proves only `children`, `firstElementChild`, `innerHTML`,
   `tagName`, escaped text/id serialization, and unsupported `className` plus
   object-id fail-closed output-leakage checks for the already accepted public
   fake-DOM div/text lifecycle.
   Worker 1204 proves only hostile escaped public facade conformance,
   snapshot-field/side-effect false-green checks, and independent lifecycle
   label evidence for that same public fake-DOM lifecycle. Worker 1205 proves
   only private React Children traversal currentness immutability/source-proof
   hardening with public compatibility flags still false. Worker 1208 proves
   only private hook currentness source-proof/freeze validation for the five
   assigned hook validators, with broad hook, `useRef`, context, and
   unsupported-hook compatibility still blocked. Worker 1207 proves only public
   `React.act` blocked-currentness source-proof/freeze validation; its
   `reactDomClientRootPlaceholder: false` evidence follows from the accepted
   minimal `react-dom/client.createRoot` fake-DOM lifecycle, not from public
   `React.act` compatibility. Worker 1210 only records the audit repair that
   made this assertion explicit. Worker 1206 proves only Scheduler
   native-entry currentness for the native wrapper and direct native CJS rows,
   binding them to Worker 937/886 private source context while preserving
   public Scheduler timing, root, act, mock, postTask, native runtime, package,
   and broad compatibility blockers.
   Broad public root render/update/unmount, broad native, browser DOM,
   test-renderer, Scheduler, public `React.act` compatibility, act queue
   flushing, callbacks, thenables, renderer/root/Scheduler execution,
   `react-dom/test-utils.act`, hydration, refs/listeners/events, resource/form,
   public controlled-input,
   serialization, React Children lazy/full traversal, unsupported hook,
   `flushSync`, real `.node` loading/N-API runtime, broad package, and broad
   renderer compatibility still require fail-closed gates and dual-run oracle
   evidence.
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
  `react-dom/test-utils.act` blocked-currentness gate, plus Worker 1207's
  source-proof/freeze hardening of the public `React.act`
  blocked-currentness report. Public `React.act` compatibility, act queue
  flushing, callbacks, thenables, public test-utils act
  callback/thenable/warning behavior, public root work, passive effect
  execution, renderer/root/Scheduler execution, Scheduler timing, renderer
  behavior, and package compatibility remain blocked.
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
  blockers, plus Worker 1205's frozen/source-proof currentness hardening, only
  as fail-closed evidence. Full traversal parity, public package
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
  hardening, plus Worker 1208's private source-proof/freeze hardening for the
  `useRef` currentness, `useRef` execution, `useRef` renderer lifecycle,
  context readiness, and unsupported placeholder currentness validators. Public
  dispatcher routing, broad hook compatibility, `useRef` execution/ref
  identity, public context/provider rendering, unsupported hook behavior and
  execution, external-store subscription, callback invocation, ID generation,
  root scheduling, renderer behavior, `act`, Scheduler timing, and package
  compatibility remain blocked.
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
  NAPI diagnostic probe, Worker 1133's diagnostic-backed NAPI metadata, and
  Worker 1176's minimal public div/text fake-DOM host-output row, plus Worker
  1194's minimal repeat div/text fake-DOM update and rendered-root unmount rows
  and Worker 1200's aligned smoke repair, plus Worker 1202's observable
  fake-DOM `children`, `firstElementChild`, `innerHTML`, `tagName`, and
  escaped serialization evidence, plus Worker 1204's hostile escaped public
  facade conformance/false-green hardening, for that lifecycle only. Broader
  public root rendering remains blocked outside that accepted fake-DOM div/text
  lifecycle slice until later workers prove additional render/update/unmount
  shapes, browser DOM mutation, listener/root marker behavior, lifecycle
  prerequisites, and package compatibility against React 19.2.6.
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

Premature until later gates are green: broad public React DOM root
render/update/unmount beyond the accepted minimal fake-DOM div/text lifecycle,
public `act`, public `react-dom/test-utils.act`, public `flushSync`, public
Scheduler timing, public hydration, resources, forms, controlled inputs,
unsupported hooks, and event dispatch.
