# worker-042-react-dom-server-fizz-plan

## Objective

Produce a report-only React DOM server/static Fizz compatibility plan for Fast React.

Write scope honored: only `worker-progress/worker-042-react-dom-server-fizz-plan.md` was changed. No implementation code was added.

## Summary

React DOM server/static compatibility is not a string-rendering helper. In React DOM 19.2.6, legacy string rendering, Node pipeable streams, Web Streams, static prerendering, postponed state, and resume all sit on the Fizz request model from `react-server/src/ReactFizzServer`, with DOM-specific serialization supplied by `react-dom-bindings/src/server/ReactFizzConfigDOM`.

Fast React should implement this as a separate server renderer stack, not as client DOM mutation or hydration code:

1. A renderer-agnostic Fizz request engine that owns tasks, segments, Suspense boundaries, Activity boundaries, postponed holes, replay slots, abort state, and flush queues.
2. A DOM server format layer that owns HTML/SVG/MathML serialization, escaping, resource queues, resource headers, bootstrap scripts/modules, import maps, Suspense/Activity/form markers, and hydration marker IDs.
3. Runtime-specific stream adapters for Node `Writable`, Web `ReadableStream`, Edge/browser controllers, and Bun direct streams.
4. A React DOM package facade that preserves the published `react-dom@19.2.6` server/static export map and condition behavior.

The server renderer must publish exact marker contracts for hydration, but it must not implement client hydration, DOM mutation, event replay, or root update behavior. Those belong to separate DOM client/hydration workers.

## Prior accepted evidence

Worker 005 established that upstream React tests are not drop-in tests. The root cause is React's custom monorepo Jest harness, source-only deep imports, feature gates, Scheduler mocks, host-config forks, internal test utilities, and renderer assumptions. For server/Fizz work, upstream files such as `ReactDOMFizzServer-test.js`, `ReactDOMFizzStatic-test.js`, `ReactDOMServerIntegration*.js`, `ReactDOMServerPartialHydration*.js`, and `ReactDOMServerSelectiveHydration*.js` should seed scenarios only after Fast React has matching adapters.

Worker 033 established the public React DOM 19.2.6 package surface from the npm tarball and local generated inventory. The published package, not the source package metadata, is authoritative. The server/static public subpaths are:

- `react-dom/server`
- `react-dom/server.node`
- `react-dom/server.browser`
- `react-dom/server.edge`
- `react-dom/server.bun`
- `react-dom/static`
- `react-dom/static.node`
- `react-dom/static.browser`
- `react-dom/static.edge`

Under the `react-server` condition, all server/static subpaths throw `react-dom/server is not supported in React Server Components.` or `react-dom/static is not supported in React Server Components.`.

This worker did not spawn nested agents in this retry because the continuation instruction explicitly prohibited spawning, waiting on, or closing nested agents. Hypotheses were checked directly against accepted worker reports and React DOM 19.2.6 source/package evidence.

## Package and export matrix

From `tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json` and the `react-dom@19.2.6` npm tarball:

| Subpath | Default exports | Notes |
| --- | --- | --- |
| `react-dom/server`, `react-dom/server.node` | `version`, `renderToString`, `renderToStaticMarkup`, `renderToPipeableStream`, `renderToReadableStream`, `resumeToPipeableStream`, `resume` | Aggregate/default Node target resolves to `server.node.js` under Node. |
| `react-dom/server.browser` | `version`, `renderToString`, `renderToStaticMarkup`, `renderToReadableStream`, `resume` | Web Streams only, plus legacy browser string APIs. |
| `react-dom/server.edge` | `version`, `renderToReadableStream`, `renderToString`, `renderToStaticMarkup`, `resume` | Edge Web Streams plus legacy browser string APIs. |
| `react-dom/server.bun` | `version`, `renderToReadableStream`, `resume`, `renderToString`, `renderToStaticMarkup` | Wrapper assigns `resume = b.resume`; inspected CJS Bun bundle does not define `b.resume`, so the runtime property exists with value `undefined`. |
| `react-dom/static`, `react-dom/static.node` | `version`, `prerenderToNodeStream`, `prerender`, `resumeAndPrerenderToNodeStream`, `resumeAndPrerender` | Aggregate/default Node target resolves to `static.node.js` under Node. |
| `react-dom/static.browser`, `react-dom/static.edge` | `version`, `prerender`, `resumeAndPrerender` | Web Streams static APIs. |

The public `exports` map has `workerd` and `edge-light` conditions for edge files, `worker` and `deno` conditions for browser files, and no `bun` condition for `react-dom/static`.

## Source evidence and root causes

### Shared Fizz request model

`packages/react-server/src/ReactFizzServer.js` owns the real server renderer model:

- `createRequest` creates the root segment and root task for live rendering.
- `createPrerenderRequest` starts tracking postponed holes in `trackedPostpones`.
- `resumeRequest` replays a previous `PostponedState` through `replayNodes` and `replaySlots`.
- `resumeAndPrerenderRequest` combines resume with a new postponed-hole tracking pass.
- `startWork`, `startFlowing`, `stopFlowing`, `abort`, `flushResources`, and `getPostponedState` drive scheduling, flushing, aborts, resource flushes, and resume state extraction.

The request contains root format context, render state, resumable state, progressive chunk size, task queues, completed/client-rendered/partial boundary queues, pending root/all task counts, fatal error state, and optional form state. Reimplementing `renderToString` as a recursive string builder would miss this request state and would diverge immediately on Suspense, resources, aborts, `useId`, form markers, and resume.

### Legacy string rendering

`packages/react-dom/src/server/ReactDOMLegacyServerImpl.js` still uses Fizz:

- It creates a Fizz request with `createRequest`.
- It uses `ReactFizzConfigDOMLegacy`, not an independent legacy renderer.
- It sets `progressiveChunkSize` to `Infinity`.
- It starts work, aborts pending work before flowing, then streams into an in-memory destination.
- It throws the synchronous-input suspension error if the shell never became ready.

`ReactDOMLegacyServerNode.js` and `ReactDOMLegacyServerBrowser.js` differ mainly in the abort reason text. Node points users to `renderToPipeableStream`; browser points users to `renderToReadableStream`. `renderToStaticMarkup` sets `generateStaticMarkup = true`, which suppresses hydration markers for completed Suspense/Activity boundaries in the legacy DOM config.

Fast React should therefore implement legacy string APIs last within the first Fizz milestone, after the Fizz request engine and DOM legacy config exist. They are wrappers over Fizz, not a first independent renderer.

### Node streams

`packages/react-dom/src/server/ReactDOMFizzServerNode.js` implements:

- `renderToPipeableStream(children, options)` returning `{pipe(destination), abort(reason)}`.
- `resumeToPipeableStream(children, postponedState, options)` with the same one-destination pipe guard.
- `renderToReadableStream(children, options)` and `resume(children, postponedState, options)` using Web `ReadableStream` even in the Node build.

Node pipeable streams:

- Call `startWork(request)` immediately.
- Call `prepareForStartFlowingIfBeforeAllReady(request)` before the first pipe.
- Start flowing into a Node `Writable`.
- Register `drain`, `error`, and `close` handlers.
- Reject multiple `pipe()` calls with `React currently only supports piping to one writable stream.`
- Convert destination errors and early close into request aborts.

`ReactServerStreamConfigNode.js` buffers UTF-8 output in 2048-byte views, tracks backpressure through `destination.write()`, calls optional `destination.flush()`, closes with `destination.end()`, and errors with `destination.destroy(error)`.

### Web Streams

Browser/edge/server Web Stream APIs resolve a `ReadableStream` with an `allReady` promise property. The stream source:

- Is a byte stream with `highWaterMark: 0` in Node/browser/edge variants.
- Starts flowing on `pull(controller)`.
- Stops and aborts on stream `cancel(reason)`.
- Rejects the outer promise on shell error and catches duplicate `allReady` rejection to avoid unhandled rejections.
- Supports `AbortSignal`; an already-aborted signal aborts immediately, and a future abort removes its listener after aborting.

The Node build creates a fake `Writable` around a Web stream controller because the Node host stream config expects `Writable`-shaped destinations. Browser and edge builds use the controller directly.

### Bun, browser, and edge variants

`ReactDOMFizzServerBrowser.js` and `ReactDOMFizzServerEdge.js` have the same source-level Web Stream API shape. `ReactServerStreamConfigBrowser.js` uses `MessageChannel` for scheduled work, `queueMicrotask` with a Promise fallback, byte chunks, `ReadableStreamController.enqueue`, and no backpressure.

`ReactDOMFizzServerBun.js` uses a Bun direct stream with `{type: 'direct'}` and `highWaterMark: 2048`. `ReactServerStreamConfigBun.js` writes string chunks directly, schedules work with `setTimeout(callback, 0)`, uses `Bun.hash` for fast hashes, and closes with `controller.end()`.

Fast React should not model these as aliases to Node. They need a small destination trait plus runtime-specific adapters, with exact public export behavior preserved by the JS package facade.

### Static prerendering

`packages/react-dom/src/server/ReactDOMFizzStaticNode.js` implements:

- `prerenderToNodeStream(children, options)` returning a promise for `{prelude: Readable, postponed}` when postpone/halt are enabled.
- `prerender(children, options)` returning a promise for `{prelude: ReadableStream, postponed}`.
- `resumeAndPrerenderToNodeStream(children, postponedState, options)`.
- `resumeAndPrerender(children, postponedState, options)`.

Static browser/edge variants expose only `prerender` and `resumeAndPrerender`.

Important static details:

- Static APIs use `createPrerenderRequest` and `resumeAndPrerenderRequest`, not live `createRequest`.
- They wait until `onAllReady` to create the returned stream.
- `nonce` is intentionally not passed into prerendered bootstrap scripts.
- Static `onHeaders` for Web APIs wraps the internal descriptor in a real `Headers` object.
- `getPostponedState(request)` returns `null` if nothing postponed; otherwise it returns opaque resume state.

Static prerendering should be its own slice. It shares the Fizz engine and DOM format config but has different completion, result object, nonce, and resume semantics from live streaming.

### Postponed and resume state

`PostponedState` in `ReactFizzServer.js` contains:

- `nextSegmentId`
- `rootFormatContext`
- `progressiveChunkSize`
- `resumableState`
- `replayNodes`
- `replaySlots`

`resumableState` in `ReactFizzConfigDOM.js` contains identifier prefix, form ID counter, streaming format, bootstrap initializers, instruction bits, HTML/body flags, and resource caches for DNS, connections, images, styles, scripts, module scripts, and unknown resource types.

`getPostponedState` either:

- Resets `resumableState` when the root postponed or the preamble could not flush, using replay slot `-1` to force a root retry.
- Completes `resumableState` when a shell exists, clearing bootstrap initializers because they have already flushed.

Fast React should treat postponed state as an opaque public token. The internal representation may be Rust-owned, JS-owned, or a JS wrapper over a native handle, but it must carry a version/target marker and must be rejected clearly if passed to the wrong Fast React version, renderer, identifier prefix mode, or runtime variant. That is a deliberate breaking guardrail if current scaffolds assume plain JSON data.

### Suspense, Activity, form, segment, and instruction markers

The DOM Fizz config emits exact server markers that client hydration must understand:

- Completed Suspense: `<!--$-->`
- Pending Suspense start: `<!--$?--><template id="..."></template>`
- Client-rendered Suspense start: `<!--$!--><template data-dgst="..." ...></template>`
- Suspense end: `<!--/$-->`
- Activity start/end: `<!--&-->` and `<!--/&-->`
- Form state markers: `<!--F!-->` and `<!--F-->`
- Placeholders: `<template id="{identifierPrefix}P:{hex}"></template>`
- Segments: hidden wrapper elements with IDs using `{identifierPrefix}S:{hex}` and insertion-mode-specific wrappers for HTML, SVG, MathML, tables, table bodies, rows, and colgroups.
- Suspense boundary IDs use `{identifierPrefix}B:{hex}`.

When the external runtime/data streaming format is enabled, segment and boundary instructions are emitted as templates with data attributes such as `data-rsi`, `data-rci`, `data-rri`, and `data-rxi`. Script streaming emits inline instruction functions and calls.

Client hydration evidence from `ReactFiberConfigDOM.js` shows the consumer side expects comment data values `$`, `/$`, `$?`, `$~`, `$!`, `&`, `/&`, `F!`, and `F`. The server plan must own producing compatible markers. Hydration matching, mismatch diagnostics, event replay, and `hydrateRoot` remain separate client DOM/hydration work.

### Resources, headers, bootstrap scripts, modules, and import maps

`ReactFizzConfigDOM.js` replaces `ReactDOMSharedInternals.d` resource dispatcher methods during server rendering:

- `prefetchDNS`
- `preconnect`
- `preload`
- `preloadModule`
- `preinitScript`
- `preinitStyle`
- `preinitModuleScript`

`createRenderState` owns:

- Script/style nonces.
- `bootstrapScriptContent`.
- `bootstrapScripts`.
- `bootstrapModules`.
- Optional external runtime script.
- Optional import map.
- Header collection through `onHeaders`.
- A default `maxHeadersLength` budget of 2000 UTF-16 code units, with a soft overrun behavior.
- Early Link header queues for preconnects, font preloads, high-priority image preloads, and stylesheet preloads.

Security-sensitive escaping is part of this layer:

- Inline script content is escaped to avoid early `</script>` termination.
- Link header hrefs escape `<`, `>`, carriage return, and newline.
- Quoted Link header parameter values escape `"`, `'`, `;`, `,`, carriage return, and newline.

Fast React must not build these with ad hoc string concatenation outside the DOM server format layer. The resource/header code should have dedicated tests for escaping, capacity, deduplication, resource credential adoption, and nonce propagation.

### Abort semantics

Abort behavior is shared by live streams, Web Streams, Bun streams, static streams, and legacy string rendering:

- `abort(request, reason)` transitions open requests to aborting, converts missing reason and promise reasons to explicit `Error` objects, stores `fatalError`, aborts pending tasks, clears abortable tasks, and flushes client-rendered boundaries if a destination exists.
- Node `pipe()` aborts on destination `error` and `close`.
- Web streams abort on `cancel(reason)` and on `AbortSignal`.
- Legacy string rendering intentionally aborts before flowing so pending Suspense is emitted as client-rendered fallback state.

Abort is not cleanup-only behavior; it mutates boundary output and error details. It needs conformance scenarios before Fast React can claim server streaming support.

## Proposed Fast React architecture

### Layer 1: React DOM package facade

Owns public CommonJS/ESM-compatible entrypoint files and condition behavior for `react-dom/server*` and `react-dom/static*`.

Responsibilities:

- Preserve exact export keys and `react-server` throwing modules.
- Route Node/browser/edge/Bun/static variants to the correct implementation.
- Keep the Bun `resume` export caveat visible in compatibility tests.
- Convert JS options into internal request options.
- Return the public stream/result object shapes.

Non-goals:

- DOM mutation.
- Client roots.
- Hydration matching.
- Event replay.

### Layer 2: Fizz request engine

Owns renderer-agnostic server rendering mechanics.

Responsibilities:

- Request lifecycle, task queues, retry/ping, shell/all-ready callbacks, fatal and recoverable errors.
- Segments, boundaries, byte-size/progressive chunk heuristics, flush priority ordering.
- Suspense, SuspenseList, Activity, `useId`, context, hooks needed during server render, `use`, thenables, `postpone`, and form state handoff.
- Postponed/replay state and resume validation.
- Abort state and conversion of pending work to client-rendered boundaries.

Likely crate boundary:

- New `crates/fast-react-server/**` with no DOM-specific strings.

Breaking change justification:

- If existing renderer traits assume mutation/persistence/hydration host configs only, introduce a separate server format trait instead of forcing Fizz through the client host-config API. Reusing client DOM mutation traits would be a root-cause architecture error.

### Layer 3: DOM Fizz format layer

Owns DOM-specific server output.

Responsibilities:

- HTML/SVG/MathML namespace and insertion-mode serialization.
- Attribute/property/style serialization and escaping.
- Text separators and empty-text behavior.
- Suspense/Activity/form markers.
- Segment wrappers and instruction emitters.
- Resource queues, hoistables, preamble/postamble, singletons, bootstrap, import maps, early headers, nonces, and external runtime/data streaming format.
- Legacy static markup differences through a DOM legacy config.

Likely crate boundary:

- New `crates/fast-react-dom-server/**`.

### Layer 4: Stream adapters

Owns runtime-specific destination behavior.

Responsibilities:

- Node `Writable` backpressure and `drain` behavior.
- Node optional `flush()` support.
- Web `ReadableStream` byte controllers and `allReady`.
- Bun direct streams and string chunks.
- Close/error/cancel mapping to Fizz request abort/fatal behavior.
- Text encoding, byte length, binary chunks, and fast hash strategy.

Likely implementation boundary:

- Rust destination trait in `crates/fast-react-server/**` or a sibling `crates/fast-react-server-streams/**`.
- Node/Bun/Web JS glue in a single later `packages/react-dom/**` integration worker, after the facade exists.

### Layer 5: Shared marker contract with hydration

The server renderer owns emitted bytes. Hydration owns DOM matching. The shared contract should be captured as conformance oracles and a small internal contract document or module, but the server implementation should not depend on client mutation or hydration code.

Contract items:

- Comment marker data.
- Prefixes for placeholder, segment, boundary, and root shell IDs.
- Error template attributes: `data-dgst`, `data-msg`, `data-stck`, `data-cstck`.
- Form marker meanings.
- External runtime data instruction attributes.
- Resource hoistable attributes such as `data-precedence`.

## Conformance strategy

Start with deterministic oracles before upstream React DOM test files:

1. Export and condition oracles for server/static subpaths should reuse worker 033 inventory evidence.
2. Result-shape oracles should check public object shapes: pipeable stream object methods, `allReady` property, static `{prelude, postponed}` result keys, and React Server Component throwing modules.
3. Markup oracles should cover simple elements, escaping, text separators, `useId`, namespace insertion mode, legacy `renderToString`, and `renderToStaticMarkup`.
4. Suspense oracles should cover completed, pending, client-rendered, aborted, and postponed boundaries.
5. Resource/header oracles should cover `preload`, `preconnect`, `prefetchDNS`, `preinit`, bootstrap scripts/modules, import maps, nonces, and `onHeaders`.
6. Stream oracles should cover Node backpressure/one-pipe behavior, Web stream cancel/abort signal behavior, and Bun export shape.
7. Resume oracles should cover `prerender` to `resume`, `prerender` to `resumeAndPrerender`, root postponed state, nested Suspense replay, and invalid postponed state rejection.

Only after these pass should upstream source tests be adapted. Relevant upstream seed files from React 19.2.6 include:

- `ReactDOMFizzServer-test.js`
- `ReactDOMFizzServerBrowser-test.js`
- `ReactDOMFizzServerEdge-test.js`
- `ReactDOMFizzServerNode-test.js`
- `ReactDOMFizzStatic-test.js`
- `ReactDOMFizzStaticBrowser-test.js`
- `ReactDOMFizzStaticNode-test.js`
- `ReactDOMFizzStaticFloat-test.js`
- `ReactDOMFizzForm-test.js`
- `ReactDOMFizzShellHydration-test.js`
- `ReactDOMFizzSuspenseList-test.js`
- `ReactDOMFizzSuppressHydrationWarning-test.js`
- `ReactDOMServerIntegration*.js`
- `ReactDOMServerPartialHydration*.js`
- `ReactDOMServerSelectiveHydration*.js`

Worker 005's warning applies: these tests require React's source harness, Scheduler mocks, DOM/JSDOM utilities, feature gates, and React DOM internals. Do not make isolated failing assertions pass by local stubs.

## Recommended implementation slices

These slices are intentionally non-overlapping. They can be run by separate future workers without touching each other's files.

1. Server/static behavior oracle inventory
   - Write scope: `tests/conformance/src/react-dom-server-*.mjs`, `tests/conformance/scripts/*react-dom-server*.mjs`, `tests/conformance/test/react-dom-server-*.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-server-*.json`, `worker-progress/worker-react-dom-server-oracles.md`.
   - Task: add deterministic React DOM 19.2.6 server/static export, result-shape, option-shape, simple markup, stream-shape, and marker oracles. Keep Fast React observations as unsupported placeholders.

2. Renderer-agnostic Fizz request crate
   - Write scope: `crates/fast-react-server/**`, root `Cargo.toml`, `worker-progress/worker-fast-react-server-fizz-core.md`.
   - Task: implement request/task/segment/boundary/postpone/resume/abort state without DOM-specific serialization. Include unit tests for queue ordering and state transitions.

3. DOM Fizz serialization crate
   - Write scope: `crates/fast-react-dom-server/**`, root `Cargo.toml`, `worker-progress/worker-fast-react-dom-server-format.md`.
   - Task: implement DOM format config, escaping, marker emission, insertion modes, preamble/postamble, resources, headers, bootstrap scripts/modules, import maps, and legacy static-markup toggles against the server crate traits.

4. Stream adapter crate
   - Write scope: `crates/fast-react-server-streams/**`, root `Cargo.toml`, `worker-progress/worker-fast-react-server-streams.md`.
   - Task: implement destination traits and Rust-side buffering/backpressure abstractions for Node-like, Web-like, and Bun-like destinations. Do not edit JS package entrypoints in this slice.

5. React DOM server/static package integration
   - Write scope: `packages/react-dom/**`, `worker-progress/worker-react-dom-server-package-integration.md`.
   - Task: wire `server*` and `static*` entrypoints to the Fizz implementation after the package scaffold exists. Preserve exact export keys, condition behavior, RSC throwing modules, public stream object shapes, and Bun caveat.

6. Server marker contract oracle
   - Write scope: `tests/conformance/src/react-dom-fizz-marker-*.mjs`, `tests/conformance/scripts/*react-dom-fizz-marker*.mjs`, `tests/conformance/test/react-dom-fizz-marker-*.test.mjs`, `tests/conformance/oracles/react-19.2.6-react-dom-fizz-marker-*.json`, `worker-progress/worker-react-dom-fizz-marker-contract.md`.
   - Task: capture exact Suspense, Activity, form, placeholder, segment, boundary, external-runtime data, and error-template marker output. This is the handoff contract for the hydration worker.

7. Upstream server test harness adapter
   - Write scope: `tests/upstream-react-dom-server/**`, `worker-progress/worker-upstream-react-dom-server-harness.md`.
   - Task: build a curated upstream harness for server/Fizz files only, using worker 005's adapter requirements. Do not modify core conformance generators or implementation packages.

8. Hydration consumer implementation
   - Write scope: `crates/fast-react-dom-hydration/**`, `worker-progress/worker-react-dom-hydration-consumer.md`.
   - Task: consume the server marker contract for hydratable matching and mismatch diagnostics. This slice must not edit the server renderer; any contract change should go through marker-oracle updates first.

## Quality, maintainability, performance, and security review

Quality:

- The plan uses React DOM 19.2.6 source files for behavior and the published npm package inventory for public exports.
- It separates package surface, server renderer, DOM serialization, stream adapters, and hydration marker consumption.
- It calls out the Bun `resume` caveat instead of normalizing it away.

Maintainability:

- The recommended slices keep Rust server mechanics, DOM formatting, stream adapters, JS package integration, conformance oracles, upstream harnessing, and hydration consumers in separate write scopes.
- The plan recommends breaking trait changes if needed to avoid forcing Fizz through client mutation host-config abstractions.

Performance:

- The request model preserves React's progressive chunking, byte-size thresholds, flush queue ordering, early preload headers, and stream backpressure points.
- Benchmarks should wait until conformance covers server markers, Suspense, resources, aborts, and stream behavior; otherwise speed would measure missing semantics.

Security:

- Server serialization is security-sensitive because it writes HTML, inline scripts, import maps, nonces, Link headers, error details, and resume markers.
- Escaping must be centralized in the DOM server format layer. Link header escaping, inline script escaping, attribute escaping, URL sanitization, and nonce handling need dedicated tests.
- Do not expose raw native postponed-state pointers to userland. Use opaque validated wrappers.

## Risks and blockers

- Fast React does not yet have a reconciler/server component execution model sufficient for real Fizz rendering.
- The current package tree has no `packages/react-dom/**` implementation yet; server package integration depends on the package scaffold worker.
- Hooks, context, `use`, Suspense, Activity, form state, and `postpone` semantics must exist before meaningful server output can match React.
- Static resume correctness depends on exact replay key paths and Suspense boundary identity. This is easy to get superficially working and still fail nested replay cases.
- Resource headers and bootstrap/import map output are easy to make insecure if implemented outside structured serializers.
- Hydration compatibility depends on exact marker bytes, but client hydration implementation is intentionally out of scope for this worker.
- Node resolver condition probes are not proof of real browser, edge, Deno, Workerd, or Bun runtime behavior.

## Commands run

Project orientation:

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' docs/tasks/worker-042-react-dom-server-fizz-plan.prompt.md
git status --short
rg --files crates packages tests docs worker-progress | sort | sed -n '1,260p'
```

Accepted worker evidence:

```sh
sed -n '1,260p' worker-progress/worker-005-upstream-tests.md
sed -n '260,620p' worker-progress/worker-005-upstream-tests.md
sed -n '1,320p' worker-progress/worker-033-react-dom-inventory.md
sed -n '320,760p' worker-progress/worker-033-react-dom-inventory.md
```

Local generated inventory:

```sh
node - <<'NODE'
const fs = require('node:fs');
const inv = JSON.parse(fs.readFileSync('tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json', 'utf8'));
for (const [mode, probes] of Object.entries(inv.runtimeProbes)) {
  for (const p of probes.filter(p => p.packageName === 'react-dom' && /server|static/.test(p.subpath || ''))) {
    console.log(mode, p.subpath || '.', p.require.status, p.require.exportKeys || p.require.message);
  }
}
NODE
node - <<'NODE'
const fs = require('node:fs');
const inv = JSON.parse(fs.readFileSync('tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json', 'utf8'));
const dom = inv.packages['react-dom'];
console.log(JSON.stringify({version: dom.version, tarballFileCount: dom.tarball.fileCount, exports: dom.packageJson.exports, publicSubpaths: dom.publicSubpaths}, null, 2));
NODE
```

React DOM package and source evidence:

```sh
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/server.react-server.js package/static.react-server.js | sed -n '1,120p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/server.node.js package/server.browser.js package/server.edge.js package/static.node.js package/static.browser.js package/static.edge.js | sed -n '1,240p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/server.bun.js package/cjs/react-dom-server.bun.development.js | rg -n "renderToReadableStream|resume|renderToString|renderToStaticMarkup|module\\.exports|exports\\."
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-server-legacy.node.development.js package/cjs/react-dom-server-legacy.browser.development.js | rg -n "function renderToStringImpl|exports\\.renderToString|exports\\.renderToStaticMarkup|A component suspended|renderToStringImpl\\("
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-server.node.development.js | rg -n "exports\\.(renderToPipeableStream|renderToReadableStream|resumeToPipeableStream|resume|prerender|prerenderToNodeStream|resumeAndPrerender|resumeAndPrerenderToNodeStream|version)"
curl -fsSL https://github.com/facebook/react/archive/refs/tags/v19.2.6.tar.gz | tar -tzf - | rg 'react-19\\.2\\.6/packages/react-dom/src(.*/)?__tests__/.*\\.js$' | sed -n '1,220p'
```

Pinned source files inspected from `facebook/react` tag `v19.2.6`:

```sh
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMFizzServerNode.js | sed -n '1,680p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMFizzServerBrowser.js | sed -n '1,360p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMFizzServerEdge.js | sed -n '1,360p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMFizzServerBun.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMFizzStaticNode.js | sed -n '1,720p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMFizzStaticBrowser.js | sed -n '1,420p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMLegacyServerImpl.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMLegacyServerNode.js | sed -n '1,160p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMLegacyServerBrowser.js | sed -n '1,160p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js | rg -n "export function (createResumableState|createRenderState|resumeRenderState|createRootFormatContext|makeId|pushStartInstance|pushEndInstance|pushStartActivityBoundary|pushEndActivityBoundary|writeStartCompletedSuspenseBoundary|writeStartPendingSuspenseBoundary|writeStartClientRenderedSuspenseBoundary|writeEndCompletedSuspenseBoundary|writeEndPendingSuspenseBoundary|writeEndClientRenderedSuspenseBoundary|pushFormStateMarkerIsMatching|pushFormStateMarkerIsNotMatching|writeStartSegment|writeEndSegment|writePlaceholder|writeCompletedSegmentInstruction|writeCompletedBoundaryInstruction|writeClientRenderBoundaryInstruction|writeCompletedRoot|writePreambleStart|writePreambleEnd|writePostamble|resetResumableState|completeResumableState|emitEarlyPreloads|hoistHoistables|hasSuspenseyContent)"
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js | sed -n '360,760p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js | sed -n '1060,1125p;2260,2305p;4480,4708p;4728,5098p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js | sed -n '5480,5715p;7048,7146p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/ReactFizzConfigDOMLegacy.js | sed -n '1,560p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-server/src/ReactFizzServer.js | rg -n "export type|export function|PostponedState|Request|Replay|resume|postpone|boundary|segment|abort|allReady|shell|fatal|CLIENT_RENDERED|COMPLETED|PENDING|ERRORED|POSTPONED|ABORTED|Activity|Suspense|formState"
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-server/src/ReactFizzServer.js | sed -n '180,410p;530,770p;1240,1760p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-server/src/ReactFizzServer.js | sed -n '5410,6338p;6360,6435p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-server/src/ReactServerStreamConfigNode.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-server/src/ReactServerStreamConfigBrowser.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-server/src/ReactServerStreamConfigBun.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | sed -n '3300,4075p'
```

Report verification:

```sh
rg '/private/v[a]r|/var/f[o]lders|/t[m]p/|/U[s]ers/' worker-progress/worker-042-react-dom-server-fizz-plan.md
perl -ne 'if (/[ \t]$/) { print "$ARGV:$.:$_"; $bad=1 } END { exit($bad ? 1 : 0) }' worker-progress/worker-042-react-dom-server-fizz-plan.md
git diff --check --no-index /dev/null worker-progress/worker-042-react-dom-server-fizz-plan.md
git status --short
```

## Evidence gathered

- Worker 005 report on upstream test harness constraints and adapter requirements.
- Worker 033 report on React DOM package exports, runtime keys, type gaps, and server/static root causes.
- Local generated runtime package inventory for `react-dom@19.2.6`.
- Published `react-dom@19.2.6` npm tarball entrypoints and CJS bundle export evidence.
- React source tag `v19.2.6` server entry files, legacy server files, static server files, DOM Fizz config, DOM legacy Fizz config, Fizz request engine, stream configs, and client hydration marker constants.
- Upstream React DOM server/Fizz test file names from the source tag.

## Changed files

- `worker-progress/worker-042-react-dom-server-fizz-plan.md`

## Completion checklist

- [x] Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Called `create_goal` for this worker task.
- [x] Wrote only `worker-progress/worker-042-react-dom-server-fizz-plan.md`.
- [x] Did not implement code.
- [x] Used worker 005, worker 033, and React DOM 19.2.6 source/package evidence.
- [x] Covered legacy string rendering, Node streams, Web Streams, Bun/edge/browser variants, static prerendering, postponed state, resume state, Suspense/Activity markers, resource headers, bootstrap scripts/modules/import maps, abort semantics, stream adapters, and hydration marker contracts.
- [x] Kept server/Fizz work separate from client DOM mutation and hydration implementation.
- [x] Recommended implementation slices with concrete non-overlapping write scopes.
- [x] Documented that no nested agents were used in this retry because the continuation instruction prohibited it.
- [x] Reviewed quality, maintainability, performance, and security implications.
