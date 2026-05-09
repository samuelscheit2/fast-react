# worker-024-create-ref-behavior

## Objective

Implement conformance-backed `createRef` behavior for `@fast-react/react`
within the scoped JavaScript package, smoke tests, conformance tests, and this
worker report. The slice covers only direct `React.createRef()` calls from the
default and `react-server` root entrypoints. Broader refs behavior remains out
of scope.

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
- `worker-progress/worker-020-element-object-conformance-probes.md`
- `worker-progress/worker-021-element-object-oracle.md`
- `worker-progress/worker-023-js-element-factory.md`
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Additional evidence:

- Published `react@19.2.6` tarball source and runtime probes for
  `createRef` under default Node and `--conditions=react-server`, each in
  development and production.

## Delegated checks

- Explorer `019e0e0e-1de7-71d3-bc7d-f6bc15e4aa8e` independently probed exact
  `react@19.2.6` tarball artifacts. It confirmed that `createRef` is present
  in all four modes, the exported function has empty `name` and `length: 0`,
  development returns a sealed plain `{ current: null }`, production returns an
  extensible plain `{ current: null }`, `current` stays writable, arguments and
  `this` are ignored, constructor calls return the explicit ref object, and
  direct ref attachment behavior is not involved.
- Explorer `019e0e0e-1da5-7463-b2a9-f92864d0bb5b` audited the local package
  and conformance structure. It recommended a separate ref-object oracle, a
  tiny shared package helper rather than expanding `element-factory.js`, root
  entrypoint wiring only, smoke coverage for default and `react-server`, and
  preserving placeholders for `forwardRef`, `useRef`, callback/string refs, and
  renderer ref lifecycle behavior.

## Files changed

- `packages/react/README.md`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- `packages/react/ref-object.js`
- `tests/smoke/import-entrypoints.mjs`
- `tests/conformance/README.md`
- `tests/conformance/package.json`
- `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
- `tests/conformance/oracles/react-19.2.6-ref-object-oracle.json`
- `tests/conformance/scripts/generate-ref-object-oracle.mjs`
- `tests/conformance/scripts/print-ref-object-oracle.mjs`
- `tests/conformance/src/ref-object-oracle-generator.mjs`
- `tests/conformance/src/ref-object-oracle.mjs`
- `tests/conformance/src/ref-object-probe-runner.mjs`
- `tests/conformance/src/ref-object-scenarios.mjs`
- `tests/conformance/src/ref-object-targets.mjs`
- `tests/conformance/test/ref-object-oracle.test.mjs`
- `worker-progress/worker-024-create-ref-behavior.md`

The element-object oracle was regenerated because its entrypoint export-shape
scenario records the `createRef` function descriptor. The only observed
element-oracle artifact change is Fast React's `createRef` function name
changing from `"createRef"` to React's `""`; status counts stayed unchanged.

## Oracle design

Added a dedicated deterministic ref-object oracle instead of expanding the
element-object oracle:

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
8. Record a deterministic before/after summary: before this worker slice both
   root entrypoints used the structured `createRef` placeholder; after this
   worker slice the generated Fast React observations are exact normalized
   matches without a compatibility claim.

Scenarios:

- `create-ref-export-shape`
- `create-ref-object-shape`
- `create-ref-identity-and-invocation`
- `create-ref-mutability`

Captured behavior includes export presence and descriptors, function own keys
and descriptors, returned object own-key order, `current` descriptor,
prototype, freeze/seal/extensible state, initial `current`, per-call identity,
argument handling, `this` handling, constructor calls, `current` assignment,
extra property add/define/delete behavior, and strict delete behavior.

## Implemented behavior

`packages/react/ref-object.js` now provides the shared JS facade behavior used
by both `packages/react/index.js` and `packages/react/react.react-server.js`.

Observed and implemented React 19.2.6 behavior:

- `createRef` is an enumerable, configurable, writable root export.
- `createRef.name === ""` and `createRef.length === 0`.
- Every call returns a fresh plain object with prototype `Object.prototype`.
- Initial keys and own keys are exactly `["current"]`.
- Initial `current` is `null`.
- `current` is enumerable and writable in all modes.
- Development default and development `react-server` seal the object:
  - `Object.isSealed(ref) === true`
  - `Object.isExtensible(ref) === false`
  - `current` is non-configurable
  - extra property assignment/definition fails
- Production default and production `react-server` leave the object extensible:
  - `Object.isSealed(ref) === false`
  - `Object.isExtensible(ref) === true`
  - `current` is configurable
  - extra properties can be added and deleted
- Arguments are ignored.
- `this` is ignored for `call`, `apply`, bound calls, and constructor calls.
- `new React.createRef()` returns the explicit ref object, not a function
  instance.

## Comparison status counts

Regenerated ref-object oracle Fast React comparison counts:

- `matched-but-compatibility-not-claimed`: 16
- `known-mismatch`: 0
- `unsupported-placeholder`: 0

Per mode:

- `default-node-development`: 4 matches
- `default-node-production`: 4 matches
- `react-server-development`: 4 matches
- `react-server-production`: 4 matches

Package-wide compatibility remains explicitly false in the ref oracle:

- `fastReactBehaviorCompatible: false`
- `compatibilityClaimed: false`
- `fullDualRunOracleExists: false`

The checked ref-object artifact also records the pre-implementation placeholder
baseline as `implementationComparison.beforeWorker024.statusCounts`:

- `unsupported-placeholder`: 16

Element-object oracle comparison counts after refresh:

- `unexpected-match-compatibility-not-claimed`: 84
- `known-mismatch`: 4
- `unsupported-placeholder`: 0

## Smoke test updates

`tests/smoke/import-entrypoints.mjs` now checks implemented `createRef`
behavior while preserving existing surface guards:

- exact enumerable root and JSX export keys
- default and `react-server` package condition routing
- blocked physical subpaths, now including `ref-object.js`
- non-enumerable Fast React metadata
- explicit placeholders for out-of-scope APIs such as `forwardRef`, `useRef`,
  `Children`, class component construction, private internals, and compiler
  runtime behavior
- development and production `createRef` ref-object differences
- direct file imports and package specifier imports under default and
  `--conditions=react-server`

## Commands run

Implementation and inspection:

```sh
sed -n ... required worker and source files
rg --files packages/react tests/smoke tests/conformance worker-progress | sort
git status --short
node <isolated react@19.2.6 createRef probe>
rg -n "createRef|Object\\.seal|refObject" <extracted react@19.2.6 cjs files>
node --check tests/conformance/src/ref-object-probe-runner.mjs
node --check tests/conformance/src/ref-object-oracle-generator.mjs
node --check tests/conformance/scripts/generate-ref-object-oracle.mjs
node --check tests/conformance/scripts/print-ref-object-oracle.mjs
node --check packages/react/ref-object.js
npm run ref-object:generate --workspace @fast-react/conformance
npm run element-object:generate --workspace @fast-react/conformance
node tests/smoke/import-entrypoints.mjs
node <oracle status count checks>
```

Required verification:

```sh
npm test --workspace @fast-react/conformance
npm run test:conformance
npm run check:js
tmp=$(mktemp) && node tests/conformance/scripts/generate-ref-object-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-ref-object-oracle.json "$tmp" && rm "$tmp"
if rg '/private/var|/var/folders|fast-react-ref-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-ref-object-oracle.json; then exit 1; else exit 0; fi
git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-024-create-ref-behavior.md
```

Additional artifact freshness check:

```sh
tmp=$(mktemp) && node tests/conformance/scripts/generate-element-object-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-element-object-oracle.json "$tmp" && rm "$tmp"
```

All verification commands passed. npm printed existing local
`minimum-release-age` config warnings; they did not affect results.

## Unsupported or intentionally out of scope

The following refs-related behavior remains unsupported or intentionally
unimplemented:

- `forwardRef`
- `useRef`
- callback ref invocation
- string refs
- owner stacks
- render-time ref attachment
- commit-time ref detachment
- host node or class instance assignment into `current`
- private React internals
- renderer lifecycle behavior

`createElement` and JSX behavior still only preserve `ref` as an observed prop
value where already covered by the element-object oracle. This worker did not
introduce any renderer behavior that mutates ref objects.

## Quality, maintainability, performance, and security review

Quality:

- Behavior is backed by exact React 19.2.6 tarball observations, not API-name
  inference.
- Tests assert the specific ref-object semantics the new oracle is supposed to
  prove, including development and production differences.
- Exact matches are recorded as matched but compatibility not claimed.

Maintainability:

- `createRef` behavior is isolated in one small helper and shared by default
  and `react-server` root entrypoints.
- The ref-object oracle is separate from the element-object oracle, so future
  refs work can evolve without distorting element behavior status counts.
- Scripts and tests follow the existing conformance artifact structure.

Performance:

- Runtime behavior is a single object allocation plus `Object.seal` only in
  development, matching React's observed implementation shape.
- Normal tests read checked artifacts and do not fetch packages or run oracle
  generation.

Security:

- Generation does not run lifecycle scripts or mutate root manifests/lockfiles.
- Tarball code is executed only in short-lived child processes under temporary
  directories.
- No DOM, SSR, resource hinting, callback ref invocation, private internals, or
  renderer commit behavior was introduced.

## Risks and follow-up tasks

- Full refs compatibility still depends on renderer lifecycle, owner, hook, and
  `forwardRef` work that is deliberately out of scope here.
- Future workers should add conformance-backed slices for `forwardRef`,
  `useRef`, render/commit ref attachment and detachment, and owner stack
  behavior before making broader refs claims.
- Package-wide React compatibility remains unclaimed despite this direct
  `createRef` match.
