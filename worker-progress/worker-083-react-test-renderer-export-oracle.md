# worker-083-react-test-renderer-export-oracle

## Objective

Add deterministic `react-test-renderer@19.2.6` package export and descriptor
oracle files.

Write scope honored:

- `tests/conformance/src/react-test-renderer-export-*.mjs`
- `tests/conformance/scripts/*react-test-renderer-export*.mjs`
- `tests/conformance/test/react-test-renderer-export-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json`
- `worker-progress/worker-083-react-test-renderer-export-oracle.md`

`ORCHESTRATOR.md` was not read. `create_goal` was set for this worker objective
before research, file reads, implementation review, or verification. `get_goal`
was available and reported the active goal status as `active` with objective
`Add deterministic react-test-renderer 19.2.6 package export and descriptor
oracle files.`

## Summary

Implemented a generated, checked-in oracle for the deprecated-but-published
`react-test-renderer@19.2.6` package surface. The oracle probes exact npm
tarballs in an isolated temporary `node_modules` tree without lifecycle scripts
or root manifest/lockfile mutation.

The artifact records:

- package metadata, tarball file lists, integrity, dependencies, and peer
  dependencies for `react-test-renderer`, `react`, `scheduler`, and `react-is`;
- root, physical CommonJS, shallow, and package.json subpath resolution;
- CommonJS require export keys, property descriptors, dynamic import interop,
  and require-cache dependency evidence;
- deterministic development/production and `react-server` condition
  differences;
- `create()` deprecation warning behavior, including the React Native test
  global suppression branch;
- `react-test-renderer/shallow` removal behavior for call and constructor use;
- explicit unsupported Fast React placeholder evidence only.

No Fast React compatibility is claimed.

## Completion Audit

Objective restated as deliverables:

- add source helpers under `tests/conformance/src/react-test-renderer-export-*.mjs`;
- add generate/print CLIs under
  `tests/conformance/scripts/*react-test-renderer-export*.mjs`;
- add the targeted Node test
  `tests/conformance/test/react-test-renderer-export-oracle.test.mjs`;
- add the checked oracle artifact
  `tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json`;
- add this progress report;
- probe the exact `react-test-renderer@19.2.6` tarball and dependency behavior
  without lifecycle scripts or root manifest mutation;
- capture export keys, descriptors, package metadata, shallow removal,
  deprecation warning surfaces, and deterministic mode/condition differences;
- keep Fast React comparison as unsupported placeholder evidence only;
- run the targeted Node test, scoped path-leak check, trailing-whitespace check,
  and scoped `git diff --check`.

Prompt-to-artifact checklist:

- Required source, script, test, oracle, and report files are present in the
  worker write scope and are the only paths in `git status --short`.
- Exact package evidence is generated from registry metadata and tarballs for
  `react-test-renderer@19.2.6`, `react@19.2.6`, `scheduler@0.27.0`, and
  `react-is@19.2.6`, with expected integrity and shasum constants checked
  before extraction.
- The generator extracts into a temporary `node_modules` tree, runs only Node
  child-process probes, records `lifecycleScriptsExecuted: false`, records
  `rootManifestsOrLockfilesMutated: false`, and leaves package manifests
  unchanged.
- The oracle records package metadata, tarball file lists, dependencies, peer
  dependencies, absence of an `exports` map, runtime export keys, property
  descriptors, CJS dynamic-import interop, condition resolution, loaded
  dependency evidence, shallow removal, and `create()` warning behavior.
- The oracle records default development, default production, `react-server`
  development, and `react-server` production runtime differences, plus Node
  resolver evidence for default, `react-server`, browser, worker, edge-light,
  workerd, bun, and deno custom conditions.
- Fast React evidence is limited to an explicit unsupported placeholder, and
  every compatibility claim remains `false`.
- Package script and README wiring were not added because they are outside this
  worker's write scope, and the task says not to edit package manifests unless
  the test cannot run otherwise; `npm test` discovers the targeted test file.
- Targeted Node test, regeneration byte-compare, scoped path-leak check, scoped
  trailing-whitespace check, and scoped `git diff --check` all pass.

## Changed Files

- `tests/conformance/src/react-test-renderer-export-targets.mjs`
- `tests/conformance/src/react-test-renderer-export-probe-runner.mjs`
- `tests/conformance/src/react-test-renderer-export-oracle-generator.mjs`
- `tests/conformance/src/react-test-renderer-export-oracle.mjs`
- `tests/conformance/scripts/generate-react-test-renderer-export-oracle.mjs`
- `tests/conformance/scripts/print-react-test-renderer-export-oracle.mjs`
- `tests/conformance/test/react-test-renderer-export-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json`
- `worker-progress/worker-083-react-test-renderer-export-oracle.md`

## Evidence Gathered

- `react-test-renderer@19.2.6` registry metadata:
  - tarball:
    `https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.2.6.tgz`
  - integrity:
    `sha512-GbS6V23YduFTPiWJ5xICbKEjRcqx1Z90js/V5miqhz7qp/d6xSe9Dd6NjSQODFRdzdsqRMPW82E/sFpPRbY5Mw==`
  - dependencies: `react-is@^19.2.6`, `scheduler@^0.27.0`
  - peer dependency: `react@^19.2.6`
  - no `exports` map, so legacy physical CommonJS subpaths remain resolvable.
- Runtime root export keys under default Node are:
  `_Scheduler`, `act`, `create`, `unstable_batchedUpdates`, and `version`.
- Production keeps the root export keys but records `act` as `undefined`.
- `react-server` condition resolves the package root but loading the renderer
  root fails through the React peer with
  `Cannot read properties of undefined (reading 'S')`.
- `create()` emits the React test renderer deprecation warning in development
  unless `global.IS_REACT_NATIVE_TEST_ENVIRONMENT` is true.
- `./shallow` and `./shallow.js` load a function that throws the removed-shallow
  error both when called and constructed.
- The generator normalizes temporary and workspace paths out of probe output.

## Commands Run

Required setup and research:

```sh
create_goal "Add deterministic react-test-renderer 19.2.6 package export and descriptor oracle files."
get_goal
sed -n '1,240p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,240p' worker-progress/worker-017-runtime-inventory-generation.md
sed -n '1,260p' worker-progress/worker-073-test-renderer-update-model-plan.md
git status --short --untracked-files=all
rg --files tests/conformance worker-progress | sort | rg 'react-dom-export|scheduler-.*oracle|react-test-renderer|package|runtime|oracles|test/.*oracle'
sed -n '1,260p' tests/conformance/src/react-dom-export-oracle.mjs
sed -n '1,260p' tests/conformance/scripts/generate-react-dom-export-oracle.mjs
sed -n '1,620p' tests/conformance/test/react-dom-export-oracle.test.mjs
sed -n '1,920p' tests/conformance/src/react-dom-export-oracle-generator.mjs
sed -n '1,320p' tests/conformance/src/react-dom-export-probe-runner.mjs
sed -n '1,260p' tests/conformance/src/react-dom-export-targets.mjs
sed -n '1,260p' tests/conformance/package.json
```

Partial-work inspection:

```sh
sed -n '1,260p' tests/conformance/src/react-test-renderer-export-targets.mjs
sed -n '1,920p' tests/conformance/src/react-test-renderer-export-oracle-generator.mjs
sed -n '1,760p' tests/conformance/src/react-test-renderer-export-probe-runner.mjs
sed -n '1,260p' tests/conformance/src/react-test-renderer-export-oracle.mjs
sed -n '1,760p' tests/conformance/test/react-test-renderer-export-oracle.test.mjs
sed -n '1,220p' tests/conformance/scripts/generate-react-test-renderer-export-oracle.mjs
sed -n '1,220p' tests/conformance/scripts/print-react-test-renderer-export-oracle.mjs
wc -c tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json
sed -n '1,120p' tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json
```

Verification already run:

```sh
node --test tests/conformance/test/react-test-renderer-export-oracle.test.mjs
tmp=$(mktemp) && node tests/conformance/scripts/generate-react-test-renderer-export-oracle.mjs > "$tmp" && cmp -s tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json "$tmp"; cmp_status=$?; rm -f "$tmp"; exit $cmp_status
rg -n '<local-path-leak-patterns>' tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json tests/conformance/src/react-test-renderer-export-*.mjs tests/conformance/scripts/*react-test-renderer-export*.mjs tests/conformance/test/react-test-renderer-export-oracle.test.mjs worker-progress/worker-083-react-test-renderer-export-oracle.md
rg -n '[ \t]+$' tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json tests/conformance/src/react-test-renderer-export-*.mjs tests/conformance/scripts/*react-test-renderer-export*.mjs tests/conformance/test/react-test-renderer-export-oracle.test.mjs worker-progress/worker-083-react-test-renderer-export-oracle.md
git diff --check -- tests/conformance/src/react-test-renderer-export-targets.mjs tests/conformance/src/react-test-renderer-export-probe-runner.mjs tests/conformance/src/react-test-renderer-export-oracle-generator.mjs tests/conformance/src/react-test-renderer-export-oracle.mjs tests/conformance/scripts/generate-react-test-renderer-export-oracle.mjs tests/conformance/scripts/print-react-test-renderer-export-oracle.mjs tests/conformance/test/react-test-renderer-export-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-test-renderer-export-oracle.json worker-progress/worker-083-react-test-renderer-export-oracle.md
```

One regeneration compare command was rerun after the shell rejected the variable
name `status` as read-only; the rerun used `cmp_status` and passed.

## Verification Results

- `node --test tests/conformance/test/react-test-renderer-export-oracle.test.mjs`:
  passed, 11 tests.
- Regeneration byte-compare against the checked oracle artifact: passed.
- Scoped path leak check over the oracle artifact, source/test/script files, and
  progress report: passed, no matches.
- Scoped trailing whitespace check over the oracle artifact, source/test/script
  files, and progress report: passed, no matches.
- `git diff --check` over the scoped worker files: passed. Because the files are
  newly untracked, this used temporary intent-to-add index entries and reset
  those entries immediately after the check without changing file content.

## Delegated Checks

- Nested read-only explorer `019e0ee9-b46b-7393-82b0-58c53be4af50` was spawned
  to independently probe the `react-test-renderer@19.2.6` package surface and
  validate assumptions about export keys, descriptors, condition behavior,
  warning behavior, shallow removal, and path-leak risks. It confirmed the
  package metadata, default export keys, production `act: undefined`, CommonJS
  dynamic-import interop keys, `react-server` runtime load failure through the
  React peer, shallow removal behavior, and `create()` warning surface. It also
  noted package scripts and README discoverability gaps, but those are outside
  this worker's write scope, and the task explicitly says not to edit package
  manifests unless the test cannot run otherwise.

## Risks Or Blockers

- The checked JSON artifact is large because descriptors include nested
  `_Scheduler`, renderer wrapper, and module namespace evidence. This is
  intentional oracle evidence, but future review may prefer splitting export,
  warning, and shallow evidence into separate artifacts.
- Custom-condition evidence is Node resolver/runtime evidence only; it is not a
  browser, Bun, Deno, worker, or edge runtime execution claim.
- The oracle intentionally does not cover root lifecycle, `toJSON`, `toTree`,
  `TestInstance`, `act` scheduling, or update/unmount behavior beyond export and
  warning surfaces. Those behaviors are assigned to later workers.
- Fast React has no JS `react-test-renderer` facade in this write scope, so the
  artifact records only an unsupported placeholder and keeps compatibility
  claims false.

## Recommended Next Tasks

- Use this export oracle as the gate for any future JS
  `@fast-react/react-test-renderer` package facade.
- Keep lifecycle, serialization, `act`, and error-surface oracle workers
  separate so this export package surface remains narrow and deterministic.
