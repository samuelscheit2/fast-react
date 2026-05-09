# worker-005-upstream-tests

## Objective

Assess whether and how upstream React 19.2.6 tests can be reused for Fast React, focusing on:

- the React 19.2.6 source tag and package evidence,
- package test layout and categories,
- renderer assumptions and required harness shims,
- which upstream tests should gate early Fast React milestones,
- tests to avoid initially,
- legal, maintenance, quality, performance, and security implications.

Scope honored: this report is the only file changed.

## Summary

Upstream React tests are valuable, but they are not drop-in tests for Fast React. The root cause is not individual assertions; it is that React's test suite is coupled to a custom monorepo harness: Yarn workspaces, deep package imports, custom Jest entrypoints, custom Babel/Hermes transforms, feature gates, scheduler mocks, test-only internal utilities, React shared internals, and host-config mocking.

Fast React should reuse upstream tests in phases:

1. Start by pinning the upstream source tag and running a small curated source-level subset through a compatibility harness.
2. Use full upstream package test files only after the matching adapter surface exists.
3. Defer renderer, DOM, server, Flight/RSC, DevTools, fixture, build, www, xplat, and persistent modes until the corresponding Fast React architecture exists.

For early milestones, use selected tests from `packages/react/src/__tests__`, `packages/react-is/src/__tests__`, `packages/shared/__tests__`, and later `packages/scheduler/src/__tests__`. Be careful: even many apparently core `packages/react` tests import `react-dom/client`, `react-dom`, `react-test-renderer`, or `react-noop-renderer`, so early gating must be at a file-or-case granularity rather than assuming every `packages/react` test is renderer-free.

## Sources and commands used

Sources inspected:

- Local project docs: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`.
- Upstream source tarball downloaded from `https://github.com/facebook/react/archive/refs/tags/v19.2.6.tar.gz` into `/tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6`.
- npm package metadata and direct npm tarballs for `react@19.2.6` and `react-dom@19.2.6`.
- Two nested managed subagent checks:
  - subagent Kant independently verified source tag, package test layout, fixture layout, scripts, and early/deferred test groups.
  - subagent Copernicus independently inspected the Jest harness, module resolution, transforms, gates, host-config assumptions, and adapter surface.

Commands run directly:

```bash
pwd && ls
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
git status --short
find . -maxdepth 2 -type f | sort
ls -la worker-progress
git ls-remote --tags https://github.com/facebook/react.git refs/tags/v19.2.6
git ls-remote --tags https://github.com/facebook/react.git 'refs/tags/v19.2.6^{}'
npm view react@19.2.6 version dist.tarball license repository.url
npm view react@19.2.6 gitHead dist.integrity dist.shasum
npm view react-dom@19.2.6 version license repository.url
npm view @types/react@19.2.14 version license repository.url
rm -rf /tmp/fast-react-upstream-tests-v19.2.6
mkdir -p /tmp/fast-react-upstream-tests-v19.2.6
curl -L --fail --silent --show-error https://github.com/facebook/react/archive/refs/tags/v19.2.6.tar.gz -o /tmp/fast-react-upstream-tests-v19.2.6/react-v19.2.6.tar.gz
tar -xzf /tmp/fast-react-upstream-tests-v19.2.6/react-v19.2.6.tar.gz -C /tmp/fast-react-upstream-tests-v19.2.6
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6 -maxdepth 2 -type d | sort
sed -n '1,240p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/package.json
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages -type d -name __tests__ | sort
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages -path '*/__tests__/*' -type f | wc -l
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages -path '*/__tests__/*' -type f | awk '$0 ~ /\/__tests__\/[^\/]*(\.js|\.coffee|[^d]\.ts)$/ {print}' | wc -l
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages -type d -name __tests__ | wc -l
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages -path '*/__tests__/*' -type f | awk -F/ '{key=$1"/"$2; count[key]++} END {for (k in count) print count[k], k}' | sort -nr
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages -path '*/__tests__/*' -type f | awk '$0 ~ /\/__tests__\/[^\/]*(\.js|\.coffee|[^d]\.ts)$/ {print}' | awk -F/ '{key=$1"/"$2; count[key]++} END {for (k in count) print count[k], k}' | sort -nr
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react/src/__tests__ -maxdepth 1 -type f | sort
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-reconciler/src/__tests__ -maxdepth 1 -type f | sort
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-dom/src/__tests__ -maxdepth 1 -type f | sort
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/scheduler/src/__tests__ -maxdepth 1 -type f | sort
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-dom/src/client/__tests__ -maxdepth 1 -type f | sort
find /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-dom/src/events/__tests__ /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-dom/src/events/plugins/__tests__ -maxdepth 1 -type f | sort
sed -n '1,430p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/jest-cli.js
sed -n '1,320p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/config.base.js
sed -n '1,320p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/config.source.js
sed -n '1,320p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/config.build.js
sed -n '1,320p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/config.source-www.js
sed -n '1,320p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/config.source-xplat.js
sed -n '1,320p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/config.source-persistent.js
sed -n '1,320p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/setupEnvironment.js
sed -n '1,620p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/setupTests.js
sed -n '1,320p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/TestFlags.js
sed -n '1,320p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/setupHostConfigs.js
sed -n '1,320p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/preprocessor.js
sed -n '1,80p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/jest/dont-run-jest-directly.js
sed -n '1,260p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/shared/inlinedHostConfigs.js
rg "shortName:" /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/scripts/shared/inlinedHostConfigs.js
rg -l "react-noop-renderer|ReactNoop" /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages
rg -l "@gate|gate\(" /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react/src/__tests__ /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-reconciler/src/__tests__ /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-dom/src/__tests__
rg -l "unstable_mock|SchedulerMock|scheduler/unstable_mock" /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages
sed -n '1,260p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-noop-renderer/src/createReactNoop.js
sed -n '1150,1615p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-noop-renderer/src/createReactNoop.js
sed -n '1,300p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/internal-test-utils/ReactInternalTestUtils.js
sed -n '1,260p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/internal-test-utils/internalAct.js
sed -n '1,260p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/shared/ReactFeatureFlags.js
sed -n '1,260p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/shared/forks/ReactFeatureFlags.readonly.js
sed -n '1,220p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react/package.json
sed -n '1,260p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-dom/package.json
sed -n '1,220p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-reconciler/package.json
sed -n '1,220p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/packages/react-noop-renderer/package.json
sed -n '1,120p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/ReactVersions.js
sed -n '1,220p' /tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/LICENSE
npm pack --dry-run --json react@19.2.6
npm pack --dry-run --json react-dom@19.2.6
curl -L --fail --silent --show-error https://registry.npmjs.org/react/-/react-19.2.6.tgz -o /tmp/fast-react-npm-react-19.2.6/react.tgz
curl -L --fail --silent --show-error https://registry.npmjs.org/react-dom/-/react-dom-19.2.6.tgz -o /tmp/fast-react-npm-react-dom-19.2.6/react-dom.tgz
tar -tzf /tmp/fast-react-npm-react-19.2.6/react.tgz | sort
tar -tzf /tmp/fast-react-npm-react-dom-19.2.6/react-dom.tgz | sort
tar -tzf /tmp/fast-react-npm-react-19.2.6/react.tgz | rg '(__tests__|src/)' || true
tar -tzf /tmp/fast-react-npm-react-dom-19.2.6/react-dom.tgz | rg '(__tests__|src/)' || true
rg -n "^## " worker-progress/worker-005-upstream-tests.md
sed -n '1,260p' worker-progress/worker-005-upstream-tests.md
sed -n '260,560p' worker-progress/worker-005-upstream-tests.md
wc -l worker-progress/worker-005-upstream-tests.md
git diff -- worker-progress/worker-005-upstream-tests.md
```

Notes:

- `npm pack --dry-run` was blocked by the local npm `minimum-release-age` policy for 19.2.6, so I used the registry tarball URLs from `npm view` and inspected them with `tar -tzf`.
- I did not install upstream dependencies or run upstream Jest. This report is based on source, metadata, tarball, config, and harness inspection.

## Upstream React source and tag evidence

React 19.2.6 source tag:

- `refs/tags/v19.2.6` exists in `facebook/react`.
- Tag object: `2fcbe419ed90f863e6f67ce5b9738f38dbec640b`.
- Peeled commit: `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- Subagent Kant independently confirmed the same tag and commit, with commit subject `Version 19.2.6` and date `2026-05-06 16:23:29 +0200`.

Package evidence:

- `npm view react@19.2.6` returned version `19.2.6`, MIT license, repository `git+https://github.com/facebook/react.git`, tarball `https://registry.npmjs.org/react/-/react-19.2.6.tgz`, and shasum `3dadb8e12b2a7934c1d5317973e5dce1301f9a4d`.
- `npm view react-dom@19.2.6` returned version `19.2.6`, MIT license, and the same repository.
- `npm view @types/react@19.2.14` returned MIT license and repository `https://github.com/DefinitelyTyped/DefinitelyTyped.git`.
- `/tmp/fast-react-upstream-tests-v19.2.6/react-19.2.6/ReactVersions.js` has `const ReactVersion = '19.2.6'`.
- `packages/react/package.json` and `packages/react-dom/package.json` both have version `19.2.6`.

Important packaging distinction:

- The npm `react@19.2.6` tarball contains 27 files and no `src/` or `__tests__` files.
- The npm `react-dom@19.2.6` tarball contains 43 files and no `src/` or `__tests__` files.
- Therefore upstream test reuse must come from the GitHub source tag, not from published npm packages.

## Test layout and categories

Top-level React source layout relevant to tests:

- `packages/*`: package sources and package-level tests.
- `scripts/jest/*`: custom Jest CLI, config, transforms, environments, and setup.
- `scripts/babel/__tests__`, `scripts/error-codes/__tests__`, `scripts/eslint-rules/__tests__`, `scripts/shared/__tests__`: script/tooling tests.
- `fixtures/*`: app-level and e2e fixtures, often copying from `build/oss-experimental`.

Package test counts from the source tag:

- 35 `packages/**/__tests__` directories.
- 621 files under `packages/**/__tests__`, including support files, snapshots, serializers, mocks, source maps, and nested fixtures.
- 355 direct test candidates match React's base Jest pattern `/__tests__/[^/]*(\.js|\.coffee|[^d]\.ts)$/`.

Largest package groups by all files under `__tests__`:

```text
282 packages/react-devtools-shared
146 packages/react-dom
73 packages/react-reconciler
33 packages/react
10 packages/react-native-renderer
8 packages/react-server-dom-webpack
7 packages/react-server-dom-turbopack
7 packages/react-devtools-timeline
6 packages/scheduler
6 packages/react-test-renderer
5 packages/shared
5 packages/react-refresh
5 packages/react-devtools-inline
4 packages/react-debug-tools
3 packages/use-sync-external-store
3 packages/react-server
3 packages/eslint-plugin-react-hooks
```

Direct test candidates by package group:

```text
144 packages/react-dom
72 packages/react-reconciler
37 packages/react-devtools-shared
27 packages/react
10 packages/react-native-renderer
7 packages/react-server-dom-webpack
6 packages/scheduler
6 packages/react-test-renderer
6 packages/react-server-dom-turbopack
5 packages/shared
5 packages/react-devtools-timeline
4 packages/react-refresh
4 packages/react-debug-tools
3 packages/use-sync-external-store
3 packages/react-server
3 packages/eslint-plugin-react-hooks
2 packages/react-markup
2 packages/react-client
2 packages/internal-test-utils
1 packages/use-subscription
1 packages/react-server-dom-fb
1 packages/react-is
1 packages/react-devtools-extensions
1 packages/react-cache
1 packages/react-art
1 packages/dom-event-testing-library
```

Core-looking package directories:

- `packages/react/src/__tests__`: 27 direct files. Contains element, children, class, JSX runtime, refs, version, profiler, strict mode, startTransition, forwardRef, and validation tests. Many files import a renderer.
- `packages/react-is/src/__tests__/ReactIs-test.js`: useful public symbol/type checks.
- `packages/shared/__tests__`: symbols, error helpers, frame scheduling, console format.
- `packages/scheduler/src/__tests__`: scheduler and scheduler mock tests.
- `packages/react-reconciler/src/__tests__`: 72 direct reconciler tests; most depend on `react-noop-renderer` and `scheduler/unstable_mock`.
- `packages/react-dom/src/__tests__`, `packages/react-dom/src/client/__tests__`, `packages/react-dom/src/events/**/__tests__`: DOM, hydration, events, server rendering, Fizz, forms, CSS, SVG, roots, refs, and legacy behavior.
- `packages/use-sync-external-store/src/__tests__` and `packages/use-subscription/src/__tests__`: library behavior tests, but still renderer-backed.

Fixture categories:

- `fixtures/dom`, `fixtures/fizz`, `fixtures/flight`, `fixtures/ssr`, and `fixtures/view-transition` are integration/e2e apps.
- Several fixtures copy `../../build/oss-experimental/*` into their `node_modules` before dev/start/build/test.
- `fixtures/flight` includes Playwright tests.
- These are not early conformance tests for Fast React; they are later packaging and integration checks.

## Harness and renderer assumptions

React intentionally blocks plain Jest:

- Root `package.json` sets Jest `testRegex` to `scripts/jest/dont-run-jest-directly.js`.
- That file throws: `Don't run jest directly. Run yarn test instead.`
- The real entrypoint is `node ./scripts/jest/jest-cli.js`.

`scripts/jest/jest-cli.js` assumptions:

- Selects configs for source, build, persistent, www, xplat, and devtools modes.
- Injects `NODE_ENV`, `RELEASE_CHANNEL`, `VARIANT`, `REACT_VERSION`, and `JEST_ENABLE_SOURCE_MAPS`.
- Defaults to release channel `experimental` and `NODE_ENV=development`.
- Build mode requires a recent `build/` directory.

`scripts/jest/config.base.js` assumptions:

- Roots are `packages` and `scripts`.
- Only direct files in `__tests__` are test files.
- Uses `scripts/jest/preprocessor.js` for most non-TypeScript files.
- Uses custom `ReactJSDOMEnvironment`.
- Enables legacy fake timers globally.
- Uses `jest-circus/runner`.
- Uses raw snapshot serializer.

Transform assumptions:

- Hermes parser parses test and source files.
- Babel transforms Flow, JSX automatic runtime, CommonJS, block scoping, infinite-loop guards, `@gate` pragmas, React version pragmas for DevTools, lazy JSX import, TypeScript, and CoffeeScript.
- Tests using JSX assume `react/jsx-runtime` or `react/jsx-dev-runtime`.

Global setup assumptions:

- `setupGlobal.js` sets timezone to UTC.
- `setupEnvironment.js` defines `__DEV__`, `__EXTENSION__`, `__TEST__`, `__PROFILE__`, `__EXPERIMENTAL__`, and `__VARIANT__`.
- `setupTests.js` installs `spyOnDev`, `spyOnProd`, React matchers, console-call enforcement, production error decoding, `gate`, `_test_gate`, `_test_gate_focus`, custom `jsdom` mocking, and `async_hooks` cleanup.
- `TestFlags.js` merges environment flags, `shared/ReactFeatureFlags`, and `scheduler/src/SchedulerFeatureFlags`. Missing feature flags throw.

Module and monorepo assumptions:

- Yarn 1 workspaces expose `packages/*` by package name.
- Tests import public packages and deep internals: `react/src/...`, `shared/...`, `scheduler/src/...`, `internal-test-utils/...`, `react-reconciler/constants`, `react-noop-renderer`, and renderer internals.
- Build tests map package imports to `build/oss-stable` or `build/oss-experimental`.

Renderer assumptions:

- `scripts/jest/setupHostConfigs.js` mocks `react`, `react/react.react-server`, `react-reconciler`, `react-server`, `react-server/flight`, `react-client/flight`, shared internals, DOM shared internals, and `scheduler`.
- `scheduler` is mocked to `scheduler/unstable_mock` in source tests.
- Host configs are selected from `scripts/shared/inlinedHostConfigs.js` and fork files under package `src/forks`.
- Inlined host config short names include `dom-browser`, `dom-node`, `dom-edge-*`, `dom-legacy`, `markup`, `native`, `fabric`, `test`, `art`, and `custom`.
- The reconciler tests rely heavily on `react-noop-renderer`, whose public test helper API includes render roots, `getChildrenAsJSX`, `renderToRootWithID`, `flushNextYield`, `flushExpired`, `flushSync`, `flushPassiveEffects`, `batchedUpdates`, `discreteUpdates`, `idleUpdates`, `act`, and tree dumping.

Root cause conclusion:

The blocker to upstream test reuse is not that assertions are impossible to satisfy. The blocker is that the tests encode React's internal package topology and test renderer contract. Fast React needs a compatibility test workspace and adapters that intentionally model those contracts. Trying to make individual failing tests pass by ad hoc mocks would hide real semantic gaps.

## Reuse feasibility by milestone

### M1: Compatibility inventory

Use upstream tests as a map of behavior categories and harness requirements. Do not run them as gates yet because no Fast React implementation or JS package exists.

Useful evidence sources:

- `packages/react/src/__tests__`
- `packages/react-is/src/__tests__`
- `packages/shared/__tests__`
- `packages/scheduler/src/__tests__`
- `packages/react-reconciler/src/__tests__`
- `packages/react-dom/src/__tests__`

### M2: Rust workspace scaffold

Use the upstream harness shape to inform scaffold decisions:

- include a JS compatibility package early,
- reserve a test-only package/module alias surface for React internals,
- plan for `scheduler/unstable_mock`,
- plan for a noop test renderer,
- keep DOM and server adapters separate from the core.

Breaking scaffold changes are justified if needed to expose test-only internals through an isolated conformance workspace. That is preferable to pretending public package exports alone can run upstream tests.

### M3: Element and runtime model

Best early upstream gates:

- `packages/react-is/src/__tests__/ReactIs-test.js`
- `packages/react/src/__tests__/ReactVersion-test.js`
- `packages/react/src/__tests__/onlyChild-test.js`
- selected cases from `packages/react/src/__tests__/ReactCreateElement-test.js`
- selected cases from `packages/react/src/__tests__/ReactElementClone-test.js`
- selected cases from `packages/react/src/__tests__/ReactChildren-test.js`
- selected cases from `packages/react/src/__tests__/ReactJSXRuntime-test.js`
- selected cases from `packages/react/src/__tests__/ReactCreateRef-test.js`
- `packages/shared/__tests__/ReactSymbols-test.internal.js`, if Fast React exposes equivalent test-only symbols.

Do not initially gate full `ReactCreateElement-test.js`, `ReactChildren-test.js`, or JSX validator files unless a minimal renderer and DOM client shim exist, because those files import `react-dom/client`, `react-dom`, and internal test utilities for owner, stack, warning, and portal assertions.

### M4: Fiber, updates, and scheduling

Useful after a scheduler model and JS test adapter exist:

- `packages/scheduler/src/__tests__/SchedulerMock-test.js`
- `packages/scheduler/src/__tests__/Scheduler-test.js`
- `packages/react-reconciler/src/__tests__/ReactIncrementalScheduling-test.js`
- `packages/react-reconciler/src/__tests__/ReactUpdatePriority-test.js`
- `packages/react-reconciler/src/__tests__/ReactBatching-test.internal.js`
- `packages/react-reconciler/src/__tests__/ReactIncrementalUpdates-test.js`

These should not gate M4 until Fast React provides `scheduler/unstable_mock`, fake timer integration, a noop renderer, and the core `ReactNoop` helper surface.

### M5: Hooks and context

Useful after noop renderer and scheduler mock parity:

- `packages/react-reconciler/src/__tests__/ReactHooksWithNoopRenderer-test.js`
- `packages/react-reconciler/src/__tests__/ReactNewContext-test.js`
- `packages/react-reconciler/src/__tests__/useSyncExternalStore-test.js`
- `packages/react-reconciler/src/__tests__/useRef-test.internal.js`
- `packages/react-reconciler/src/__tests__/useEffectEvent-test.js`
- `packages/react-reconciler/src/__tests__/ReactMemo-test.js`
- `packages/react-reconciler/src/__tests__/ReactLazy-test.internal.js`
- `packages/use-sync-external-store/src/__tests__/useSyncExternalStoreShared-test.js`
- `packages/use-subscription/src/__tests__/useSubscription-test.js`

### M6: Renderer host boundary

Use `react-reconciler` tests more broadly once Fast React has a host-config trait and a noop renderer:

- mutation noop renderer tests first,
- persistent noop renderer tests after persistence host operations exist,
- custom renderer tests after the public `react-reconciler` factory API exists.

### M7: JS package integration

Run source tests through Fast React package aliases and begin build-mode-like tests only after the JS package can produce stable entrypoints:

- `react`
- `react/jsx-runtime`
- `react/jsx-dev-runtime`
- `react-dom/client` only when a DOM adapter exists
- `react-reconciler/constants`
- `scheduler`
- `scheduler/unstable_mock`

### M8: Conformance and benchmark harness

Create a curated upstream conformance matrix:

- source OSS experimental development,
- source OSS stable development,
- production mode only after error-code and warning behavior are modeled,
- build mode only after Fast React has built package artifacts.

### M9: Compatibility closure

Add heavier suites:

- `packages/react-dom/src/__tests__`
- `packages/react-dom/src/events/**/__tests__`
- server/Fizz/hydration tests,
- Flight/RSC tests,
- fixture apps,
- DevTools integration only if Fast React intends to support DevTools internals.

## Required harness shims or adapters

Minimum harness for early source tests:

- A pinned upstream source checkout or vendored test subset, recorded by tag and commit.
- A Jest wrapper that mirrors `scripts/jest/jest-cli.js` environment injection.
- Module aliasing for `react`, `react/jsx-runtime`, `react/jsx-dev-runtime`, `react/package.json`, `react-is`, `shared`, `scheduler`, `scheduler/unstable_mock`, `internal-test-utils`, and selected deep `src` imports.
- Babel/Hermes/Flow/TypeScript/CoffeeScript preprocessing compatible with upstream files.
- `@gate` pragma transform or an equivalent preprocessing step.
- `TestFlags.js`-compatible feature flag surface. Missing flags should fail loudly.
- `internal-test-utils` equivalents for console mocks, React test matchers, `act`, `waitFor`, `waitForAll`, `waitForThrow`, `assertLog`, `assertConsoleErrorDev`, and `assertConsoleWarnDev`.
- Development and production warning/error behavior shims, including production error decoding if production tests are enabled.
- `scheduler/unstable_mock` with log/yield/flush APIs used by React tests.
- UTC timezone setup and Jest fake timer behavior.

Minimum harness for reconciler and hooks tests:

- `react-noop-renderer` or Fast React equivalent.
- Mutation host config first; persistent host config later.
- `ReactNoop` helper API parity for roots, render, flush, scheduler, portals, suspense test helpers, and output-as-JSX assertions.
- `react-reconciler/constants` compatibility.
- `ReactSharedInternals` compatibility sufficient for hooks, transitions, owner stacks, act, and warning tests.

Minimum harness for DOM/server tests:

- `react-dom`, `react-dom/client`, `react-dom/server`, `react-dom/static`, `react-dom/test-utils`, and `react-dom/unstable_testing` package aliases.
- `ReactDOMSharedInternals` compatibility.
- Custom JSDOM environment and `internal-test-utils/ReactJSDOM`.
- DOM event system and synthetic event adapter.
- Hydration, Fizz, server stream, and browser/node/edge/bun server config shims.

Minimum harness for Flight/RSC tests:

- `react/react.react-server`.
- `react-server`, `react-client`, and Flight config forks.
- Bundler-specific metadata shims for webpack, turbopack, parcel, and unbundled modes.

## Tests to avoid initially and why

Avoid initially:

- `packages/react-dom/**`: requires DOM host config, JSDOM quirks, events, forms, hydration, Fizz, server rendering, and DOM shared internals.
- `packages/react-reconciler/**` as a whole: requires noop renderer, scheduler mock, host config, roots, lanes, effects, Suspense, and act parity.
- `packages/react-server*`, `packages/react-client`, and `packages/react-server-dom-*`: require server, client, stream, Flight, and bundler config forks.
- `packages/react-devtools-*`: dominated by DevTools store/backend/profiling/source-map behavior, not early React compatibility.
- `packages/react-native-renderer/**`: requires native/fabric host config and xplat assumptions.
- `packages/react-refresh/**`: depends on Fast Refresh runtime semantics and integration hooks.
- `fixtures/*`: many require upstream-style `build/oss-experimental`, app dependencies, browser/e2e runners, or React scripts.
- `scripts/*` tooling tests: useful for React itself, but mostly irrelevant to Fast React runtime conformance.
- `www`, `xplat`, `persistent`, and `build` test modes: they add forked feature flags, entrypoints, or artifact layout before base OSS source mode is stable.

Avoid these because they would fail on missing harness contracts before testing the intended Fast React behavior. That failure mode encourages symptom patching. The correct path is to add the relevant architecture first, then enable the matching tests.

## Legal/licensing or maintenance risks

Licensing:

- React source is MIT licensed.
- If Fast React copies or vendors upstream test files, preserve the MIT license notice and copyright.
- The npm packages do not include source tests, so test vendoring must be sourced from the GitHub tag, not npm.

Maintenance:

- Pin upstream tests to tag `v19.2.6` and peeled commit `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
- Record all local test patches separately from imported upstream files.
- Prefer a manifest of enabled test files/cases with explicit reasons for skips.
- Re-run the inventory when changing React target versions because feature flags, gates, and test files move.
- Do not silently alter upstream tests to match Fast React. If a test needs adaptation, document whether the cause is a harness gap, a deliberate compatibility divergence, or an upstream-internal assumption.

Quality:

- Early full-file reuse is risky because many files mix pure API behavior with renderer-specific warnings.
- Case-level gating is acceptable at M3 if each selected case maps to a semantic requirement.
- Once the harness exists, full upstream files should replace hand-picked case subsets where possible.

Performance:

- DevTools test directories include many support files and snapshots. They should not be in early local developer loops.
- Reconciler tests can be slow and scheduler-sensitive; run a focused smoke subset in pre-merge and larger suites in scheduled CI.
- Avoid deep equality against raw noop renderer child structures; upstream itself warns this is slow and prefers JSX output helpers.

Security:

- Treat upstream fixtures and package scripts as code execution. Pin source and dependencies before running them in CI.
- Do not run app fixtures or Playwright suites until their install/build scripts are reviewed and isolated.
- Avoid broad module aliases that let tests accidentally import system or unreviewed local files.

## Proposed follow-up implementation tasks

1. Create an upstream-test manifest pinned to `v19.2.6` and `eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401`.
2. Build a minimal Jest conformance workspace for Fast React with upstream-compatible environment variables, transforms, and module aliases.
3. Add a feature flag shim equivalent to `shared/ReactFeatureFlags` plus `scheduler/src/SchedulerFeatureFlags`.
4. Port or vendor `internal-test-utils` needed by the first enabled tests.
5. Implement `scheduler/unstable_mock` before enabling scheduler or noop renderer tests.
6. Enable first M3 gates: `ReactIs-test.js`, `ReactVersion-test.js`, `onlyChild-test.js`, and selected cases from createElement, cloneElement, children, JSX runtime, and createRef tests.
7. Build a test-only noop renderer adapter before enabling reconciler, hooks, context, Suspense, and scheduler integration tests.
8. Add a DOM adapter harness only after the renderer host boundary exists.
9. Keep an explicit skip ledger with root-cause categories: missing harness, missing feature, intentional divergence, or upstream-internal/non-goal.
10. Later, create CI tiers: fast curated source tests, noop renderer/reconciler tests, DOM/server tests, and fixtures/e2e.

## Evidence gathered

- Upstream tag and commit were verified by `git ls-remote` and independently by subagent Kant.
- Package metadata was verified through `npm view`.
- Source tag was downloaded and inspected from GitHub.
- npm tarballs were downloaded directly and inspected, confirming they do not contain source tests.
- React's custom Jest entrypoint, base config, source/build/www/xplat/persistent configs, environment setup, setup tests, feature flags, host-config setup, and preprocessor were inspected.
- Package test directories and counts were computed from the source tag.
- Renderer assumptions were traced through `setupHostConfigs.js`, `inlinedHostConfigs.js`, and `react-noop-renderer`.
- Fixture build assumptions were checked through fixture `package.json` scripts.

## Risks or blockers

- No upstream tests were executed in this worker because the project currently has no implementation or conformance harness. Static inspection cannot prove a future Fast React harness will run a given file without additional patches.
- Full upstream test files often combine public behavior with React-internal warning, stack, owner, and renderer behavior. Early case-level selection needs discipline to avoid creating a misleading compatibility signal.
- Feature flag drift can make a test appear to fail or pass for the wrong reason. Missing flags should be hard failures.
- `react-noop-renderer` parity is a major dependency for most reconciler, hooks, context, Suspense, and scheduler tests.
- DOM/server/Flight tests require a much larger adapter surface and should not block early milestones.

## Changed files

- `worker-progress/worker-005-upstream-tests.md`

## Completion checklist

- [x] Read `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- [x] Did not read `ORCHESTRATOR.md`.
- [x] Created an active goal for this worker task.
- [x] Kept writes limited to `worker-progress/worker-005-upstream-tests.md`.
- [x] Did not modify implementation code.
- [x] Verified upstream React 19.2.6 source tag and npm package metadata.
- [x] Distinguished GitHub source tests from npm package contents.
- [x] Inspected package test layout and counted test directories/files.
- [x] Inspected React's Jest CLI, configs, transforms, setup, feature gates, and host-config setup.
- [x] Assessed renderer assumptions and noop renderer dependency.
- [x] Proposed milestone-based reuse feasibility.
- [x] Listed required harness shims and adapters.
- [x] Listed tests to avoid initially and root causes.
- [x] Covered legal/licensing and maintenance risks.
- [x] Proposed follow-up implementation tasks.
- [x] Used subagents to test hypotheses and summarized their results.
- [x] Reviewed quality, maintainability, performance, and security implications.
- [x] Listed changed files, commands run, evidence, risks, and recommended next tasks.
