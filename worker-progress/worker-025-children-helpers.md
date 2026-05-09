# worker-025-children-helpers

## Objective

Implement conformance-backed `React.Children` helper behavior for
`@fast-react/react`. The slice adds a deterministic React 19.2.6
children-helper oracle, implements only the direct helper behavior covered by
that oracle for the default and `react-server` root entrypoints, preserves
package-surface guardrails, and keeps package-wide compatibility claims false.

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
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Additional evidence:

- Published `react@19.2.6` tarball source and generated oracle observations
  from exact npm metadata and integrity-verified tarball artifacts.

## Delegated checks

- Explorer `019e0e1f-3817-7980-af9f-c8b85ab88e75` independently probed
  `react@19.2.6` `Children` behavior across default development/production and
  `--conditions=react-server` development/production. The explorer confirmed
  descriptor names and lengths, nullish/boolean/scalar handling, array holes,
  nested arrays, fragment leaf behavior, callback `thisArg`, key synthesis and
  slash escaping, iterable and Map behavior, direct thenables, and
  `react-server` production minified errors. I used the result to add
  `react-server` production error formatting and to keep `lazy` behavior out of
  the implementation.

## Files changed

- `packages/react/README.md`
- `packages/react/children-helper.js`
- `packages/react/element-factory.js`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- `tests/smoke/import-entrypoints.mjs`
- `tests/conformance/README.md`
- `tests/conformance/package.json`
- `tests/conformance/oracles/react-19.2.6-children-helper-oracle.json`
- `tests/conformance/scripts/generate-children-helper-oracle.mjs`
- `tests/conformance/scripts/print-children-helper-oracle.mjs`
- `tests/conformance/src/children-helper-oracle-generator.mjs`
- `tests/conformance/src/children-helper-oracle.mjs`
- `tests/conformance/src/children-helper-probe-runner.mjs`
- `tests/conformance/src/children-helper-scenarios.mjs`
- `tests/conformance/src/children-helper-targets.mjs`
- `tests/conformance/test/children-helper-oracle.test.mjs`
- `worker-progress/worker-025-children-helpers.md`

`tests/conformance/oracles/react-19.2.6-element-object-oracle.json` was
regenerated and byte-compared after `Children` stopped using placeholder
functions. It remained byte-identical, so it has no final diff.

## Oracle design

Added a dedicated deterministic children-helper oracle following the existing
element/ref oracle pattern:

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
   behavior scenarios were placeholders; after this worker slice, all generated
   Fast React observations are exact normalized matches without a compatibility
   claim.

Scenarios:

- `children-helper-export-shape`
- `children-nullish-and-empty-values`
- `children-scalar-values`
- `children-array-and-nested-traversal`
- `children-element-and-fragment-leaves`
- `children-map-return-handling-and-keys`
- `children-to-array-key-synthesis`
- `children-iterable-values`
- `children-thenable-values`
- `children-error-behavior`

## Implemented behavior

`packages/react/children-helper.js` now provides the shared JS facade behavior
used by both `packages/react/index.js` and
`packages/react/react.react-server.js`.

Observed and implemented React 19.2.6 behavior:

- `React.Children` is a mutable plain object with enumerable keys
  `map`, `forEach`, `count`, `toArray`, and `only`.
- Helper function descriptors match React: `map.name === "mapChildren"` and
  `map.length === 3`; `forEach.length === 3`; `count`, `toArray`, and `only`
  each have length `1`.
- `map(null)` returns `null`; `map(undefined)` returns `undefined`;
  `toArray(null|undefined)` returns `[]`; `count(null|undefined)` returns `0`.
- Booleans, `null`, `undefined`, and array holes inside traversal count as
  visited children and callbacks receive `null`; identity map and `toArray`
  filter those nullish results.
- Strings, numbers, and bigints traverse as leaves. Symbols and functions are
  ignored.
- Arrays and nested arrays flatten depth-first with React's callback index
  order.
- `forEach` applies the provided `thisArg` and ignores callback return values.
- Elements and fragments are direct leaf values; fragment `props.children` are
  not traversed without rendering.
- Portal-shaped objects are treated as direct leaves without implementing real
  renderer portal creation.
- `Children.only` returns the original valid element, including fragments, and
  rejects arrays and non-elements.
- `map` and `toArray` clone valid elements only to replace React's synthesized
  keys; scalar results are returned as-is; `null` and `undefined` callback
  returns are filtered; boolean callback returns are retained.
- Key synthesis and escaping match React for user keys containing `:`, `=`, and
  `/`, nested array paths, returned callback element keys, and array-return
  callback prefixes.
- `Set`, generators, and `Map` iterables traverse in iterator order. Map entry
  arrays are traversed, and development mode warns once per module.
- Direct thenable behavior matches React: fulfilled values unwrap, synchronous
  fulfillment mutates thenable status, rejected thenables throw their reason,
  and pending thenables are thrown after status mutation.
- Plain invalid object errors match default and development behavior.
  `react-server` production uses React's minified errors for invalid object
  children (`#31`) and `Children.only` failures (`#143`).

Implementation details:

- `element-factory.js` now exports `cloneAndReplaceKey` so Children helpers can
  reuse the already oracle-backed element object construction path when
  replacing keys.
- `index.js` and `react.react-server.js` now import `createChildrenHelpers()`;
  the server entrypoint passes `{ reactServer: true }` so production errors
  match the `react-server` bundle.
- `lazy` traversal remains intentionally unsupported because `lazy` itself is
  still a placeholder and this oracle does not cover it.

## Comparison status counts

Generated children-helper oracle Fast React comparison counts:

- `matched-but-compatibility-not-claimed`: 40
- `known-mismatch`: 0
- `unsupported-placeholder`: 0

Per mode:

- `default-node-development`: 10 matches
- `default-node-production`: 10 matches
- `react-server-development`: 10 matches
- `react-server-production`: 10 matches

Package-wide compatibility remains explicitly false:

- `fastReactBehaviorCompatible: false`
- `compatibilityClaimed: false`
- `fullDualRunOracleExists: false`

The checked children-helper artifact also records the pre-implementation
placeholder baseline as `implementationComparison.beforeWorker025.statusCounts`:

- `known-mismatch`: 4
- `unsupported-placeholder`: 36

Element-object oracle comparison counts after refresh:

- `unexpected-match-compatibility-not-claimed`: 84
- `known-mismatch`: 4
- `unsupported-placeholder`: 0

The element-object artifact was byte-identical after regeneration.

## Smoke test updates

`tests/smoke/import-entrypoints.mjs` now checks implemented `Children` behavior
while preserving existing surface guards:

- exact enumerable root and JSX export keys
- default and `react-server` package condition routing
- blocked physical subpaths, now including `children-helper.js`
- non-enumerable Fast React metadata
- explicit placeholders for out-of-scope APIs such as `forwardRef`, `useRef`,
  hooks, class component construction, private internals, and compiler runtime
  behavior
- development and production `Children` behavior, including server production
  minified error cases
- direct file imports and package specifier imports under default and
  `--conditions=react-server`

## Commands run

Implementation and inspection:

```sh
sed -n ... required worker and source files
find packages/react tests/smoke tests/conformance -maxdepth 3 -type f | sort
git status --short
curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz ...
rg -n "function mapIntoArray|function mapChildren|Children" <extracted react cjs files>
node <React 19.2.6 Children behavior spot probes>
node --check packages/react/children-helper.js
node --check packages/react/element-factory.js
node --check tests/conformance/src/children-helper-probe-runner.mjs
node --check tests/conformance/src/children-helper-oracle-generator.mjs
node --check tests/conformance/scripts/generate-children-helper-oracle.mjs
npm run children-helper:generate --workspace @fast-react/conformance
npm run element-object:generate --workspace @fast-react/conformance
node --test tests/conformance/test/children-helper-oracle.test.mjs
node tests/smoke/import-entrypoints.mjs
node <oracle status count checks>
```

Required verification:

```sh
npm test --workspace @fast-react/conformance
npm run test:conformance
npm run check:js
tmp=$(mktemp) && node tests/conformance/scripts/generate-children-helper-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-children-helper-oracle.json "$tmp" && rm "$tmp"
tmp=$(mktemp) && node tests/conformance/scripts/generate-element-object-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-element-object-oracle.json "$tmp" && rm "$tmp"
if rg '/private/var|/var/folders|fast-react-children-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-children-helper-oracle.json; then exit 1; else exit 0; fi
if rg '/private/var|/var/folders|fast-react-element-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-element-object-oracle.json; then exit 1; else exit 0; fi
git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-025-children-helpers.md
```

All verification commands passed. npm printed existing local
`minimum-release-age` config warnings; they did not affect results.

## Unsupported or intentionally out of scope

The following remain unsupported or intentionally out of scope:

- renderer traversal
- owner stacks and render-time owner changes
- rendering fragments into their children
- real portal creation from `react-dom` or another renderer
- `lazy` traversal before `lazy` has conformance-backed support
- hooks, context, `forwardRef`, `useRef`, refs lifecycle behavior, memo/lazy
  wrapper APIs, compiler runtime behavior, private internals, DOM behavior, and
  native/Rust-backed rendering behavior

## Quality, maintainability, performance, and security review

Quality:

- Behavior is backed by exact React 19.2.6 tarball observations, not API-name
  inference.
- The new tests assert specific React-observed traversal, callback, key,
  iterable, thenable, and error semantics.
- Exact matches are recorded as matched but compatibility not claimed.

Maintainability:

- `Children` behavior is isolated in one shared helper module and used by both
  default and `react-server` root entrypoints.
- Element key replacement reuses `element-factory.js` construction instead of
  duplicating element descriptor logic.
- The children-helper oracle is separate from element/ref oracles, keeping
  future helper behavior changes reviewable by scenario.

Performance:

- Normal package behavior is synchronous JS traversal with no native loading.
- Normal tests read checked artifacts and do not fetch packages or run oracle
  generation.
- Oracle generation isolates scenarios in child processes to avoid module
  warning-cache bleed and to keep failures local.

Security:

- Generation does not run lifecycle scripts or mutate root manifests/lockfiles.
- Tarball code is executed only in short-lived child processes under temporary
  directories.
- Error normalization strips temp/local paths and excludes stack traces.
- No DOM, SSR, resource hinting, private-internal, hook, or renderer behavior
  was introduced.

## Recommended next tasks

1. Add a conformance-backed `lazy` oracle before enabling `Children` traversal
   of lazy values.
2. Add a future `react-dom`/portal slice before claiming real portal object
   creation behavior.
3. Continue with conformance-backed slices for context, memo/lazy wrappers,
   hooks, and private internals rather than expanding placeholders from API
   names.
