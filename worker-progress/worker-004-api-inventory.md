# worker-004-api-inventory

## Objective

Build an evidence-backed public API inventory for the React 19.2.6 compatibility target, focused on package exports, runtime export keys, TypeScript declaration surfaces, subpath entrypoints, and runtime/type divergences.

Compatibility target used for this report:

- `react@19.2.6`
- `react-dom@19.2.6`
- `@types/react@19.2.14`
- `@types/react-dom@19.2.3` as the current external declaration package for `react-dom@19.2.6`

## Summary

`react` and `react-dom` 19.2.6 publish CommonJS runtime entry files behind package `exports` maps. Neither package ships bundled `.d.ts` files or a `types`/`typings` field, so the TypeScript surface comes from DefinitelyTyped packages.

The most important compatibility root cause is that runtime and declaration ownership are split. The runtime packages expose several names and conditional branches that the declaration packages either intentionally hide, gate behind canary declarations, or do not model at all. A React-compatible implementation should therefore treat runtime export compatibility and type compatibility as two related but separate artifacts.

High-impact confirmed divergences:

- `react` runtime exports `unstable_useCacheRefresh`, but `@types/react` only declares it through `react/canary`.
- `react/compiler-runtime` runtime exports `c`, but `@types/react/compiler-runtime` is `export {}` only.
- `react` and `react-dom` runtime expose private internals that declarations intentionally omit.
- `react-dom/client` runtime exports `version`; `@types/react-dom/client` omits it.
- `react-dom/profiling` is a public runtime subpath with no `@types/react-dom` declaration entry.
- `react-dom/server.browser`, `server.bun`, `server.edge`, and `server.node` runtime exports include `version`; condition-specific declaration files omit it.
- `react-dom/server.browser` and `server.bun` runtime export `resume`; condition-specific declarations omit it.
- `react-dom/static.browser` runtime exports `resumeAndPrerender`; declarations omit it.
- `react-server` conditional branches expose different runtime keys and throwing modules, but the external declaration packages do not model conditional type surfaces.

## Sources and commands used

Read project coordination files:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`

Did not read `ORCHESTRATOR.md`.

Primary package metadata commands:

```bash
npm view react@19.2.6 version dist.tarball dist.integrity exports types main module --json
npm view react-dom@19.2.6 version dist.tarball dist.integrity exports types main module dependencies peerDependencies --json
npm view @types/react@19.2.14 version dist.tarball dist.integrity types typesVersions dependencies --json
npm view @types/react-dom version dist.tarball dist.integrity types typesVersions dependencies peerDependencies --json
npm view scheduler@0.27.0 version dist.tarball dist.integrity exports main --json
npm view csstype version dist.tarball dist.integrity types main --json
npm view typescript version dist.tarball dist.integrity bin --json
```

Local environment:

```bash
node --version   # v26.0.0
npm --version    # 11.12.1
tsc --version    # not globally installed
```

Temporary artifact setup:

```bash
tmp=$(mktemp -d /tmp/fast-react-api.manual.XXXXXX)
mkdir -p "$tmp/node_modules" "$tmp/tarballs"
curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz -o "$tmp/tarballs/react.tgz"
curl -fsSL https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -o "$tmp/tarballs/react-dom.tgz"
curl -fsSL https://registry.npmjs.org/scheduler/-/scheduler-0.27.0.tgz -o "$tmp/tarballs/scheduler.tgz"
curl -fsSL https://registry.npmjs.org/@types/react/-/react-19.2.14.tgz -o "$tmp/tarballs/types-react.tgz"
curl -fsSL https://registry.npmjs.org/@types/react-dom/-/react-dom-19.2.3.tgz -o "$tmp/tarballs/types-react-dom.tgz"
curl -fsSL https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz -o "$tmp/tarballs/csstype.tgz"
curl -fsSL https://registry.npmjs.org/typescript/-/typescript-6.0.3.tgz -o "$tmp/tarballs/typescript.tgz"
tar -xzf ... -C "$tmp/node_modules/<package>" --strip-components=1
```

`npm install react@19.2.6 ...` was attempted first, but local npm policy rejected the install because `minimum-release-age` blocked packages newer than the configured cutoff. Direct tarball extraction was used for evidence collection instead.

Runtime and package inspection commands:

```bash
node -e "for (const id of ['react','react-dom','@types/react','@types/react-dom']) { const p=require(id + '/package.json'); console.log(id, JSON.stringify({version:p.version, main:p.main, types:p.types, typings:p.typings, exports:p.exports, typesVersions:p.typesVersions, dependencies:p.dependencies, peerDependencies:p.peerDependencies}, null, 2)); }"
node <runtime require.resolve/Object.keys probe for exported subpaths>
node --conditions=react-server <runtime Object.keys probe for react-server condition>
find node_modules/react node_modules/react-dom -maxdepth 1 -type f
find node_modules/@types/react node_modules/@types/react-dom -maxdepth 2 -type f
```

Type inspection commands:

```bash
node <TypeScript compiler API AST scan for @types/react and @types/react-dom declaration files>
node <virtual TypeScript program checking suspected runtime/type divergences>
```

Nested subagent verification:

- Runtime/package subagent independently checked npm metadata, tarball extraction, package `exports`, runtime `Object.keys`, dynamic `import()` namespaces, and extension subpath rejection. Result agreed with the local runtime inventory.
- Type/declaration subagent independently inspected `@types/react@19.2.14` and `@types/react-dom@19.2.3` with TypeScript AST scans and compared declaration surfaces to runtime export assignments. Result supplied divergence hypotheses that were then checked locally with TypeScript diagnostics.

## Package and subpath export inventory

### `react@19.2.6`

Package metadata:

- `main`: `index.js`
- No `types` or `typings` field.
- No bundled `.d.ts` files at package root.
- Runtime package files are CommonJS entry files plus `cjs/*` builds.

Export map:

| Subpath | Default target | `react-server` target | Notes |
| --- | --- | --- | --- |
| `react` / `.` | `./index.js` | `./react.react-server.js` | Main React runtime |
| `react/jsx-runtime` | `./jsx-runtime.js` | `./jsx-runtime.react-server.js` | Automatic JSX runtime |
| `react/jsx-dev-runtime` | `./jsx-dev-runtime.js` | `./jsx-dev-runtime.react-server.js` | Dev JSX runtime |
| `react/compiler-runtime` | `./compiler-runtime.js` | `./compiler-runtime.js` | Compiler helper runtime |
| `react/package.json` | `./package.json` | same | Metadata only |

Physical root files observed:

- `index.js`
- `react.react-server.js`
- `jsx-runtime.js`
- `jsx-runtime.react-server.js`
- `jsx-dev-runtime.js`
- `jsx-dev-runtime.react-server.js`
- `compiler-runtime.js`
- `package.json`

Important package `exports` behavior:

- `require.resolve('react/index.js')` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- `require.resolve('react/jsx-runtime.js')` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- Compatibility should mirror public subpaths, not physical filenames.

### `react-dom@19.2.6`

Package metadata:

- `main`: `index.js`
- No `types` or `typings` field.
- No bundled `.d.ts` files at package root.
- `dependencies`: `scheduler@^0.27.0`
- `peerDependencies`: `react@^19.2.6`

Export map:

| Subpath | Runtime targets | Notes |
| --- | --- | --- |
| `react-dom` / `.` | default `./index.js`; `react-server` `./react-dom.react-server.js` | Main DOM package |
| `react-dom/client` | default `./client.js`; `react-server` `./client.react-server.js` | Client roots |
| `react-dom/server` | `node`/default `./server.node.js`; `browser`/`worker`/`deno` `./server.browser.js`; `workerd`/`edge-light` `./server.edge.js`; `bun` `./server.bun.js`; `react-server` `./server.react-server.js` | Server rendering aggregate |
| `react-dom/server.node` | default `./server.node.js`; `react-server` `./server.react-server.js` | Node server rendering |
| `react-dom/server.browser` | default `./server.browser.js`; `react-server` `./server.react-server.js` | Browser/worker server rendering |
| `react-dom/server.edge` | default `./server.edge.js`; `react-server` `./server.react-server.js` | Edge server rendering |
| `react-dom/server.bun` | default `./server.bun.js`; `react-server` `./server.react-server.js` | Bun server rendering |
| `react-dom/static` | `node`/default `./static.node.js`; `browser`/`worker`/`deno` `./static.browser.js`; `workerd`/`edge-light` `./static.edge.js`; `react-server` `./static.react-server.js` | Static/prerender aggregate |
| `react-dom/static.node` | default `./static.node.js`; `react-server` `./static.react-server.js` | Node static prerendering |
| `react-dom/static.browser` | default `./static.browser.js`; `react-server` `./static.react-server.js` | Browser/worker static prerendering |
| `react-dom/static.edge` | default `./static.edge.js`; `react-server` `./static.react-server.js` | Edge static prerendering |
| `react-dom/profiling` | default `./profiling.js`; `react-server` `./profiling.react-server.js` | Profiling build facade |
| `react-dom/test-utils` | `./test-utils.js` | Test helper facade |
| `react-dom/package.json` | `./package.json` | Metadata only |

Physical root files observed:

- `index.js`
- `react-dom.react-server.js`
- `client.js`
- `client.react-server.js`
- `server.js`
- `server.node.js`
- `server.browser.js`
- `server.edge.js`
- `server.bun.js`
- `server.react-server.js`
- `static.js`
- `static.node.js`
- `static.browser.js`
- `static.edge.js`
- `static.react-server.js`
- `profiling.js`
- `profiling.react-server.js`
- `test-utils.js`
- `package.json`

Important package `exports` behavior:

- `require.resolve('react-dom/server')` resolves to `server.node.js` under default Node conditions.
- `require.resolve('react-dom/static')` resolves to `static.node.js` under default Node conditions.
- `require.resolve('react-dom/server.js')`, `require.resolve('react-dom/static.js')`, and `require.resolve('react-dom/client.js')` fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- `server.js` and `static.js` exist physically but are not public exported subpaths.

## Runtime export inventory

### Default Node condition, `require()`

`react`:

- `Activity`
- `Children`
- `Component`
- `Fragment`
- `Profiler`
- `PureComponent`
- `StrictMode`
- `Suspense`
- `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`
- `__COMPILER_RUNTIME`
- `act`
- `cache`
- `cacheSignal`
- `captureOwnerStack`
- `cloneElement`
- `createContext`
- `createElement`
- `createRef`
- `forwardRef`
- `isValidElement`
- `lazy`
- `memo`
- `startTransition`
- `unstable_useCacheRefresh`
- `use`
- `useActionState`
- `useCallback`
- `useContext`
- `useDebugValue`
- `useDeferredValue`
- `useEffect`
- `useEffectEvent`
- `useId`
- `useImperativeHandle`
- `useInsertionEffect`
- `useLayoutEffect`
- `useMemo`
- `useOptimistic`
- `useReducer`
- `useRef`
- `useState`
- `useSyncExternalStore`
- `useTransition`
- `version`

`react/jsx-runtime`:

- `Fragment`
- `jsx`
- `jsxs`

`react/jsx-dev-runtime`:

- `Fragment`
- `jsxDEV`

`react/compiler-runtime`:

- `c`

`react-dom`:

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

`react-dom/client`:

- `createRoot`
- `hydrateRoot`
- `version`

`react-dom/server` and `react-dom/server.node`:

- `renderToPipeableStream`
- `renderToReadableStream`
- `renderToStaticMarkup`
- `renderToString`
- `resume`
- `resumeToPipeableStream`
- `version`

`react-dom/server.browser`, `react-dom/server.edge`, and `react-dom/server.bun`:

- `renderToReadableStream`
- `renderToStaticMarkup`
- `renderToString`
- `resume`
- `version`

`react-dom/static` and `react-dom/static.node`:

- `prerender`
- `prerenderToNodeStream`
- `resumeAndPrerender`
- `resumeAndPrerenderToNodeStream`
- `version`

`react-dom/static.browser` and `react-dom/static.edge`:

- `prerender`
- `resumeAndPrerender`
- `version`

`react-dom/profiling`:

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

`react-dom/test-utils`:

- `act`

Dynamic `import()` note:

- Under Node v26.0.0, dynamic import of these CommonJS modules returned the same named keys as `require()` plus `default` and `module.exports` namespace keys. That is Node CommonJS interop behavior, not separate package-authored ESM exports.

### `react-server` condition, `require()`

Command used: `node --conditions=react-server <runtime probe>`.

`react`:

- `Children`
- `Fragment`
- `Profiler`
- `StrictMode`
- `Suspense`
- `__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`
- `cache`
- `cacheSignal`
- `captureOwnerStack`
- `cloneElement`
- `createElement`
- `createRef`
- `forwardRef`
- `isValidElement`
- `lazy`
- `memo`
- `use`
- `useCallback`
- `useDebugValue`
- `useId`
- `useMemo`
- `version`

`react/jsx-runtime` under `react-server`:

- `Fragment`
- `jsx`
- `jsxDEV`
- `jsxs`

`react/jsx-dev-runtime` under `react-server`:

- `Fragment`
- `jsx`
- `jsxDEV`
- `jsxs`

`react/compiler-runtime` under `react-server`:

- `c`

`react-dom` under `react-server`:

- `__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`
- `preconnect`
- `prefetchDNS`
- `preinit`
- `preinitModule`
- `preload`
- `preloadModule`
- `version`

`react-dom/client` under `react-server`:

- Throws: `react-dom/client is not supported in React Server Components.`

`react-dom/server` under `react-server`:

- Throws: `react-dom/server is not supported in React Server Components.`

`react-dom/static` under `react-server`:

- Throws: `react-dom/static is not supported in React Server Components.`

`react-dom/profiling` under `react-server`:

- Throws: `react-dom/profiling is not supported in React Server Components.`

`react-dom/test-utils` under `react-server`:

- `act`

### Runtime probe caveat

Directly requiring `react-dom/server.browser` and `react-dom/static.browser` under Node v26.0.0 left an active `MessagePort` handle and did not let the process exit naturally after one second. This is observable React package behavior, not project code. Future inventory automation should isolate runtime probes per subpath and use timeouts or explicit `process.exit(0)`.

## Type declaration inventory

### Declaration package ownership

`react@19.2.6`:

- No bundled declarations.
- No `types` or `typings` package field.
- Public declarations are provided by `@types/react@19.2.14`.

`react-dom@19.2.6`:

- No bundled declarations.
- No `types` or `typings` package field.
- Public declarations are provided by `@types/react-dom@19.2.3`.
- `@types/react-dom@19.2.3` peers on `@types/react@^19.2.0`.

### `@types/react@19.2.14`

Package metadata:

- `types`: `index.d.ts`
- `typesVersions`: TypeScript `<=5.0` uses `ts5.0/*`
- Dependency: `csstype@^3.2.2`

Declaration export map:

| Subpath | Declaration target |
| --- | --- |
| `react` / `.` | `index.d.ts`, with TS <= 5.0 target `ts5.0/index.d.ts` |
| `react/canary` | `canary.d.ts`, with TS <= 5.0 target `ts5.0/canary.d.ts` |
| `react/experimental` | `experimental.d.ts`, with TS <= 5.0 target `ts5.0/experimental.d.ts` |
| `react/jsx-runtime` | `jsx-runtime.d.ts`, with TS <= 5.0 target `ts5.0/jsx-runtime.d.ts` |
| `react/jsx-dev-runtime` | `jsx-dev-runtime.d.ts`, with TS <= 5.0 target `ts5.0/jsx-dev-runtime.d.ts` |
| `react/compiler-runtime` | `compiler-runtime.d.ts` |
| `react/package.json` | `package.json` |

Declaration files present:

- `index.d.ts`
- `global.d.ts`
- `canary.d.ts`
- `experimental.d.ts`
- `jsx-runtime.d.ts`
- `jsx-dev-runtime.d.ts`
- `compiler-runtime.d.ts`
- TS <= 5.0 mirrors under `ts5.0/`

Root declaration surface:

- `index.d.ts` uses `export = React` and declares namespace `React`.
- Runtime-aligned value declarations include `Children`, `Fragment`, `StrictMode`, `Suspense`, `version`, `Profiler`, `Component`, `PureComponent`, `createElement`, `cloneElement`, `createContext`, `isValidElement`, `createRef`, `forwardRef`, `memo`, `lazy`, `useContext`, `useState`, `useReducer`, `useRef`, `useLayoutEffect`, `useEffect`, `useEffectEvent`, `useImperativeHandle`, `useCallback`, `useMemo`, `useDebugValue`, `useDeferredValue`, `useTransition`, `startTransition`, `act`, `useId`, `useInsertionEffect`, `useSyncExternalStore`, `useOptimistic`, `use`, `useActionState`, `cache`, `cacheSignal`, `Activity`, and `captureOwnerStack`.
- Large type-only surface includes element/component/ref types, context and exotic component types, event types, DOM/ARIA/SVG/HTML attributes, `CSSProperties`, and `JSX`.

Subpath declarations:

- `react/jsx-runtime`: re-exports `Fragment`, exports namespace `JSX`, and exports `jsx` and `jsxs`.
- `react/jsx-dev-runtime`: re-exports `Fragment`, exports namespace `JSX`, exports `JSXSource`, and exports `jsxDEV`.
- `react/compiler-runtime`: `export {}` only. No declared `c` export.
- `react/canary`: augmentation-only; adds canary members including `unstable_useCacheRefresh`, view-transition types, `ViewTransition`, fragment refs, and related canary props/types.
- `react/experimental`: augmentation-only; adds experimental Suspense/SuspenseList, taint, gesture-transition, optimistic-key, and media/key augmentations.

### `@types/react-dom@19.2.3`

Package metadata:

- `types`: `index.d.ts`
- No dependencies.
- Peer dependency: `@types/react@^19.2.0`

Declaration export map:

| Subpath | Declaration target |
| --- | --- |
| `react-dom` / `.` | `index.d.ts` |
| `react-dom/client` | `client.d.ts` |
| `react-dom/server` | `server.d.ts` |
| `react-dom/server.browser` | `server.browser.d.ts` |
| `react-dom/server.bun` | `server.bun.d.ts` |
| `react-dom/server.edge` | `server.edge.d.ts` |
| `react-dom/server.node` | `server.node.d.ts` |
| `react-dom/static` | `static.d.ts` |
| `react-dom/static.browser` | `static.browser.d.ts` |
| `react-dom/static.edge` | `static.edge.d.ts` |
| `react-dom/static.node` | `static.node.d.ts` |
| `react-dom/test-utils` | `test-utils/index.d.ts` |
| `react-dom/canary` | `canary.d.ts` |
| `react-dom/experimental` | `experimental.d.ts` |
| `react-dom/package.json` | `package.json` |

Declaration files present:

- `index.d.ts`
- `client.d.ts`
- `server.d.ts`
- `server.browser.d.ts`
- `server.bun.d.ts`
- `server.edge.d.ts`
- `server.node.d.ts`
- `static.d.ts`
- `static.browser.d.ts`
- `static.edge.d.ts`
- `static.node.d.ts`
- `test-utils/index.d.ts`
- `canary.d.ts`
- `experimental.d.ts`

Entrypoint declaration surfaces:

- `react-dom`: `createPortal`, `version`, `flushSync`, `unstable_batchedUpdates`, `FormStatusNotPending`, `FormStatusPending`, `FormStatus`, `useFormStatus`, `useFormState`, `prefetchDNS`, `PreconnectOptions`, `preconnect`, `PreloadAs`, `PreloadOptions`, `preload`, `PreloadModuleAs`, `PreloadModuleOptions`, `preloadModule`, `PreinitAs`, `PreinitOptions`, `preinit`, `PreinitModuleAs`, `PreinitModuleOptions`, `preinitModule`, `requestFormReset`.
- `react-dom/client`: `ReactFormState`, `HydrationOptions`, `RootOptions`, `ErrorInfo`, `Root`, `DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_CREATE_ROOT_CONTAINERS`, `Container`, `createRoot`, `hydrateRoot`.
- `react-dom/server`: `BootstrapScriptDescriptor`, `ReactImportMap`, `RenderToPipeableStreamOptions`, `PipeableStream`, `ServerOptions`, `renderToPipeableStream`, `renderToString`, `renderToStaticMarkup`, `RenderToReadableStreamOptions`, `ReactDOMServerReadableStream`, `renderToReadableStream`, `ResumeOptions`, `resume`, `resumeToPipeableStream`, `version`.
- `react-dom/server.browser`: re-exports `renderToReadableStream`, `renderToStaticMarkup`, `renderToString` from `./server`.
- `react-dom/server.bun`: re-exports `renderToReadableStream`, `renderToStaticMarkup`, `renderToString` from `./server`.
- `react-dom/server.edge`: re-exports `renderToReadableStream`, `renderToStaticMarkup`, `renderToString`, `resume` from `./server`.
- `react-dom/server.node`: re-exports `renderToPipeableStream`, `renderToReadableStream`, `renderToStaticMarkup`, `renderToString`, `resume`, `resumeToPipeableStream` from `./server`.
- `react-dom/static`: `PostponedState`, `ReactImportMap`, `BootstrapScriptDescriptor`, `PrerenderOptions`, `PrerenderResult`, `prerender`, `PrerenderToNodeStreamResult`, `prerenderToNodeStream`, `ResumeOptions`, `resumeAndPrerender`, `resumeAndPrerenderToNodeStream`, `version`.
- `react-dom/static.browser`: re-exports `prerender` and `version` from `./static`.
- `react-dom/static.edge`: re-exports `prerender`, `resumeAndPrerender`, and `version` from `./static`.
- `react-dom/static.node`: re-exports `prerender`, `prerenderToNodeStream`, `resumeAndPrerender`, `resumeAndPrerenderToNodeStream`, and `version` from `./static`.
- `react-dom/test-utils`: re-exports deprecated `act` from `react`.
- `react-dom/canary`: augmentation-only.
- `react-dom/experimental`: augmentation-only.
- `react-dom/profiling`: no declaration export exists in `@types/react-dom@19.2.3`.

## Divergences between runtime exports and types

Confirmed with TypeScript 6.0.3 compiler API using a virtual source file and `moduleResolution: NodeNext`.

| Entrypoint | Runtime export or behavior | Declaration state | Evidence/root cause |
| --- | --- | --- | --- |
| `react` | Exports `unstable_useCacheRefresh` under default runtime | `@types/react` root has no exported member | TS diagnostic 2305; declared only through `react/canary` augmentation |
| `react` | Exports `__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE` | Omitted | TS diagnostic 2305; intentionally private internal |
| `react` | Exports `__COMPILER_RUNTIME` | Omitted | TS diagnostic 2305; intentionally private internal |
| `react/compiler-runtime` | Exports `c` | `compiler-runtime.d.ts` is `export {}` | TS diagnostic 2305; declaration package does not expose runtime helper |
| `react` under `react-server` | Exposes narrower server-safe set and `__SERVER_INTERNALS...` | External types do not model `react-server` condition | Type package has no condition-specific root declarations |
| `react/jsx-runtime` under `react-server` | Exports `jsx`, `jsxDEV`, and `jsxs` | `jsx-runtime.d.ts` declares `jsx` and `jsxs`, not `jsxDEV` | Conditional runtime branch differs from stable declaration entry |
| `react/jsx-dev-runtime` under `react-server` | Exports `jsx`, `jsxDEV`, and `jsxs` | `jsx-dev-runtime.d.ts` declares `jsxDEV`, not `jsx`/`jsxs` | Conditional runtime branch differs from stable declaration entry |
| `react-dom` | Exports `__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE` | Omitted | Private internal used by React DOM integration |
| `react-dom/client` | Exports `version` | `client.d.ts` has no `version` export | TS diagnostic 2305 |
| `react-dom/profiling` | Public runtime subpath with DOM, client root, and resource hint exports | No declaration entry | TS diagnostic 7016: no declaration file for module `react-dom/profiling` |
| `react-dom/server.browser` | Exports `resume` and `version` | Declares only `renderToReadableStream`, `renderToStaticMarkup`, `renderToString` | TS diagnostics 2305 for `resume` and `version` |
| `react-dom/server.bun` | Exports `resume` and `version` | Declares only `renderToReadableStream`, `renderToStaticMarkup`, `renderToString` | TS diagnostics 2305 for `resume` and `version` |
| `react-dom/server.edge` | Exports `version` | Declares `resume` and render functions, not `version` | TS diagnostic 2305 |
| `react-dom/server.node` | Exports `version` | Re-exports render/resume functions only, not `version` | TS diagnostic 2305 |
| `react-dom/static.browser` | Exports `resumeAndPrerender` | Declares only `prerender` and `version` | TS diagnostic 2305 |
| `react-dom/client`, `server`, `static`, `profiling` under `react-server` | Some subpaths throw unsupported-in-RSC errors | Types do not model condition-specific throwing modules | Runtime condition is package export behavior; declarations are unconditional |
| Dynamic `import()` of CommonJS entries | Adds `default` and `module.exports` keys to namespace under Node v26 | Declaration packages model named exports, not Node CJS namespace keys | Node interop behavior rather than authored package exports |

## Inventory automation recommendation

Add a future repository script that generates a checked-in JSON/Markdown API snapshot from exact npm tarballs. Do not rely on local `node_modules` state.

Recommended automation stages:

1. Resolve package metadata with `npm view` and record exact versions, tarball URLs, integrity hashes, `exports`, `main`, `types`, dependencies, and peer dependencies.
2. Download and extract tarballs into a temporary directory by exact URL/integrity.
3. Enumerate package export maps directly from `package.json`.
4. For every exported runtime subpath, run isolated Node probes under:
   - default Node conditions
   - `--conditions=react-server`
   - optionally `--conditions=browser`, `--conditions=edge-light`, `--conditions=workerd`, and `--conditions=bun` where Node can resolve them
5. Capture `require.resolve`, `Object.keys(require(id))`, dynamic `import()` namespace keys, thrown errors, and `ERR_PACKAGE_PATH_NOT_EXPORTED` for physical extension paths.
6. Run each runtime probe in a separate process with a timeout and explicit shutdown. This matters because browser-target React DOM bundles can leave active `MessagePort` handles under Node.
7. Use the TypeScript compiler API against exact `@types/*` tarballs to resolve declaration subpaths and collect exported values/types/interfaces/classes/namespaces.
8. Compile a generated virtual TypeScript file containing every runtime named export and capture diagnostics for runtime/type divergence.
9. Emit a stable machine-readable inventory and a human-readable report.
10. Gate compatibility work with snapshot diffs when bumping React, React DOM, or declaration versions.

Implementation note: because React and React DOM do not ship declarations, the automation must track runtime package versions and declaration package versions independently.

## Compatibility risks and root causes

Quality and maintainability:

- The public API is not just top-level React hooks. It includes JSX runtimes, compiler runtime, DOM resource hint APIs, server/static/prerender APIs, profiling, test-utils, private internals, and condition-specific behavior.
- The root cause of many mismatches is split ownership: runtime packages are published by React, while TypeScript declarations are external DefinitelyTyped packages with different release cadence and policy.
- A compatible package should preserve the package `exports` map first. Exposing physical files such as `react/index.js` or `react-dom/server.js` as public subpaths would diverge from React 19.2.6 and may hide real resolver bugs.
- `react-server` branches are materially different from default branches. Treating them as aliases would be a root-cause error, especially for `react-dom/client`, `react-dom/server`, `react-dom/static`, and `react-dom/profiling`, which throw under that condition.
- Private internals have public runtime names and are likely used by sibling React packages. A reimplementation can hide them from docs/types, but runtime objects and expected shape must be investigated before React DOM integration.

Performance:

- Inventory automation must isolate subpath probes. Some browser-target bundles keep Node alive after `require()` via a `MessagePort`, so a single long-lived probe process can hang.
- Future implementation should avoid eager initialization in facade modules beyond React behavior, especially for server/static/browser-target subpaths.

Security:

- The inventory itself executed third-party package code in temporary directories only. No repository code was modified beyond this report.
- Future SSR/static implementation must preserve React's escaping, bootstrap script, import map, nonce, preload, preinit, and resource hint semantics. These APIs can become XSS or resource-injection risks if approximated.
- Private internals should be exposed only for compatibility and should not become an expanded supported API surface for Fast React.

Breaking-change guidance:

- If the future scaffold currently assumes a flat package API, break it early and introduce condition-aware package entrypoints. Fixing this later would likely require wider downstream churn.
- If the future type strategy assumes declarations can be derived from runtime keys, break that assumption. The target ecosystem already has runtime/type divergence, and compatibility requires deliberate policy per divergence.

## Proposed follow-up implementation tasks

1. Create an API snapshot generator for exact React/React DOM/@types tarballs as described above.
2. Add a package export-map conformance test that verifies exported and non-exported subpaths, including extension-path rejection.
3. Add runtime key snapshot tests for default Node and `react-server` conditions.
4. Add TypeScript declaration snapshot tests using exact `@types/react` and `@types/react-dom` versions.
5. Decide type policy for known mismatches:
   - Mirror DefinitelyTyped exactly for ecosystem compatibility.
   - Add Fast React declaration patches for runtime exports.
   - Or publish runtime-only compatibility and document type divergences.
6. Investigate private internal object shapes:
   - `React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`
   - `React.__SERVER_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`
   - `React.__COMPILER_RUNTIME`
   - `ReactDOM.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE`
7. Add condition-specific tests for `react-server` branches, including expected unsupported React DOM errors.
8. Add focused behavior inventories for `createElement`, `cloneElement`, `Children`, refs, hooks, context, JSX runtime, server rendering, static prerendering, and resource hint APIs. This report only inventories entrypoint/export surfaces.
9. Confirm whether `@types/react-dom` should be part of the official compatibility target alongside `@types/react`, because `react-dom@19.2.6` has no bundled declarations.

## Completion checklist

- [x] Read `WORKER_BRIEF.md`.
- [x] Read `MASTER_PLAN.md`.
- [x] Read `MASTER_PROGRESS.md`.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Used subagents to independently verify runtime/package exports and type surfaces.
- [x] Wrote only `worker-progress/worker-004-api-inventory.md`.
- [x] Did not modify implementation code.
- [x] Inventoried package export maps for `react@19.2.6` and `react-dom@19.2.6`.
- [x] Inventoried runtime export keys for default Node condition.
- [x] Inventoried runtime export keys and errors for `react-server` condition.
- [x] Inventoried TypeScript declaration surfaces for `@types/react@19.2.14`.
- [x] Inventoried TypeScript declaration surfaces for `@types/react-dom@19.2.3`.
- [x] Confirmed runtime/type divergences with TypeScript diagnostics where practical.
- [x] Included automation recommendation.
- [x] Included compatibility risks and root causes.
- [x] Included quality, maintainability, performance, and security review notes.
- [x] Included proposed follow-up implementation tasks.

## Handoff

Changed files:

- `worker-progress/worker-004-api-inventory.md`

Commands run:

- `pwd && rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'package.json' -g 'tsconfig*.json' -g 'worker-progress/**'`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `git status --short`
- `find . -maxdepth 3 -type f | sort | sed 's#^./##'`
- `npm view react@19.2.6 ... --json`
- `npm view react-dom@19.2.6 ... --json`
- `npm view @types/react@19.2.14 ... --json`
- `npm view @types/react-dom ... --json`
- `node --version && npm --version && tsc --version || true`
- `npm view scheduler@0.27.0 ... --json`
- `npm view csstype ... --json`
- `npm view typescript ... --json`
- Temporary `npm install` attempt, blocked by local `minimum-release-age`
- Direct `curl` plus `tar` extraction of exact tarballs into `/tmp/fast-react-api.manual.0QvQ4u`
- Runtime `require.resolve` and `Object.keys(require())` probes
- `node --conditions=react-server` runtime probes
- TypeScript compiler API AST scan over declaration files
- TypeScript compiler API virtual diagnostic check for suspected divergences
- Browser bundle active-handle probe for `react-dom/server.browser` and `react-dom/static.browser`
- Completion audit checks: `wc -l worker-progress/worker-004-api-inventory.md`, `rg '^## ' worker-progress/worker-004-api-inventory.md`, required-section `rg` loop, and `sed -n` inspection of the written report

Unresolved risks and follow-up tasks:

- This report inventories export surfaces, not deep semantic behavior.
- Private internal object shapes still need separate investigation.
- `@types/react-dom@19.2.3` should be explicitly accepted or rejected as part of the official compatibility target.
- Runtime/type divergence policy needs a project decision before publishing declarations.
- Environment-specific branches beyond default Node and `react-server` should be covered by future automation with separate condition probes.
