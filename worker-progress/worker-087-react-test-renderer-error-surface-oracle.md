# worker-087-react-test-renderer-error-surface-oracle

## Objective

Add deterministic react-test-renderer public error surface oracle files.

Goal tool status:

- `create_goal` was called before research or file reads with objective
  `Add deterministic react-test-renderer public error surface oracle files.`
- `get_goal` returned status `active` with the same objective.

Write scope honored:

- `tests/conformance/src/react-test-renderer-error-surface-*.mjs`
- `tests/conformance/scripts/*react-test-renderer-error-surface*.mjs`
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json`
- `worker-progress/worker-087-react-test-renderer-error-surface-oracle.md`

`ORCHESTRATOR.md` was not read. No shared package manifests were edited.

## Summary

Added a checked React 19.2.6 / react-test-renderer 19.2.6 public error
surface oracle generated from exact npm tarballs. The oracle covers:

- invalid `find` and `findBy*` zero/multiple result errors;
- `.root` after unmount plus retained `TestInstance` access after unmount;
- deterministic invalid `create()` and `update()` inputs;
- removed `react-test-renderer/shallow` call and constructor errors;
- unsupported `React.use({})` renderer/runtime message;
- development deprecation console calls from flushed `act()` probes.

Fast React compatibility claims remain explicitly false because this worker only
records pinned React behavior and does not compare a Fast React
react-test-renderer facade.

## Files changed

- `tests/conformance/src/react-test-renderer-error-surface-targets.mjs`
- `tests/conformance/src/react-test-renderer-error-surface-scenarios.mjs`
- `tests/conformance/src/react-test-renderer-error-surface-probe-runner.mjs`
- `tests/conformance/src/react-test-renderer-error-surface-oracle-generator.mjs`
- `tests/conformance/src/react-test-renderer-error-surface-oracle.mjs`
- `tests/conformance/scripts/generate-react-test-renderer-error-surface-oracle.mjs`
- `tests/conformance/scripts/print-react-test-renderer-error-surface-oracle.mjs`
- `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json`
- `worker-progress/worker-087-react-test-renderer-error-surface-oracle.md`

## Implementation notes

- The generator downloads exact tarballs for:
  - `react-test-renderer@19.2.6`
  - `react@19.2.6`
  - `scheduler@0.27.0`
  - `react-is@19.2.6`
- It verifies pinned `dist.integrity` and `dist.shasum`, extracts into an
  isolated temporary `node_modules` tree, and never runs lifecycle scripts.
- It validates the `react-test-renderer` dependency and peer-dependency graph
  before probing behavior.
- It runs one Node child process per scenario/mode.
- The single probe mode is `default-node-development` because React 19.2.6
  production `react-test-renderer` omits public `act()`. Development with
  `IS_REACT_ACT_ENVIRONMENT = true` and `act()` wrapping is the deterministic
  public error-surface path.
- Message normalization only removes path fragments. Predicate error messages
  keep fixed function source text as semantic evidence.
- The checked artifact records no timestamps, local concrete temp paths, file
  URLs, or workspace paths.

## Evidence gathered

Direct local probes and nested subagents confirmed the root cause: the public
error surface is deterministic only when work is flushed through
`react-test-renderer` development `act()`. No-`act` probes often expose pending
concurrent work instead of the intended public errors, and production lacks the
public `act` export.

Nested subagents:

- `019e0ee9-a38b-7212-b96d-77f9d9343927` independently probed React
  19.2.6 / react-test-renderer 19.2.6. It recommended the final scenario set,
  confirmed exact messages, and warned against production/no-`act` and
  circular `findByProps({})` cases.
- `019e0ee9-b204-75d3-8e17-0e543c4db267` audited local conformance patterns.
  It confirmed the five-file source pattern, print/generate script pattern,
  checked JSON artifact convention, false Fast React claims, byte-compare
  regeneration check, and local path leak guards.

Representative checked messages:

- `No instances found with node type: "aside"`
- `Expected 1 but found 2 instances with node type: "section"`
- `No instances found with props: {"id":"missing"}`
- `Expected 1 but found 2 instances with props: {"role":"dup"}`
- `Can't access .root on unmounted test renderer`
- `Unable to find node on an unmounted component.`
- `Objects are not valid as a React child (found: object with keys {foo}). If you meant to render a collection of children, use an array instead.`
- `react-test-renderer/shallow has been removed. See https://react.dev/warnings/react-test-renderer.`
- `An unsupported type was passed to use(): [object Object]`

## Commands run

Required initial reads:

```sh
sed -n '1,220p' WORKER_BRIEF.md
sed -n '1,260p' MASTER_PLAN.md
sed -n '1,260p' MASTER_PROGRESS.md
sed -n '1,260p' worker-progress/worker-017-runtime-inventory-generation.md
sed -n '1,260p' worker-progress/worker-022-host-operation-errors.md
sed -n '1,280p' worker-progress/worker-073-test-renderer-update-model-plan.md
if [ -f worker-progress/worker-083-react-test-renderer-export-oracle.md ]; then sed -n '1,280p' worker-progress/worker-083-react-test-renderer-export-oracle.md; else printf 'MISSING\n'; fi
```

Inspection and design:

```sh
git status --short --untracked-files=all
rg --files tests/conformance worker-progress | sort
sed -n '1,260p' tests/conformance/package.json
find tests/conformance -maxdepth 3 -type f \( -name '*react-test-renderer*' -o -name '*oracle*.mjs' -o -name '*generator*.mjs' \) | sort
sed -n '1,260p' tests/conformance/src/react-dom-portal-oracle-generator.mjs
sed -n '1,260p' tests/conformance/src/react-dom-portal-probe-runner.mjs
sed -n '1,220p' tests/conformance/src/react-dom-portal-scenarios.mjs
sed -n '1,240p' tests/conformance/src/react-dom-portal-targets.mjs
sed -n '1,260p' tests/conformance/src/react-dom-portal-oracle.mjs
sed -n '1,280p' tests/conformance/test/react-dom-portal-oracle.test.mjs
npm view react-test-renderer@19.2.6 version dist.tarball dist.integrity dependencies peerDependencies --json
npm view react-test-renderer@19.2.6 dist.shasum license homepage repository --json
npm view react-is@19.2.6 version dist.tarball dist.integrity dist.shasum dependencies peerDependencies --json
npm view react@19.2.6 version dist.tarball dist.integrity dist.shasum dependencies peerDependencies --json
npm view scheduler@0.27.0 version dist.tarball dist.integrity dist.shasum dependencies peerDependencies --json
node --version
sed -n '1,220p' package.json
```

Throwaway upstream probes were run from exact package tarballs to confirm
messages before implementation. Concrete temporary paths are omitted here; they
were not written to artifacts.

Generation and verification:

```sh
node tests/conformance/scripts/generate-react-test-renderer-error-surface-oracle.mjs --write
node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs
tmp=$(mktemp) && node tests/conformance/scripts/generate-react-test-renderer-error-surface-oracle.mjs > "$tmp" && cmp -s "$tmp" tests/conformance/oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json; rc=$?; rm -f "$tmp"; exit $rc
scoped local/temp path leak scan over the oracle artifact and source files; pattern omitted from this report
rg -n '[ \t]$' tests/conformance/src/react-test-renderer-error-surface-*.mjs tests/conformance/scripts/*react-test-renderer-error-surface*.mjs tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json || true
git diff --check -- tests/conformance/src/react-test-renderer-error-surface-targets.mjs tests/conformance/src/react-test-renderer-error-surface-scenarios.mjs tests/conformance/src/react-test-renderer-error-surface-oracle.mjs tests/conformance/src/react-test-renderer-error-surface-probe-runner.mjs tests/conformance/src/react-test-renderer-error-surface-oracle-generator.mjs tests/conformance/scripts/generate-react-test-renderer-error-surface-oracle.mjs tests/conformance/scripts/print-react-test-renderer-error-surface-oracle.mjs tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json
for f in tests/conformance/oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json tests/conformance/scripts/generate-react-test-renderer-error-surface-oracle.mjs tests/conformance/scripts/print-react-test-renderer-error-surface-oracle.mjs tests/conformance/src/react-test-renderer-error-surface-oracle-generator.mjs tests/conformance/src/react-test-renderer-error-surface-oracle.mjs tests/conformance/src/react-test-renderer-error-surface-probe-runner.mjs tests/conformance/src/react-test-renderer-error-surface-scenarios.mjs tests/conformance/src/react-test-renderer-error-surface-targets.mjs tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs worker-progress/worker-087-react-test-renderer-error-surface-oracle.md; do out=$(git diff --check --no-index /dev/null "$f" 2>&1); rc=$?; if [ $rc -ne 0 ] && [ $rc -ne 1 ]; then printf '%s\n' "$out"; exit $rc; fi; if [ -n "$out" ]; then printf '%s\n' "$out"; exit 1; fi; done
npm test --workspace @fast-react/conformance -- --test-name-pattern='React test renderer error surface'
for f in tests/conformance/src/react-test-renderer-error-surface-targets.mjs tests/conformance/src/react-test-renderer-error-surface-scenarios.mjs tests/conformance/src/react-test-renderer-error-surface-probe-runner.mjs tests/conformance/src/react-test-renderer-error-surface-oracle-generator.mjs tests/conformance/src/react-test-renderer-error-surface-oracle.mjs tests/conformance/scripts/generate-react-test-renderer-error-surface-oracle.mjs tests/conformance/scripts/print-react-test-renderer-error-surface-oracle.mjs tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json worker-progress/worker-087-react-test-renderer-error-surface-oracle.md; do test -f "$f" && printf 'present %s\n' "$f"; done
node - <<'NODE'
const oracle = require('./tests/conformance/oracles/react-19.2.6-react-test-renderer-error-surface-oracle.json');
const obs = oracle.reactTestRendererErrorSurfaceObservations['default-node-development'];
const byId = Object.fromEntries(obs.map((entry) => [entry.scenarioId, entry.result.result.value]));
console.log(JSON.stringify({
  kind: oracle.oracleKind,
  deterministic: oracle.deterministic,
  fastReactClaimsFalse: oracle.conformanceClaims.fastReactComparedToReactTestRenderer === false && oracle.conformanceClaims.compatibilityClaimed === false,
  invalidFindAndFindBy: oracle.coverage.invalidFindAndFindByResults && byId['test-instance-query-errors'].noMatchByType.status === 'throws' && byId['test-instance-query-errors'].multiMatchByProps.status === 'throws',
  unmountedRootAccess: oracle.coverage.unmountedRootAccess && byId['unmounted-root-access-errors'].rendererRoot.message,
  invalidCreateUpdate: oracle.coverage.invalidCreateInputs && oracle.coverage.invalidUpdateInputs && byId['invalid-create-update-inputs'].createPlainObjectChild.status === 'throws' && byId['invalid-create-update-inputs'].updateInvalidUndefinedType.status === 'throws',
  shallowRemoval: oracle.coverage.shallowRemoval && byId['shallow-removal-error'].construct.status === 'throws',
  unsupportedMessage: oracle.coverage.unsupportedMessages && byId['unsupported-use-error'].createUnsupportedUse.message,
  modes: oracle.probeModes.map((mode) => mode.id),
  scenarios: oracle.scenarios.map((scenario) => scenario.id)
}, null, 2));
NODE
```

## Verification results

- `node tests/conformance/scripts/generate-react-test-renderer-error-surface-oracle.mjs --write`: passed and produced the checked oracle.
- `node --test tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`: passed, 11 tests.
- Regeneration byte-compare: passed; generated stdout matched the checked JSON artifact exactly.
- Scoped local path leak check: passed; no matches.
- Scoped trailing whitespace check: passed; no matches.
- Scoped `git diff --check`: passed. Because all files are newly added, the
  no-index loop also checked each untracked scoped file for whitespace errors.
- `npm test --workspace @fast-react/conformance -- --test-name-pattern='React test renderer error surface'`: passed. Node ran the conformance test glob and reported 252 passing tests, including the 11 new React test renderer error-surface tests.
- Completion audit file-presence and oracle-content checks: passed. All scoped
  deliverables exist and the checked artifact reports deterministic coverage for
  invalid find/findBy, unmounted root access, invalid create/update, shallow
  removal, and unsupported messages with Fast React claims false.

npm printed an existing local config warning for `minimum-release-age`; it did
not affect command success.

## Risks or blockers

- The oracle intentionally covers development `act()`-flushed public errors
  only. Production lacks public `act()` in React 19.2.6, so production was left
  as an explicit gap instead of mixing scheduler timing into this error-surface
  oracle.
- The oracle does not compare Fast React behavior because no public Fast React
  react-test-renderer facade is in scope.
- The unsupported `React.use({})` case records the public renderer/runtime
  error message but does not imply `use` scheduling or Suspense behavior is
  implemented.

## Recommended next tasks

1. Add the public react-test-renderer export oracle if worker 083 is not
   completed elsewhere, because this worker deliberately focused on errors.
2. When a Fast React react-test-renderer JS facade exists, add a dual-run
   comparison pass with known mismatches rather than changing this pinned React
   evidence artifact.
3. Use this oracle to drive future public error mapping from structured
   `HostError` and `ReconcilerError` into React-compatible JS messages.

## Review

- Quality: scenarios are based on exact React 19.2.6 tarball probes and cover
  the requested public error surfaces without broadening into scheduler or
  implementation behavior.
- Maintainability: files follow the existing conformance oracle pattern with
  separate targets, scenarios, probe runner, generator, artifact reader, print
  script, and tests.
- Performance: normal tests read the checked artifact. Network and package
  execution happen only during explicit regeneration.
- Security: generation executes exact pinned React package code in isolated
  child processes under a temporary package tree and does not run package
  lifecycle scripts or mutate workspace manifests/lockfiles.
