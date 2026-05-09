# worker-028-create-context-behavior

## Objective

Implement conformance-backed direct `createContext` object behavior for
`@fast-react/react`. The slice adds a deterministic React 19.2.6 context-object
oracle, implements only the directly observable default-root
`createContext(...)` object behavior covered by that oracle, preserves
`react-server` export absence, and keeps package-wide compatibility claims
false.

I did not read `ORCHESTRATOR.md`.

## Sources read

Required sources:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-002-conformance.md`
- `worker-progress/worker-004-api-inventory.md`
- `worker-progress/worker-014-react-entrypoint-placeholders.md`
- `worker-progress/worker-017-runtime-inventory-generation.md`
- `worker-progress/worker-021-element-object-oracle.md`
- `worker-progress/worker-023-js-element-factory.md`
- `worker-progress/worker-024-create-ref-behavior.md`
- `worker-progress/worker-025-children-helpers.md`
- `worker-progress/worker-026-memo-lazy-behavior.md`
- `worker-progress/worker-027-forward-ref-behavior.md`
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Additional evidence:

- Published `react@19.2.6` tarball source and generated oracle observations
  from exact npm metadata and integrity-verified tarball artifacts.

## Delegated checks

- Explorer `019e0e59-26f6-7be3-a4ee-ff311829eddd` independently probed
  `react@19.2.6` from the npm tarball and verified the integrity hash
  `sha512-sfWGGfavi0xr8Pg0sVsyHMAOziVYKgPLNrS7ig+ivMNb3wbCBw3KxtflsGBAwD3gYQlE/AEZsTLgToRrSCjb0Q==`.
  It confirmed default-root `createContext` export descriptors, development
  renderer slots, production slot absence, default-value identity, provider and
  consumer object identity, displayName assignment behavior, constructor calls,
  and `react-server` export absence.
- Explorer `019e0e59-273d-76e2-bfcc-99a568ea6c79` audited the local integration
  shape. It confirmed the dedicated helper/oracle pattern, default-root-only
  wiring, helper subpath blocking, element-object oracle refresh requirement,
  and the out-of-scope boundary for `react-server`, `useContext`, rendering,
  propagation, hooks, owners, and private internals.

## Files changed

- `packages/react/README.md`
- `packages/react/context-object.js`
- `packages/react/index.js`
- `tests/smoke/import-entrypoints.mjs`
- `tests/conformance/README.md`
- `tests/conformance/package.json`
- `tests/conformance/oracles/react-19.2.6-context-object-oracle.json`
- `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
- `tests/conformance/scripts/generate-context-object-oracle.mjs`
- `tests/conformance/scripts/print-context-object-oracle.mjs`
- `tests/conformance/src/context-object-oracle-generator.mjs`
- `tests/conformance/src/context-object-oracle.mjs`
- `tests/conformance/src/context-object-probe-runner.mjs`
- `tests/conformance/src/context-object-scenarios.mjs`
- `tests/conformance/src/context-object-targets.mjs`
- `tests/conformance/test/context-object-oracle.test.mjs`
- `worker-progress/worker-028-create-context-behavior.md`

The element-object oracle was regenerated because its entrypoint export-shape
scenario records the local Fast React `createContext` function descriptor. The
only element artifact changes are Fast React `createContext` descriptor updates
from placeholder `name: "createContext", length: 0` to React's anonymous
`name: "", length: 1` in the two default-root probe observations where the
export exists.

## Oracle design

Added a dedicated deterministic context-object oracle following the existing
ref, Children, wrapper, and forward-ref oracle pattern:

1. Resolve exact `react@19.2.6` npm metadata.
2. Download and integrity-check the exact React tarball.
3. Extract React and copy local `@fast-react/react` into a temporary
   `node_modules` tree.
4. Run one isolated Node child process per target, scenario, and mode.
5. Cover four modes:
   - `default-node-development`
   - `default-node-production`
   - `react-server-development`
   - `react-server-production`
6. Normalize observations into checked JSON with no timestamps, temp paths,
   local absolute paths, or transient environment details.
7. Compare Fast React against the React oracle using explicit statuses while
   keeping package-wide compatibility claims false.
8. Record a deterministic before/after summary: before this worker slice,
   default-root behavior scenarios were placeholders and `react-server`
   scenarios already matched absence; after this worker slice all generated
   Fast React observations are exact normalized matches without a compatibility
   claim.

Scenarios:

- `context-export-shape`
- `context-default-values`
- `context-object-shape`
- `context-invocation`
- `context-provider-consumer-identity`
- `context-display-name`
- `context-mutability-and-slots`

Captured behavior includes root export/function descriptors,
`react-server` export absence, representative nullish/scalar/object/array/
symbol/function default values, context own-key order, descriptors, prototype,
freeze/seal/extensible state, `$$typeof` tags, Provider/Consumer identity and
shape, default value identity, `_threadCount`, development renderer slots,
displayName assignment behavior, `this`/extra-argument handling, constructor
calls, direct slot mutation, and direct property add/delete behavior.

## Implemented behavior

`packages/react/context-object.js` now provides shared default-root
`createContext` direct object behavior used by `packages/react/index.js`.
`packages/react/react.react-server.js` intentionally remains unchanged and
does not export `createContext`.

Observed and implemented default-root React 19.2.6 behavior:

- `createContext.name === ""` and `createContext.length === 1`.
- `createContext` is an enumerable, configurable, writable root export.
- Direct calls return a plain, extensible, unsealed, unfrozen context object.
- Development context own keys are `["$$typeof", "_currentValue",
  "_currentValue2", "_threadCount", "Provider", "Consumer",
  "_currentRenderer", "_currentRenderer2"]`.
- Production context own keys are `["$$typeof", "_currentValue",
  "_currentValue2", "_threadCount", "Provider", "Consumer"]`.
- All context fields are enumerable, configurable, writable data properties.
- `$$typeof === Symbol.for("react.context")`.
- `_currentValue` and `_currentValue2` preserve default value identity.
- `_threadCount === 0`.
- `Provider === context`.
- `Consumer` is a separate plain extensible object with own keys
  `["$$typeof", "_context"]`.
- `Consumer.$$typeof === Symbol.for("react.consumer")`.
- `Consumer._context === context`.
- Development initializes `_currentRenderer` and `_currentRenderer2` to `null`;
  production omits those keys.
- Extra arguments and `this` are ignored.
- `new React.createContext(value)` returns the explicit context object, not a
  function instance.
- `context.displayName` and `context.Consumer.displayName` assignments create
  ordinary data properties. `context.Provider.displayName` aliases the context
  because `Provider === context`.

## Comparison status counts

Generated context-object oracle Fast React comparison counts:

- `matched-but-compatibility-not-claimed`: 28
- `known-mismatch`: 0
- `unsupported-placeholder`: 0

Per mode:

- `default-node-development`: 7 matches
- `default-node-production`: 7 matches
- `react-server-development`: 7 matches
- `react-server-production`: 7 matches

The 14 `react-server` matches are absence matches; they do not represent
server `createContext` behavior.

Package-wide compatibility remains explicitly false:

- `fastReactBehaviorCompatible: false`
- `compatibilityClaimed: false`
- `fullDualRunOracleExists: false`

The checked context-object artifact also records the pre-implementation
baseline as `implementationComparison.beforeWorker028.statusCounts`:

- `matched-but-compatibility-not-claimed`: 14
- `known-mismatch`: 2
- `unsupported-placeholder`: 12

Element-object oracle comparison counts after refresh:

- `unexpected-match-compatibility-not-claimed`: 84
- `known-mismatch`: 4
- `unsupported-placeholder`: 0

## Smoke test updates

`tests/smoke/import-entrypoints.mjs` now checks implemented direct
`createContext` behavior while preserving existing surface guards:

- exact enumerable root and JSX export keys;
- default and `react-server` package condition routing;
- blocked physical subpaths, now including `context-object.js`;
- non-enumerable Fast React metadata;
- explicit placeholders for out-of-scope APIs such as `useContext`, hooks,
  class component construction, private internals, compiler runtime behavior,
  and renderer behavior;
- development and production `createContext` direct object behavior;
- default-root package specifier behavior and `react-server` package specifier
  export absence under `--conditions=react-server`.

## Commands run

Implementation and inspection:

```sh
sed -n ... required worker and source files
rg --files -g ... required source files
git status --short
curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz ...
rg -n "function createContext|createContext|REACT_CONTEXT_TYPE|REACT_PROVIDER_TYPE" <extracted react cjs files>
node <React 19.2.6 createContext behavior spot probes>
node --check packages/react/context-object.js
node --check tests/conformance/src/context-object-probe-runner.mjs
node --check tests/conformance/src/context-object-oracle-generator.mjs
node --check tests/conformance/test/context-object-oracle.test.mjs
node --check tests/smoke/import-entrypoints.mjs
npm run context-object:generate --workspace @fast-react/conformance
npm run element-object:generate --workspace @fast-react/conformance
node --test tests/conformance/test/context-object-oracle.test.mjs
node tests/smoke/import-entrypoints.mjs
node <oracle status count checks>
```

Required verification:

```sh
npm test --workspace @fast-react/conformance
npm run test:conformance
npm run check:js
tmp=$(mktemp) && node tests/conformance/scripts/generate-context-object-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-context-object-oracle.json "$tmp" && rm "$tmp"
tmp=$(mktemp) && node tests/conformance/scripts/generate-element-object-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-element-object-oracle.json "$tmp" && rm "$tmp"
if rg '/private/var|/var/folders|fast-react-context-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-context-object-oracle.json; then exit 1; else exit 0; fi
if rg '/private/var|/var/folders|fast-react-element-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-element-object-oracle.json; then exit 1; else exit 0; fi
git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-028-create-context-behavior.md
```

All verification commands passed. npm printed existing local
`minimum-release-age` config warnings; they did not affect results.

## Unsupported or intentionally out of scope

The following remain unsupported or intentionally out of scope:

- adding `createContext` to the `react-server` root entrypoint;
- `useContext`;
- Provider rendering semantics;
- Consumer rendering semantics;
- context value propagation;
- subscriptions or invalidation;
- renderer mutation/ownership of `_currentRenderer` or `_currentRenderer2`;
- owner stacks and render-time owner changes;
- hooks;
- private React internals;
- DOM, native, SSR, RSC, or Rust-backed renderer integration.

This worker implements only direct default-root context object behavior proven
by the context-object oracle.

## Quality, maintainability, performance, and security review

Quality:

- Behavior is backed by exact React 19.2.6 tarball observations, not API-name
  inference.
- The new tests assert specific React-observed export descriptors, object
  shapes, dev/prod differences, `react-server` absence, identity relationships,
  invocation behavior, displayName behavior, and direct mutability.
- Exact matches are recorded as matched but compatibility not claimed.

Maintainability:

- `createContext` direct object behavior is isolated in a small helper module.
- The context-object oracle is separate from element/ref/Children/wrapper/
  forward-ref oracles, so future context rendering work can add new scenarios
  without overloading existing artifacts.
- Default-root implementation and `react-server` absence are both guarded by
  smoke and conformance tests.

Performance:

- Direct context construction is a small object-literal path.
- Development-only renderer-slot initialization is skipped in production.
- Normal conformance tests read checked artifacts and do not fetch network
  metadata or execute oracle generation.

Security:

- No DOM, SSR, resource hinting, native loading, private internals, hook, or
  renderer behavior was introduced.
- Oracle generation executes verified React package code and local Fast React
  code only in short-lived temporary child processes.
- Generated artifacts are checked for temp/local path leaks.

## Completion audit

- Dedicated context oracle under `tests/conformance/**`: done via
  `react-19.2.6-context-object-oracle.json`, generator/print scripts, scenario
  metadata, probe runner, artifact reader, and tests.
- Exact React 19.2.6 artifacts as source of truth: done; generator resolves npm
  metadata, downloads the exact tarball, verifies `dist.integrity`, and probes
  isolated child processes.
- Default Node development and production direct behavior: done; both modes are
  covered by seven scenarios each.
- `--conditions=react-server` only for export absence/surface preservation:
  done; `react-server` modes cover absence and implementation keeps the export
  absent.
- Direct object behavior implemented only where oracle covers it: done;
  implementation is limited to default-root `createContext` object construction.
- Smoke tests updated while preserving keys, condition routing, blocked
  physical subpaths, and placeholders: done.
- Regenerated affected existing oracle artifact: done for the element-object
  oracle; byte-compare passed.
- Package-wide compatibility claims false: done in the context oracle and
  unchanged broader artifacts.
- Unsupported areas documented: done above.
- Required verification commands and guards: all passed as listed above.
