# worker-021-element-object-oracle

## Objective

Implement the first deterministic element-object conformance oracle under
`tests/conformance/**`, using React 19.2.6 package artifacts as truth and the
existing runtime inventory infrastructure style from worker-017. The oracle
must capture React element object behavior for `createElement`,
`cloneElement`, `jsx`, `jsxs`, `jsxDEV`, and `isValidElement` across default
Node and `react-server` conditions in development and production, then compare
the current Fast React package entrypoints as explicit mismatches or
unsupported placeholders without claiming compatibility.

Write scope honored: only `tests/conformance/**` and this report were changed.
I did not read `ORCHESTRATOR.md`.

## Sources read

Required project and worker sources:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-002-conformance.md`
- `worker-progress/worker-004-api-inventory.md`
- `worker-progress/worker-014-react-entrypoint-placeholders.md`
- `worker-progress/worker-017-runtime-inventory-generation.md`
- `worker-progress/worker-020-element-object-conformance-probes.md`
- Current files under `tests/conformance/**`

Additional implementation context read:

- `packages/react/package.json`
- `packages/react/index.js`
- `packages/react/react.react-server.js`
- `packages/react/jsx-runtime.js`
- `packages/react/jsx-runtime.react-server.js`
- `packages/react/jsx-dev-runtime.js`
- `packages/react/jsx-dev-runtime.react-server.js`
- `packages/react/placeholder-utils.js`
- root `package.json`

## Delegated checks

- Explorer `019e0de8-3280-75a0-8b43-a0c61a16c9b8` audited integration shape.
  It recommended a separate element-object oracle beside the runtime inventory,
  checked-in JSON under `tests/conformance/oracles/`, network-free normal
  tests, child-process isolation per scenario/mode, strict path-leak guards,
  and explicit Fast React mismatch/placeholder statuses. I used that structure.
- Explorer `019e0de8-32c5-7533-8259-48c8fd5ecb71` independently validated
  worker-020 coverage against the published `react@19.2.6` tarball. It
  confirmed the main behavior matrix and identified additional deterministic
  scenarios for config property copying, inherited/symbol props, clone odd
  inputs, clone child-array freezing, child validation, static child warnings,
  and export descriptors. I added those scenarios to the oracle.

## Files changed

- `tests/conformance/README.md`
- `tests/conformance/package.json`
- `tests/conformance/oracles/react-19.2.6-element-object-oracle.json`
- `tests/conformance/scripts/generate-element-object-oracle.mjs`
- `tests/conformance/scripts/print-element-object-oracle.mjs`
- `tests/conformance/src/element-object-oracle-generator.mjs`
- `tests/conformance/src/element-object-oracle.mjs`
- `tests/conformance/src/element-object-probe-runner.mjs`
- `tests/conformance/src/element-object-scenarios.mjs`
- `tests/conformance/src/element-object-targets.mjs`
- `tests/conformance/test/element-object-oracle.test.mjs`
- `worker-progress/worker-021-element-object-oracle.md`

## Oracle design

The new generator mirrors the worker-017 inventory pattern but produces a
behavior oracle instead of an export/package inventory:

1. Resolve exact `react@19.2.6` npm metadata.
2. Download the exact React tarball and verify `dist.integrity`.
3. Extract React into a temporary `node_modules/react`.
4. Copy local `packages/react` into temporary
   `node_modules/@fast-react/react`.
5. Copy a probe runner into the temp project.
6. Run one Node child process per target, scenario, and mode.
7. Emit stable JSON with no timestamps, temp paths, local absolute paths, or
   lifecycle script execution.

Modes covered:

- `default-node-development`
- `default-node-production`
- `react-server-development`
- `react-server-production`

The checked artifact contains 22 scenarios across these areas:

- entrypoint export shape
- `isValidElement`
- `createElement`
- `cloneElement`
- `jsx`
- `jsxs`
- `jsxDEV`

Normalized observations capture:

- `Object.keys` and `Reflect.ownKeys` order
- full descriptor metadata for data/accessor properties
- getter names and `isReactWarning`
- symbol keys and `Symbol.keyFor` values
- object prototype labels, freeze/seal/extensible state, and object tags
- element brand, props, `_store`, ref/key descriptors, and child values
- props/config and child-array identity booleans where observable
- raw intercepted `console.error` / `console.warn` argument arrays
- thrown error name/code/message without stacks or paths
- `jsxDEV` production undefined-export behavior
- default vs `react-server` JSX runtime export differences

The artifact also stores Fast React observations for the same scenario/mode
matrix and a comparison table. Current Fast React comparison statuses are only:

- `known-mismatch`
- `unsupported-placeholder`

Compatibility claims remain explicitly false:

- `fastReactBehaviorCompatible: false`
- `compatibilityClaimed: false`
- `fullDualRunOracleExists: false`

## Fast React unsupported or mismatching behavior

Fast React still does not implement element-object behavior. The current
package entrypoints either expose placeholder functions with different
descriptors from React or throw `FastReactUnimplementedError` when behavior is
called.

The oracle records that state as expected mismatch/unsupported evidence, not
as passing compatibility. Specific unsupported areas include:

- `createElement` element construction, key/ref handling, default props,
  children arrays, dev descriptors, warnings, and freezing
- `cloneElement` preservation/override semantics and clone object shape
- `jsx` / `jsxs` props identity, key copy path, static child behavior, and
  warning paths
- `jsxDEV` behavior and production undefined export semantics
- `isValidElement` brand checks
- owner-in-render behavior and N-API-backed element construction remain out of
  scope for this worker

## Commands run

Implementation and inspection:

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-002-conformance.md
sed -n '1,260p' worker-progress/worker-004-api-inventory.md
sed -n '1,260p' worker-progress/worker-014-react-entrypoint-placeholders.md
sed -n '1,320p' worker-progress/worker-017-runtime-inventory-generation.md
sed -n '1,760p' worker-progress/worker-020-element-object-conformance-probes.md
rg --files tests/conformance | sort
sed -n '1,260p' tests/conformance/package.json
sed -n '1,280p' tests/conformance/README.md
sed -n '1,420p' tests/conformance/src/runtime-inventory-generator.mjs
sed -n '1,420p' tests/conformance/test/runtime-inventory.test.mjs
find packages/react -maxdepth 2 -type f -print | sort
sed -n '1,320p' packages/react/index.js
sed -n '1,280p' packages/react/react.react-server.js
sed -n '1,320p' packages/react/placeholder-utils.js
sed -n '1,240p' packages/react/jsx-runtime.js
sed -n '1,240p' packages/react/jsx-runtime.react-server.js
sed -n '1,240p' packages/react/jsx-dev-runtime.js
sed -n '1,240p' packages/react/jsx-dev-runtime.react-server.js
npm run element-object:generate --workspace @fast-react/conformance
node --check tests/conformance/src/element-object-probe-runner.mjs
node --check tests/conformance/src/element-object-oracle-generator.mjs
wc -c tests/conformance/oracles/react-19.2.6-element-object-oracle.json
node <oracle summary and spot-check snippets>
```

Verification:

```sh
npm test --workspace @fast-react/conformance
npm run test:conformance
npm run check:js
tmp=$(mktemp) && node tests/conformance/scripts/generate-element-object-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-element-object-oracle.json "$tmp" && rm "$tmp"
if rg '/private/var|/var/folders|fast-react-element-oracle-[A-Za-z0-9]|/tmp/|Users/user|Developer/Developer' tests/conformance/oracles/react-19.2.6-element-object-oracle.json; then exit 1; else exit 0; fi
```

All verification commands above passed. npm printed existing local
`minimum-release-age` config warnings; they did not affect results.

## Quality, maintainability, performance, and security review

Quality:

- The oracle is generated from exact React package artifacts and validates the
  tarball integrity hash before executing React.
- Normal tests are network-free and read only the checked artifact.
- Tests verify schema, target coverage, React spot behavior, no path leaks, and
  explicit Fast React mismatch/unsupported status.

Maintainability:

- Scenario metadata, probe modes, artifact readers, generator, probe runner,
  and tests are split into small files under `tests/conformance/src`.
- The behavior oracle is separate from the runtime inventory so package-surface
  evidence and element-object behavior can evolve independently.
- The JSON artifact is large, but it is concrete reviewed evidence. If future
  behavior artifacts grow substantially, splitting per scenario or mode would
  be the next maintainability improvement.

Performance:

- Generation runs many short child processes by design to isolate React module
  warning caches and `NODE_ENV`/condition resolution. Normal tests do not run
  generation.
- Probe and fetch timeouts prevent hung registry requests or package probes.

Security:

- No lifecycle scripts run, no root manifests or lockfiles are mutated, and
  temporary extraction directories are removed.
- React package code from the verified tarball and local Fast React package
  code are executed only in short-lived child processes.
- Error normalization strips temp/local paths and excludes stack traces.

## Risks and follow-up tasks

- This is an element-object oracle, not the full dual-run conformance harness.
  Full Fast React compatibility must remain unclaimed until broader React and
  renderer behavior comparisons exist.
- `_debugTask` internals are intentionally opaque because they are
  environment-shaped; the oracle records only null/object kind for that value.
- Owner stack behavior during render is not covered because the current
  package/reconciler path cannot create elements inside a real render owner
  context yet.
- A future implementation worker should add the JS facade element factory
  behind this oracle, then regenerate and review the Fast React comparison
  statuses as behavior changes.
