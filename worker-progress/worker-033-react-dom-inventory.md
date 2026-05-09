# worker-033-react-dom-inventory

## Objective

Build a report-only React DOM 19.2.6 compatibility inventory that identifies package subpaths, public exports, renderer/client/server/static surfaces, and the smallest safe implementation slices for future Fast React DOM work.

Write scope honored: only `worker-progress/worker-033-react-dom-inventory.md` was changed. No React DOM code was implemented.

## Summary

React DOM 19.2.6 should be approached as three different compatibility surfaces, not one package facade:

1. The npm package surface: CommonJS entrypoint files behind a strict `exports` map, condition-specific `react-server` branches, and public runtime keys.
2. Client renderer behavior: `createRoot`, `hydrateRoot`, portals, `flushSync`, forms, resource hints, DOM mutation, delegated events, hydration, resources, singletons, and view transitions.
3. Server/static behavior: legacy string rendering, Fizz streaming, Web Streams, Node streams, postponed state, prerendering, resume, DOM serialization, headers, resources, and Suspense markers.

The smallest safe first slice is a package-surface-only `@fast-react/react-dom` scaffold with exact public subpaths and loud unsupported placeholders. The next safe slices are deterministic React DOM export/type oracles, direct JS facade matches such as `version` and `unstable_batchedUpdates`, and `react-dom/test-utils.act` once `React.act` behavior is covered. `react-dom/client`, `react-dom/profiling`, hydration, events, resources/singletons/forms, and server/static rendering should not be implemented as thin stubs because their root causes require reconciler, host-config, DOM, or Fizz semantics.

One important evidence distinction: the React source tag's `packages/react-dom/package.json` contains source-only exports such as `./unstable_testing`, `./unstable_server-external-runtime`, and `./src/*`, but the published `react-dom@19.2.6` npm tarball does not. The npm tarball is the authoritative public package surface for Fast React compatibility.

## Versions and pinned evidence

- Node used locally: `v26.0.0`.
- npm used locally: `11.12.1`.
- `react@19.2.6` registry integrity: `sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q==`.
- `react-dom@19.2.6` registry integrity: `sha512-0prMI+hvBbPjsWnxDLxlCGyM8PN6UuWjEUCYmZhO67xIV9Xasa/r/vDnq+Xyq4Lo27g8QSbO5YzARu0D1Sps3g==`.
- `@types/react@19.2.14` registry integrity: `sha512-ilcTH/UniCkMdtexkoCN0bI7pMcJDvmQFPvuPvmEaYA/NSfFTAgdUSLAoVjaRJm7+6PvcM+q1zYOwS4wTYMF9w==`.
- `@types/react-dom@19.2.3` registry integrity: `sha512-jp2L/eY6fn+KgVVQAOqYItbF0VY/YApe5Mz2F0aykSO8gx31bYCZyvSeYxCHKvzHG5eZjc+zyaS5BrBWya2+kQ==`.
- `scheduler@0.27.0` registry integrity: `sha512-eNv+WrVbKu1f3vbYJT/xtiF5syA5HPIMtf9IgY/nKg0sWqzAUEvqY/xm7OcZc/qafLx/iO9FgOmeSAp4v5ti/Q==`.
- React source tag `v19.2.6`: tag object `2fcbe419ed90f863e6f67ce5b9738f38dbec640b`, peeled commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- Checked generated inventory used as local evidence: `tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json`.

## Package surface inventory

`react-dom@19.2.6` package metadata:

- `main`: `index.js`.
- No `types` or `typings` field.
- Runtime dependency: `scheduler@^0.27.0`.
- Peer dependency: `react@^19.2.6`.
- Published tarball file count: 43.

Public npm subpaths:

| Subpath | Targets | Notes |
| --- | --- | --- |
| `react-dom` / `.` | `default -> ./index.js`; `react-server -> ./react-dom.react-server.js` | Root DOM facade. |
| `react-dom/client` | `default -> ./client.js`; `react-server -> ./client.react-server.js` | Client roots; `react-server` branch throws. |
| `react-dom/server` | `node/default -> ./server.node.js`; `browser/worker/deno -> ./server.browser.js`; `workerd/edge-light -> ./server.edge.js`; `bun -> ./server.bun.js`; `react-server -> ./server.react-server.js` | Aggregate server entry. |
| `react-dom/server.node` | `default -> ./server.node.js`; `react-server -> ./server.react-server.js` | Node stream plus Web Stream server APIs. |
| `react-dom/server.browser` | `default -> ./server.browser.js`; `react-server -> ./server.react-server.js` | Web Stream server APIs and legacy browser string APIs. |
| `react-dom/server.edge` | `default -> ./server.edge.js`; `react-server -> ./server.react-server.js` | Edge Web Stream server APIs and legacy browser string APIs. |
| `react-dom/server.bun` | `default -> ./server.bun.js`; `react-server -> ./server.react-server.js` | Bun Web Stream wrapper and legacy browser string APIs. |
| `react-dom/static` | `node/default -> ./static.node.js`; `browser/worker/deno -> ./static.browser.js`; `workerd/edge-light -> ./static.edge.js`; `react-server -> ./static.react-server.js` | Aggregate static/prerender entry. No `bun` condition. |
| `react-dom/static.node` | `default -> ./static.node.js`; `react-server -> ./static.react-server.js` | Node stream plus Web Stream prerender/resume APIs. |
| `react-dom/static.browser` | `default -> ./static.browser.js`; `react-server -> ./static.react-server.js` | Web Stream static APIs. |
| `react-dom/static.edge` | `default -> ./static.edge.js`; `react-server -> ./static.react-server.js` | Edge Web Stream static APIs. |
| `react-dom/profiling` | `default -> ./profiling.js`; `react-server -> ./profiling.react-server.js` | Profiling build facade; includes client root APIs. |
| `react-dom/test-utils` | `./test-utils.js` | Exposes only `act`. Not condition-switched. |
| `react-dom/package.json` | `./package.json` | Metadata. |

Important resolver behavior:

- Default Node resolves `react-dom/server` to `node_modules/react-dom/server.node.js`.
- Default Node resolves `react-dom/static` to `node_modules/react-dom/static.node.js`.
- With `--conditions=react-server`, root resolves to `react-dom.react-server.js`; client/server/static/profiling resolve to throwing `*.react-server.js` modules; `test-utils` remains `test-utils.js`.
- Node custom-condition probes are resolver evidence only. Because Node includes its built-in `node` condition, `--conditions=browser` still resolved aggregate `react-dom/server` and `react-dom/static` to node targets in the checked inventory.
- Physical files such as `react-dom/client.js`, `react-dom/server.js`, `react-dom/static.js`, `react-dom/test-utils.js`, `react-dom/cjs/*`, and all `*.react-server.js` files are not public direct subpaths under package `exports`; `require.resolve('react-dom/server.js')` and similar extension subpaths throw `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Runtime export inventory

Runtime export keys are from the checked generated inventory plus direct descriptor reads. Default development and production had the same `react-dom` keys for the React DOM subpaths below.

### `react-dom`

Default:

- `__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`
- `createPortal`
- `flushSync`
- `preconnect`
- `prefetchDNS`
- `preinit`
- `preinitModule`
- `preload`
- `preloadModule`
- `requestFormReset`
- `unstable_batchedUpdates`
- `useFormState`
- `useFormStatus`
- `version`

`react-server`:

- `__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`
- `preconnect`
- `prefetchDNS`
- `preinit`
- `preinitModule`
- `preload`
- `preloadModule`
- `version`

Behavior implications:

- `unstable_batchedUpdates` is now a passthrough in `packages/react-dom/src/shared/ReactDOM.js`.
- `createPortal` validates DOM containers through `isValidContainer` and creates a React portal object via the reconciler portal helper.
- `flushSync` manipulates React transition state, DOM current update priority, and flushes all roots through React DOM internals.
- Resource hint APIs delegate through `ReactDOMSharedInternals.d` dispatcher; correct behavior eventually needs DOM resource dispatcher support.
- `useFormStatus` and `useFormState` use React dispatcher host transition/form hooks; `requestFormReset` uses React DOM internals and throws for non-React-rendered forms by default.

### `react-dom/client`

Default exports:

- `createRoot`
- `hydrateRoot`
- `version`

`react-server`: requiring or importing throws `react-dom/client is not supported in React Server Components.`

Behavior implications:

- `createRoot` validates DOM containers, creates a reconciler container, marks the DOM container as a root, installs delegated DOM event listeners, and returns a root object with `render` and `unmount`.
- `hydrateRoot` validates the container, creates a hydration container, records hydration callbacks/options/form state, marks the root, installs delegated events, and exposes `unstable_scheduleHydration` on the hydration root object.
- This subpath cannot be made behavior-compatible without reconciler roots, update queues, lane scheduling, DOM mutation host operations, and event setup.

### `react-dom/server*`

`react-dom/server` and `react-dom/server.node` default exports:

- `version`
- `renderToString`
- `renderToStaticMarkup`
- `renderToPipeableStream`
- `renderToReadableStream`
- `resumeToPipeableStream`
- `resume`

`react-dom/server.browser` default exports:

- `version`
- `renderToString`
- `renderToStaticMarkup`
- `renderToReadableStream`
- `resume`

`react-dom/server.edge` default exports:

- `version`
- `renderToReadableStream`
- `renderToString`
- `renderToStaticMarkup`
- `resume`

`react-dom/server.bun` wrapper exports:

- `version`
- `renderToReadableStream`
- `resume`
- `renderToString`
- `renderToStaticMarkup`

`server.bun` caveat: the wrapper assigns `exports.resume = b.resume`, but the inspected CJS Bun bundle exports `renderToReadableStream` and `version`, so the runtime `resume` property exists with value `undefined` in the generated inventory.

All server variants resolve to `server.react-server.js` under the `react-server` condition, and requiring/importing throws `react-dom/server is not supported in React Server Components.`

Behavior implications:

- Legacy `renderToString`/`renderToStaticMarkup` are not independent string builders. Source uses Fizz request creation, DOM legacy format config, work start, abort of pending work, and streaming into an in-memory destination.
- Streaming APIs depend on `react-server/src/ReactFizzServer`, DOM format config, Node streams or Web Streams, abort signals, headers, callbacks, postponed state, and resume.

### `react-dom/static*`

`react-dom/static` and `react-dom/static.node` default exports:

- `version`
- `prerenderToNodeStream`
- `prerender`
- `resumeAndPrerenderToNodeStream`
- `resumeAndPrerender`

`react-dom/static.browser` default exports:

- `version`
- `prerender`
- `resumeAndPrerender`

`react-dom/static.edge` default exports:

- `version`
- `prerender`
- `resumeAndPrerender`

All static variants resolve to `static.react-server.js` under the `react-server` condition, and requiring/importing throws `react-dom/static is not supported in React Server Components.`

Behavior implications:

- Static APIs depend on Fizz prerender requests, postponed state, resumable/render state, DOM serialization, stream adapters, abort handling, and resume-and-prerender flows.
- They are separate from client hydration even though their output is designed for future hydration/resume.

### `react-dom/profiling`

Default exports:

- `__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`
- `createPortal`
- `createRoot`
- `flushSync`
- `hydrateRoot`
- `preconnect`
- `prefetchDNS`
- `preinit`
- `preinitModule`
- `preload`
- `preloadModule`
- `requestFormReset`
- `unstable_batchedUpdates`
- `useFormState`
- `useFormStatus`
- `version`

`react-server`: requiring or importing throws `react-dom/profiling is not supported in React Server Components.`

Behavior implications:

- This is not just the root facade with a different version string. It includes client root APIs and should wait until the normal client-root behavior exists.

### `react-dom/test-utils`

Default and `react-server` exports:

- `act`

Behavior implications:

- Source `packages/react-dom/src/test-utils/ReactTestUtils.js` warns once that `ReactDOMTestUtils.act` is deprecated and delegates to `React.act(callback)`.
- This is an easy facade only after `React.act` behavior and warning policy are covered.

## Type declaration implications

`react-dom@19.2.6` ships no declarations. The current declaration package target is `@types/react-dom@19.2.3`, with `types: index.d.ts` and peer dependency `@types/react@^19.2.0`.

Declaration subpaths in `@types/react-dom@19.2.3`:

- `.`
- `./client`
- `./server`
- `./server.browser`
- `./server.bun`
- `./server.edge`
- `./server.node`
- `./static`
- `./static.browser`
- `./static.edge`
- `./static.node`
- `./test-utils`
- `./canary`
- `./experimental`
- `./package.json`

Runtime/type gaps:

- `react-dom/profiling` is a public runtime subpath with no declaration subpath.
- `react-dom/canary` and `react-dom/experimental` are declaration-only augmentation subpaths with no matching runtime subpath in `react-dom@19.2.6`.
- `react-dom/client` runtime exports `version`; `@types/react-dom/client` omits it.
- `server.node.d.ts` re-exports server functions but omits `version`, even though runtime `server.node` exports `version`.
- `server.browser.d.ts` omits runtime `version` and `resume`.
- `server.edge.d.ts` includes `resume` but omits runtime `version`.
- `server.bun.d.ts` omits runtime `version` and omits `resume`; omitting `resume` may be intentional because runtime `resume` is present but undefined in the Bun wrapper.
- `static.browser.d.ts` exports `prerender` and `version`, but omits runtime `resumeAndPrerender`.
- `react-server` condition branches and throwing modules are not modeled by declarations.

Conclusion: Fast React should track runtime package compatibility and TypeScript compatibility as related but separate work products. Do not infer TypeScript support from runtime keys.

## Behavior surfaces and root causes

### Easy package-surface placeholders

Safe without a renderer:

- `package.json` metadata, `exports` map, dependency/peer metadata, engines policy.
- Entrypoint files that route by `NODE_ENV` and `react-server` condition.
- Exact unsupported errors for `client`, `server`, `static`, and `profiling` in React Server Components.
- Descriptor-level export-key oracles and `ERR_PACKAGE_PATH_NOT_EXPORTED` checks for blocked physical `.js` subpaths.
- `version` values.

Possibly safe direct facade work after dedicated oracles:

- `unstable_batchedUpdates` passthrough.
- `react-dom/test-utils.act` warning-and-delegate wrapper after `React.act` exists.
- `createPortal` object construction only if React portal symbols/model and DOM container validation are implemented; portal rendering remains renderer work.

### Requires reconciler/root behavior

- `createRoot`
- `hydrateRoot`
- root object `render` and `unmount`
- `flushSync`
- form hooks/actions
- `useFormStatus`
- `useFormState`
- root error callbacks and recoverable errors
- transition callbacks and default transition indicator

Root cause: these APIs call reconciler containers, update scheduling, current update priority, render/commit work loops, host transition status, form state, and React DOM internals.

### Requires DOM host config

- Element/text instance creation.
- HTML/SVG/MathML namespace handling.
- Attribute/property/style/event prop setting.
- Custom elements.
- Controlled inputs, textareas, selects, and forms.
- Container validation, root marking, instance-to-fiber maps, public instance lookup.
- Mutation commits, hide/unhide, clear container, fragment refs, test selectors, focus helpers.

Root cause: React DOM's host config exports `supportsMutation = true`, `supportsHydration = true`, `supportsResources = true`, `supportsSingletons = true`, `supportsTestSelectors = true`, and `supportsMicrotasks = true`. Worker 008's capability-grouped host-config recommendation is the right boundary; a DOM-shaped core would block native/custom renderer compatibility.

### Requires events and update priority

- Delegated root and portal listeners through `listenToAllSupportedEvents`.
- Event plugin dispatch.
- Current browser event mapping to discrete, continuous, default, or idle update priority.
- Event replay for hydration.
- Selection, focus/blur, beforeinput/composition, scroll, pointer, wheel, form submit/reset, and native event edge cases.

Root cause: event priority and replay are not optional DOM decoration; they determine update scheduling and hydration behavior.

### Requires hydration

- `hydrateRoot`.
- Hydratable element/text/Suspense/Activity/form marker matching.
- Hydration mismatch diagnostics and recoverable errors.
- Dehydrated boundary hide/unhide/clear operations.
- Event replay and explicit hydration targets.
- Server marker compatibility.

Root cause: hydration is distributed across the reconciler hydration context, DOM host config, event replay, and Fizz markers. Treating hydration as "create root over existing DOM" would patch symptoms and miss the data model.

### Requires resources, singletons, forms, and view transitions

- `preconnect`, `prefetchDNS`, `preload`, `preloadModule`, `preinit`, `preinitModule` beyond no-op facade validation.
- Hoistable styles/scripts/resources.
- `html`, `head`, and `body` singleton acquisition/release.
- `requestFormReset` on React-owned forms.
- View-transition names, measurement, root clones, and gesture transitions.

Root cause: these features are wired into React DOM shared internals, DOM host config resource/singleton capabilities, and Fizz output. They should not live in renderer-agnostic core.

### Requires server/Fizz implementation

- `renderToString`
- `renderToStaticMarkup`
- `renderToPipeableStream`
- `renderToReadableStream`
- `resumeToPipeableStream`
- `resume`
- `prerender`
- `prerenderToNodeStream`
- `resumeAndPrerender`
- `resumeAndPrerenderToNodeStream`

Root cause: server/static APIs need a React Server/Fizz renderer, DOM serialization config, Suspense/Activity markers, postponed state, resource headers, bootstrap scripts/modules/import maps, abort semantics, stream adapters, and resume state. They are not wrappers around a client DOM renderer.

## Recommended non-overlapping follow-up workers

1. `worker-035-react-dom-package-scaffold`
   - Write scope: `packages/react-dom/**`, `tests/smoke/**`, `package.json`, `package-lock.json`, `worker-progress/worker-035-react-dom-package-scaffold.md`.
   - Task: add `@fast-react/react-dom` package with exact public npm subpaths, `exports` map, metadata, `react-server` throwing modules, blocked extension smoke checks, and loud unsupported errors. Do not implement DOM rendering.

2. `worker-036-react-dom-export-oracle`
   - Write scope: `tests/conformance/**`, `worker-progress/worker-036-react-dom-export-oracle.md`.
   - Task: add deterministic React DOM 19.2.6 export/descriptor/condition oracle and Fast React comparison placeholders. Include `profiling`, `test-utils`, `react-server` throws, Bun `resume` undefined caveat, and blocked physical subpaths.

3. `worker-037-react-dom-type-inventory`
   - Write scope: `tests/conformance/**`, `worker-progress/worker-037-react-dom-type-inventory.md`.
   - Task: parse `@types/react-dom@19.2.3` with TypeScript compiler API, compare declaration subpaths to runtime subpaths, and decide how Fast React will ship or reference React DOM declarations.

4. `worker-038-react-dom-direct-facades`
   - Write scope: `packages/react-dom/**`, `tests/smoke/**`, `tests/conformance/**`, `worker-progress/worker-038-react-dom-direct-facades.md`.
   - Task: implement oracle-covered direct facades only: `version`, exact unsupported errors, `unstable_batchedUpdates` passthrough, and possibly `test-utils.act` after `React.act` exists.

5. `worker-039-portal-object-inventory`
   - Write scope: `tests/conformance/**`, `packages/react/**` if portal symbols/model belong there, `packages/react-dom/**`, `worker-progress/worker-039-portal-object-inventory.md`.
   - Task: inventory and implement portal object creation separately from portal rendering. Include DOM container validation and key behavior.

6. `worker-040-dom-mutation-renderer-plan`
   - Write scope: `worker-progress/worker-040-dom-mutation-renderer-plan.md`.
   - Task: produce a DOM mutation host implementation plan against `crates/fast-react-host-config/**`, `crates/fast-react-reconciler/**`, and a future DOM adapter package. Keep it report-only unless assigned an implementation scope.

7. `worker-041-dom-events-priority-plan`
   - Write scope: `worker-progress/worker-041-dom-events-priority-plan.md`.
   - Task: map React DOM event plugin/update priority/event replay behavior to Fast React scheduler and DOM adapter requirements.

8. `worker-042-react-dom-server-fizz-plan`
   - Write scope: `worker-progress/worker-042-react-dom-server-fizz-plan.md`.
   - Task: plan server/static Fizz compatibility, including legacy string rendering, streaming, static prerender, postponed/resume state, headers, resources, and hydration marker contracts.

## Delegated hypothesis checks

- Nested explorer `019e0e73-fe33-7dd3-bbea-dbc0b555d1a3` checked package metadata, tarball public subpaths, runtime keys, non-exported physical files, and `@types/react-dom` gaps. I used its results to verify the package/type split, the missing `profiling` declaration, the declaration-only `canary`/`experimental` subpaths, and the `server.bun` `resume` caveat.
- Nested explorer `019e0e74-0c79-7303-b9e1-5fad24230270` checked source-level behavior slicing. I used its results to validate the root-cause split between package placeholders, direct facades, client roots, DOM mutation/events/hydration/resources, and server/static Fizz work.
- Both agents reported no file edits and did not read `ORCHESTRATOR.md`.

## Evidence gathered

- npm metadata for `react@19.2.6`, `react-dom@19.2.6`, `@types/react@19.2.14`, `@types/react-dom@19.2.3`, and `scheduler@0.27.0`.
- Published `react-dom@19.2.6` tarball file list and root `package.json`, including the authoritative public `exports` map and the absence of source-only unstable subpaths.
- Generated runtime inventory from `tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json`, including runtime keys, condition resolution, blocked physical subpaths, descriptors, and `react-server` throwing branches.
- `@types/react-dom@19.2.3` tarball declarations and declaration package `exports`, showing runtime/type gaps.
- React source tag `v19.2.6` package and implementation sources for root DOM APIs, client roots, test utils, Fizz server/static entries, DOM host config capabilities, event priority, and DOM server serialization config.
- Independent nested explorer checks for package/type evidence and behavior-slice evidence.

## Commands run

Project orientation and prior accepted reports:

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-004-api-inventory.md
sed -n '1,260p' worker-progress/worker-005-upstream-tests.md
sed -n '1,280p' worker-progress/worker-008-renderer-host-config.md
sed -n '1,280p' worker-progress/worker-017-runtime-inventory-generation.md
sed -n '1,220p' docs/tasks/worker-033-react-dom-inventory.prompt.md
rg --files -g '!ORCHESTRATOR.md' | sort | sed -n '1,220p'
git status --short
```

Version and package metadata:

```sh
node --version
npm --version
npm view react@19.2.6 version dist.tarball dist.integrity main types typings exports --json
npm view react-dom@19.2.6 version dist.tarball dist.integrity main types typings dependencies peerDependencies exports --json
npm view @types/react@19.2.14 version dist.tarball dist.integrity types typings typesVersions dependencies --json
npm view @types/react-dom@19.2.3 version dist.tarball dist.integrity types typings typesVersions dependencies peerDependencies --json
npm view @types/react-dom version dist.tarball dist.integrity --json
npm view scheduler@0.27.0 version dist.tarball dist.integrity main exports --json
```

Checked generated runtime inventory:

```sh
node tests/conformance/scripts/print-inventory.mjs --format markdown | sed -n '1,260p'
node - <<'NODE'
const fs = require('node:fs');
const inv = JSON.parse(fs.readFileSync('tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json', 'utf8'));
const dom = inv.packages['react-dom'];
console.log(JSON.stringify({version: dom.version, distTarball: dom.registry.distTarball, distIntegrity: dom.registry.distIntegrity, fileCount: dom.tarball.fileCount, publicSubpaths: dom.publicSubpaths, exportMap: dom.packageJson.exports}, null, 2));
NODE
node - <<'NODE'
const fs = require('node:fs');
const inv = JSON.parse(fs.readFileSync('tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json', 'utf8'));
for (const [mode, probes] of Object.entries(inv.runtimeProbes)) {
  for (const p of probes.filter(p => p.packageName === 'react-dom')) {
    console.log(mode, p.subpath, p.require.status, p.require.exportKeys || p.require.message);
  }
}
NODE
node - <<'NODE'
const fs = require('node:fs');
const inv = JSON.parse(fs.readFileSync('tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json', 'utf8'));
for (const p of inv.blockedPhysicalSubpathProbes.filter(p => p.packageName === 'react-dom')) {
  console.log(p.specifier, p.status, p.error && p.error.code);
}
NODE
node - <<'NODE'
const fs = require('node:fs');
const inv = JSON.parse(fs.readFileSync('tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json', 'utf8'));
for (const [mode, rows] of Object.entries(inv.conditionResolution)) {
  for (const p of rows.filter(p => p.packageName === 'react-dom')) {
    console.log(mode, p.subpath, p.status === 'ok' ? p.path : p.error.code);
  }
}
NODE
```

Tarball and declaration evidence:

```sh
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -tzf - | sort
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/package.json | sed -n '1,220p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/index.js package/client.js package/profiling.js package/test-utils.js package/react-dom.react-server.js package/client.react-server.js package/server.react-server.js package/static.react-server.js package/profiling.react-server.js | sed -n '1,260p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/server.node.js package/server.browser.js package/server.edge.js package/server.bun.js package/static.node.js package/static.browser.js package/static.edge.js | sed -n '1,320p'
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz | tar -xOzf - package/cjs/react-dom-server.bun.development.js package/cjs/react-dom-server.browser.development.js package/cjs/react-dom-server.edge.development.js package/cjs/react-dom-server.node.development.js | rg -n "exports\\.(renderToReadableStream|resume|resumeToPipeableStream|prerender|resumeAndPrerender|version)"
curl -fsSL https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz | tar -tzf - | sort
curl -fsSL https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz | tar -xOzf - react-dom/package.json react-dom/index.d.ts react-dom/client.d.ts react-dom/server.d.ts react-dom/server.node.d.ts react-dom/server.browser.d.ts react-dom/server.edge.d.ts react-dom/server.bun.d.ts react-dom/static.d.ts react-dom/static.node.d.ts react-dom/static.browser.d.ts react-dom/static.edge.d.ts react-dom/test-utils/index.d.ts | sed -n '1,520p'
```

Pinned source evidence:

```sh
git ls-remote --tags https://github.com/facebook/react.git refs/tags/v19.2.6 'refs/tags/v19.2.6^{}'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/ReactVersions.js | sed -n '1,80p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/package.json | sed -n '1,240p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/shared/ReactDOM.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/shared/ReactDOMFloat.js | rg -n "export function|ReactDOMSharedInternals|integrity|nonce"
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/shared/ReactDOMFlushSync.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/ReactDOMSharedInternals.js | sed -n '1,180p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/ReactDOMReactServer.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMClient.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/client/ReactDOMRoot.js | sed -n '1,360p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/test-utils/ReactTestUtils.js | sed -n '1,220p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMFizzServerNode.js | sed -n '1,280p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMFizzStaticNode.js | sed -n '1,260p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom/src/server/ReactDOMLegacyServerImpl.js | sed -n '1,240p'
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/client/ReactFiberConfigDOM.js | rg -n "export const supports|supportsMutation|supportsHydration|supportsResources|supportsSingletons|supportsTestSelectors|supportsMicrotasks|export function (createInstance|appendInitialChild|finalizeInitialChildren|createTextInstance|preparePortalMount|commitUpdate|commitTextUpdate|appendChild|appendChildToContainer|insertBefore|insertInContainerBefore|removeChild|removeChildFromContainer|clearContainer|hydrateInstance|hydrateTextInstance|flushHydrationEvents|getResource|acquireResource|resolveSingletonInstance|acquireSingletonInstance|preloadResource|suspendResource)"
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/DOMPluginEventSystem.js | rg -n "export function listenToAllSupportedEvents|listenToNativeEvent|selectionchange|allNativeEvents"
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/events/ReactDOMEventListener.js | rg -n "getEventPriority|DiscreteEventPriority|ContinuousEventPriority|DefaultEventPriority|case '"
curl -fsSL https://raw.githubusercontent.com/facebook/react/v19.2.6/packages/react-dom-bindings/src/server/ReactFizzConfigDOM.js | rg -n "export function (createResumableState|createRenderState|createRootFormatContext|makeId)|bootstrap|nonce|importMap|formState|headers|Suspense|postpone"
```

Report verification:

```sh
rg '/private/v[a]r|/var/f[o]lders|/t[m]p/' worker-progress/worker-033-react-dom-inventory.md
git diff --check -- worker-progress/worker-033-react-dom-inventory.md
git diff --check --no-index /dev/null worker-progress/worker-033-react-dom-inventory.md; rc=$?; if [ "$rc" -gt 1 ]; then exit "$rc"; fi; exit 0
git status --short
```

Notes:

- npm printed local `minimum-release-age` warnings during `npm view`; the commands still returned metadata successfully.
- One source-tarball exploration used a shell `tmp=$(mktemp -d)` extraction to inspect file lists and markers, but the report records only the generic command shape and contains no concrete local temporary path.
- A no-index whitespace check is included because the report file is untracked until the orchestrator merges it; plain `git diff --check -- <file>` does not cover untracked files.

## Quality, maintainability, performance, and security review

Quality:

- The report separates published npm tarball evidence from React source-tag evidence and does not treat source-only exports as public package compatibility requirements.
- Runtime, type, and behavior compatibility are kept separate because each has different evidence and failure modes.

Maintainability:

- Recommended follow-up workers have non-overlapping write scopes and avoid mixing package scaffolding, DOM rendering, events, hydration, and server/Fizz implementation.
- The report preserves concrete caveats such as Node resolver condition limits and Bun's undefined `resume` export.

Performance:

- No implementation was added. The main performance recommendation is to avoid benchmarking React DOM until conformance gates cover renderer, events, hydration, and server semantics.
- Future oracles should use checked artifacts and isolated probes rather than executing package code during normal smoke tests.

Security:

- Package tarball evidence was inspected directly; no lifecycle scripts were run.
- Server/static work is flagged as security-sensitive because it serializes HTML, scripts, import maps, nonces, headers, form markers, and Suspense/resume state.
- DOM resource APIs and attributes should be implemented through structured DOM rules, not string concatenation in the client renderer.

## Risks and blockers

- `react-dom/client` behavior is blocked on reconciler roots, lane/update semantics, a DOM mutation host, and event priority.
- `hydrateRoot` is blocked on hydratable state, event replay, Suspense/Activity/form markers, and server output compatibility.
- `react-dom/profiling` cannot be completed before client roots because it exports `createRoot` and `hydrateRoot`.
- `react-dom/server` and `react-dom/static` are blocked on a Fizz-like server renderer, DOM serialization config, stream adapters, postponed/resume state, and resource/header semantics.
- TypeScript support needs an explicit policy: reuse `@types/react-dom`, generate declaration shims, or ship owned declarations.
- Node resolver condition probes are not proof of browser, Worker, Edge, Deno, Bun, or Workerd runtime behavior.
- The published tarball is authoritative for public exports; source-tag package metadata includes unpublished paths that could mislead future work.

## Changed files

- `worker-progress/worker-033-react-dom-inventory.md`

## Completion checklist

- [x] Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md` first.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Called `create_goal` for this worker task.
- [x] Wrote only `worker-progress/worker-033-react-dom-inventory.md`.
- [x] Used pinned `react-dom@19.2.6` npm metadata and tarball evidence.
- [x] Used pinned React source tag `v19.2.6` evidence for behavior slicing.
- [x] Inventoried `react-dom`, `react-dom/client`, server/static subpaths, `profiling`, `test-utils`, conditional exports, type implications, and public runtime exports.
- [x] Separated package-surface placeholders from renderer, DOM, hydration, events, resources/singletons/forms, and server streaming behavior.
- [x] Recommended non-overlapping follow-up workers with concrete write scopes.
- [x] Summarized delegated checks and how their results affected this report.
- [x] Listed changed files, commands run, risks/blockers, and recommended next tasks.
- [x] Reviewed quality, maintainability, performance, and security implications.
