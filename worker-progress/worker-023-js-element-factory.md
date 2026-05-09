# worker-023-js-element-factory

## Objective

Implement the first conformance-backed JavaScript element factory for
`@fast-react/react`, using the checked React 19.2.6 element-object oracle from
worker-021 as source of truth. Replace placeholder behavior for
`createElement`, `cloneElement`, `isValidElement`, `jsx`, `jsxs`, and `jsxDEV`
where the oracle covers behavior across default and `react-server`
entrypoints, while keeping full compatibility claims false.

I did not read `ORCHESTRATOR.md`.

## Sources read

Required sources:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-014-react-entrypoint-placeholders.md`
- `worker-progress/worker-020-element-object-conformance-probes.md`
- `worker-progress/worker-021-element-object-oracle.md`
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Additional evidence:

- The checked oracle artifact
  `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
- Published `react@19.2.6` CJS package files extracted under a temporary
  directory for source-level cross-checking while implementing the observed
  oracle behavior.

## Delegated checks

- Explorer `019e0dfc-7a0d-7212-a3fe-93637c4a5bed` audited the oracle status
  policy. It confirmed that exact normalized matches already had a generator
  status name, `unexpected-match-compatibility-not-claimed`, but tests needed
  to allow that status and require `firstDifferencePath: null` only for that
  case.
- Explorer `019e0dfc-84ee-7122-a4f4-f1f2b457c2e4` audited the package
  placeholder architecture and smoke tests. It confirmed that the implementation
  should preserve export keys and condition routing, keep private internals as
  throwing placeholders, and update smoke tests for the newly implemented
  element APIs.

## Files changed

- `packages/react/README.md`
- `packages/react/element-factory.js`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- `packages/react/jsx-runtime.js`
- `packages/react/jsx-runtime.react-server.js`
- `packages/react/jsx-dev-runtime.js`
- `packages/react/jsx-dev-runtime.react-server.js`
- `tests/smoke/import-entrypoints.mjs`
- `tests/conformance/README.md`
- `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
- `tests/conformance/src/element-object-oracle-generator.mjs`
- `tests/conformance/src/element-object-oracle.mjs`
- `tests/conformance/src/element-object-targets.mjs`
- `tests/conformance/test/element-object-oracle.test.mjs`
- `worker-progress/worker-023-js-element-factory.md`

## Implementation summary

- Added `packages/react/element-factory.js` as the shared JavaScript facade for
  element objects. Default root, `react-server` root, JSX runtime, and JSX dev
  runtime now share the same construction logic.
- Implemented the oracle-covered behavior for `createElement`,
  `cloneElement`, `isValidElement`, `jsx`, `jsxs`, and `jsxDEV`.
- Preserved the accepted package export map, runtime export keys, package
  condition routing, placeholder metadata, and explicit
  `FastReactUnimplementedError` placeholders for APIs outside this slice.
- Kept private client/server internals as opaque throwing placeholders; the
  element factory does not depend on them.
- Kept owner-in-render behavior out of scope. Direct calls and the current
  supported scenarios use `null` owners, while clone behavior preserves the
  observed direct-call owner values.
- Kept top-level compatibility claims false in the oracle and package evidence.

## Behavior now matching the oracle

The regenerated oracle records exact normalized Fast React matches for all
non-entrypoint element-object scenarios in all four modes:

- `isValidElement` brand checks, including plain objects with
  `Symbol.for("react.transitional.element")`.
- `createElement` element branding, key coercion, ref-as-prop behavior,
  `defaultProps`, children handling, config copying, dev warning getters,
  child validation, dev/prod descriptors, and dev freezing.
- `cloneElement` null/undefined errors, plain-object clone behavior, key/ref
  preservation and override behavior, props copying, symbol copying from old
  props, child replacement, and dev/prod object shapes.
- `jsx` and `jsxs` key behavior, key-spread warnings, keyless config identity,
  key copy path behavior, inherited key behavior, static child-array freezing,
  and static non-array warnings.
- `jsxDEV` development element construction and production `undefined` export
  behavior in default and `react-server` JSX entrypoints.

Regenerated Fast React comparison status counts:

- `unexpected-match-compatibility-not-claimed`: 84
- `known-mismatch`: 4
- `unsupported-placeholder`: 0

Per mode:

- `default-node-development`: 21 matches, 1 known mismatch
- `default-node-production`: 21 matches, 1 known mismatch
- `react-server-development`: 21 matches, 1 known mismatch
- `react-server-production`: 21 matches, 1 known mismatch

Audit follow-up: `tests/conformance/test/element-object-oracle.test.mjs` now
asserts these total and per-mode counts directly, so regressions back to broad
mismatches or unsupported placeholders fail in conformance tests while
`compatibilityClaimed` remains false.

## Remaining mismatches and unsupported behavior

The remaining known mismatches are limited to the `entrypoint-export-shape`
scenario:

- `default-node-development`: `$.result.value.react.ownKeys.length`
- `default-node-production`: `$.result.value.react.exportKeys.length`
- `react-server-development`: `$.result.value.react.ownKeys.length`
- `react-server-production`: `$.result.value.react.ownKeys.length`

These are intentional because the package still preserves accepted Fast React
scaffold metadata, accepted runtime export keys, and the placeholder version
instead of claiming full `react@19.2.6` package compatibility.

Unsupported behavior remains explicit outside this worker's element-object
scope, including Children helpers, context, refs, hooks, memo/lazy,
transitions, compiler runtime behavior, private internals, renderer owner
stacks, and native/Rust-backed element records.

## Commands run

Implementation and inspection:

```sh
git status --short
rg --files -g 'WORKER_BRIEF.md' -g 'MASTER_PLAN.md' -g 'MASTER_PROGRESS.md' -g 'worker-progress/worker-014-react-entrypoint-placeholders.md' -g 'worker-progress/worker-020-element-object-conformance-probes.md' -g 'worker-progress/worker-021-element-object-oracle.md' -g 'packages/react/**' -g 'tests/smoke/**' -g 'tests/conformance/**' -g 'worker-progress/worker-023-js-element-factory.md'
sed -n ... required worker and source files
node --check packages/react/element-factory.js
node --check packages/react/index.js
node --check packages/react/jsx-runtime.js
node --check packages/react/jsx-dev-runtime.js
NODE_ENV=development node <element factory spot check>
NODE_ENV=production node <element factory spot check>
node tests/smoke/import-entrypoints.mjs
node <oracle status count snippets>
```

Oracle and required verification:

```sh
npm run element-object:generate --workspace @fast-react/conformance
npm test --workspace @fast-react/conformance
npm run test:conformance
npm run check:js
tmp=$(mktemp) && node tests/conformance/scripts/generate-element-object-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-element-object-oracle.json "$tmp" && rm "$tmp"
if rg '/private/var|/var/folders|fast-react-element-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-element-object-oracle.json; then exit 1; else exit 0; fi
git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-023-js-element-factory.md
```

Audit follow-up verification:

```sh
npm test --workspace @fast-react/conformance
npm run test:conformance
git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-023-js-element-factory.md
```

All verification commands passed. npm printed existing
`minimum-release-age` config warnings; they did not affect results.

## Quality, maintainability, performance, and security review

Quality:

- The implementation is gated by the regenerated element-object oracle. Exact
  matches are represented as "matched but compatibility not claimed" rather
  than as a package-wide compatibility pass.
- The comparison root cause was fixed by comparing behavior payloads instead of
  the expected package-name discriminator.
- Smoke tests now check real element behavior for implemented APIs and still
  verify exact export keys, condition routing, blocked physical subpaths, and
  explicit placeholders for unimplemented APIs.

Maintainability:

- All element-object construction is centralized in one shared JS module so
  default, `react-server`, JSX runtime, and JSX dev runtime behavior cannot
  drift independently.
- The module keeps production construction on a simple object-literal path and
  isolates development-only descriptors, warning getters, validation, debug
  fields, and freezing.
- The status policy documents why exact normalized matches do not flip global
  compatibility claims.

Performance:

- Production element construction avoids descriptor definition and freezing,
  matching the oracle's mutable production shape.
- Development paths do descriptor work and freezing only when
  `NODE_ENV !== "production"`.

Security:

- No DOM, SSR, resource hinting, compiler, hook, or private-internal behavior
  was introduced.
- Key coercion intentionally follows the oracle-observed JavaScript coercion
  behavior, including user-defined `toString` side effects and thrown errors.
- The new internal helper file is not exported as a package subpath and is
  covered by the smoke blocked-subpath list.

## Risks and follow-up tasks

- The package still has intentional entrypoint-surface mismatches because it is
  not claiming full React compatibility.
- Owner stacks during renderer execution remain unsupported and should be
  implemented only after shared internals and renderer owner state exist.
- Future workers should implement the next conformance-backed slices for
  `createRef`, `Children`, context, memo/lazy, hooks, and private internals
  rather than expanding placeholders from names alone.
- A later Rust/N-API integration can store normalized element records, but the
  final public JS object descriptor behavior should continue to be verified by
  this oracle.
