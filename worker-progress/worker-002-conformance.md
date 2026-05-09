# worker-002-conformance

## Objective

Design a React 19.2.6 conformance strategy for Fast React without implementing project code. The strategy must identify the public API inventory process, behaviors that require executable comparison against React, test harness structure, upstream test reuse feasibility, and compatibility gaps that should block milestones.

Write scope honored: only this file was written.

## Sources and commands used

Primary sources:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- npm package metadata and tarballs for `react@19.2.6`, `react-dom@19.2.6`, `@types/react@19.2.14`, `@types/react-dom@19.2.3`, and `scheduler@0.27.0`
- Upstream React tag `v19.2.6`, which resolves to commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`

Commands run:

```sh
pwd && ls
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files -g '!ORCHESTRATOR.md'
find worker-progress -maxdepth 2 -type f -print
git status --short
find docs scripts -maxdepth 3 -type f -print
sed -n '1,220p' worker-progress/README.md
sed -n '1,260p' docs/tasks/worker-002-conformance.prompt.md
npm view react@19.2.6 version exports files dist.tarball --json
npm view react-dom@19.2.6 version exports files dist.tarball --json
npm view @types/react@19.2.14 version dist.tarball --json
npm view @types/react-dom version --json
curl -L https://registry.npmjs.org/react/-/react-19.2.6.tgz -s | tar -tzf - | sed -n '1,220p'
curl -L https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -s | tar -tzf - | sed -n '1,260p'
curl -L https://registry.npmjs.org/@types/react/-/react-19.2.14.tgz -s | tar -tzf - | sed -n '1,260p'
curl -L https://registry.npmjs.org/react/-/react-19.2.6.tgz -s | tar -xzOf - package/cjs/react.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react/-/react-19.2.6.tgz -s | tar -xzOf - package/cjs/react.production.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react/-/react-19.2.6.tgz -s | tar -xzOf - package/cjs/react.react-server.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react/-/react-19.2.6.tgz -s | tar -xzOf - package/cjs/react-jsx-runtime.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react/-/react-19.2.6.tgz -s | tar -xzOf - package/cjs/react-jsx-dev-runtime.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react/-/react-19.2.6.tgz -s | tar -xzOf - package/cjs/react-compiler-runtime.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -s | tar -xzOf - package/cjs/react-dom.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -s | tar -xzOf - package/cjs/react-dom.production.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -s | tar -xzOf - package/cjs/react-dom.react-server.production.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -s | tar -xzOf - package/cjs/react-dom-client.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -s | tar -xzOf - package/cjs/react-dom-server.node.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -s | tar -xzOf - package/cjs/react-dom-server.browser.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -s | tar -xzOf - package/cjs/react-dom-server-legacy.node.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -s | tar -xzOf - package/cjs/react-dom-test-utils.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
curl -L https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -s | tar -xzOf - package/static.node.js | sed -n '1,120p'
curl -L https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -s | tar -xzOf - package/server.node.js | sed -n '1,120p'
curl -L https://registry.npmjs.org/@types/react/-/react-19.2.14.tgz -s | tar -xzOf - react/index.d.ts | rg '^\s*(export|declare)\s+(function|class|const|namespace|interface|type)\s+' | sed -n '1,240p'
npm view @types/react-dom@19.2.3 version dist.tarball --json
curl -L https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz -s | tar -tzf - | sed -n '1,240p'
curl -L https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz -s | tar -xzOf - react-dom/index.d.ts react-dom/client.d.ts react-dom/server.d.ts react-dom/static.d.ts react-dom/test-utils/index.d.ts 2>/dev/null | rg '^export (function|const|class|interface|type)|^export \{' | sed -n '1,220p'
npm view react@19.2.6 repository.url --json
npm view react-dom@19.2.6 peerDependencies dependencies --json
npm view scheduler@0.27.0 version exports files dist.tarball --json
curl -L https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz -s | tar -xzOf - package/cjs/scheduler.development.js | rg -o 'exports\.[A-Za-z0-9_$]+' | sort -u
git ls-remote --tags https://github.com/facebook/react.git 'v19.2.6' 'v19.2.6^{}' '19.2.6' '19.2.6^{}'
git ls-remote --tags https://github.com/facebook/react.git | rg '19\.2' | tail -n 40
curl -L https://github.com/facebook/react/archive/eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401.tar.gz -s | tar -tzf - | rg 'packages/react/src/.*__tests__/.*\.(js|ts)$' | wc -l
curl -L https://github.com/facebook/react/archive/eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401.tar.gz -s | tar -tzf - | rg 'packages/react-reconciler/src/.*__tests__/.*\.(js|ts)$' | wc -l
curl -L https://github.com/facebook/react/archive/eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401.tar.gz -s | tar -tzf - | rg 'packages/react-dom/src/.*__tests__/.*\.(js|ts)$' | wc -l
curl -L https://github.com/facebook/react/archive/eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401.tar.gz -s | tar -tzf - | rg 'packages/scheduler/src/.*__tests__/.*\.(js|ts)$' | wc -l
curl -L https://github.com/facebook/react/archive/eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401.tar.gz -s | tar -xzOf - react-eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401/packages/react/src/__tests__/ReactChildren-test.js | sed -n '1,180p'
curl -L https://github.com/facebook/react/archive/eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401.tar.gz -s | tar -xzOf - react-eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401/packages/react-reconciler/src/__tests__/ReactHooksWithNoopRenderer-test.js | sed -n '1,200p'
curl -L https://github.com/facebook/react/archive/eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401.tar.gz -s | tar -xzOf - react-eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401/packages/react-dom/src/__tests__/ReactDOMRoot-test.js | sed -n '1,180p'
node --version
npm --version
git rev-parse --show-toplevel && git branch --show-current
```

Delegated checks:

- Subagent `019e0da3-e57d-7231-90e9-56caeecf251f` checked API inventory extraction. It confirmed that tarball-based metadata plus isolated Node probes are preferable to `npm install`, because install can be blocked by local npm policy and can write lockfiles. It also flagged CJS/ESM, `NODE_ENV`, and `react-server` condition differences as inventory pitfalls.
- Subagent `019e0da3-e5c4-7910-b59d-f6a941abbf67` checked upstream test reuse. It confirmed that upstream tests are scenario sources, not a drop-in conformance suite, because they depend on React's Jest setup, `internal-test-utils`, feature gates, Scheduler mocks, and source-only renderers.

## React 19.2.6 API inventory approach

The public API inventory should be generated, pinned, and reviewed before implementation. The inventory is not the conformance suite; it is the compatibility surface map used to decide which executable behavior comparisons must exist.

Recommended inventory pipeline:

1. Fetch exact package metadata with `npm view <pkg>@<version> --json` and record version, `dist.tarball`, package exports, dependencies, peer dependencies, Node version, npm version, and TypeScript version.
2. Download tarballs by `dist.tarball` into a temporary directory, not the repository. Avoid `npm install` for inventory generation because local npm policy can block installation and package manager commands can mutate lockfiles.
3. Parse each package `package.json` export map into subpath and condition rows. `package.exports` defines entrypoints and conditions but does not prove member names, thrown modules, object descriptors, arity, dev/prod behavior, or ESM interop.
4. Probe every public subpath in isolated Node processes across `require()`, ESM `import()`, `NODE_ENV=development`, `NODE_ENV=production`, and relevant conditions such as `react-server`, `node`, `browser`, `edge-light`, `workerd`, and `bun`.
5. Record export names, value kind, `typeof`, function `.name`, function `.length`, property descriptors, symbol identities, default/module namespace behavior, and thrown entrypoint errors.
6. Parse types with the TypeScript compiler API. Regex over `.d.ts` files is acceptable only as an early sanity check. The final inventory must honor `exports.types`, `typesVersions`, `ts5.0` folders, canary/experimental declarations, namespaces, overloads, JSX declarations, and global augmentations.

Runtime surfaces observed from published packages:

- `react`: `Activity`, `Children`, `Component`, `Fragment`, `Profiler`, `PureComponent`, `StrictMode`, `Suspense`, `act` in development, client internals, compiler runtime, `cache`, `cacheSignal`, `captureOwnerStack`, `cloneElement`, `createContext`, `createElement`, `createRef`, `forwardRef`, `isValidElement`, `lazy`, `memo`, `startTransition`, `unstable_useCacheRefresh`, hooks, and `version`.
- `react` under `react-server`: narrower surface with server internals, element APIs, `Children`, refs, `forwardRef`, `lazy`, `memo`, selected hooks, cache APIs, `use`, and `version`; client hooks such as `useState`, `useEffect`, and transition state hooks are absent.
- `react/jsx-runtime`: `Fragment`, `jsx`, `jsxs`.
- `react/jsx-dev-runtime`: `Fragment`, `jsxDEV`.
- `react/compiler-runtime`: public runtime export `c`; type declaration intentionally exports nothing for IDE autocomplete.
- `react-dom`: DOM internals, `createPortal`, `flushSync`, resource hint APIs (`prefetchDNS`, `preconnect`, `preload`, `preloadModule`, `preinit`, `preinitModule`), form APIs (`requestFormReset`, `useFormState`, `useFormStatus`), `unstable_batchedUpdates`, and `version`.
- `react-dom` under `react-server`: only DOM internals plus resource hint APIs and `version`; client entrypoints throw when imported under the `react-server` condition.
- `react-dom/client`: `createRoot`, `hydrateRoot`, and `version`.
- `react-dom/server`: legacy string/static APIs plus streaming/resume APIs, including `renderToString`, `renderToStaticMarkup`, `renderToPipeableStream`, `renderToReadableStream`, `resume`, and `resumeToPipeableStream`.
- `react-dom/static`: prerender/resume-prerender APIs, including `prerender`, `prerenderToNodeStream`, `resumeAndPrerender`, and `resumeAndPrerenderToNodeStream`.
- Explicit server/static subpaths differ by environment: node exports Node stream variants; browser and edge surfaces omit Node stream variants; bun has a specific entrypoint.
- `react-dom/profiling`: combines root DOM APIs and client root APIs with profiling build behavior.
- `react-dom/test-utils`: `act`.
- `react-dom` depends on `scheduler@^0.27.0`; scheduler compatibility should be inventoried if Fast React exposes or depends on scheduler-compatible behavior. Observed scheduler exports include priority constants and `unstable_scheduleCallback`, `unstable_cancelCallback`, `unstable_shouldYield`, `unstable_runWithPriority`, `unstable_next`, `unstable_wrapCallback`, and related APIs.

Type surfaces:

- `@types/react@19.2.14` is the current target in the master documents. It includes root, JSX runtime, canary, experimental, compiler-runtime, and TS `<=5.0` variants.
- `react-dom@19.2.6` does not publish bundled `types` or `typings`; the latest observed DefinitelyTyped package is `@types/react-dom@19.2.3` with peer `@types/react: ^19.2.0`. If TypeScript compatibility is in scope for `react-dom`, this package should be pinned in the conformance inventory even though the master compatibility list currently names only `@types/react`.

## Behavioral conformance matrix

| Area | APIs or features | Must compare against React 19.2.6 | Blocking level |
| --- | --- | --- | --- |
| Package resolution | Export maps, CJS/ESM interop, `NODE_ENV`, `react-server`, explicit server/static subpaths | Import success/failure, export names, namespace shape, thrown entrypoint messages | M1/M7 |
| Element model | `createElement`, JSX runtimes, `cloneElement`, `isValidElement`, symbols, keys, refs, default props, owner metadata, dev-only freezing and warnings | Object shape, descriptors, symbol identity, key escaping, ref behavior, warning text classes | M3 |
| Children traversal | `Children.map`, `forEach`, `count`, `toArray`, `only`; arrays, iterables, portals, null/boolean holes | Traversal order, callback index, returned keys, exception behavior | M3 |
| Class components | `Component`, `PureComponent`, `setState`, `forceUpdate`, lifecycle ordering, error boundaries | Update merging, callback timing, bailout behavior, error handling | M4/M5 |
| Function components and hooks | All stable hooks plus `useEffectEvent`, `useOptimistic`, `useActionState`, `use`, `unstable_useCacheRefresh` | Hook ordering, invalid-hook diagnostics, state queue semantics, reducer eager bailout, ref identity, memo dependency equality, effect lifecycles | M5 |
| Context | `createContext`, provider/consumer, `useContext`, nested providers, propagation, bailout interaction | Value propagation, stale read prevention, warning cases, renderer boundary behavior | M5 |
| Scheduling and updates | Lanes/priorities, batching, transitions, deferred values, `flushSync`, `unstable_batchedUpdates`, act behavior | Commit order, interruption/resume, priority inversion prevention, batching boundaries, sync flush behavior | M4/M8 |
| Reconciliation | keyed/unkeyed children, fragments, text nodes, portals, memo, lazy, Suspense, Activity | Mount/update/delete order, state retention, fallback reveal/hide, lazy resolution/rejection, bailout behavior | M4-M6 |
| Effects | insertion, layout, passive effects, strict effects, cleanup ordering, unmount behavior | Ordering relative to DOM mutations and each other, StrictMode double-invoke policy, teardown timing | M5/M6 |
| DOM client | `createRoot`, `hydrateRoot`, `root.render`, `root.unmount`, portals, event system, attributes, style, form controls | DOM output, warnings, event propagation, controlled/uncontrolled inputs, hydration mismatch behavior | M6/M7 |
| Resource and form APIs | `preconnect`, `prefetchDNS`, `preload`, `preloadModule`, `preinit`, `preinitModule`, `requestFormReset`, `useFormStatus`, `useFormState` | DOM/resource side effects, option normalization, invalid input warnings, action state semantics | M7/M8 |
| Server rendering | `renderToString`, `renderToStaticMarkup`, streaming APIs, `resume`, static/prerender APIs | HTML bytes, escaping, bootstrap options, stream chunk order, abort/recover behavior, postponed state | M8/M9 |
| Dev diagnostics | warnings, errors, owner stacks, component stacks, `act` warnings, hydration warnings | Message classes and actionable text; exact stack formatting can trail behavior but must be tracked | M3-M9 |
| Types | `@types/react`, `@types/react-dom` if adopted, JSX namespace, overloads, TS version split | Compile-pass/fail fixtures against pinned declarations | M7/M8 |
| Performance | element creation, updates, hooks, context, scheduler, renderer operations | Only after semantic gates pass for the benchmarked area | M8/M9 |

Root cause principle: behavior comparison must observe React as an oracle because many compatibility points are not derivable from export names. Examples include dev/prod object freezing, warning timing, hook queue ordering, scheduler interruption, hydration mismatch handling, and stream chunk order.

## Test harness recommendation

Build a black-box executable comparison harness instead of forking React's internal Jest harness.

Recommended structure:

1. Scenario files describe one behavior in implementation-neutral JavaScript or TypeScript. A scenario exports a function that receives an adapter and returns normalized observations.
2. The runner executes each scenario twice in isolated child processes: once with published `react@19.2.6`/`react-dom@19.2.6`, once with Fast React aliased to the same public entrypoints.
3. Each run emits JSON observations. Observations should include object shapes, descriptors, render logs, DOM snapshots, thrown errors, warning/error logs, effect order, scheduler yields, stream chunks, and TypeScript compile results where relevant.
4. The comparator normalizes volatile details such as absolute paths, generated stack frame line numbers, object identity labels, and timing jitter, while preserving user-visible ordering and message classes.
5. The suite records expected divergences explicitly with owner, milestone, reason, and expiry. An expected divergence without an owner or expiry should fail review.

Adapters:

- `core` adapter: Node-only, no renderer. Covers `react`, JSX runtimes, element shape, `Children`, refs, memo/lazy wrappers, warnings, and type-level fixtures.
- `noop-renderer` adapter: deterministic host renderer owned by Fast React. Covers reconciler, updates, hooks, context, Suspense, Activity, transitions, effects, and scheduling without DOM noise.
- `dom-jsdom` adapter: covers root APIs, DOM mutations, attributes, forms, portals, resource hints, and most events.
- `dom-browser` adapter: Playwright or equivalent for event, selection, focus, input, and hydration cases where jsdom is insufficient.
- `server-node` adapter: covers Node stream APIs, string rendering, static rendering, `resumeToPipeableStream`, abort, and error callbacks.
- `server-web` adapter: covers Web Stream APIs for browser/edge-style entrypoints.
- `typecheck` adapter: uses TypeScript compiler API against pinned declarations and fixture projects.

Runner controls:

- Run with both development and production bundles. Development tests assert diagnostics and object hardening; production tests assert absence of dev-only warnings and production object shapes.
- Run package-resolution probes under CJS and ESM. ESM namespace behavior should be tracked separately from CJS member exports.
- Run `react-server` condition probes separately, including entrypoints that are expected to throw.
- Use deterministic fake clocks only inside adapters that can prove equivalent ordering. Scheduler tests should prefer logged yields and explicit flush helpers over wall-clock thresholds.
- Store React oracle outputs as generated snapshots only after manual review. Regenerate snapshots only when the pinned React target changes.

Pass/fail policy:

- Red: missing API, import mismatch, crash, semantic ordering mismatch, or incorrect DOM/server output in a milestone-gated area.
- Yellow: dev warning text/stack formatting mismatch where runtime behavior is correct and the divergence is documented.
- Green: React and Fast React observations match after approved normalization.

## Upstream test reuse feasibility

Upstream React tests are valuable but not directly reusable as the primary conformance suite. The root cause is that they are source-tree tests for React itself, not published-package black-box tests.

Evidence:

- Published npm tarballs for `react` and `react-dom` include bundles and metadata, not upstream source tests.
- Upstream `v19.2.6` has test volume that is useful as a map: 31 tests under `packages/react/src`, 72 under `packages/react-reconciler/src`, 146 under `packages/react-dom/src`, and 6 under `packages/scheduler/src` by the command patterns above.
- Sampled tests depend on `jest.resetModules`, JSX transforms, `internal-test-utils`, `assertConsoleErrorDev`, feature gates, Scheduler logs, `react-noop-renderer`, React-specific Jest environments, and source-only internals.

Reuse tiers:

- Low adaptation: many `packages/react/src/__tests__` cases for `Children`, element creation, clone, refs, JSX runtime, context validators, class equivalence, forwardRef, memo/lazy wrappers, version checks. Port the behavior into black-box scenarios rather than vendoring the files verbatim.
- Medium adaptation: `react-dom` tests for roots, DOM properties, attributes, forms, events, portals, hydration, and server integration. Reuse scenario intent but write adapters for jsdom/browser/server and console capture.
- High adaptation: `react-reconciler` tests for hooks, updates, Suspense, Activity, transitions, effect ordering, context propagation, and scheduling. These are strong semantic references but require a Fast React noop renderer and scheduler controls.
- Defer: RSC/Flight and server component tests until server component support is explicitly planned.
- Avoid for early conformance: `.internal.js` tests that assert Fiber internals, flags, source-only modules, event internals, DevTools, compiler fixtures, or Facebook/RN-specific forks. These can diagnose future gaps but should not define public compatibility gates.

Recommendation: create an upstream-reference index that links each adopted scenario to the upstream test file and test name, but keep Fast React's executable tests black-box and adapter-driven.

## Compatibility gates by milestone

| Milestone | Gate | Blocking compatibility gaps |
| --- | --- | --- |
| M1 Compatibility Inventory | Generated inventory exists for pinned package/runtime/type surfaces | Unknown public subpaths, missing condition matrix, missing dev/prod split, no type inventory, no list of expected thrown entrypoints |
| M2 Rust Workspace Scaffold | Scaffold can host conformance harness without circular architecture | No JS binding test entrypoint plan, no temp-package aliasing story, no deterministic test renderer slot, no place for generated oracle snapshots |
| M3 Element And Runtime Model | Core element suite matches React oracle | Incorrect element symbols, key/ref extraction, owner/ref behavior, `Children` traversal, JSX runtime output, dev object freezing/warnings |
| M4 Fiber, Updates, And Scheduling | Noop renderer comparison passes for reconciliation and update ordering | Incorrect state retention, update queue ordering, batching, lane priority ordering, interruption/resume, class update callbacks |
| M5 Hooks And Context | Hook/context matrix passes under noop renderer | Incorrect hook ordering diagnostics, stale closures caused by queue bugs, effect cleanup order, context propagation, `useSyncExternalStore`, transitions, `use`, optimistic/action state |
| M6 Renderer Host Boundary | Host-config/noop and DOM proof adapter agree with React where in scope | Host mutation order differs, refs attach/detach in wrong phase, portals/fragments/text handling diverge, hydration boundary semantics missing |
| M7 JS Package Integration | Public package resolution and DOM client smoke comparisons pass | Entry point mismatch, CJS/ESM interop mismatch, broken aliasing as `react`/`react-dom`, missing `react-server` behavior, TypeScript declaration mismatch |
| M8 Conformance And Benchmark Harness | Dual-run harness is mandatory before benchmark claims | Benchmarks run against semantically incomplete areas, oracle snapshots absent, expected divergences unowned, server/static/DOM coverage below declared milestone |
| M9 Iterative Compatibility Closure | Dashboard tracks all known divergences and perf regressions | Untriaged yellow/red divergences, warning mismatches promoted to release without documented tradeoff, speedups caused by missing semantics |

Breaking changes are acceptable when they remove architectural causes of divergence. For example, if an early scaffold makes hooks renderer-local rather than reconciler-owned, it should be broken before M5 because it would hide update queue and effect ordering root causes behind adapter patches.

## Benchmark gating recommendation

Do not use performance as a merge or release claim until the conformance gate for the benchmarked behavior is green.

Benchmark policy:

- M3 may benchmark element creation only after element shape, key/ref, JSX runtime, and dev/prod semantics match React.
- M4/M5 may benchmark updates, hooks, context, and scheduler only after the noop renderer comparison suite passes for those behaviors.
- M6/M7 may benchmark renderer/DOM paths only after the DOM adapter covers mutation order, event basics, refs, and hydration cases relevant to the benchmark.
- M8 should introduce a benchmark manifest that links each benchmark to its required conformance scenario IDs. A benchmark without linked green conformance scenarios should be marked invalid, not merely failing.
- Compare against React 19.2.6 in the same Node/browser process shape as Fast React where possible. Record Node version, build mode, host renderer, warmup count, sample size, and confidence intervals.

Rationale: otherwise Fast React can appear faster by omitting work such as dev checks, effect ordering, scheduler yielding, hydration recovery, stream flushing, or DOM normalization.

## Proposed follow-up implementation tasks

1. Add a read-only inventory generator that downloads pinned tarballs to a temp directory and emits an API inventory JSON for `react`, `react-dom`, `scheduler`, `@types/react`, and optionally `@types/react-dom`.
2. Add package-resolution probes for CJS, ESM, `NODE_ENV`, and export conditions, including expected throw cases.
3. Create the conformance runner skeleton with React oracle execution, Fast React alias execution, JSON observation format, normalization, and expected-divergence metadata.
4. Build the `core` adapter and first scenarios for element creation, JSX runtimes, `Children`, refs, and dev/prod warnings.
5. Design a deterministic noop renderer adapter before implementing hooks or scheduling so reconciler behavior can be compared without DOM-specific noise.
6. Create a DOM adapter using jsdom plus a browser smoke subset for focus, selection, event propagation, and hydration behaviors that jsdom cannot model reliably.
7. Add TypeScript fixture compilation for `@types/react@19.2.14` and decide whether to pin `@types/react-dom@19.2.3` as an explicit compatibility target.
8. Create an upstream-reference index mapping scenario IDs to upstream React `v19.2.6` test files and test names.
9. Add benchmark manifest rules that require green conformance scenario IDs before any benchmark is considered valid.

## Completion checklist

- Objective addressed: yes, this report designs the conformance strategy rather than implementing code.
- Required sections present: yes.
- Public API inventory approach included: yes, including package exports, runtime probes, type parsing, dev/prod, CJS/ESM, and `react-server` conditions.
- Behaviors requiring executable comparison identified: yes, in the behavioral conformance matrix.
- Test structure recommended: yes, black-box dual-run harness with adapters and normalized JSON observations.
- Upstream test reuse feasibility covered: yes, including low/medium/high/deferred tiers and why direct reuse is not sufficient.
- Compatibility gaps that should block milestones listed: yes, by milestone M1-M9.
- Benchmark gating recommendation included: yes.
- Proposed follow-up tasks included: yes.
- Delegated checks summarized: yes.
- Quality review: the strategy favors generated inventories, black-box comparisons, explicit expected divergences, and milestone gates to keep maintainability high.
- Maintainability review: the adapter split avoids locking Fast React to React's internal Jest harness while preserving upstream scenario traceability.
- Performance review: benchmark gates prevent measuring missing semantics as speed.
- Security review: tarball fetching should happen in temp directories; generated scripts must avoid executing package lifecycle scripts and should treat tarball contents as untrusted input except when loaded in isolated probe processes.

Handoff summary:

- Findings: React 19.2.6 compatibility must be anchored on executable oracle comparisons, not export names. The inventory should be generated from pinned tarballs and runtime/type probes. Upstream React tests should seed scenarios, but the executable harness should remain black-box and adapter-driven.
- Changed files: `worker-progress/worker-002-conformance.md`.
- Commands run: listed in `Sources and commands used`.
- Unresolved risks and follow-up tasks: exact dev warning stacks are expensive to match; scheduler/lane behavior needs a deterministic noop renderer; `react-dom` type compatibility requires a decision on pinning `@types/react-dom@19.2.3`; server components/RSC should remain out of scope until explicitly planned.
