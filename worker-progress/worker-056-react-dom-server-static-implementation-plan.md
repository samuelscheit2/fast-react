# worker-056-react-dom-server-static-implementation-plan

## Objective

Produce a report-only implementation plan for React DOM server and static rendering, including legacy string rendering, Node streams, Web Streams, prerender/resume APIs, and Fizz-compatible internal boundaries.

Write scope honored: only `worker-progress/worker-056-react-dom-server-static-implementation-plan.md` was changed. No implementation code was added.

## Summary

React DOM server/static support should be implemented as a Fizz-compatible server renderer stack, not as a recursive HTML string helper and not as an extension of the client DOM mutation renderer.

The safe split is:

1. Public package entrypoint compatibility: preserve the published `react-dom@19.2.6` server/static subpaths, export keys, condition routing, `react-server` throwing modules, and result object shapes. This is package facade work and can remain loud-placeholder behavior until the renderer exists.
2. Renderer-agnostic Fizz mechanics: own requests, tasks, segments, Suspense/Activity boundaries, postpones, resume replay slots, `useId`, aborts, ready callbacks, flush queues, and opaque postponed state.
3. DOM server formatting: own HTML/SVG/MathML serialization, escaping, insertion modes, resource/header queues, bootstrap scripts/modules/import maps, nonce handling, Suspense/Activity/form markers, segment placeholders, and legacy static-markup differences.
4. Runtime stream adapters: adapt Fizz output to Node `Writable`, Web `ReadableStream`, Edge/browser stream controllers, and Bun's direct stream shape without making those runtimes aliases of one another.
5. Hydration marker contract: server/Fizz generates exact bytes and DOM marker shapes; client hydration consumes them. Hydration matching, event replay, and DOM mutation fallback remain separate workers.

The first implementation work should be oracle-first. Worker 050 is active and no worker 050 output is merged in this checkout, so this plan treats server/static oracles as unavailable and starts with a deterministic oracle slice unless that worker lands first.

## Current State

`packages/react-dom/**` already contains package-surface placeholders for the server/static subpaths:

- `server.node.js` exports `version`, `renderToString`, `renderToStaticMarkup`, `renderToPipeableStream`, `renderToReadableStream`, `resumeToPipeableStream`, and `resume`.
- `server.browser.js` exports `version`, `renderToString`, `renderToStaticMarkup`, `renderToReadableStream`, and `resume`.
- `server.edge.js` exports `version`, `renderToReadableStream`, `renderToString`, `renderToStaticMarkup`, and `resume`.
- `server.bun.js` exports `version`, `renderToReadableStream`, `resume`, `renderToString`, and `renderToStaticMarkup`; `resume` is intentionally `undefined`, matching the published Bun wrapper caveat from workers 033 and 042.
- `static.node.js` exports `version`, `prerenderToNodeStream`, `prerender`, `resumeAndPrerenderToNodeStream`, and `resumeAndPrerender`.
- `static.browser.js` and `static.edge.js` export `version`, `prerender`, and `resumeAndPrerender`.
- `server.react-server.js` and `static.react-server.js` throw the React Server Components unsupported errors.

These files are public facade scaffolds only. They do not implement server rendering semantics. The Rust workspace currently has core, host-config, reconciler, test-renderer, and N-API scaffold crates, but no server/Fizz crate, DOM server serializer crate, or stream adapter crate. `fast-react-host-config` already reserves hydration, resources, singletons, forms, and a placeholder `HydrationHost`, but real Fizz output should use a separate server format boundary rather than forcing server rendering through `MutationRenderer` or client hydration traits.

## Evidence From Merged Workers

Worker 005 established that upstream React tests are scenario evidence, not drop-in gates. Server/Fizz tests depend on React's source Jest harness, feature gates, scheduler mocks, internal test utilities, DOM/JSDOM helpers, and host-config forks. Fast React should first add deterministic local oracles, then adapt curated upstream files such as `ReactDOMFizzServer-test.js`, `ReactDOMFizzStatic-test.js`, `ReactDOMServerIntegration*.js`, `ReactDOMServerPartialHydration*.js`, and `ReactDOMServerSelectiveHydration*.js`.

Worker 033 established the authoritative public package surface from the published `react-dom@19.2.6` package. The server/static subpaths are `react-dom/server`, `react-dom/server.node`, `react-dom/server.browser`, `react-dom/server.edge`, `react-dom/server.bun`, `react-dom/static`, `react-dom/static.node`, `react-dom/static.browser`, and `react-dom/static.edge`. Runtime compatibility and TypeScript declaration compatibility must remain separate work products.

Worker 042 established the server/static root cause: legacy string rendering, pipeable streams, Web Streams, static prerendering, postponed state, and resume all sit on React Fizz request semantics plus DOM server formatting. `renderToString` and `renderToStaticMarkup` are Fizz wrappers, not separate string renderers.

Worker 043 established the hydration side of the contract. Client hydration must parse exact Fizz markers such as `<!--$-->`, `<!--$?-->`, `<!--$!-->`, `<!--/$-->`, `<!--&-->`, `<!--/&-->`, `<!--F!-->`, `<!--F-->`, preamble contribution comments, adjacent templates, and runtime-mutated `$~` or `$!` states. Server/Fizz owns marker generation; hydration owns DOM matching and event replay.

## Public Entrypoint Compatibility

Keep package compatibility distinct from real rendering:

- The package facade owns `package.json` exports, subpath routing, `react-server` throwing modules, public export keys, property descriptors, version exports, and blocked physical subpath behavior.
- The facade should convert JS options into internal request options only after the Fizz stack exists.
- The facade should preserve public result shapes: pipeable stream objects with `pipe` and `abort`, Web `ReadableStream` objects with `allReady`, and static results with `{ prelude, postponed }`.
- The facade should not synthesize HTML, stream chunks, hydration markers, postponed state, or resources itself.
- TypeScript declaration support should remain explicit and separate from runtime entrypoint support. `@types/react-dom@19.2.3` has known runtime/type gaps around server/static `version`, `resume`, and static browser `resumeAndPrerender`.

This split allows a package-surface worker to merge independently from Fizz semantics. It also avoids a false compatibility claim where imports work but behavior is missing.

## Fizz-Compatible Internal Boundaries

### Server Request Engine

Add a renderer-agnostic server crate, likely `crates/fast-react-server/**`, that owns:

- request lifecycle: create, start work, start flowing, stop flowing, abort, fatal error, shell ready, all ready, postponed extraction;
- task queues and ping/retry mechanics;
- segments, completed queues, partial boundaries, client-rendered boundaries, and flush ordering;
- Suspense, SuspenseList, Activity, `use`, thenables, `postpone`, context, and server-compatible hooks needed during render;
- `useId`, identifier prefix state, root format context handles, and replay slots;
- opaque postponed state with validation for Fast React version, renderer kind, runtime variant, identifier-prefix mode, and resume compatibility.

This crate must not know HTML strings, DOM comments, Node streams, Web Streams, or browser globals.

### DOM Server Format Layer

Add a DOM-specific format crate, likely `crates/fast-react-dom-server/**`, that owns:

- HTML, SVG, and MathML insertion modes;
- host element, attribute, property, style, text, and `dangerouslySetInnerHTML` serialization;
- escaping for text, attributes, inline scripts, import maps, Link headers, and quoted header parameters;
- completed, pending, client-rendered, queued, and aborted Suspense output;
- Activity boundary output;
- form state markers and form replay bootstrap;
- placeholder/template IDs, segment wrappers, boundary IDs, root IDs, and instruction chunks;
- resource hints, hoistables, preamble/postamble, `html`/`head`/`body` singleton contribution markers, bootstrap scripts/modules, nonces, import maps, and `onHeaders`;
- legacy DOM config differences such as static markup suppressing hydration markers for completed boundaries.

This crate should expose structured operations over chunks and format state, not ad hoc string concatenation from the package facade.

### Stream Adapters

Add a stream boundary, either inside `crates/fast-react-server/**` or a sibling `crates/fast-react-server-streams/**`, that models destination behavior separately from rendering:

- Node `Writable`: UTF-8 chunk buffering, `destination.write()` backpressure, `drain`, optional `flush()`, `end()`, `destroy(error)`, early close, and destination error aborts.
- Web `ReadableStream`: byte stream source, pull-driven flowing, `cancel(reason)` abort, `AbortSignal` integration, `allReady`, and unhandled rejection suppression.
- Browser/edge stream controllers: enqueue/close/error behavior without Node-style backpressure.
- Bun direct streams: direct string chunk behavior and Bun-specific scheduling/hash choices where required.

The Node package build exposes both Node pipeable and Web Stream APIs; browser and edge expose Web Stream APIs; Bun has the published `resume` property caveat. Do not normalize these runtime differences away.

### Hydration Marker Contract

The server stack must publish the exact marker contract consumed by hydration:

| Output class | Required marker shape |
| --- | --- |
| Completed Suspense | `<!--$-->...<!--/$-->` |
| Pending Suspense | `<!--$?--><template id="..."></template>...<!--/$-->` |
| Client-rendered Suspense | `<!--$!--><template data-dgst="..." data-msg="..." data-stck="..." data-cstck="..."></template>...<!--/$-->` |
| Queued Suspense runtime state | start comment data mutates to `$~` while completion is queued |
| Activity | `<!--&-->...<!--/&-->` |
| Matching form state | `<!--F!-->` |
| Non-matching form state | `<!--F-->` |
| Segment placeholder | `<template id="{identifierPrefix}P:{hex}"></template>` |
| Segment wrapper | hidden wrapper with `{identifierPrefix}S:{hex}`, insertion-mode-specific for DOM namespaces and table contexts |
| Boundary ID | `{identifierPrefix}B:{hex}` |
| Preamble contributions | `<!--html-->`, `<!--head-->`, `<!--body-->` |

Server implementation must generate these; hydration implementation must parse and act on them. Any marker contract change should go through a marker oracle before implementation changes.

## API Semantics To Preserve

### Legacy String Rendering

`renderToString` and `renderToStaticMarkup` should be implemented after the Fizz request engine and DOM legacy format config exist:

- create a Fizz request;
- use progressive chunk size `Infinity`;
- start work;
- abort pending work before flowing;
- stream into an in-memory destination;
- throw the synchronous-input suspension error when the shell never becomes ready;
- use Node-vs-browser abort guidance text for suspended input;
- set `generateStaticMarkup = true` for `renderToStaticMarkup`, suppressing hydration marker output where React's legacy config does.

Do not build these as standalone recursive serializers. That would miss Suspense fallback behavior, `useId`, resource flushing, form markers, abort semantics, and future resume compatibility.

### Node Streams

`renderToPipeableStream` and `resumeToPipeableStream` should return a public object with `pipe(destination)` and `abort(reason)`:

- `startWork(request)` happens immediately;
- `prepareForStartFlowingIfBeforeAllReady(request)` runs before first pipe;
- only one destination can be piped, with React's one-pipe error behavior covered by oracle;
- destination `drain`, `error`, and `close` events feed back into flow/abort state;
- destination errors and early close abort pending work;
- optional `destination.flush()` is respected;
- resume validates postponed state before request creation.

The Node build also exposes `renderToReadableStream` and `resume`, so Node integration cannot be limited to `Writable` streams.

### Web Streams

`renderToReadableStream` and `resume` should return promises resolving to Web `ReadableStream` objects with an `allReady` promise property:

- streams are byte streams with the React-observed high-water-mark behavior;
- `pull(controller)` starts flowing;
- `cancel(reason)` aborts the request;
- `AbortSignal` aborts immediately when already aborted and removes listeners after future aborts;
- shell errors reject the outer promise;
- `allReady` rejection is caught to avoid unhandled rejections;
- browser/edge implementations write through stream controllers directly, while Node may bridge through a Writable-shaped adapter.

### Static Prerender And Resume

Static APIs should be implemented as their own slice, not as live stream aliases:

- Node: `prerenderToNodeStream`, `prerender`, `resumeAndPrerenderToNodeStream`, and `resumeAndPrerender`.
- Browser/edge: `prerender` and `resumeAndPrerender`.
- `prerender*` uses a prerender request with postponed tracking.
- `resumeAndPrerender*` resumes from postponed state and tracks new postponed holes.
- returned results are promises for `{ prelude, postponed }`;
- the `prelude` is a Node stream or Web `ReadableStream` according to entrypoint;
- `postponed` is `null` when nothing postponed and an opaque validated token otherwise;
- static completion waits until all-ready before exposing the result stream;
- prerendered bootstrap script handling has static-specific nonce behavior;
- Web static `onHeaders` should expose a real `Headers` object where React does.

### Postponed State

Treat postponed state as an opaque public token, not a plain JSON contract and not a raw native pointer:

- internal state needs next segment ID, root format context, progressive chunk size, resumable state, replay nodes, and replay slots;
- resumable DOM state needs identifier prefix, form ID counter, streaming format, instruction bits, preamble flags, bootstrap state, and resource caches;
- tokens should carry version/renderer/runtime markers and reject mismatches with explicit errors;
- tokens must not expose native memory addresses or permit use-after-free across JS calls.

## Recommended Implementation Sequence

These slices are ordered to minimize false compatibility claims. Slices with overlapping write scopes should be run sequentially, not in parallel.

1. Server/static behavior oracles
   - Write scope: `tests/conformance/src/react-dom-server-static-*.mjs`, `tests/conformance/scripts/*react-dom-server-static*.mjs`, `tests/conformance/test/react-dom-server-static-*.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-server-static-*.json`, `worker-progress/worker-react-dom-server-static-oracles.md`.
   - Task: capture export keys, descriptors, `react-server` throws, result shapes, legacy simple markup, stream shape, option shape, one-pipe errors, abort signal behavior, static result shape, postponed token shape, and initial marker bytes. If worker 050 lands first, use its merged output and fill only uncovered scenarios.
   - Verification: `npm test --workspace @fast-react/conformance`, oracle regeneration byte-compare, temp/local path leak guard, trailing whitespace check.

2. Package facade hardening
   - Write scope: `packages/react-dom/**`, `tests/smoke/**`, optional `tests/conformance/**`, `worker-progress/worker-react-dom-server-static-facade.md`.
   - Task: keep server/static entrypoints aligned with the export oracle while preserving loud unsupported behavior. This may include `version` and exact descriptor work, but no HTML generation.
   - Verification: `node tests/smoke/import-entrypoints.mjs`, `npm test --workspace @fast-react/conformance` for export oracles, blocked physical subpath probes.

3. Fizz request core crate
   - Write scope: `crates/fast-react-server/**`, root `Cargo.toml`, `worker-progress/worker-fast-react-server-core.md`.
   - Task: implement request/task/segment/boundary/postpone/resume/abort state and a renderer-agnostic format trait. Use fake format/destination tests only.
   - Verification: `cargo fmt --all --check`, `cargo test -p fast-react-server --all-features`, `cargo clippy -p fast-react-server --all-targets --all-features -- -D warnings`.

4. DOM format crate foundation
   - Write scope: `crates/fast-react-dom-server/**`, root `Cargo.toml`, `tests/conformance/**` only for generated fixtures if needed, `worker-progress/worker-fast-react-dom-server-format.md`.
   - Task: implement DOM serialization, escaping, insertion modes, marker emission, template/segment IDs, and legacy static-markup toggles against the Fizz core trait. Keep resources minimal but structured.
   - Verification: Rust unit tests for escaping and insertion modes, marker oracle byte-compare, `cargo clippy -p fast-react-dom-server --all-targets --all-features -- -D warnings`.

5. Resource, header, and bootstrap formatting
   - Write scope: `crates/fast-react-dom-server/**`, `tests/conformance/**`, `worker-progress/worker-fast-react-dom-server-resources.md`.
   - Task: add resource hint queues, preconnect/preload/preinit/preinitModule behavior, Link header budget/escaping, scripts/modules/import maps, nonces, preamble/postamble, and singleton contribution markers.
   - Verification: dedicated escaping/header/resource oracles, Rust unit tests for deduplication and capacity behavior, security review of serializer entrypoints.

6. Stream adapter layer
   - Write scope: `crates/fast-react-server-streams/**` or `crates/fast-react-server/**`, root `Cargo.toml`, `worker-progress/worker-fast-react-server-streams.md`.
   - Task: add destination traits and runtime-neutral tests for Node-like backpressure, Web cancel/abort, close/error, byte chunks, and flow control. Do not edit JS entrypoints in this slice unless the scope explicitly includes a minimal private adapter harness.
   - Verification: Rust tests with mock destinations, JS local probes only if the slice adds JS glue, no upstream source tests.

7. Node server package integration
   - Write scope: `packages/react-dom/**`, optional `bindings/node/**` if native handles are required, `tests/conformance/**`, `worker-progress/worker-react-dom-server-node-integration.md`.
   - Task: wire `server.node` live and resume APIs to the Fizz stack. Preserve pipeable result shape, Web Stream APIs in the Node build, one-pipe guard, callbacks, abort, and postponed validation.
   - Verification: server/static conformance oracles for Node entrypoints, local Node stream probes, `node tests/smoke/import-entrypoints.mjs`.

8. Browser/edge/Bun server package integration
   - Write scope: `packages/react-dom/**`, `tests/conformance/**`, `worker-progress/worker-react-dom-server-web-runtimes.md`.
   - Task: wire browser, edge, and Bun server entrypoints. Preserve runtime-specific APIs and the Bun `resume` undefined caveat unless a later React target changes it.
   - Verification: Web Stream conformance probes under Node where possible, condition-resolution oracle checks, targeted runtime probes when available.

9. Static prerender/resume integration
   - Write scope: `packages/react-dom/**`, `tests/conformance/**`, `worker-progress/worker-react-dom-static-prerender-resume.md`.
   - Task: wire `static.node`, `static.browser`, and `static.edge` APIs to prerender and resume-and-prerender requests, including `{ prelude, postponed }` results and `Headers` behavior.
   - Verification: static shape/stream/postponed oracles, resume replay oracles for nested Suspense, invalid postponed token rejection probes.

10. Legacy string wrappers
    - Write scope: `packages/react-dom/**`, `tests/conformance/**`, `worker-progress/worker-react-dom-legacy-string-rendering.md`.
    - Task: implement `renderToString` and `renderToStaticMarkup` as Fizz wrappers after the engine and DOM legacy config are in place.
    - Verification: legacy markup oracles, suspension abort/error oracles, static markup marker suppression oracles.

11. Fizz-hydration marker handoff
    - Write scope: `tests/conformance/src/react-dom-fizz-marker-*.mjs`, `tests/conformance/scripts/*react-dom-fizz-marker*.mjs`, `tests/conformance/test/react-dom-fizz-marker-*.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-fizz-marker-*.json`, `worker-progress/worker-react-dom-fizz-hydration-contract.md`.
    - Task: prove server output can be consumed by the planned hydration marker parser without marker translation. This slice should update tests/contracts before changing server or hydration code.
    - Verification: byte/DOM-node marker oracles, nested boundary depth cases, runtime-mutated `$~`/`$!` cases, form marker adjacency cases.

12. Upstream server/Fizz harness
    - Write scope: `tests/upstream-react-dom-server/**`, `worker-progress/worker-upstream-react-dom-server-harness.md`.
    - Task: adapt a curated subset of upstream React DOM server/Fizz tests using worker 005's harness requirements. This should happen only after local oracles cover the same root behavior.
    - Verification: focused upstream harness command documented by that worker, skip ledger with root-cause categories.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The plan uses worker 033 for public npm package evidence and workers 042/043 for source-level server/hydration semantics.
- Public entrypoint compatibility is kept separate from behavioral compatibility.
- Worker 050 was not used because no output is merged in this checkout.

Maintainability:

- Fizz request mechanics, DOM formatting, stream adapters, JS package integration, hydration consumers, and upstream test harnessing have separate ownership boundaries.
- Breaking changes are justified if existing traits imply server rendering must be a client host-config mode. Server format traits should be separate from mutation, persistence, and hydration host traits.
- Postponed state should be explicitly versioned and opaque to avoid brittle userland contracts.

Performance:

- The architecture preserves progressive chunk sizing, flush queue ordering, backpressure points, resource preloads, and shell/all-ready timing.
- Benchmarks should wait until conformance covers markers, Suspense, resources, aborts, and streams. Otherwise performance numbers will measure missing semantics.

Security:

- HTML, attribute, inline script, import map, and Link header escaping must be centralized in the DOM server format layer.
- Nonces, bootstrap scripts/modules, error template attributes, form replay markers, and postponed state are security-sensitive.
- Do not expose raw native handles or memory addresses through postponed tokens.
- Do not run upstream fixtures or broad upstream tests until their scripts and module aliases are isolated.

## Risks Or Blockers

- Fast React does not yet have the reconciler, hooks, context, Suspense, Activity, `use`, `postpone`, form state, or server component execution model required for real Fizz parity.
- DOM attribute/style/namespace serialization is not implemented yet; server output depends on it before meaningful markup can match React.
- Resource and header behavior is security-sensitive and easy to get superficially correct but semantically wrong.
- Resume correctness depends on exact replay slots and nested boundary identity.
- Hydration compatibility depends on exact marker bytes and DOM shapes, but client hydration remains a separate implementation track.
- Node condition probes do not prove behavior in real browsers, edge runtimes, Deno, Workerd, or Bun.
- Upstream React server tests cannot be used as early gates until the harness adapters from worker 005 exist.

## Evidence Files Consulted

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-005-upstream-tests.md`
- `worker-progress/worker-033-react-dom-inventory.md`
- `worker-progress/worker-042-react-dom-server-fizz-plan.md`
- `worker-progress/worker-043-react-dom-hydration-plan.md`
- `packages/react-dom/package.json`
- `packages/react-dom/placeholder-utils.js`
- `packages/react-dom/server.node.js`
- `packages/react-dom/server.browser.js`
- `packages/react-dom/server.edge.js`
- `packages/react-dom/server.bun.js`
- `packages/react-dom/static.node.js`
- `packages/react-dom/static.browser.js`
- `packages/react-dom/static.edge.js`
- `packages/react-dom/server.react-server.js`
- `packages/react-dom/static.react-server.js`
- `tests/conformance/oracles/react-19.2.6-react-dom-export-oracle.json`
- `tests/conformance/src/react-dom-export-targets.mjs`
- `tests/conformance/src/react-dom-type-targets.mjs`
- `Cargo.toml`
- `package.json`
- `crates/fast-react-host-config/src/lib.rs`
- `crates/fast-react-reconciler/src/lib.rs`
- `crates/fast-react-core/src/lib.rs`
- `crates/fast-react-core/src/element.rs`

## Delegated Hypothesis Checks

Two nested read-only explorer agents were spawned because the worker instructions asked workers to use subagents to test hypotheses:

- Public package entrypoint compatibility: asked to inspect worker 033, worker 042, current `packages/react-dom` server/static files, and export/type oracle files. Expected output: exact entrypoints/exports, current scaffold gaps, and mergeable package-surface slices.
- Server/static semantics and hydration boundary: asked to inspect workers 005, 042, 043, and current host/reconciler files. Expected output: root-cause architecture requirements, hydration marker constraints, and mergeable Fizz/static slices.

Their results were pending at initial draft time and will be incorporated before final handoff if they return in time. Direct local evidence above is sufficient if usage limits or timeouts prevent completion.

## Commands Run

Project orientation:

```sh
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
rg --files worker-progress
git status --short
rg --files packages/react-dom crates tests/conformance | sed -n '1,220p'
```

Evidence search and report reads:

```sh
wc -l worker-progress/worker-005-upstream-tests.md worker-progress/worker-033-react-dom-inventory.md worker-progress/worker-042-react-dom-server-fizz-plan.md worker-progress/worker-043-react-dom-hydration-plan.md
rg -n "server|static|renderTo|Fizz|prerender|resume|hydrate|marker|stream|entrypoint|exports|legacy|string|Node|Web|Segment|Boundary|Suspense" worker-progress/worker-005-upstream-tests.md worker-progress/worker-033-react-dom-inventory.md worker-progress/worker-042-react-dom-server-fizz-plan.md worker-progress/worker-043-react-dom-hydration-plan.md
find packages/react-dom -maxdepth 1 -type f -print | sort
sed -n '1,220p' worker-progress/worker-005-upstream-tests.md
sed -n '220,539p' worker-progress/worker-005-upstream-tests.md
sed -n '1,220p' worker-progress/worker-042-react-dom-server-fizz-plan.md
sed -n '220,531p' worker-progress/worker-042-react-dom-server-fizz-plan.md
sed -n '1,260p' worker-progress/worker-033-react-dom-inventory.md
sed -n '260,582p' worker-progress/worker-033-react-dom-inventory.md
sed -n '1,220p' worker-progress/worker-043-react-dom-hydration-plan.md
sed -n '220,324p' worker-progress/worker-043-react-dom-hydration-plan.md
```

Current scaffold reads:

```sh
sed -n '1,220p' packages/react-dom/package.json
sed -n '1,220p' packages/react-dom/placeholder-utils.js
sed -n '1,180p' packages/react-dom/server.node.js
sed -n '1,180p' packages/react-dom/server.browser.js
sed -n '1,180p' packages/react-dom/server.edge.js
sed -n '1,180p' packages/react-dom/server.bun.js
sed -n '1,180p' packages/react-dom/static.node.js
sed -n '1,180p' packages/react-dom/static.browser.js
sed -n '1,180p' packages/react-dom/static.edge.js
sed -n '1,120p' packages/react-dom/server.react-server.js && sed -n '1,120p' packages/react-dom/static.react-server.js
sed -n '1,260p' tests/conformance/oracles/react-19.2.6-react-dom-export-oracle.json
sed -n '1,260p' tests/conformance/src/react-dom-export-targets.mjs
sed -n '1,260p' tests/conformance/src/react-dom-type-targets.mjs
sed -n '1,220p' Cargo.toml
sed -n '1,220p' package.json
sed -n '1,260p' crates/fast-react-host-config/src/lib.rs
sed -n '1,260p' crates/fast-react-reconciler/src/lib.rs
rg -n "trait|Hydrat|MutationRenderer|HostCreation|HostCommit|Resource|Singleton|Form|Server|Fizz" crates/fast-react-host-config/src/lib.rs
sed -n '220,560p' crates/fast-react-host-config/src/lib.rs
sed -n '1,220p' crates/fast-react-core/src/lib.rs
sed -n '1,220p' crates/fast-react-core/src/element.rs
sed -n '748,1260p' crates/fast-react-host-config/src/lib.rs
```

Goal/delegation tools used:

```text
create_goal for worker 056.
spawn_agent for public package entrypoint compatibility hypothesis check.
spawn_agent for server/static semantics and hydration boundary hypothesis check.
```

## Changed Files

- `worker-progress/worker-056-react-dom-server-static-implementation-plan.md`

## Recommended Next Tasks

1. Add or merge server/static behavior oracles before implementing code.
2. Keep package facade compatibility work separate from Fizz semantics.
3. Add a renderer-agnostic Fizz server crate.
4. Add a DOM server format crate with centralized escaping and marker emission.
5. Add stream adapters before wiring package entrypoints.
6. Wire server APIs before static prerender/resume APIs.
7. Implement legacy string APIs as Fizz wrappers, not standalone string renderers.
8. Add a marker handoff oracle before hydration consumes Fast React server output.
