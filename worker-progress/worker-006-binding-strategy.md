# worker-006-binding-strategy

## Objective

Design the initial JS-to-Rust binding strategy for Fast React, focused on N-API, napi-rs, supported Node versions, package entrypoints, native artifact layout, dev/prod builds, and the risks of making React semantics observable across a native boundary.

This worker did not implement code. Write scope was limited to this report.

## Sources and commands used

Local project sources:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `docs/tasks/worker-006-binding-strategy.prompt.md`
- `worker-progress/README.md`

External primary sources:

- Node.js Node-API documentation: https://nodejs.org/api/n-api.html
- Node.js releases page: https://nodejs.org/en/about/previous-releases
- Node.js package entrypoint and conditional exports documentation: https://nodejs.org/api/packages.html
- npm `package.json` documentation for `optionalDependencies`, `engines`, `os`, `cpu`, and `libc`: https://docs.npmjs.com/cli/v11/configuring-npm/package-json/
- napi-rs build docs: https://napi.rs/docs/cli/build
- napi-rs pre-publish docs: https://napi.rs/docs/cli/pre-publish
- napi-rs native package release docs: https://napi.rs/docs/deep-dive/release
- React 19.2.6 and React DOM 19.2.6 npm package metadata and tarball contents.

Commands and tools run:

- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `rg --files -g '!ORCHESTRATOR.md'`
- `git status --short`
- `find worker-progress -maxdepth 2 -type f -print`
- `sed -n '1,220p' docs/tasks/worker-006-binding-strategy.prompt.md`
- `sed -n '1,180p' worker-progress/README.md`
- Spawned two managed subagents:
  - `019e0da8-93b3-7971-b937-ae165de7cbc7` (`Wegener`) checked N-API, napi-rs, Node version, and native package distribution assumptions.
  - `019e0da8-93f3-7b31-8d37-20ef337bed1f` (`Gibbs`) checked JS-observable React semantic risks across the native boundary.
- `npm view react@19.2.6 exports --json`
- `npm view react-dom@19.2.6 exports --json`
- `npm view @types/react@19.2.14 version --json`
- `node -v && npm -v && rustc --version && cargo --version`
- `npm pack react@19.2.6 --dry-run` and `npm pack react-dom@19.2.6 --dry-run` failed under the local npm `minimum-release-age` policy.
- `npm_config_minimum_release_age=0 npm pack react@19.2.6 --dry-run` and the same for `react-dom` still failed because this npm build treats the setting as unknown.
- `npm --userconfig=/dev/null pack react@19.2.6 --dry-run`
- `npm --userconfig=/dev/null pack react-dom@19.2.6 --dry-run`
- `npm view react@19.2.6 --json`
- `npm view react-dom@19.2.6 --json`
- `curl -fsSL "$(npm view react@19.2.6 dist.tarball --silent)" | tar -xzO ...` with `rg` and `sed` to inspect React 19.2.6 development and production element construction.
- `npm view @napi-rs/cli version --json`
- `cargo search napi --limit 5`
- Web lookups of the Node.js, npm, and napi-rs official documentation listed above.

Observed local tool versions:

- Node: `v26.0.0`
- npm: `11.12.1`
- Rust: `rustc 1.95.0 (59807616e 2026-04-14)`
- Cargo: `cargo 1.95.0 (f2d3ce0bd 2026-03-21)`
- `@napi-rs/cli`: `3.6.2`
- crates.io `napi`: `3.8.6`

Subagent results used:

- The N-API/napi-rs check confirmed that N-API is the right first native ABI for a Node-hosted package, but only if the Rust addon uses Node-API exclusively and the public React facade stays JS-owned.
- The semantic-risk check confirmed that native boundaries are not just a performance concern; they can change object identity, property descriptors, warning side effects, stack traces, scheduling order, and dev/prod behavior.

## N-API and napi-rs evidence

Recommendation: use napi-rs over a direct V8, Node C++, or custom C ABI binding for the first JS-to-Rust integration.

Evidence:

- Node-API is documented by Node.js as stable and ABI-stable across Node versions. It is independent of the underlying JS engine and is intended to let addons compiled for one major version run on later major versions without recompilation.
- The same Node.js docs state the limit of that guarantee: direct Node C++ APIs, libuv APIs, V8 APIs, and external libraries do not inherit Node-API ABI stability. Fast React should therefore forbid direct `v8.h`, `node.h`, and `uv.h` usage in the binding crate unless a future design explicitly accepts ABI churn.
- Node-API version support in current Node docs:
  - N-API 8: Node `12.22.0+`, `14.17.0+`, `15.12.0+`, `16.0.0+`, and later.
  - N-API 9: Node `18.17.0+`, `20.3.0+`, `21.0.0+`, and later.
  - N-API 10: Node `22.14.0+`, `23.6.0+`, and later.
- Node's current release page on 2026-05-09 shows Node 22 and 24 as LTS, Node 26 as Current, and Node 20 as EOL. That makes `node >=22` the right initial support floor even though upstream React's published `engines.node` remains much older.
- napi-rs provides the Rust binding layer, CLI build tooling, generated JS loaders, TypeScript declaration generation, and per-platform package workflows. Its build docs show `napi build --platform --release`, platform-suffixed `.node` outputs, CJS/ESM binding generation, and Cargo flag passthrough.
- napi-rs release docs recommend per-platform npm packages for native addons because Rust source builds impose high toolchain and compile-time costs on consumers, while postinstall downloads add runtime-irrelevant dependencies and fail in private-network CI.

Initial N-API version policy:

- Set the public package engine to `node >=22`.
- Compile the addon against N-API 8 initially unless a concrete API need justifies N-API 9. This keeps the ABI surface conservative while still running on Node 22/24/26. N-API 10 should be avoided at first because it would raise the real floor to Node `22.14.0+` for no proven benefit.
- Add a CI guard that fails if the binding crate or generated C code includes direct V8, Node C++, or libuv headers.

This is a deliberate breaking change relative to React's very broad historical Node engine range. The reason is root-cause supportability: native packages require active ABI, platform, and security testing, and Node 20 is already EOL as of 2026-05-09.

## Binding architecture recommendation

Use a JS-owned compatibility facade over a private Rust native engine.

Recommended shape:

- Public React-compatible packages export JS modules. Rust is an implementation detail loaded by those modules.
- The native addon should expose coarse operations and opaque handles, not public React values.
- JS should manufacture all public React-observable objects at first: elements, contexts, refs, lazy/memo wrappers, provider/consumer objects, hook dispatchers, errors, and warning getters.
- Rust should own internal structures that are not directly observable: core arena/state, fiber-like data, lane/update bookkeeping, reconciliation work queues, and renderer-neutral computation.
- JS should remain the scheduler and event-loop authority at first. Rust can request more work or return a suggested priority, but JS chooses whether work is scheduled through microtasks, timers, `MessageChannel`, `setImmediate`, or renderer/test hooks.
- JS should call user components, refs, lifecycle callbacks, host-config callbacks, and error handlers through an explicit trampoline. Rust must not call user JS from background threads.
- Rust may hold references to JS values only through napi-rs reference types tied to the correct `Env` and lifecycle. It should not store raw `napi_value` across turns, threads, or Node environments.
- Native errors and panics must be translated to JS exceptions or controlled fatal diagnostics. Rust panics must not unwind through N-API.

Boundary granularity:

- Do not route every `jsx`, `jsxs`, `jsxDEV`, or `createElement` call through Rust until conformance and microbenchmarks prove it is faster. Per-element N-API object creation can cost more than the JS object literal path and can easily get property descriptors wrong.
- Initial Rust calls should be batch-oriented: create an internal root, enqueue update metadata, process a bounded work slice, serialize minimal commit instructions, and release handles.
- If a native element fast path is later attempted, it must return exact JS objects and pass descriptor/freeze/warning tests before it can replace the JS path.

Security and lifecycle requirements:

- Treat all JS inputs as untrusted. Validate object shape, type tags, array bounds, string lengths, and callback presence before passing data into Rust.
- Avoid native file-system loading beyond Node's package resolution of the platform package. No postinstall download script should be part of the default install path.
- Register environment cleanup hooks or equivalent napi-rs cleanup so native arenas and JS references are released when a Node worker or process environment exits.

## Package artifact and entrypoint recommendation

Public package strategy:

- Start with explicit Fast React package names for development, for example `fast-react` / `fast-react-dom` or scoped equivalents. Do not publish as `react` or `react-dom` until conformance is high enough to justify ecosystem aliasing.
- Provide React-compatible export maps so tests can alias `react` to the Fast React package when ready.
- Mirror React 19.2.6's public `react` subpaths:
  - `.`
  - `./jsx-runtime`
  - `./jsx-dev-runtime`
  - `./compiler-runtime`
  - `./package.json`
  - `react-server` conditional variants for the same subpaths, even if early versions intentionally throw or delegate to unsupported stubs with tracked gaps.
- For `react-dom` compatibility later, mirror React DOM 19.2.6's observed exports:
  - `.`
  - `./client`
  - `./server`
  - `./static`
  - `./profiling`
  - `./test-utils`
  - explicit server/static environment subpaths such as `./server.node`, `./server.browser`, `./server.edge`, `./server.bun`, `./static.node`, `./static.browser`, and `./static.edge`.

Entrypoint format:

- Keep CommonJS entry files because React 19.2.6 publishes CJS gate files and much of the React ecosystem still uses `require`.
- Add ESM wrappers through conditional exports only after dual-package hazards are tested. The CJS and ESM entrypoints must share the same singleton internals; duplicate React internals across `import` and `require` would break hooks/context identity.
- Use Node's `exports` field with explicit subpaths. Node docs note that introducing `exports` restricts undeclared subpaths, so any compatibility package must explicitly list every public subpath it claims to support.
- Avoid exposing the native binding package as part of the public React API. Consumers should import React-compatible packages, not `@fast-react/binding`.

Native artifact layout:

- Create one internal JS loader package, for example `@fast-react/binding`, that owns native loading and exports a narrow private API to the public packages.
- Create per-platform optional packages with exact matching versions, for example:
  - `@fast-react/binding-darwin-arm64`
  - `@fast-react/binding-darwin-x64`
  - `@fast-react/binding-linux-x64-gnu`
  - `@fast-react/binding-linux-x64-musl`
  - `@fast-react/binding-linux-arm64-gnu`
  - `@fast-react/binding-linux-arm64-musl`
  - `@fast-react/binding-win32-x64-msvc`
  - `@fast-react/binding-win32-arm64-msvc`
- Each platform package should use npm `os`, `cpu`, and `libc` fields so package managers select only compatible artifacts where possible.
- The main loader should declare these as `optionalDependencies` with exact versions, detect missing optional installs, and report a clear unsupported-platform or `--omit=optional` error.
- The `.node` filename should include the platform triple generated by `napi build --platform`, for example `fast_react_binding.linux-x64-gnu.node`.
- Prefer npm-distributed binary packages over postinstall downloads. This reduces private-network failures, avoids extra runtime dependencies, and makes the supply-chain surface inspectable through normal package-locks.

## Dev/prod build strategy

Public behavior should be selected by the JS facade, not by whichever Cargo profile happened to build the native module.

React 19.2.6 evidence:

- `react/index.js`, `jsx-runtime.js`, `jsx-dev-runtime.js`, and `react.react-server.js` choose development or production CJS payloads using `process.env.NODE_ENV === 'production'`.
- The React 19.2.6 development element path uses `Symbol.for("react.transitional.element")`, creates an object with `$$typeof`, `type`, `key`, `props`, and `_owner`, defines `ref` as non-enumerable with a warning getter or null value, adds `_store.validated`, `_debugInfo`, `_debugStack`, and `_debugTask`, then freezes props and the element.
- The React 19.2.6 production element path returns a smaller object with `$$typeof`, `type`, `key`, `ref`, and `props`.

Recommended build policy:

- Ship npm native artifacts built with Cargo `--release`; do not ship Rust debug builds to end users.
- Implement dev/prod React semantics in JS entrypoints and pass an explicit mode/config to Rust where native diagnostics or feature flags differ.
- Keep development warnings, warning getters, object freezing, debug stacks, and StrictMode diagnostics JS-owned until native parity is proven.
- Provide local development commands that build the native addon in debug mode for maintainers, but ensure package tests also run against the release artifact layout.
- Add a future profiling build only as an explicit condition/subpath after conformance tests cover it. Do not overload `NODE_ENV` with Rust compiler profile.

## JS-observable semantic risks

The root risk is not whether Rust can compute React internals. The root risk is that React's behavior is heavily observable as JavaScript values and scheduling side effects.

Risks to treat as compatibility blockers:

- Element object shape: `Object.keys`, property descriptors, `Object.getOwnPropertyNames`, `Object.getOwnPropertySymbols`, `Object.isFrozen`, JSON inspection, and snapshot serializers can all see divergence.
- Symbol identity: public tags must be created with the JS runtime's `Symbol.for(...)`, not Rust-side constants.
- Realm identity: values created in one Node VM context or worker environment may not behave like values created in the consumer's realm.
- Context identity: providers, consumers, `_context`, current values, and circular references must not be cloned or serialized through Rust.
- Hook dispatcher identity: hooks depend on exact shared-internal dispatcher mutation during render. Duplicate JS facade instances across CJS/ESM or across package aliases would break this.
- Error/warning behavior: dev warnings use console side effects and precise warning getters. Rust errors, napi-rs `Error`, and panics will not naturally match React's JS error classes, stacks, messages, or timing.
- Thrown thenables and `use`: promises/thenables thrown during render must preserve JS object identity and timing.
- Scheduler and microtasks: React work ordering depends on JS event-loop primitives. Native background threads or thread-safe functions can reorder callbacks unless JS remains the scheduling authority.
- Renderer callbacks: host config calls, refs, lifecycle callbacks, and error boundaries are stack-sensitive and must run on the JS thread through a controlled trampoline.
- Dev/prod divergence: StrictMode extra renders/effects/ref callbacks, element freezing, debug fields, warning text, and production element shape need separate tests.
- Performance inversion: moving tiny JS operations across N-API can be slower than leaving them in JS. The binding must benchmark the boundary itself, not just Rust core algorithms.

Mitigations:

- Keep public values JS-owned until there is conformance proof for exact native value construction.
- Make all cross-boundary APIs narrow, documented, and covered by golden tests against React 19.2.6.
- Run conformance for both CJS and ESM import paths once ESM is added.
- Treat mismatched descriptors, warning text, scheduling order, and identity as root-cause failures, not cosmetic differences.

## CI and release implications

CI should prove three things independently: native build correctness, package installability, and React-observable behavior.

Recommended CI matrix:

- Node versions: 22 LTS, 24 LTS, and 26 Current.
- OS/targets at minimum:
  - macOS arm64 and x64
  - Linux x64 glibc
  - Linux x64 musl
  - Linux arm64 glibc
  - Windows x64 MSVC
  - Add Windows arm64 and Linux arm64 musl when release automation is stable.
- Package managers: npm, pnpm, and Yarn install checks, because optional native dependency behavior differs across lockfile/install implementations.
- Install scenarios:
  - normal install
  - `npm install --omit=optional` or equivalent, expecting a clear loader error
  - unsupported platform, expecting a clear error
  - package aliasing tests where consumer imports `react` but resolves to Fast React
- Module scenarios:
  - `require(...)`
  - `import(...)` after ESM wrappers exist
  - duplicate import/require singleton check
  - export-map checks for every supported subpath and condition.

Release policy:

- Use napi-rs artifact/prepublish flow to collect CI-built `.node` artifacts and prepare per-platform packages.
- Publish platform packages and the JS loader/public packages with exact synchronized versions. A partial publish should fail closed.
- Avoid postinstall downloads in the normal path.
- Add provenance/signing/SBOM steps before public release because native binary packages expand the supply-chain risk.
- Keep Node 20 unsupported unless a project-wide decision accepts testing and maintaining an EOL runtime. Breaking compatibility here is justified by security and native release maintenance.

## Proposed follow-up implementation tasks

1. Create an RFC for the binding crate and npm package layout, including exact package names, `exports`, `engines.node`, native package names, and supported target triples.
2. Scaffold a minimal napi-rs binding crate with a private `@fast-react/binding` loader and one no-op native function, then validate package installation on Node 22/24/26.
3. Add a conformance fixture that compares React 19.2.6 versus Fast React for element object shape, descriptors, symbols, freezing, warning getters, and dev/prod entrypoint selection.
4. Add boundary microbenchmarks for JS-only element creation, native object construction, batched native calls, and callback trampolines before moving any hot public API into Rust.
5. Add CI guards that block direct V8/Node C++/libuv header use in the binding crate.
6. Define the JS scheduler trampoline contract with the scheduler/fiber and renderer-host workers before Rust starts calling user components or host config callbacks.
7. Build package-manager install tests for optional platform packages across npm, pnpm, and Yarn, including omitted optional dependencies and unsupported platform errors.
8. Document how consumers can alias `react` and `react-dom` to Fast React during conformance testing without publishing under upstream package names.

## Completion checklist

- Summary: N-API through napi-rs is the recommended first JS-to-Rust binding, with `node >=22`, conservative N-API 8 initially, per-platform optional native packages, and a JS-owned React compatibility facade.
- Changed files: `worker-progress/worker-006-binding-strategy.md`.
- Commands run: listed in the "Sources and commands used" section.
- Evidence gathered: local master/worker docs, official Node/npm/napi-rs docs, React 19.2.6 npm metadata, React 19.2.6 tarball source inspection, local tool versions, and two delegated hypothesis checks.
- Quality review: recommendation keeps public compatibility concerns in JS, constrains Rust to private/internal data, and calls out where breaking Node support is justified.
- Maintainability review: package layout isolates native loading in one private loader package and avoids exposing Rust implementation details as public API.
- Performance review: report warns that per-call N-API overhead can erase Rust speedups and requires boundary microbenchmarks before moving hot public paths.
- Security review: report avoids postinstall downloads, requires validation of JS inputs, forbids direct unstable native headers, and calls for release provenance before public distribution.
- Unresolved risks: exact package names, final host-config callback contract, whether N-API 9 is needed, exact CJS/ESM singleton strategy, and measured boundary overhead remain follow-up work.
- Required sections present: Objective; Sources and commands used; N-API and napi-rs evidence; Binding architecture recommendation; Package artifact and entrypoint recommendation; Dev/prod build strategy; JS-observable semantic risks; CI and release implications; Proposed follow-up implementation tasks; Completion checklist.
