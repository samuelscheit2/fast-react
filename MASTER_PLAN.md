# Fast React Master Plan

Last updated: 2026-05-13

This file is the human-readable current and future work plan. Machine-readable
live task state and deterministic transitions belong in
`docs/orchestration/state.json`. Accepted history belongs in
`MASTER_PROGRESS.md`; project orchestration configuration belongs in
`docs/orchestration/PROJECT.md`.

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

Top-level cap: 30 workers. Current accepted implementation head before this
docs pass is main `1dbe4bef` (`Merge worker 1280 transition hook dispatcher metadata`).
Accepted implementation, cleanup, planning, and docs-only history
that is not under active repair is recorded in `MASTER_PROGRESS.md`; this plan
lists only current/future work.
Worker 853's competing test-renderer branch was rejected as redundant after
Worker 844 was accepted; do not use it as accepted input.
Worker 1219's docs-only branch is superseded by main `8f611f0e` and is not
accepted input because it preserves the stale `fd026e4b` docs-head wording and
the pre-audit Worker 1215 full-hash typo.

Current orchestration queue:

- Workers 1253, 1254, 1257, 1258, 1259, 1260, 1261, 1262, 1263, 1264,
  1269, 1270, 1271, 1272, 1277 through 1280, 1286 through 1290,
  1296 through 1299, and 1306, 1308, and 1310
  have been reviewed, repaired where needed, merged, and recorded as accepted
  history.
- Scouts 1265, 1266, 1267, and 1268 reported concrete next-lane candidates.
- Scouts 1273 and 1276 reported concrete next-lane candidates.
- Scout 1275 reported a concrete native/no-load next-lane candidate.
- Scout 1274 reported a concrete React hooks/core facade next-lane candidate.
- Scout 1281 reported a concrete Rust scheduler/root next-lane candidate.
- Scout 1284 reported a concrete native/no-load next-lane candidate.
- Scout 1282 reported a concrete React DOM next-lane candidate.
- Scout 1283 reported a concrete react-test-renderer next-lane candidate.
- Scout 1285 reported a concrete React core/hooks next-lane candidate.
- Scouts 1291 through 1295 reported concrete next-lane candidates.
- Worker 1300 sixth repair is active for react-test-renderer TestInstance
  query-bridge local-gate source proofing after source audit found detached CJS
  stub false greens, broken return wiring, first-return/top-level binding gaps,
  control-flow, spread override, nested-return, guard-binding, duplicate-key,
  helper-order, `var` redeclaration, method duplicate-key, and escaped-key gaps.
- Scout 1301 reported a Rust root/scheduler source-metadata currentness lane;
  Worker 1306 has been reviewed, merged, and recorded as accepted history.
- Scout 1302 reported a React DOM conformance-only nested lifecycle lane;
  Worker 1307 completed implementation and is under source/verification audit.
- Scout 1304 reported a native no-load generation source-ownership lane;
  Worker 1309 completed implementation and is under source/verification audit.
- Scout 1305 reported a React Children currentness override alias lane; Worker
  1308 has been reviewed, merged, and recorded as accepted history.
- Scout 1303 reported a react-test-renderer error-surface row-contract lane;
  Worker 1310 has been reviewed, merged, and recorded as accepted history.
- Scouts 1255 and 1256 remain no-report superseded lanes; their replacement
  findings seeded Workers 1258 and 1259.

Current project-owned source/test large-file baseline after accepted
implementation/evidence baseline main `446897a1`,
excluding generated oracle JSON and package CJS published artifacts:

- `packages/react-dom/src/client/root-bridge.js`: 30,464 lines
- `tests/conformance/test/react-test-renderer-create-routing-gate.test.mjs`: 19,026 lines
- `packages/react-test-renderer/index.js`: 17,251 lines
- `packages/react-dom/src/resource-form-internals-gate.js`: 14,641 lines
- `packages/react-dom/src/client/controlled-restore-queue.js`: 10,949 lines
- `tests/conformance/src/react-dom-root-render-e2e-conformance-gate.mjs`: 10,282 lines
- `packages/react-dom/src/events/plugin-event-system.js`: 9,533 lines
- `crates/fast-react-reconciler/src/root_scheduler/tests.rs`: 9,551 lines
- `tests/conformance/src/react-test-renderer-serialization-local-gate.test.mjs`: 9,241 lines
- `crates/fast-react-reconciler/src/root_scheduler.rs`: 8,545 lines

Do not run a broad large-file cleanup lane before public React DOM root/render
work. Prefer a single behavior-preserving `root-bridge.js` facade split only if
the orchestrator can reserve that file; defer unrelated resource/form,
controlled-input, event, hydration, test-renderer, and N-API splits until those
behavior lanes need them.

Do not consume future worker outputs as accepted evidence until reviewed,
verified, and merged to main. When any active repair, audit, or validation lane
lands, move the accepted facts into `MASTER_PROGRESS.md` in the next docs pass.

Accepted compatibility evidence through current main `1dbe4bef` remains narrow.
The only public React DOM root behavior
accepted so far is the fake-DOM div/text `createRoot().render(...)` lifecycle:
initial render, same-root div/text/id update, id removal, `render(null)` cleanup,
rendered-root unmount cleanup, idempotent repeated unmount,
recreate-after-unmount, and the narrow nested fake-DOM
`<div id?><span>{text}</span></div>` lifecycle with source-owned parent/child
mutation evidence plus the test/conformance/smoke-only observable fake-DOM
fields and explicit public-facade null/unmount conformance rows already recorded
in progress. Recent accepted evidence adds
recursive conformance discovery coverage, no-load private native metadata source
ledgers with exact capability-claim blockers, React DOM private subpath/native
alias denylists, public render capability rejection rows, aligned smoke and
conformance rejection matrices, public component-wrapper render execution
blockers for function/memo/forwardRef/lazy element types, private React Children
currentness hardening against nested mutable evidence plus hostile
`Object.freeze` replacement, clone/proxy, stale source-report, public-alias, and
proxy-trap paths, exact-three private same-transition queue-lane currentness
evidence, refreshed private-admission 727/728, 739/745, and 804 source ledgers,
private sync-flush minimal host placement evidence, private passive destroy
clear-before-invoke evidence, scheduler root currentness coverage for all
accepted Scheduler root scenarios with exact row/source manifests and
claim-alias blockers, scheduler local observation row and behavior evidence
exact-shape validation against source/evidence smuggling including inherited
`Object.prototype` source-metadata blockers, and
react-test-renderer serialization oracle/local-status gates for the current
placeholder package, exact placeholder package-root/JS/CJS/shallow currentness,
private package-root create bridge admission guards requiring source-owned
root-create preflight evidence, private/test-only sync-flush placement
committed-fiber inspection, and private queued minimal HostRoot update evidence
with update-then-cleanup fail-closed coverage, direct React Children object-key
default-hint coercion parity, and conformance discovery static re-export
coverage, plus private `startTransition` rootless currentness evidence with
exact report/array key validation, test-only Scheduler same-lane early rejection
canaries, native no-load/source-currentness prototype-row rejection, and
test-renderer private cross-entrypoint bridge currentness while public
test-renderer behavior remains blocked. Queued minimal HostRoot cleanup also now
validates detached-host ownership before publication. React DOM public facade
host-prop validation now rejects inherited root-bridge capability and claim
aliases, including non-enumerable Object.prototype pollution and proxy
prototype traps, before private rendering. Native root work-loop metadata
source-currentness rows require exact own keys. Private FunctionComponent
deleted-subtree teardown rejects live topology drift before ref cleanup,
passive destroy, host detach, or host operations. Queued minimal HostRoot
source preflight rejects missing root-element handles and root text sources
before enqueue, render, commit, current switch, finished-work metadata, pending
lanes, render-phase work, or host mutation. Native generation-admission ledger
rows require exact own data keys. Queued minimal HostRoot cleanup now has
extra-sibling live topology drift canaries, and react-test-renderer private root
handle update/unmount routes reject cloned, symbol-spoofed, and
prototype-backed handles without WeakMap ownership. Test-renderer private
admission ledgers reject required evidence tokens left only in comments,
including JS template interpolation comments and delegated 733/736 bridge
evidence comments. React DOM public root rendering now rejects inherited
element-prototype capability and diagnostic `public*` fields before private
adapter render. Native cleanup-hook preflight evidence requires exact own rows
and rejects broad inherited public/native/package/root/worker/execution aliases.
Transition hook dispatcher metadata now requires source-owned singleton
identity before field inspection.
Broader public root render/update/unmount compatibility, real `.node`
loading/N-API runtime, browser DOM compatibility, refs/events/hydration/listeners,
public `React.act` compatibility, act queue flushing, callbacks, thenables,
renderer/root/Scheduler execution, `react-dom/test-utils.act`, `flushSync`,
Scheduler timing,
test-renderer public behavior, resources/forms, public input/change or
controlled-input behavior, serialization, broad React Children traversal parity,
unsupported hook behavior, broad hook/useRef/context compatibility, public
`react-dom/test-utils.act` callback/thenable behavior, public `flushSync`
callback/thenable/root/Scheduler behavior, package compatibility, and broad
renderer compatibility remain blocked.

Future workers may intentionally overlap with accepted areas when that improves
throughput. Resolve merge conflicts by preserving accepted private blockers and
canonical evidence requirements.

## Near-Term Sequencing

1. Treat accepted compatibility evidence through current main `1dbe4bef` as
   private evidence, negative public evidence, package-private adapter evidence,
   file-organization/planning evidence, and the narrow fake-DOM public div/text
   plus nested fake-DOM lifecycle evidence described above, including
   `render(null)` cleanup and idempotent unmount cleanup. Public render
   capability rejection rows, public wrapper execution blockers, private native
   metadata and admission ledgers, React DOM private denylist parity, React
   Children freeze/proxy currentness hardening, exact-two/exact-three private
   same-transition currentness, sync-flush placement and committed-fiber
   inspection, queued minimal HostRoot private update evidence, direct Children
   object-key default coercion parity, conformance discovery re-export coverage,
   private `startTransition` rootless currentness with exact report validation,
   Scheduler same-lane early rejection canaries, native prototype-row rejection,
   test-renderer cross-entrypoint bridge currentness, passive destroy evidence,
   queued minimal cleanup detached-host ownership validation, scheduler root
   currentness completeness, scheduler local
   row/evidence source validation, test-renderer placeholder currentness,
   test-renderer private create/serialization gates, queued minimal source
   preflight inertness, native generation exact-key admission, queued minimal
   cleanup live-sibling drift rejection, and test-renderer root-handle WeakMap
   ownership canaries, plus private ledger comment-proof token evidence, are
   blockers and currentness evidence only. React DOM inherited element-prototype
   public-field rejection is accepted negative public facade evidence only; it
   does not open broader public root, native, browser DOM, component rendering,
   Children traversal, package, Scheduler, effects, test-renderer, or renderer
   compatibility. Native cleanup-hook preflight exactness is no-load private
   evidence only and does not open real native addon or worker execution.
   Transition dispatcher metadata source ownership is private negative evidence
   only and does not open public `useTransition`, Scheduler, root, package, or
   hook compatibility.
2. Review future workers and audits against the accepted source-owned
   lifecycle, hydration, `act`, deletion, sync-flush, HostRoot lane handoff,
   scheduler continuation/currentness, reconciler/test-renderer direct
   multi-child fiber inspection, native-generation/cleanup, worker-thread
   cleanup, concurrent update drain, hook staging failure preservation,
   root-listener dispatch, React Children traversal, resource/form/resource
   hints, input/change extraction, controlled-restore queue currentness,
   host-node currentness, Scheduler variant/root currentness, package-surface,
   private-admission ledger, and public blocker requirements before any merge.
3. Use the current orchestration policy represented by
   `docs/orchestration/PROJECT.md` and live state in
   `docs/orchestration/state.json`: worker self-reports are inputs only, and
   non-trivial or risky implementation changes get independent read-only audits
   whose number and focus are chosen case by case. Hostile source review and
   regression-command reruns are examples, not a mandatory pair.
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
  Worker 998 HostText commit currentness, Worker 1237 exact-two/exact-three
  same-transition currentness, and Worker 1241 sync-flush minimal host placement
  shapes only as private test-host canaries or blocked diagnostics with
  source-owned commit, host-node, root/lane, scheduler, queue/handoff,
  store-backed row lane metadata, topology, replay, ref/passive, and cleanup
  validation. Public React
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
  probe, Worker 1133's diagnostic-backed NAPI metadata admission as
  package-private bridge input only, Worker 1228's repaired no-load private
  native metadata source ledger, Worker 1233's React DOM private subpath/native
  alias denylist parity, Workers 1232/1235 public render capability rejection
  matrices, Worker 1238 public wrapper execution blockers, and Worker 1242
  null-render/idempotent-unmount fake-DOM lifecycle evidence as narrow accepted
  public fake-DOM evidence only.
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
  act/Scheduler blocker currentness, Worker 1244's private passive destroy
  clear-before-invoke evidence, and Worker 913's public React.act
  blocked-currentness gate, plus Worker 930's public
  `react-dom/test-utils.act` blocked-currentness gate, plus Worker 1207's
  source-proof/freeze hardening of the public `React.act`
  blocked-currentness report, plus Worker 1213's source-proof/freeze hardening
  of the public `react-dom/test-utils.act` blocked-currentness report. Public
  `React.act` compatibility, act queue flushing, callbacks, thenables, public
  test-utils act
  callback/thenable/warning behavior, public root work, passive effect
  execution, renderer/root/Scheduler execution, Scheduler timing, renderer
  behavior, and package compatibility remain blocked.
- Public `flushSync` follow-ups can consume accepted Worker 933's
  source-owned public `react-dom` and `react-dom/profiling` blocked-currentness
  report and Worker 986's refreshed blocked-currentness rows only as
  negative/private evidence, plus Worker 953's caller-override and
  non-enumerable-claim rejection hardening, plus Worker 1214's source-proof
  hardening for the public `flushSync` blocked-currentness report. Callback execution,
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
  metadata shape, Worker 1129's crate-private diagnostic probe, Worker 1133's
  diagnostic-backed NAPI metadata, and Worker 1228's exact-claim-repaired
  no-load source ledger with source-owned blocker evidence as private
  native-generation currentness evidence.
  Executable native addon loading, cleanup hooks, scheduling,
  renderer/reconciler output, worker-thread teardown, public no-stale-value
  behavior, public native compatibility, and package exports remain blocked.
- React Children helper work can consume accepted Worker 950's private
  source-owned traversal currentness report, Worker 972's lazy traversal oracle,
  Worker 976's lazy renderer blockers, and Worker 995's portal/ref/owner
  blockers, plus Worker 1205's frozen/source-proof currentness hardening,
  Worker 1222's nested source-freeze hardening, and Worker 1234's freeze-return
  authority/proxy-trap rejection hardening, only as fail-closed evidence.
  Full traversal parity, public package
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
  context readiness, and unsupported placeholder currentness validators, plus
  Worker 1225's nested freeze hardening for those same private validators.
  Public
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
  Worker 948's finished-work commit queue-lane consumer, Worker 980's
  expired queue-lane consumer, Worker 1221's entangled transition queue-lane
  continuation, Worker 1220's same-transition multi-update currentness, and
  Worker 1224's exact-two/live-queue validation repair, only when preserving
  scheduler identity, Worker 898 queue/lane proof,
  store-backed row lane metadata, sequence IDs, applied/skipped counts,
  resulting element, callback identity, expired/selected lane currentness, and
  root/current/finished-work identity.
  Public Scheduler timing, public root/act/package/native behavior,
  postTask/mock compatibility, and package compatibility remain blocked.
- Conformance harness follow-ups can consume accepted Worker 955's discovery
  gate and Worker 1227's recursive conformance discovery repair to keep
  executable conformance gate files covered by workspace scripts, including
  sidecar fixture coverage blockers. Benchmark harness follow-ups can consume
  Worker 957's result-schema, required-scenario, diagnostic-only, duplicate-row,
  and command-provenance false-green hardening. Full conformance execution still
  has pre-existing serialization and private-admission failures, so discovery
  coverage and benchmark manifest/result validation are not broad conformance or
  performance compatibility claims. Benchmark harness follow-ups can also
  consume Worker 994's command-provenance currentness hardening without treating
  it as a performance claim.
- Conformance harness follow-ups can also consume accepted Workers 964, 978, and
  1240 private admission ledger refreshes, Worker 967's serialization/local
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
  facade conformance/false-green hardening, Worker 1220's
  recreate-after-unmount evidence, Worker 1221's id/text update and id-removal
  hardening, Worker 1228's repaired private native metadata ledger, Worker
  1233's private React DOM subpath/native alias denylist parity, Workers
  1232/1235 public render capability rejection matrix coverage, and Worker
  1238's public component-wrapper execution blockers, plus Worker 1242's
  `render(null)` cleanup and idempotent unmount rows, for that
  lifecycle and blocker surface only. Broader
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
