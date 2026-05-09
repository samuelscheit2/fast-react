# worker-027-forward-ref-behavior

## Objective

Implement conformance-backed direct `forwardRef` wrapper-object behavior for
`@fast-react/react`. The slice adds a deterministic React 19.2.6 forward-ref
oracle, implements only the direct wrapper-object behavior covered by that
oracle for default and `react-server` root entrypoints, preserves package
surface guardrails, and keeps package-wide compatibility claims false.

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
- Current files under `packages/react/**`, `tests/smoke/**`, and
  `tests/conformance/**`

Additional evidence:

- Published `react@19.2.6` tarball source and generated oracle observations
  from exact npm metadata and integrity-verified tarball artifacts.

## Delegated checks

- Explorer `019e0e4b-3333-7c90-a0bd-44c61613c918` independently probed
  `react@19.2.6` `forwardRef` direct behavior across default development,
  default production, `--conditions=react-server` development, and
  `--conditions=react-server` production. It confirmed anonymous export
  descriptors, wrapper object shapes, invalid input warning behavior, arity
  warnings, constructor calls, `this`/extra-argument handling, and
  development-only `displayName` setter behavior.
- Explorer `019e0e4b-5356-75c3-adb2-95291176850a` audited the local
  integration shape. It recommended a dedicated forward-ref oracle, implementing
  in `packages/react/wrapper-object.js`, routing only the default and
  `react-server` root exports, updating smoke tests, and regenerating the
  element-object oracle because the root `forwardRef` descriptor changed.

## Files changed

- `packages/react/README.md`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- `packages/react/wrapper-object.js`
- `tests/smoke/import-entrypoints.mjs`
- `tests/conformance/README.md`
- `tests/conformance/package.json`
- `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
- `tests/conformance/oracles/react-19.2.6-forward-ref-oracle.json`
- `tests/conformance/scripts/generate-forward-ref-oracle.mjs`
- `tests/conformance/scripts/print-forward-ref-oracle.mjs`
- `tests/conformance/src/forward-ref-oracle-generator.mjs`
- `tests/conformance/src/forward-ref-oracle.mjs`
- `tests/conformance/src/forward-ref-probe-runner.mjs`
- `tests/conformance/src/forward-ref-scenarios.mjs`
- `tests/conformance/src/forward-ref-targets.mjs`
- `tests/conformance/test/forward-ref-oracle.test.mjs`
- `worker-progress/worker-027-forward-ref-behavior.md`

The element-object oracle was regenerated because its entrypoint export-shape
scenario records the local Fast React `forwardRef` function descriptor. The
only element artifact changes are Fast React `forwardRef` descriptor updates
from placeholder `name: "forwardRef", length: 0` to React's `name: "",
length: 1` in the four probe modes.

## Oracle design

Added a dedicated deterministic forward-ref oracle following the ref, Children,
and wrapper-object oracle pattern:

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

- `forward-ref-export-shape`
- `forward-ref-wrapper-object`
- `forward-ref-invocation`
- `forward-ref-display-name`

Captured behavior includes export descriptors, function own keys and
descriptors, wrapper own-key order, property descriptors, prototype,
freeze/seal/extensible state, `$$typeof`, render identity, invalid render
values, memo/lazy wrapper inputs, extra arguments, `this` handling, constructor
calls, development-only `displayName`, render arity warnings, invalid value
warnings, memo-input warnings, and `defaultProps` warnings.

## Implemented behavior

`packages/react/wrapper-object.js` now provides shared direct `forwardRef`
behavior used by both `packages/react/index.js` and
`packages/react/react.react-server.js`.

Observed and implemented React 19.2.6 behavior:

- `forwardRef.name === ""` and `forwardRef.length === 1`.
- Direct calls return a plain, extensible, unsealed, unfrozen wrapper object.
- Production wrapper own keys are `["$$typeof", "render"]`.
- Development wrapper own keys add non-enumerable configurable accessor
  `displayName`.
- `$$typeof === Symbol.for("react.forward_ref")`.
- `render` preserves the first argument identity, including invalid values.
- Extra arguments and `this` are ignored.
- `new React.forwardRef(render)` returns the wrapper object, not a function
  instance.
- Development warns for non-function values, memo-wrapped inputs, arity 1,
  arity greater than 2, and `render.defaultProps`.
- Development accepts arity 0 and arity 2 without warning.
- Development `displayName` assignment stores the name on the wrapper and also
  writes `render.name`/`render.displayName` when the render function lacks both.
- Production has no initial `displayName` accessor; assigning `displayName`
  creates a normal enumerable data property.

## Comparison status counts

Generated forward-ref oracle Fast React comparison counts:

- `matched-but-compatibility-not-claimed`: 16
- `known-mismatch`: 0
- `unsupported-placeholder`: 0

Per mode:

- `default-node-development`: 4 matches
- `default-node-production`: 4 matches
- `react-server-development`: 4 matches
- `react-server-production`: 4 matches

Package-wide compatibility remains explicitly false:

- `fastReactBehaviorCompatible: false`
- `compatibilityClaimed: false`
- `fullDualRunOracleExists: false`

The checked forward-ref artifact also records the pre-implementation
placeholder baseline as `implementationComparison.beforeWorker027.statusCounts`:

- `known-mismatch`: 4
- `unsupported-placeholder`: 12

Element-object oracle comparison counts after refresh:

- `unexpected-match-compatibility-not-claimed`: 84
- `known-mismatch`: 4
- `unsupported-placeholder`: 0

## Smoke test updates

`tests/smoke/import-entrypoints.mjs` now checks implemented direct `forwardRef`
behavior while preserving existing surface guards:

- exact enumerable root and JSX export keys
- default and `react-server` package condition routing
- blocked physical subpaths
- non-enumerable Fast React metadata
- explicit placeholders for out-of-scope APIs such as `useRef`, hooks, context,
  class component construction, private internals, compiler runtime behavior,
  and renderer behavior
- development and production `forwardRef` direct wrapper behavior
- direct file imports and package specifier imports under default and
  `--conditions=react-server`

## Commands run

Implementation and inspection:

```sh
sed -n ... required worker and source files
rg --files packages/react tests/smoke tests/conformance worker-progress | sort
git status --short
curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz ...
rg -n "function forwardRef|forwardRef|REACT_FORWARD_REF_TYPE|exports\\.forwardRef" <extracted react cjs files>
node <React 19.2.6 forwardRef behavior spot probes>
node --check packages/react/wrapper-object.js
node --check tests/conformance/src/forward-ref-probe-runner.mjs
node --check tests/conformance/src/forward-ref-oracle-generator.mjs
node --check tests/conformance/scripts/generate-forward-ref-oracle.mjs
node --check tests/conformance/scripts/print-forward-ref-oracle.mjs
node --check tests/conformance/test/forward-ref-oracle.test.mjs
node --check tests/smoke/import-entrypoints.mjs
npm run forward-ref:generate --workspace @fast-react/conformance
npm run element-object:generate --workspace @fast-react/conformance
node --test tests/conformance/test/forward-ref-oracle.test.mjs
node tests/smoke/import-entrypoints.mjs
node <oracle status count checks>
```

Required verification:

```sh
npm test --workspace @fast-react/conformance
npm run test:conformance
npm run check:js
tmp=$(mktemp) && node tests/conformance/scripts/generate-forward-ref-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-forward-ref-oracle.json "$tmp" && rm "$tmp"
tmp=$(mktemp) && node tests/conformance/scripts/generate-element-object-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-element-object-oracle.json "$tmp" && rm "$tmp"
if rg '/private/var|/var/folders|fast-react-forward-ref-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-forward-ref-oracle.json; then exit 1; else exit 0; fi
if rg '/private/var|/var/folders|fast-react-element-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-element-object-oracle.json; then exit 1; else exit 0; fi
git diff --check -- packages/react tests/smoke tests/conformance worker-progress/worker-027-forward-ref-behavior.md
```

All verification commands passed. npm printed existing local
`minimum-release-age` config warnings; they did not affect results.

## Unsupported or intentionally out of scope

The following remain unsupported or intentionally out of scope:

- render-time ref attachment
- commit-time ref detachment
- callback ref invocation
- string refs
- `useRef`
- refs lifecycle behavior
- component invocation through a renderer
- `forwardRef` render invocation
- owner stacks and render-time owner changes
- hooks
- context
- memo/lazy renderer semantics
- private React internals
- DOM, native, or Rust-backed renderer integration

This worker implements only direct wrapper-object behavior proven by the
forward-ref oracle.

## Quality, maintainability, performance, and security review

Quality:

- Behavior is backed by exact React 19.2.6 tarball observations, not API-name
  inference.
- The new tests assert specific React-observed wrapper descriptors, warnings,
  dev/prod differences, invocation behavior, and `displayName` side effects.
- Exact matches are recorded as matched but compatibility not claimed.

Maintainability:

- `forwardRef` behavior is isolated in the same shared helper module as
  `memo`/`lazy`, but the forward-ref oracle is separate so worker-026's
  memo/lazy artifact and status counts remain stable.
- Default and `react-server` root entrypoints import the same helper, reducing
  drift between condition branches.
- Package-surface and placeholder guardrails remain in smoke tests.

Performance:

- Direct wrapper construction is a small object-literal path.
- Development-only warning and `displayName` descriptor work is skipped in
  production.
- Normal conformance tests read checked artifacts and do not fetch network
  metadata or execute package generation.

Security:

- No DOM, SSR, resource hinting, native loading, private internals, or renderer
  behavior was introduced.
- Oracle generation executes verified React package code and local Fast React
  code only in short-lived temporary child processes.
- Generated artifacts are checked for temp/local path leaks.
