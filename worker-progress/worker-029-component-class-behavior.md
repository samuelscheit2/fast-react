# worker-029-component-class-behavior

## Objective

Implement conformance-backed direct `Component` and `PureComponent` behavior
for the default-root `@fast-react/react` entrypoint. The slice adds a
deterministic React 19.2.6 component-class oracle, replaces only the
default-root placeholder class constructors where the oracle covers direct
constructor/prototype/instance/no-op updater behavior, preserves
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
- `worker-progress/worker-028-create-context-behavior.md`
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Additional evidence:

- Published `react@19.2.6` tarball source and generated oracle observations
  from exact npm metadata and integrity-verified tarball artifacts.

## Delegated checks

- Explorer `019e0e64-9f3f-70f1-9dbc-e3ebf3dc0662` independently probed
  `react@19.2.6` class behavior from the npm tarball. It confirmed export
  descriptors, prototype shapes, dev-only deprecated accessors, default refs
  freezing, production refs mutability, no-op updater warning/deduplication
  behavior, call/apply/bind/new behavior, custom updater forwarding, and
  `react-server` absence.
- Explorer `019e0e64-9f7e-7670-a1e0-f5ca2abf77f0` audited the local
  integration shape. It recommended a dedicated component-class oracle, a
  private `packages/react/component-class.js` helper wired only into
  `index.js`, smoke checks replacing the previous unimplemented assertion, and
  no `react-server` class export.

## Files changed

- `packages/react/README.md`
- `packages/react/component-class.js`
- `packages/react/index.js`
- `tests/smoke/import-entrypoints.mjs`
- `tests/conformance/README.md`
- `tests/conformance/package.json`
- `tests/conformance/oracles/react-19.2.6-component-class-oracle.json`
- `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
- `tests/conformance/scripts/generate-component-class-oracle.mjs`
- `tests/conformance/scripts/print-component-class-oracle.mjs`
- `tests/conformance/src/component-class-oracle-generator.mjs`
- `tests/conformance/src/component-class-oracle.mjs`
- `tests/conformance/src/component-class-probe-runner.mjs`
- `tests/conformance/src/component-class-scenarios.mjs`
- `tests/conformance/src/component-class-targets.mjs`
- `tests/conformance/test/component-class-oracle.test.mjs`
- `worker-progress/worker-029-component-class-behavior.md`

The element-object oracle was regenerated because its entrypoint export-shape
scenario records Fast React `Component` and `PureComponent` function
descriptors. The scoped artifact diff changes only the Fast React class
function lengths from placeholder `0` to React's observed `3` in the two
default-root modes.

## Oracle design

Added a dedicated deterministic component-class oracle following the existing
ref, Children, wrapper, forward-ref, and context oracle pattern:

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
   default-root class scenarios were placeholder mismatches or unsupported and
   `react-server` scenarios already matched absence; after this worker slice
   all generated Fast React observations are exact normalized matches without a
   compatibility claim.

Scenarios:

- `component-class-export-shape`
- `component-class-prototype-shape`
- `component-class-construction`
- `component-class-invocation`
- `component-class-custom-updater`
- `component-class-noop-updater`
- `component-class-deprecated-accessors`

Captured behavior includes root export descriptors, function own-key order,
function names and lengths, `react-server` export absence, prototype own-key
order and descriptors, `isReactComponent`, `isPureReactComponent`,
development-only `isMounted` and `replaceState` accessors, construction with
representative props/context/updater/extra arguments, instance own keys and
descriptors, prototype chains, shared default refs and updater identity, refs
mutability, direct function/member/call/apply/bind/new behavior, custom updater
forwarding, default no-op updater method descriptors, `setState` validation,
`forceUpdate`, callback non-invocation, development warnings, warning
deduplication, and production warning absence.

## Implemented behavior

`packages/react/component-class.js` now provides default-root direct
`Component` and `PureComponent` behavior used by `packages/react/index.js`.
`packages/react/react.react-server.js` intentionally remains unchanged and does
not export either class.

Observed and implemented default-root React 19.2.6 behavior:

- `Component.name === "Component"` and `Component.length === 3`.
- `PureComponent.name === "PureComponent"` and
  `PureComponent.length === 3`.
- Both are enumerable, configurable, writable root exports.
- `Component.prototype` owns `constructor`, `isReactComponent`, `setState`, and
  `forceUpdate`; development also owns non-enumerable non-configurable
  `isMounted` and `replaceState` accessors.
- `PureComponent.prototype` inherits from `Component.prototype` and owns
  `constructor`, `isReactComponent`, `setState`, `forceUpdate`, and
  `isPureReactComponent`.
- `PureComponent.prototype` copies the same `isReactComponent`, `setState`, and
  `forceUpdate` values as `Component.prototype`.
- `new Component(props, context, updater, extra)` and
  `new PureComponent(...)` assign own enumerable writable configurable
  `props`, `context`, `refs`, and `updater` properties; extra arguments are
  ignored.
- Direct props/context/custom updater identities are preserved.
- The default `refs` object is shared across default-root Component and
  PureComponent instances. It is frozen/sealed/non-extensible in development
  and mutable/extensible in production.
- The default no-op updater is shared across instances and has enumerable
  `isMounted`, `enqueueForceUpdate`, `enqueueReplaceState`, and
  `enqueueSetState` methods.
- Development no-op updater enqueue methods warn once per component name and
  caller (`setState` or `forceUpdate`); production enqueue methods do nothing
  and warn never.
- `setState` accepts objects, functions, `null`, and `undefined`; other direct
  values throw React's observed validation error.
- `setState` and `forceUpdate` forward to a custom updater with React's
  observed arguments and return `undefined`.
- Default no-op updater calls do not invoke callbacks.
- Direct function/member/call/apply/bind/new behavior follows React's strict
  function-constructor behavior rather than ES class semantics.

## Comparison status counts

Generated component-class oracle Fast React comparison counts:

- `matched-but-compatibility-not-claimed`: 28
- `known-mismatch`: 0
- `unsupported-placeholder`: 0

Per mode:

- `default-node-development`: 7 matches
- `default-node-production`: 7 matches
- `react-server-development`: 7 absence/direct-surface matches
- `react-server-production`: 7 absence/direct-surface matches

Package-wide compatibility remains explicitly false:

- `fastReactBehaviorCompatible: false`
- `compatibilityClaimed: false`
- `fullDualRunOracleExists: false`

The checked component-class artifact also records the pre-implementation
baseline as `implementationComparison.beforeWorker029.statusCounts`:

- `matched-but-compatibility-not-claimed`: 14
- `known-mismatch`: 2
- `unsupported-placeholder`: 12

Element-object oracle comparison counts after refresh:

- `unexpected-match-compatibility-not-claimed`: 84
- `known-mismatch`: 4
- `unsupported-placeholder`: 0

## Smoke test updates

`tests/smoke/import-entrypoints.mjs` now checks implemented direct
`Component` and `PureComponent` behavior while preserving existing surface
guards:

- exact enumerable root and JSX export keys;
- default and `react-server` package condition routing;
- blocked physical subpaths, now including `component-class.js`;
- non-enumerable Fast React metadata;
- explicit placeholders for out-of-scope APIs such as hooks, private
  internals, compiler runtime behavior, and renderer behavior;
- default-root development and production class constructors, prototypes,
  instances, refs object state, custom updater forwarding, no-op updater
  validation/warnings, and call/apply/bind/new behavior;
- `react-server` package specifier export absence under
  `--conditions=react-server`.

## Commands run

Implementation and inspection:

```sh
sed -n ... required worker and source files
rg --files packages/react tests/smoke tests/conformance worker-progress | sort
git status --short
curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz ...
rg -n "function Component|Component\\.prototype|PureComponent|ReactNoopUpdateQueue|enqueueSetState|isPureReactComponent" <extracted react cjs files>
node <React 19.2.6 Component/PureComponent behavior spot probes>
node --check packages/react/component-class.js
node --check tests/conformance/src/component-class-probe-runner.mjs
node --check tests/conformance/src/component-class-oracle-generator.mjs
node --check tests/conformance/scripts/generate-component-class-oracle.mjs
node --check tests/conformance/scripts/print-component-class-oracle.mjs
node --check tests/conformance/test/component-class-oracle.test.mjs
npm run component-class:generate --workspace @fast-react/conformance
npm run element-object:generate --workspace @fast-react/conformance
node --test tests/conformance/test/component-class-oracle.test.mjs
node tests/smoke/import-entrypoints.mjs
node <oracle status count checks>
```

Required verification:

```sh
npm test --workspace @fast-react/conformance
npm run test:conformance
npm run check:js
tmp=$(mktemp) && node tests/conformance/scripts/generate-component-class-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-component-class-oracle.json "$tmp" && rm "$tmp"
tmp=$(mktemp) && node tests/conformance/scripts/generate-element-object-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-element-object-oracle.json "$tmp" && rm "$tmp"
if rg '/private/var|/var/folders|fast-react-component-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-component-class-oracle.json; then exit 1; else exit 0; fi
if rg '/private/var|/var/folders|fast-react-element-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-element-object-oracle.json; then exit 1; else exit 0; fi
git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-029-component-class-behavior.md
```

All verification commands passed. npm printed existing local
`minimum-release-age` config warnings; they did not affect results.

## Unsupported or intentionally out of scope

The following remain unsupported or intentionally out of scope:

- adding `Component` or `PureComponent` to the `react-server` root entrypoint;
- rendering class components;
- lifecycle method invocation;
- reconciliation;
- state updates through a real renderer;
- update queue merging, scheduling, batching, callback timing, and mounted
  renderer behavior;
- refs lifecycle behavior or host/class instance ref assignment;
- context propagation;
- owner stacks and render-time owner changes;
- hooks;
- DOM, native, SSR, RSC, or Rust-backed renderer integration;
- private React internals.

This worker implements only direct default-root constructor/prototype/
instance/no-op updater behavior proven by the component-class oracle.

## Quality, maintainability, performance, and security review

Quality:

- Behavior is backed by exact React 19.2.6 tarball observations, not API-name
  inference.
- The new tests assert React-observed export descriptors, prototype
  descriptors, dev/prod differences, `react-server` absence, invocation
  behavior, default refs/updater state, warnings, validation, and exact Fast
  React comparison status counts.
- Exact matches are recorded as matched but compatibility not claimed.

Maintainability:

- Direct class behavior is isolated in one helper module and wired only into
  the default root, keeping `react-server` absence explicit.
- The component-class oracle is separate from existing element/ref/Children/
  wrapper/forward-ref/context artifacts, so future renderer class behavior can
  add new scenarios without overloading direct constructor coverage.
- Smoke tests preserve package-surface and placeholder guardrails while adding
  focused class checks.

Performance:

- Direct construction is a small function-constructor path with no native
  loading.
- Development-only warning caches, frozen refs, and deprecated accessors are
  skipped in production where React skips them.
- Normal conformance tests read checked artifacts and do not fetch network
  metadata or regenerate oracles.

Security:

- No DOM, SSR, resource hinting, native loading, private internals, hook, or
  renderer behavior was introduced.
- Oracle generation executes verified React package code and local Fast React
  code only in short-lived temporary child processes.
- Generated artifacts are checked for temp/local path leaks.

## Risks and recommended next tasks

- The package still has intentional entrypoint-surface mismatches in the
  element-object oracle because Fast React preserves scaffold metadata and
  placeholder version instead of claiming full React package compatibility.
- Renderer-driven class updates, lifecycle semantics, refs lifecycle, context
  propagation, and owner stacks need separate renderer-backed oracles before
  implementation.
- Future workers should keep `react-server` class exports absent unless exact
  React target probes for a future version prove otherwise.
