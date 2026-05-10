# Fast React Master Progress

Last updated: 2026-05-10

This file owns accepted history only. Current queues, next actions, and future
sequencing belong in `MASTER_PLAN.md`.

## Completed Foundation

- M0 orchestration foundation, worker conventions, and initial repo strategy
  were completed.
- M1 compatibility inventory and conformance strategy were completed.
- M2 Cargo/npm scaffold and package boundaries were completed.
- Local React reference source clone was added at
  `/Users/user/Developer/Developer/react-reference` for `facebook/react`
  `v19.2.6`, commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.

## Accepted Architecture

- Rust core owns renderer-agnostic React semantics using explicit lanes,
  fibers, update queues, hooks/effects, and root scheduling state.
- Host config boundaries use opaque host handles/tokens and explicit
  capability groups. DOM/native/security/resource behavior belongs in renderer
  adapters.
- JS facades provide React-compatible packages while native/Rust internals grow
  behind conformance gates.
- Published behavior is proven through black-box React 19.2.6 oracles and
  package probes.

## Accepted Implementation History

### Worker 721

- Worker 721 added a private React DOM fake-DOM execution path for admitted
  dangerousHTML and text-reset rows. The path consumes accepted HostComponent
  update metadata, applies `innerHTML` / `textContent` / reset rows only on
  privately admitted fake-DOM targets, records hidden mutation and rollback
  payloads, and publishes latest props only after mutation succeeds.
- Acceptance review found and blocked an initial live-DOM admission gap. The
  accepted fix added private WeakSet target admission, rejects unadmitted
  live-like component-tree hosts before any DOM reads or writes, and added
  package/conformance regression tests for that fail-closed behavior.
- Worker 721 was accepted after independent post-fix audit and verification
  with focused React DOM root-bridge tests, text-content and
  dangerousHTML/style conformance gates, React DOM workspace checks, package
  surface guard, import smoke, full `npm run check`, conflict-marker scanning,
  and `git diff --check`; its subagent, worktree, and branch were removed after
  merge. Public roots, browser DOM, hydration, events, refs, controlled inputs,
  resources, and full child reconciliation remain blocked.

### Follow-Ups 716-717

- Worker 716 added the private-admission and package-surface ledger for the
  accepted queue 685-714 work without product code changes. It extended the
  conformance guard evidence for accepted private surfaces and kept public
  package compatibility claims blocked.
- Worker 716 was accepted after independent review and focused verification
  with the conformance workspace, `npm run check:package-surface`, import
  smoke, conflict-marker scanning, and `git diff --check`; its subagent,
  worktree, and branch were removed after merge.
- Worker 717 hardened the private HostRoot render -> finished-work -> commit
  handoff by adding a test-only commit entrypoint that validates completed
  HostRoot renders, records root finished-work metadata, and commits through the
  existing guarded handoff. Public root rendering, `act`, `flushSync`, host
  mutation compatibility, refs/effects execution, and hydration remain blocked.
- Worker 717 was accepted after independent review and verification with
  focused `root_work_loop` and `root_commit` tests, workspace formatting,
  clippy with `-D warnings`, full reconciler tests, full `npm run check`,
  conflict-marker scanning, and `git diff --check`; its subagent, worktree, and
  branch were removed after merge.

### Maintenance 715

- Worker 715 restored the Rust 1.95.0 / clippy 0.1.95 workspace gate after the
  post-cleanup `npm run check` baseline failed in existing Rust code. The
  accepted maintenance pass boxed private diagnostic error payloads, added
  narrow item-level clippy allows for intentional canary evidence shapes,
  removed mechanical lint drift, preserved NAPI serialized status strings while
  renaming private enum variants, and kept public behavior unchanged.
- The worker was accepted after independent audit and verification with `cargo
  fmt --all --check`, workspace clippy with `-D warnings`, `cargo test -p
  fast-react-reconciler --all-features`, full `npm run check`, conflict-marker
  scanning, and `git diff --check`.
- Post-merge cleanup removed worker 715's subagent, isolated worktree, and
  branch after the main checkout passed `npm run check`.

### Queue 685-714

- Workers 687-689, 691, and 712 were accepted from the active queue. The batch
  added private Rust canaries for `useMemo`/`useCallback` reuse across update
  renders, effect dependency comparison scheduling only changed passive
  destroy/create work, layout destroy-before-throwing-create fail-closed error
  metadata, Suspense ping retry lane proof tied to root work-loop handoff, and
  Scheduler mock expired lane/root continuation ordering. Public hook,
  effect, Suspense, Scheduler, act, root, and renderer compatibility remain
  blocked.
- The batch was verified after merge with `cargo fmt --all --check`, full
  `fast-react-reconciler` tests, Scheduler workspace checks, focused Scheduler
  mock conformance, `npm run check:package-surface`, full conformance checks,
  conflict-marker scanning, and `git diff --check`.
- Workers 686, 690, 692, and 693 were accepted from the active queue. The batch
  added private HostRoot multiple-update reduction and callback-order handoff,
  nested context provider/consumer begin-work and lane-propagation evidence,
  Offscreen hidden-update reveal lane metadata, and nested deletion subtree
  ref/passive/host cleanup ordering. Public root rendering, context, Offscreen,
  unmount, passive, ref, and host mutation compatibility remain blocked.
- The batch was verified after merge with `cargo fmt --all --check`, full
  `fast-react-reconciler` tests, conflict-marker scanning, and `git diff
  --check`.
- Workers 685 and 694 were accepted from the active queue. The batch added
  private root work-loop finished-work-to-commit handoff metadata and nested
  sync-flush/act root continuation ordering with lane preservation, while
  public render, act, flushSync, Scheduler, and renderer compatibility remain
  blocked.
- The batch was verified after merge with `cargo fmt --all --check`, full
  `fast-react-reconciler` tests, conflict-marker scanning, and `git diff
  --check`.
- Workers 697, 704, 710, 713, and 714 were accepted from the active queue. The
  batch added private react-test-renderer `toJSON` nested/sibling host-output
  execution evidence, React DOM fake-DOM `dangerouslySetInnerHTML` root-update
  execution with rollback evidence, resource fake-head preload/preinit/script
  dedupe and load-order execution, Scheduler postTask priority-timeout
  continuation metadata, and queue 655-684 private-admission guards. Public
  serialization, React DOM root/resource, Scheduler timing, and package
  compatibility claims remain blocked.
- The batch was verified after merge with `cargo fmt --all --check`, full
  `fast-react-test-renderer` tests, React DOM/test-renderer/Scheduler
  workspace checks, `npm run check:package-surface`, full conformance checks,
  conflict-marker scanning, and `git diff --check`.
- Workers 695, 696, 698-703, 706-709, and 711 were accepted from the active
  queue. The batch added private react-test-renderer root create/update work
  loop and HostComponent prop/style execution evidence, `toTree` composite
  metadata, TestInstance class-root query evidence, nested act passive-flush
  order diagnostics, error-boundary commit recovery metadata, and production
  CJS private metadata parity. It also added React DOM private root-render
  HostText/HostComponent execution, root-render click delegation, controlled
  select/textarea restore execution, hydration text-node patch execution,
  portal owner-root event handoff, and form-action async callback execution.
  Public test-renderer, React DOM root/event/hydration/form, and package
  compatibility claims remain blocked.
- The batch required overlap resolutions in test-renderer create-routing and
  act-oracle conformance expectations plus DOM event delegation metadata. The
  accepted state was verified after merge with `cargo fmt --all --check`, full
  `fast-react-test-renderer` tests, React DOM and test-renderer workspace
  checks, `npm run check:package-surface`, full conformance checks,
  conflict-marker scanning, and `git diff --check`.
- Worker 705 was accepted, completing queue 685-714. It added private React DOM
  root-unmount evidence that consumes callback-ref cleanup-return execution and
  deleted-subtree passive destroy ordering metadata before fake-DOM host
  cleanup, while public root unmount, public refs, scheduler-driven passive
  execution, and compatibility claims remain blocked.
- The completed queue 685-714 state was verified after merge with `cargo fmt
  --all --check`, full `fast-react-test-renderer` tests, React DOM and
  test-renderer workspace checks, `npm run check:package-surface`, full
  conformance checks, focused React DOM root facade/root-render/test-utils act
  gates, conflict-marker scanning, and `git diff --check`.
- Post-queue cleanup, before launching worker 715, confirmed only the root
  orchestrator agent remained live, `git worktree list` contained only the main
  checkout, no queue 685-714 worker branches were present, and no neighboring
  queue worktree directories remained.

### Queue 655-684

- Workers 655, 657-658, 660, 664-665, 671, 676, 678, and 684 were accepted
  from the active queue. The batch added private HostText root-commit
  execution, multi-child placement execution, function passive destroy/create
  execution, HostComponent ref detach/update/attach order evidence, root render
  failure recovery metadata, cross-root sync-flush visible callback execution,
  test-renderer HostComponent prop-plus-text update serialization evidence,
  controlled-input live preflight descriptor/value-tracker blockers, hydration
  replay click-dispatch diagnostics, and queue 625-654 private-admission
  guards while keeping public compatibility blocked.
- Worker 665 conflicted with worker 664 only in `sync_flush.rs` imports; the
  merge keeps both root render-error metadata and cross-root callback execution
  paths.
- The batch was verified after merge with `cargo fmt --all --check`, focused
  `fast-react-reconciler` `root_commit`, `sync_flush`, placement, and passive
  filters, focused `fast-react-test-renderer` update coverage, React DOM
  workspace checks, test-renderer serialization conformance, package-surface
  and private-admission guards, conflict-marker scanning, and `git diff
  --check`.
- Workers 656, 659, 661-663, 666-670, 672-675, 677, and 679-683 were
  accepted, completing queue 655-684. The batch added HostComponent prop/style
  commit execution, layout-effect destroy/create execution, context-provider
  commit propagation, Suspense fallback retry execution, Offscreen passive
  defer/reveal evidence, reducer transition lane execution, test-renderer
  `toTree`/TestInstance/error-boundary/act/passive/unmount private native
  evidence, React DOM live-container/root-unmount/fragment/hydration/resource/
  form private execution evidence, and Scheduler postTask act/root continuation
  evidence while keeping public compatibility blocked.
- Queue 655-684 conflict resolutions preserved both sides of overlapping
  private evidence in host prop/text commits, root work-loop Suspense/context
  imports, passive Offscreen queue imports, test-renderer `toTree` routing
  helpers, and React DOM resource fake-head/load-state/order metadata.
- The completed queue 655-684 state was verified with `cargo fmt --all
  --check`, full `fast-react-reconciler` tests, full
  `fast-react-test-renderer` tests, React DOM/test-renderer/Scheduler
  workspace checks, `npm run check:package-surface`, full conformance checks,
  focused test-renderer create-routing and serialization gates, focused React
  DOM root facade checks, conflict-marker scanning, and `git diff --check`.

### Queue 625-654

- Workers 625, 628, 630, 634, 636-640, 643, 645, and 652 were accepted,
  completing queue 625-654. The final batch added root scheduler lane
  expiration execution, function-component `useReducer` and context propagation
  execution, deletion ref/passive cleanup execution, test-renderer
  create/update/unmount native execution, private toJSON native-execution
  evidence, private act/scheduler flush evidence, React DOM private root
  unmount facade cleanup, live controlled-input preflight evidence, and private
  form-action submit reset fake-path execution while keeping public
  compatibility blocked.
- The completed queue 625-654 state was verified with `cargo fmt --all
  --check`, full `fast-react-reconciler` tests, full
  `fast-react-test-renderer` tests, React DOM/test-renderer/Scheduler workspace
  checks, `npm run check:package-surface`, focused test-renderer create-routing
  and serialization checks, focused React DOM root facade/control/form/resource
  checks, conflict-marker scanning, and `git diff --check`.
- Workers 644 and 647 were accepted from the active queue. The batch added
  private checkbox input/change controlled-restore execution for an admitted
  fake-DOM checked path, and broadened private portal click delegation execution
  with owner-root validation while keeping public controlled-input, browser
  event, and portal event compatibility blocked.
- The batch was verified after merge with focused React DOM event,
  resource/form, controlled-input, and event-delegation conformance checks;
  `npm run check --workspace @fast-react/react-dom`; conflict-marker scanning;
  and `git diff --check`.
- Workers 631, 641, and 642 were accepted from the active queue. The batch
  added private Suspense retry render handoff evidence, symbol-private React DOM
  facade `root.render` fake-DOM execution, and private facade root-render update
  conformance evidence while keeping public Suspense and React DOM root
  compatibility blocked.
- The batch was verified after merge with `cargo fmt --all --check`, focused
  reconciler Suspense and root-scheduler tests, focused React DOM private root
  bridge and root-render conformance checks, `npm run check --workspace
  @fast-react/react-dom`, conflict-marker scanning, and `git diff --check`.
- Workers 626, 627, 629, 632, 633, 635, 646, 648-651, and 653-654 were
  accepted from the active queue. The batch added private sync-flush/act root
  execution evidence, broader function-component `useState` host output,
  private effect update/unmount lifecycle execution, Offscreen reveal
  complete/commit handoff proof, host-child insert-before and payload execution
  evidence, private focus/blur dispatch, hydration claim replay and
  recoverable-error callback gates, stylesheet/script/modulepreload resource
  commit diagnostics, and Scheduler mock/postTask private execution routes
  while keeping public compatibility blocked.
- The batch was verified after merge with `cargo fmt --all --check`, focused
  reconciler checks for sync flush, root scheduler/commit/work-loop, function
  components, effects, Offscreen, complete work, host work, and host nodes;
  focused React DOM event, hydration, resource, and conformance checks; `npm
  run check --workspace @fast-react/react-dom`; focused Scheduler mock/postTask
  checks; `npm run check --workspace scheduler`; `npm run
  check:package-surface`; conflict-marker scanning; and `git diff --check`.

### Queue 595-624

- Workers 595, 597, 598, 601, 604, 618, and 621 were accepted from the active
  queue. The partial batch added private test-host HostComponent update
  execution, sync-flush root commit continuation diagnostics, visible root
  callback invocation, accepted passive callback execution, context-changed
  bailout evidence, hydration target-claiming metadata, and private form submit
  dispatch diagnostics while keeping public compatibility blocked.
- The partial batch was verified after merge with focused Rust checks for
  host-component update, sync flush, root callbacks, passive effects, and
  context provider update lanes; focused React DOM hydration/form conformance
  checks; `npm run check --workspace @fast-react/react-dom`; conflict-marker
  scanning; and `git diff --check`.
- Workers 596, 600, 605-608, 613, 619, 623, and 624 were accepted from the
  active queue. The batch added root scheduler sync-commit execution,
  `useReducer` dispatch commit linkage, Suspense retry render handoff,
  Offscreen hidden-lane reveal metadata, private HostText and HostComponent
  property update execution, React DOM root-render native handoff, hydration
  recoverable-error routing, scheduler postTask abort-continuation diagnostics,
  and package/benchmark/conformance guards for queue 565-594 while keeping
  public compatibility blocked.
- The batch was verified after merge with `cargo fmt --all --check`, focused
  reconciler filters for root scheduler/work loop, Offscreen, complete work,
  HostText, HostComponent, host nodes, host work, and root commit; focused and
  full React DOM package checks; scheduler postTask and package-surface checks;
  private-admission, benchmark, and conformance workspace checks;
  conflict-marker scanning; and `git diff --check`.
- Workers 599, 602-603, 609-611, 614-616, 620, and 622 were accepted from the
  active queue. The batch added `useState` dispatch-to-commit metadata,
  layout-effect commit-order execution, broad context-provider subtree
  traversal, deletion subtree host detachment execution, test-renderer
  create/update native-bridge admission, React DOM root property/text update
  execution, root unmount cleanup admission, private click dispatch,
  stylesheet load-state resource diagnostics, and scheduler mock act/root work
  handoff diagnostics while keeping public compatibility blocked.
- The batch was verified after merge with `cargo fmt --all --check`, focused
  reconciler checks for `useState`, function components, layout/effect lists,
  context, deletion, and host nodes; test-renderer create/update Rust and JS
  gates plus workspace checks; React DOM root bridge, event, resource, package,
  and conformance checks; scheduler mock/act checks; conflict-marker scanning;
  and `git diff --check`.
- Workers 612 and 617 were accepted, completing queue 595-624. The final batch
  added private test-renderer unmount native-bridge admission that consumes Rust
  deletion commit handoff evidence, and React DOM input/change controlled
  restore execution for an admitted fake-DOM text input path while keeping
  public unmount and controlled-input compatibility blocked.
- The final queue 595-624 batch was verified after merge with
  `cargo fmt --all --check`, focused `fast-react-test-renderer` unmount tests,
  test-renderer create-routing conformance and workspace checks, focused React
  DOM event/resource/controlled-input conformance checks, the full React DOM
  package test set, `npm run check --workspace @fast-react/react-dom`,
  conflict-marker scanning, and `git diff --check`.

### Queue 565-594

- Workers 565-594 were accepted and merged. The batch extended private
  root-work-loop and scheduler diagnostics, multi-provider context lane
  propagation, Suspense retry and Offscreen visibility gates, test-renderer
  root/update/unmount/act/toJSON diagnostics, React DOM root facade,
  style/dangerousHTML fake-DOM commit metadata, controlled restore mutation
  intent, hydration replay dispatch, modulepreload ordering, scheduler mock and
  postTask continuations, native JSON streaming, transition dispatcher routing,
  element key/ref warnings, package-surface/private-admission/benchmark gates,
  root-render E2E handoff evidence, and worker-launcher status handling.
- Post-merge integration moved scheduler postTask and mock diagnostics out of
  package physical surfaces, refreshed the root-render handoff source evidence
  gate, and resolved combined test-renderer and DOM metadata conflicts while
  keeping public compatibility blocked.
- Queue 565-594 was verified after merge with `cargo fmt --all --check`,
  focused reconciler context checks, full `fast-react-reconciler` tests, full
  `fast-react-test-renderer` tests, focused React DOM/test-renderer conformance
  checks, `npm run check:js`, conflict-marker scanning, and `git diff --check`.

### Queue 534-564

- Workers 534-562 and 564 were accepted, completing the queue after worker 563
  had compacted the master progress history. The batch added root work-loop
  finished-work handoff diagnostics, lane-priority scheduling canaries,
  function-component `useCallback`, layout-effect, context-provider lane, and
  hook dispatcher blockers; test-renderer live-root, serialization, act,
  toJSON/update/unmount, and root-create preflight gates; React DOM facade,
  hydration/resource/form/controlled-restore/event/portal/style/dangerous HTML
  diagnostics; scheduler mock/postTask and native batch sequencing refreshes;
  package-surface and benchmark audits; Suspense, Offscreen, and React
  `cloneElement` child-array freeze parity evidence. Public compatibility
  remains blocked.
- Queue 534-564 was verified after merge with focused Rust reconciler
  begin-work checks, `fast-react-test-renderer` tests, React DOM workspace
  checks, React workspace checks, Scheduler/native/package-surface/benchmark
  checks from the accepted worker reports, focused DOM event/resource/form/
  controlled/style/dangerousHTML/root-facade/test-renderer/element-object
  conformance tests, import-smoke checks, conflict-marker scans, and
  `git diff --check`.

### Queue 503-533

- Workers 505-508 and 510-533 were accepted from queue 503-533, completing the
  queue. The batch added private React DOM form/reset/resource/stylesheet/
  controlled restore and public-facade diagnostics, broader DOM event and
  portal error metadata, root-render E2E private admissions, test-renderer
  TestInstance/query/committed-fiber/act/error-boundary diagnostics, scheduler
  mock/postTask/native-entry guards, hook dispatcher blockers, native transport
  teardown, package-surface/private-admission refreshes, and benchmark private
  canaries while public compatibility remains blocked.
- Workers 505-508 and 510-533 were verified after merge with focused React DOM,
  controlled-input, root-render E2E, test-renderer serialization/create/act/
  error-surface, scheduler mock, package-surface, benchmark, workspace
  import-smoke, Rust fmt, full `fast-react-test-renderer`, and focused
  reconciler committed-fiber checks, plus conflict-marker scanning and
  `git diff --check`. Post-merge cleanup aligned the test-renderer
  create-routing gate expectation for the combined worker 516/530 diagnostics.
- Worker 504 was accepted from queue 503-533. It added private Fragment and
  Portal deletion-subtree traversal diagnostics, explicit Suspense/Offscreen
  blockers, and narrowed host cleanup traversal while keeping real portal DOM
  mutation and public unmount compatibility blocked. It was verified after
  merge with focused deletion traversal tests, root-commit deletion and
  root_commit filters, Rust fmt, conflict-marker scanning, and
  `git diff --check`.
- Worker 503 was accepted from queue 503-533. It added private deleted-subtree
  passive destroy flush diagnostics that consume accepted deletion passive/ref
  cleanup ordering metadata without opening public passive effect execution. It
  was verified after merge with focused deleted-subtree passive and root-commit
  snapshot tests, passive-effect and root-commit deletion filters, Rust fmt,
  conflict-marker scanning, and `git diff --check`.
- Worker 509 was accepted from queue 503-533. It added private controlled
  restore queue write/flush ordering diagnostics for accepted text,
  select/textarea, checkbox, and radio metadata while keeping actual queue
  writes, queue flushing, wrapper execution, live value tracking, radio lookup,
  and DOM mutation blocked. It was verified after merge with package
  resource/form/controlled tests, controlled-input conformance, React DOM
  workspace checks, syntax checks, conflict-marker scanning, and
  `git diff --check`.

### Earlier Accepted Batches

- Queue 473-502 was accepted and merged as the predecessor batch. It added
  private passive/effect diagnostics, hook `useMemo`/`useEffect` gates,
  context and Suspense/Offscreen blockers, deletion cleanup ordering,
  test-renderer query/`toTree`/act/error-surface diagnostics, React DOM
  root/event/resource/form/controlled/portal/hydration/test-utils gates,
  Scheduler mock/postTask/native-entry diagnostics, native transport teardown,
  package-surface hardening, benchmark canaries, and root-render E2E private
  admissions while public compatibility remained blocked. Verification covered
  focused Rust and JS gates, React DOM/test-renderer/scheduler/native
  workspaces, package-surface/import-smoke/benchmark checks, conformance gates,
  conflict-marker scans, and `git diff --check`.
- Queue 443-472 was accepted and merged, with worker 466 discarded as a stale
  empty branch. The accepted work covered layout-effect and committed metadata
  canaries, ref cleanup/error routing, context propagation, passive scheduler
  and sync-flush recovery gates, HostRoot fragment/array reconciliation, DOM
  text/style/event/hydration/resource/form/controlled-input diagnostics,
  test-renderer query/serialization/error-boundary/act diagnostics, scheduler
  continuation/postTask diagnostics, native teardown, package-surface privacy,
  and benchmark canaries. Verification covered focused Rust, React DOM,
  test-renderer, scheduler, native, benchmark, package-surface, import-smoke,
  conformance checks, conflict-marker scanning, and `git diff --check`.
- Queues 413-442, 383-412, and 353-382 were accepted as implementation
  batches for the root commit/update/deletion path, ref and error metadata,
  context and passive-effect ownership, scheduler act/mock execution, private
  test-renderer root/serialization/tree/TestInstance behavior, React DOM
  root/event/hydration/portal/resource/controlled/test-utils gates, native
  transport diagnostics, package-surface refreshes, benchmark admissions, and
  root-render E2E private gates. Broad post-merge verification repeatedly
  included Rust fmt, reconciler/test-renderer/N-API tests, workspace clippy,
  `npm run check:js`, benchmark and package-surface checks, focused JS
  conformance gates, conflict-marker scans, and `git diff --check`.
- Queues 323-352, 293-322, and 263-292 were accepted as the first large
  root-output and package-surface implementation waves. They established
  private root commit placement/update/deletion canaries, function-component
  state/effect/context paths, root scheduler and sync-flush gates,
  test-renderer root/JSON/tree/TestInstance/act/error-surface gates, React DOM
  root/listener/component-tree/event/ref/hydration/portal/resource/form/
  controlled-input/test-utils gates, native bridge validation, benchmark
  admissions, and package privacy checks. Verification covered focused Rust
  and JS checks, full package tests where applicable, clippy, package-surface
  and benchmark checks, `npm run check:js`, and `git diff --check`.
- Workers 130-262 were accepted across smaller implementation waves. They
  built the HostRoot commit and sync-flush foundations, scheduler callback and
  lane-selection integration, function-component hook/effect/context
  structures, passive pending/flush diagnostics, host complete-work and
  host-node-store boundaries, private DOM bridge/text/property/event/
  hydration/resource/form/portal helpers, react-test-renderer package and
  serialization gates, native handle lifecycle diagnostics, benchmark
  readiness gates, and package-surface guards. Workers were verified on their
  worktrees and after integration with focused Rust/JS gates, package tests,
  workspace checks, conformance gates, conflict-resolution review, and
  `git diff --check`.
- Workers 118-129 established the early M4 root/render foundation: host-token
  compile alignment, core fiber topology, scheduler mock/native entries, React
  DOM root-render oracle, container marker/listener shells, FiberRoot/HostRoot
  records, HostRoot update queues, scheduler roots, and HostRoot render-phase
  diagnostics. They were verified on `main` with focused Rust and scheduler
  checks, Rust fmt, package smoke checks, and `git diff --check`.
- Early oracle, package-surface, and planning workers through 117 were merged
  and closed. They supplied the React/React DOM/scheduler/test-renderer/native
  inventories, published-behavior oracles, scaffolded package boundaries,
  root/form/control and act probes, initial core lane/event/fiber/hook flag
  work, and report-only implementation plans used by later batches.
