# worker-001-architecture

## Objective

Test the root architecture hypotheses for an almost 1-to-1 Rust reimplementation of React 19.2.6, with emphasis on public React semantics, renderer independence, memory ownership, the scheduler/fiber model, JS interop, and the line between preserving React behavior and intentionally breaking from React's JavaScript internals.

This report is research and architecture guidance only. No project code was implemented.

## Sources and commands used

Primary project sources read:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `docs/tasks/worker-001-architecture.prompt.md`

Primary package sources inspected:

- `react@19.2.6`
- `react-dom@19.2.6`
- `@types/react@19.2.14`
- `react-reconciler@0.33.0`
- `scheduler@0.27.0`
- `react-is@19.2.6`

Temporary artifact location used by this worker:

- `/tmp/fast-react-arch.dW3yMJ`

Representative commands run:

- `pwd && rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'AGENTS.md' -g '!ORCHESTRATOR.md'`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `git status --short --branch`
- `npm view react@19.2.6 version dist.tarball exports --json`
- `npm view react-dom@19.2.6 version dist.tarball exports --json`
- `npm view @types/react@19.2.14 version dist.tarball --json`
- `npm view react-reconciler@0.33.0 version peerDependencies dist.tarball exports --json`
- `npm view scheduler@0.27.0 version dist.tarball exports --json`
- `npm view react-is@19.2.6 version dist.tarball exports --json`
- `curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz -o /tmp/fast-react-arch.dW3yMJ/tgz/react-19.2.6.tgz`
- `curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -o /tmp/fast-react-arch.dW3yMJ/tgz/react-dom-19.2.6.tgz`
- `curl -fsSL https://registry.npmjs.org/@types/react/-/react-19.2.14.tgz -o /tmp/fast-react-arch.dW3yMJ/tgz/types-react-19.2.14.tgz`
- `curl -fsSL https://registry.npmjs.org/react-reconciler/-/react-reconciler-0.33.0.tgz -o /tmp/fast-react-arch.dW3yMJ/tgz/react-reconciler-0.33.0.tgz`
- `curl -fsSL https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz -o /tmp/fast-react-arch.dW3yMJ/tgz/scheduler-0.27.0.tgz`
- `curl -fsSL https://registry.npmjs.org/react-is/-/react-is-19.2.6.tgz -o /tmp/fast-react-arch.dW3yMJ/tgz/react-is-19.2.6.tgz`
- `tar -xzf ... --strip-components=1`
- `node` probes against unpacked React, React DOM, React server condition files, scheduler, and reconciler exports
- `rg` and `nl -ba ... | sed -n ...` over `react.development.js`, `react-dom-client.development.js`, `react-reconciler.development.js`, `scheduler.development.js`, and `@types/react/index.d.ts`

Notes:

- `npm pack react@19.2.6` was attempted but blocked by the local npm `minimum-release-age` policy. I used the registry tarball URLs returned by `npm view` instead.
- I did not read `ORCHESTRATOR.md`. It appeared in directory listings only.
- Managed nested subagents were used to test independent hypotheses. They made no repository writes. Their findings are summarized below.

Delegated checks:

- Public React API and type semantics check: confirmed React 19.2.6 uses `Symbol.for("react.transitional.element")`, treats `ref` as a normal prop while preserving `element.ref` compatibility, has distinct `react-server` exports, and requires exact JS object/property descriptor behavior at the package boundary.
- Reconciler, host-config, fiber/lane/scheduler check: confirmed renderer independence exists through a large host config, but React DOM-specific resources, hydration, form state, event priority, and singleton behavior make the boundary much wider than a minimal "create node and append child" API.
- Rust ownership and JS interop check: confirmed that normal Rust borrow trees are the wrong root model for fibers/hooks/update queues; recommended arena/generational handles and N-API-first JS integration.

## Architecture findings

The main architecture hypothesis is directionally correct: a Rust core should own React's renderer-agnostic semantics while renderers provide host behavior through a host-config-style boundary. The important correction is that "renderer-agnostic" does not mean "small." In React 19.2.6, the reconciler is where elements, fibers, lanes, hooks, context, updates, Suspense, cache, transitions, effects, error handling, commit phases, DevTools hooks, and scheduler coordination meet. A Rust reimplementation should not split these apart in a way that makes their invariants cross crate boundaries invisibly.

The strongest root constraint is observable JavaScript semantics. Userland can observe package exports, element brands, key/ref behavior, property descriptors, frozen dev objects, promise/thenable mutation, context objects, hook errors, scheduling order, and effect timing. Rust-native structs are fine internally, but the JS-facing values must behave like React values.

React's JavaScript fiber internals should not be copied literally. The fiber graph is cyclic and mutable: `child`, `sibling`, `return`, `alternate`, `stateNode`, hook lists, update queues, effect queues, lane fields, deletion lists, and host back-pointers all mutate across render and commit. A direct Rust ownership tree would fight the model and likely lead to either unsound shared mutability or excessive cloning. Use arenas with stable typed IDs/generational handles and explicit render/commit mutation phases.

The scheduler is not a generic async runtime problem. React lanes encode semantic priority and consistency, while the scheduler package provides cooperative yielding via host timers and message-loop integration. A Rust port should preserve lane bit behavior first, then abstract host scheduling behind a narrow adapter. Do not build the core around Tokio, OS threads, or a work-stealing executor unless conformance evidence proves that the same JS-visible timing and yielding semantics survive.

JS interop is not a thin wrapper concern. Components are JS callables; props/state can contain arbitrary JS values; render can throw JS errors or thenables; `use` and Suspense mutate thenables with `status`, `value`, and `reason`; hooks are dispatched through mutable shared internals; `startTransition` uses shared transition state. The first public integration should be Node/N-API so conformance can run against the real JS package surface before any browser/WASM optimization work.

The project should intentionally break compatibility with unstable React internals where copying them would create root architectural debt. In particular, do not expose raw fiber object shapes as a stable Rust or JS API, and do not promise third-party `react-reconciler` API compatibility in the first milestone. Use `react-reconciler@0.33.0` as design evidence for the host boundary, not as the public ABI to support immediately.

## Recommended crate/module boundaries

Recommended initial workspace shape:

- `fast-react-core`: public React value model, `Symbol.for` tags, element creation/cloning, refs, keys, children traversal, lazy/memo/forwardRef/context records, dev/prod policy hooks.
- `fast-react-shared`: dispatcher, async cache dispatcher, transition state, owner stack state, feature flags, shared error types, shared JS value abstractions.
- `fast-react-fiber`: fiber arena, root model, fiber tags, flags, alternates, effect/deletion lists, begin/complete/commit orchestration.
- `fast-react-lanes`: lane bitmasks, event priorities, transition/retry/deferred lanes, expiration, entanglement, `getNextLanes` parity logic.
- `fast-react-hooks`: hook linked-list semantics over arena IDs, reducer/state queues, effect queues, `use`, `useActionState`, `useOptimistic`, `useEffectEvent`, rules-of-hooks diagnostics.
- `fast-react-scheduler`: cooperative scheduler abstraction that preserves React priority names and lets host adapters provide microtasks, timers, time source, yield checks, and paint requests.
- `fast-react-host`: host-config traits grouped by capability: mutation, persistence, hydration, resources, singletons, portals, events/priority, microtasks, test selectors, form reset, DevTools integration.
- `fast-react-js`: Node/N-API binding facade, JS object creation/property descriptors, JS callable execution, JS exception/thenable handling, finalizers, package-compatible exports.
- `fast-react-test-renderer`: minimal non-DOM renderer for early reconciler, hook, context, Suspense, and scheduler conformance.
- Later `fast-react-dom-host`: DOM-specific host implementation after the generic host boundary is proven.
- Later `fast-react-wasm`: browser/WASM adapter if deployment or benchmark evidence justifies it.

Boundary rule: public semantic modules may depend inward on shared types, but renderers should depend on the host trait and core IDs rather than on concrete fiber storage internals. Keep fiber mutation APIs phase-scoped so render, commit, passive effect flushing, and DevTools override paths cannot interleave unsafely.

## React semantics that must drive the design

Package and export semantics:

- The compatibility target confirmed by `npm view` is `react@19.2.6`, `react-dom@19.2.6`, and `@types/react@19.2.14`.
- `react` default client exports include `Activity`, `Children`, `Component`, `PureComponent`, `Fragment`, `Profiler`, `StrictMode`, `Suspense`, `createElement`, `cloneElement`, `createContext`, `createRef`, `forwardRef`, `lazy`, `memo`, `startTransition`, `cache`, `cacheSignal`, `use`, all major state/effect hooks, `useActionState`, `useEffectEvent`, `useOptimistic`, `unstable_useCacheRefresh`, and internals.
- `react-server` is a different surface. It omits client-only state/effect/ref/context APIs such as `Component`, `PureComponent`, `Activity`, `createContext`, `useState`, `useReducer`, `useEffect`, `useRef`, and transitions, while retaining server-safe element helpers, `cache`, `cacheSignal`, `use`, `useId`, `useMemo`, `useCallback`, `lazy`, `memo`, and `forwardRef`.
- `react-dom` client exports are `createRoot`, `hydrateRoot`, and `version`; root methods reject callback-style legacy usage with warnings/errors.

Element and child semantics:

- React 19.2.6 brands elements with `Symbol.for("react.transitional.element")`, not the legacy `react.element`.
- Other observable brands include `react.portal`, `react.fragment`, `react.strict_mode`, `react.profiler`, `react.consumer`, `react.context`, `react.forward_ref`, `react.suspense`, `react.memo`, `react.lazy`, and `react.activity`.
- `key` is coerced to a string and removed from `props`; in development, `props.key` is a warning getter.
- `ref` is now a regular prop. `props.ref` is preserved. `element.ref` remains as compatibility behavior; in development it is a non-enumerable deprecation getter backed by `props.ref`.
- Development elements and props are frozen and carry `_owner`, `_store`, `_debugInfo`, `_debugStack`, and `_debugTask`. Production element shapes differ.
- `cloneElement(..., { ref: undefined })` preserves the previous ref.
- `Children` traversal treats `undefined` and booleans as null-ish, supports strings/numbers/bigints/elements/portals/lazy values/iterables/thenables, escapes generated keys, warns on Maps, and throws for plain objects.

Type and component semantics:

- `@types/react@19.2.14` allows `FunctionComponent` and `JSXElementConstructor` to return `ReactNode | Promise<ReactNode>`.
- `ReactNode` includes bigint, iterables, portals, booleans, null/undefined, and promise-like values through `AwaitedReactNode`.
- `Context<T>` acts as its own provider in React 19 because `Provider === context`.
- Exotic components such as memo, lazy, forwardRef, provider, and consumer are object records with `$$typeof`; TypeScript pretends they are callable, but runtime treats them specially.

Hooks, context, and update semantics:

- Public hooks are dispatcher calls through React shared internals. The `react` package does not implement hook behavior by itself.
- The renderer/reconciler must install the correct dispatcher for mount, update, rerender, invalid hook access, and context-only phases.
- Hook order is semantic. Rust must preserve the ordered hook list, render-phase update handling, base queue merging, eager state, reducer identity behavior, and diagnostics.
- Context carries separate current values for primary and secondary renderers. The host/core design must preserve this dual-renderer behavior.
- Class update queues and hook queues are circular/pending queues that merge into base queues by lane. Queue ordering is not an implementation detail; it determines visible state.

Scheduling, Suspense, and effects:

- Lanes are semantic priority and consistency groups. Preserve the bit assignments initially and port `requestUpdateLane`, transition lane allocation, retry/deferred lanes, expiration, entanglement, and `getNextLanes` with parity tests.
- `startTransition` uses shared transition state and tracks updated fibers.
- Suspense and `use` rely on thrown thenables and thenable status mutation. JS exceptions and JS promises must remain first-class.
- Commit is a phase machine: before-mutation, mutation, layout, spawned work, passive. Passive effects are scheduled separately.
- StrictMode, act, DevTools hooks, owner stacks, and development warnings are part of useful compatibility, not optional polish for later architecture.

## Renderer host-config boundary recommendation

Use a React-reconciler-style host-config boundary, but design it as grouped Rust traits rather than one enormous trait. The extraction from `react-reconciler@0.33.0` shows these capability groups:

- Identity and context: renderer version/name, public instance lookup, root host context, child host context, primary/secondary renderer identity.
- Instance creation: create host instance, append initial child, finalize initial children, text instance creation, text-content decisions, public instance mapping.
- Commit wrapping: prepare for commit, reset after commit, commit mount, commit update, commit text update.
- Mutation mode: append, insert, remove, clear container, hide/unhide, reset text, detach deleted instances.
- Persistence mode: clone instances, create/finalize child sets, replace container children, clone hidden instances.
- Hydration mode: find hydratable children/siblings, can-hydrate checks, hydrate instance/text/activity/suspense, commit hydrated nodes, delete unhydrated tails, hydration diagnostics.
- Portals and containers: portal mount preparation, root/container child management, host parent/sibling lookup support.
- Scheduling and priority: current update priority, event priority resolution, event type/time, timers, microtasks, paint/post-paint callbacks.
- Suspensey commits/resources: may-suspend checks, preload/suspend instance, delayed commit readiness, suspended commit reason.
- DOM-like resources/singletons: hoistable resources, stylesheet/script/resource acquisition/release, singleton instance acquisition, release, and hydration.
- Forms and host transitions: form reset, host transition status context, action/form state integration.
- Diagnostics and tooling: DevTools injection, test selectors, bounding rects, text content, focus, accessibility role matching, intersection observation.

Recommended rollout:

1. Implement a minimal mutation-capable test renderer first.
2. Add hydration as a separate capability group only after basic mount/update/delete/effect semantics are passing.
3. Keep DOM resources, singletons, and form actions out of the generic test renderer; make them DOM-host capabilities.
4. Do not expose `react-reconciler` compatibility as a public promise until Fast React can prove the host-config matrix and third-party custom renderer behavior.

## JS interop recommendation

Use a JS-first package facade with N-API first.

Reasons:

- Node/jsdom conformance is the fastest way to compare with React 19.2.6 behavior.
- N-API can preserve JS object identity, property descriptors, `Symbol.for` brands, frozen dev objects, JS callable components, JS errors, JS promises/thenables, and CJS/package export behavior.
- State, props, context values, refs, callbacks, memo comparators, lazy loaders, actions, and event handlers are arbitrary JS values. They should stay as rooted JS references owned by the correct JS environment.
- React-visible scheduling depends on JS microtasks, timers, `performance.now`, thrown thenables, and host event priorities. A binding that moves work freely to Rust threads will break semantics.

WASM should be a later adapter, not the first architecture driver. WASM may be needed for browser deployment, but it complicates direct object identity, callable references, promise interop, DOM integration, and bundler conditions. The Rust core should be portable enough for WASM, but the first binding should optimize for correctness evidence rather than deployment breadth.

Interop rules:

- All JS handles must be scoped to their owning runtime/thread.
- Use explicit finalizers for Rust arena objects reachable from JS.
- Treat thrown JS values and thrown thenables as control-flow values, not just errors.
- Keep public React objects JS-shaped at the boundary even when their backing data lives in Rust.
- Preserve CJS/default/react-server/jsx-runtime/jsx-dev-runtime entrypoints and package export conditions.

## Major risks and root causes

- Memory ownership risk. Root cause: fibers, hooks, update queues, effects, refs, host instances, and DevTools back-pointers form cyclic mutable graphs. Mitigation: arena/generational handles, explicit deletion cleanup, phase-scoped mutation, and no stable exposure of raw internal node layout.
- JS interop risk. Root cause: React semantics are coupled to JS identity, property descriptors, exceptions, promises, thenable mutation, closures, and microtasks. Mitigation: N-API-first proof, JS-handle discipline, and parity tests before optimizing across threads or into WASM.
- Scheduler risk. Root cause: lanes encode consistency while scheduler callbacks encode cooperative host timing. Mitigation: preserve lane bit behavior first, provide host scheduler adapters, and test yielded/interleaved updates against React 19.2.6.
- Renderer boundary risk. Root cause: React DOM needs hydration, resources, singletons, form actions, event priority, and commit suspension beyond a minimal host API. Mitigation: capability-grouped host traits and a host-config method matrix before DOM implementation.
- Compatibility risk. Root cause: public React behavior includes many "internal-looking" details that userland and tools observe. Mitigation: golden tests for exports, symbols, descriptors, dev/prod differences, warnings, hook errors, scheduler/effect order, and TypeScript declarations.
- Performance risk. Root cause: early speedups can simply measure missing semantics. Mitigation: defer performance claims until conformance and representative benchmarks exist.
- Security risk. Root cause: native bindings execute user JS callbacks and retain JS values across Rust-owned structures. Mitigation: avoid unsound cross-thread JS access, validate host adapter boundaries, ensure finalizers run, and treat arbitrary thrown values safely.
- Maintainability risk. Root cause: mirroring current React internals too literally would make every upstream internal churn a breaking Rust refactor. Mitigation: preserve public behavior and essential algorithms, but intentionally replace JS object graphs with Rust arenas and typed APIs.

Breaking changes worth accepting:

- Do not support raw React fiber object identity or layout as a public compatibility target.
- Do not promise `react-reconciler` third-party renderer ABI compatibility in the first milestone.
- Do not make Rust lifetimes mirror the fiber tree. Use handles even if that is less "idiomatic" than owned trees.
- Do not make WASM the first binding if it weakens conformance or delays Node-based comparison tests.

## Proposed follow-up implementation tasks

1. Build a React 19.2.6 behavior probe suite for exports, package conditions, element descriptors, key/ref behavior, children traversal, context records, memo/lazy/forwardRef, and TypeScript surface parity.
2. Generate a host-config method matrix from `react-reconciler@0.33.0`, grouped by mutation, persistence, hydration, resources, singletons, events, scheduling, forms, test selectors, and DevTools.
3. Prototype a Rust fiber arena with `RootId`, `FiberId`, alternates, child/sibling/return links, deletion cleanup, host back-pointers, and phase-scoped mutable access.
4. Port lane constants and `getNextLanes`/`requestUpdateLane` behavior with fixture parity tests against React DOM 19.2.6.
5. Prototype hook/update/effect queues using ID-backed linked/circular list semantics and tests for render-phase updates and hook-order diagnostics.
6. Prototype N-API element creation and JS callable execution, including property descriptors, frozen dev elements, JS errors, thrown thenables, promise status mutation, and finalizers.
7. Implement a minimal mutation-mode test renderer before DOM work.
8. Add scheduler adapter spikes for Node: microtask scheduling, timers, `performance.now`, cooperative yielding, priority callbacks, and `act` behavior.
9. Decide and document the initial compatibility policy for `react-reconciler` and third-party custom renderers.

## Completion checklist

- Objective addressed: yes. The report tests the architecture hypotheses for Rust core semantics, renderer independence, memory ownership, scheduler/fiber model, JS interop, and intentional divergence from React JS internals.
- Required file written: yes, `worker-progress/worker-001-architecture.md`.
- Write scope respected: yes, only this progress file was added.
- No project code implemented: yes.
- `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` read first: yes.
- `ORCHESTRATOR.md` not read: yes. It appeared only in directory listings.
- Subagents used to test hypotheses: yes. Three nested checks were delegated and summarized in this report.
- Required section `Objective`: present.
- Required section `Sources and commands used`: present.
- Required section `Architecture findings`: present.
- Required section `Recommended crate/module boundaries`: present.
- Required section `React semantics that must drive the design`: present.
- Required section `Renderer host-config boundary recommendation`: present.
- Required section `JS interop recommendation`: present.
- Required section `Major risks and root causes`: present.
- Required section `Proposed follow-up implementation tasks`: present.
- Required section `Completion checklist`: present.
- Quality review: complete. Recommendations favor behavior-driven boundaries, conformance-first rollout, and explicit invariants.
- Maintainability review: complete. The report recommends preserving public semantics while avoiding brittle JS-internal layout compatibility.
- Performance review: complete. The report warns against benchmarking missing semantics and recommends lane/scheduler parity before optimization claims.
- Security review: complete. The report calls out JS handle ownership, native finalizers, thrown values, and cross-thread JS access risks.

## Handoff summary

Summary:

- Build Fast React around observed React 19.2.6 public semantics, not around a literal copy of JavaScript object internals.
- Use arenas/generational handles for fibers, hooks, queues, and effects.
- Preserve lane semantics and cooperative scheduling behavior before performance work.
- Use a grouped host-config boundary and prove it with a minimal test renderer before DOM.
- Use N-API first for JS conformance; treat WASM as a later adapter.
- Accept breaking internal differences where copying React internals would make Rust unsound or brittle.

Changed files:

- `worker-progress/worker-001-architecture.md`

Commands run:

- Listed in `Sources and commands used`.

Evidence gathered:

- npm metadata confirmed the target package versions and export maps.
- Published package tarballs exposed exact runtime entrypoints and CJS implementation details for React, React DOM, React Reconciler, Scheduler, and React types.
- Node probes confirmed public export keys, element shape, key/ref behavior, dev/prod freezing, `react-server` surface differences, React DOM client/server exports, scheduler exports, and reconciler public factory exports.
- Source inspection confirmed fiber alternates, circular update/hook queues, lane selection, scheduler/root scheduling, commit phases, and the size of the host-config boundary.
- Three nested subagents independently checked public semantics, renderer/fiber/scheduler constraints, and Rust ownership/interop constraints.

Unresolved risks and follow-up tasks:

- JS interop may dominate the architecture; prove callable execution, thrown thenables, microtask timing, and object identity early.
- Host-config scope is large; create a method matrix before implementing DOM.
- Lane and scheduler parity must be tested before claiming performance.
- Third-party `react-reconciler` compatibility should remain out of scope until explicitly accepted by the orchestrator.
