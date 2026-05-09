# worker-026-memo-lazy-behavior

## Objective

Implement conformance-backed direct `memo` and `lazy` wrapper-object behavior
for `@fast-react/react`. The slice adds a deterministic React 19.2.6
wrapper-object oracle, implements only the directly observable wrapper behavior
covered by that oracle for the default and `react-server` root entrypoints,
preserves package-surface guardrails, and keeps package-wide compatibility
claims false.

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
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Additional evidence:

- Published `react@19.2.6` tarball source and generated oracle observations
  from exact npm metadata and integrity-verified tarball artifacts.

## Delegated checks

- Explorer `019e0e32-24d9-7e00-a86a-40ab51b9d5c5` independently probed
  `react@19.2.6` from the published tarball across default development,
  default production, `react-server` development, and `react-server`
  production. It confirmed anonymous `memo`/`lazy` export descriptors,
  plain extensible wrapper objects, development-only `memo.displayName`,
  development-only lazy `_debugInfo`/`_ioInfo`, nullish `memo` warnings,
  minimal wrapper-time validation, and direct `_init` state transitions for
  fulfilled, rejected, pending, throwing, and invalid thenables.
- Explorer `019e0e32-3216-7f63-921f-177180c84a96` audited the local integration
  shape. It recommended a dedicated `wrapper-object` oracle following the
  newer ref/Children pattern, root-entrypoint wiring only, smoke coverage for
  direct behavior, adding `wrapper-object.js` to blocked physical subpaths, and
  regenerating the element-object oracle because entrypoint descriptors change.

## Files changed

- `packages/react/README.md`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- `packages/react/wrapper-object.js`
- `tests/smoke/import-entrypoints.mjs`
- `tests/conformance/README.md`
- `tests/conformance/package.json`
- `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
- `tests/conformance/oracles/react-19.2.6-wrapper-object-oracle.json`
- `tests/conformance/scripts/generate-wrapper-object-oracle.mjs`
- `tests/conformance/scripts/print-wrapper-object-oracle.mjs`
- `tests/conformance/src/wrapper-object-oracle-generator.mjs`
- `tests/conformance/src/wrapper-object-oracle.mjs`
- `tests/conformance/src/wrapper-object-probe-runner.mjs`
- `tests/conformance/src/wrapper-object-scenarios.mjs`
- `tests/conformance/src/wrapper-object-targets.mjs`
- `tests/conformance/test/wrapper-object-oracle.test.mjs`
- `worker-progress/worker-026-memo-lazy-behavior.md`

## Oracle design

Added a dedicated deterministic wrapper-object oracle following the existing
ref-object and Children-helper oracle pattern:

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

- `wrapper-export-shape`
- `memo-wrapper-object`
- `memo-arguments-and-display-name`
- `lazy-wrapper-object`
- `lazy-init-behavior`

Captured behavior includes root export/function descriptors, wrapper own-key
order, property descriptors, prototype, freeze/seal/extensible state,
`$$typeof` tags, `memo` `type` and `compare`, development-only
`displayName`, nullish-type warnings, `this` and extra-argument handling,
`lazy` direct-call `this` and extra-argument handling, `lazy` `_payload`,
`_init`, `_debugInfo`, `_ioInfo`, wrapper-time loader non-invocation, and
direct `_init` status/result transitions for deterministic fulfilled,
rejected, pending, throwing, non-thenable, missing-default, and
undefined-module cases.

## Implemented behavior

`packages/react/wrapper-object.js` now provides shared JavaScript facade
behavior used by both `packages/react/index.js` and
`packages/react/react.react-server.js`.

Observed and implemented React 19.2.6 `memo` behavior:

- `memo.name === ""` and `memo.length === 2`.
- Wrapper objects are plain, extensible, unsealed, and unfrozen.
- Production own keys are `["$$typeof", "type", "compare"]`.
- Development own keys add non-enumerable configurable accessor
  `displayName`.
- `$$typeof === Symbol.for("react.memo")`.
- `type` preserves the first argument identity.
- Omitted or `undefined` compare becomes `null`; other compare values preserve
  identity and value.
- Extra arguments and `this` are ignored; constructor calls return the wrapper
  object.
- Development warns for `null` and `undefined` first arguments but still
  returns a wrapper.
- Development `displayName` assignment stores the name on the wrapper and also
  writes `type.name`/`type.displayName` when the wrapped type lacks both.

Observed and implemented React 19.2.6 `lazy` behavior:

- `lazy.name === ""` and `lazy.length === 1`.
- Direct `lazy(loader)` creates a plain wrapper and does not invoke the loader.
- Extra arguments and `this` are ignored; constructor calls return the wrapper
  object.
- Production wrapper own keys are `["$$typeof", "_payload", "_init"]`.
- Development wrapper own keys add `_debugInfo`; development payload keys add
  `_ioInfo`.
- `$$typeof === Symbol.for("react.lazy")`.
- Initial payload is `{ _status: -1, _result: loader }`.
- `_init(payload)` invokes the loader with no arguments and `this === undefined`
  for strict loaders.
- Synchronously fulfilled thenables set `_status = 1`, store the module object,
  and return `module.default`.
- Synchronously rejected thenables set `_status = 2`, store the error, and
  throw that error.
- Pending thenables set `_status = 0`, store the thenable, and throw it.
- Throwing loaders and non-thenable loader results leave `_status = -1` and
  keep the original loader stored in `_result`.
- Development mutates settling thenables with `status`/`value` or
  `status`/`reason`, tracks `_ioInfo.value/start/end`, copies string
  `thenable.displayName` to `_ioInfo.name`, and warns for fulfilled module
  objects that are `undefined` or lack `default`.
- Production omits `_debugInfo`, `_ioInfo`, development warnings, and thenable
  instrumentation.

## Comparison status counts

Generated wrapper-object oracle Fast React comparison counts:

- `matched-but-compatibility-not-claimed`: 20
- `known-mismatch`: 0
- `unsupported-placeholder`: 0

Per mode:

- `default-node-development`: 5 matches
- `default-node-production`: 5 matches
- `react-server-development`: 5 matches
- `react-server-production`: 5 matches

Package-wide compatibility remains explicitly false:

- `fastReactBehaviorCompatible: false`
- `compatibilityClaimed: false`
- `fullDualRunOracleExists: false`

The checked wrapper-object artifact also records the pre-implementation
placeholder baseline as `implementationComparison.beforeWorker026.statusCounts`:

- `known-mismatch`: 4
- `unsupported-placeholder`: 16

Element-object oracle comparison counts after refresh:

- `unexpected-match-compatibility-not-claimed`: 84
- `known-mismatch`: 4
- `unsupported-placeholder`: 0

The element-object oracle was regenerated because its entrypoint export-shape
scenario records Fast React `memo`/`lazy` function descriptors. The scoped
artifact diff only changes those function names from placeholder names to
React's anonymous `""` and lengths from `0` to React's `1`/`2`.

## Smoke test updates

`tests/smoke/import-entrypoints.mjs` now checks implemented `memo` and `lazy`
direct behavior while preserving existing surface guards:

- exact enumerable root and JSX export keys
- default and `react-server` package condition routing
- blocked physical subpaths, now including `wrapper-object.js`
- non-enumerable Fast React metadata
- explicit placeholders for out-of-scope APIs such as `forwardRef`, hooks,
  class component construction, private internals, and compiler runtime
  behavior
- development and production `memo`/`lazy` direct wrapper behavior
- direct file imports and package specifier imports under default and
  `--conditions=react-server`

## Commands run

Implementation and inspection:

```sh
sed -n ... required worker and source files
rg --files packages/react tests/smoke tests/conformance worker-progress | sort
git status --short
curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz ...
rg -n "function memo|function lazy|exports\\.memo|exports\\.lazy|REACT_MEMO_TYPE|REACT_LAZY_TYPE" <extracted react cjs files>
node <React 19.2.6 memo/lazy wrapper probes>
node --check packages/react/wrapper-object.js
node --check packages/react/index.js
node --check packages/react/react.react-server.js
node --check tests/conformance/src/wrapper-object-probe-runner.mjs
node --check tests/conformance/src/wrapper-object-oracle-generator.mjs
node --check tests/conformance/scripts/generate-wrapper-object-oracle.mjs
node --check tests/conformance/scripts/print-wrapper-object-oracle.mjs
npm run wrapper-object:generate --workspace @fast-react/conformance
npm run element-object:generate --workspace @fast-react/conformance
node --test tests/conformance/test/wrapper-object-oracle.test.mjs
node tests/smoke/import-entrypoints.mjs
node <oracle status count checks>
```

Required verification:

```sh
npm test --workspace @fast-react/conformance
npm run test:conformance
npm run check:js
tmp=$(mktemp) && node tests/conformance/scripts/generate-wrapper-object-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-wrapper-object-oracle.json "$tmp" && rm "$tmp"
tmp=$(mktemp) && node tests/conformance/scripts/generate-element-object-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-element-object-oracle.json "$tmp" && rm "$tmp"
if rg '/private/var|/var/folders|fast-react-wrapper-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-wrapper-object-oracle.json; then exit 1; else exit 0; fi
if rg '/private/var|/var/folders|fast-react-element-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-element-object-oracle.json; then exit 1; else exit 0; fi
git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-026-memo-lazy-behavior.md
```

All verification commands passed. npm printed existing local
`minimum-release-age` config warnings; they did not affect results.

## Unsupported or intentionally out of scope

The following remain unsupported or intentionally out of scope:

- rendering behavior
- Suspense resolution through any renderer
- memo bailout behavior
- memo compare invocation
- component invocation
- lazy rendering integration
- owner stacks and render-time owner changes
- hooks
- context
- `forwardRef`
- refs lifecycle behavior
- private internals
- DOM behavior
- native/Rust-backed rendering behavior

Direct `_init` is implemented only because the oracle covers it as directly
observable object-internal behavior. No renderer or Suspense semantics are
introduced.

## Quality, maintainability, performance, and security review

Quality:

- Behavior is backed by exact React 19.2.6 tarball observations, not API-name
  inference.
- The new tests assert specific React-observed wrapper descriptors, warnings,
  dev/prod differences, and `_init` state transitions.
- Exact matches are recorded as matched but compatibility not claimed.

Maintainability:

- `memo` and `lazy` behavior is isolated in one shared helper module and used
  by both default and `react-server` root entrypoints.
- The wrapper-object oracle is separate from element/ref/Children oracles,
  keeping future wrapper behavior changes reviewable by scenario.
- Smoke tests preserve package surface checks while adding focused direct
  wrapper checks.

Performance:

- Direct `memo` and `lazy` calls allocate small plain JS objects and do not load
  native code.
- Development-only descriptor/debug work is skipped in production.
- Normal tests read checked artifacts and do not fetch packages or regenerate
  oracles.

Security:

- Generation does not run lifecycle scripts or mutate root manifests/lockfiles.
- Tarball code is executed only in short-lived child processes under temporary
  directories.
- Error normalization strips temp/local paths and excludes stack traces.
- No DOM, SSR, resource hinting, private-internal, hook, or renderer behavior
  was introduced.

## Recommended next tasks

1. Add renderer-backed Suspense/lazy tests only after a renderer conformance
   surface exists; do not infer it from direct wrapper `_init` behavior.
2. Add memo bailout and compare invocation behavior with renderer coverage,
   not in the package facade.
3. Continue with conformance-backed slices for context, hooks, `forwardRef`,
   refs lifecycle, and private internals before making broader React
   compatibility claims.
