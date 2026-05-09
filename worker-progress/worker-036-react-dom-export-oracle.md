# worker-036-react-dom-export-oracle

## Summary

Added a deterministic React DOM 19.2.6 runtime export oracle. The generator reads the checked worker-017 runtime inventory, downloads the exact `react`, `react-dom`, and `scheduler` tarballs named by that inventory, verifies integrity and tarball file lists, extracts them into an isolated temporary `node_modules`, and probes React DOM through one Node child process per subpath, mode, and condition.

The checked oracle records runtime export keys, property descriptors, CommonJS and dynamic-import interop, condition resolution, and blocked physical `.js`/CJS subpaths. It covers root, client, server variants, static variants, profiling, test-utils, `react-server` throwing branches, and the Bun `server.bun` `resume` property caveat where the export exists but has an undefined value.

No Fast React React DOM comparison was added. That is intentional because the React DOM package scaffold is owned by worker 035 and this oracle must remain self-contained and runnable with direct `node` commands regardless of whether that scaffold has merged.

No nested agent evidence was used in this resumed completion because the continuation instruction explicitly required finishing directly without nested agents.

## Changed Files

- `tests/conformance/src/react-dom-export-targets.mjs`
  - Defines the React DOM 19.2.6 target, supporting `react` and `scheduler` packages, runtime/public subpaths, runtime probe modes, condition modes, blocked-subpath modes, and source documents.
- `tests/conformance/src/react-dom-export-probe-runner.mjs`
  - Isolated child-process probe runner for runtime loading and resolution.
  - Captures export keys, own keys, descriptors, nested descriptor summaries, thrown errors, and CJS/ESM interop.
- `tests/conformance/src/react-dom-export-oracle-generator.mjs`
  - Generates the oracle from the checked runtime inventory and exact npm tarballs.
  - Verifies tarball integrity and file lists against worker-017 inventory data.
  - Normalizes temporary paths and validates generated runtime/condition summaries against the checked inventory.
- `tests/conformance/src/react-dom-export-oracle.mjs`
  - Adds stringify/read helpers, markdown formatting, and lookup helpers for observations, condition resolution rows, and blocked-subpath probes.
- `tests/conformance/scripts/generate-react-dom-export-oracle.mjs`
  - Direct `node` generator CLI with optional `--write`.
- `tests/conformance/scripts/print-react-dom-export-oracle.mjs`
  - Direct `node` print CLI for JSON and markdown output.
- `tests/conformance/test/react-dom-export-oracle.test.mjs`
  - Adds schema, target, coverage, export-key, descriptor, `react-server`, condition-resolution, blocked-subpath, path-leak, and print-CLI tests.
- `tests/conformance/oracles/react-19.2.6-react-dom-export-oracle.json`
  - Checked deterministic oracle artifact.
- `worker-progress/worker-036-react-dom-export-oracle.md`
  - This report.

## Oracle Coverage

- Runtime subpaths:
  - `.`
  - `./client`
  - `./server`
  - `./server.browser`
  - `./server.bun`
  - `./server.edge`
  - `./server.node`
  - `./static`
  - `./static.browser`
  - `./static.edge`
  - `./static.node`
  - `./profiling`
  - `./test-utils`
- Runtime modes:
  - default Node development
  - default Node production
  - `--conditions=react-server` development
  - `--conditions=react-server` production
- Condition resolution modes:
  - default Node
  - `react-server`
  - `browser`
  - `worker`
  - `edge-light`
  - `workerd`
  - `bun`
  - `deno`
- Blocked subpaths:
  - 40 physical `.js`/CJS React DOM files are probed under default Node and `react-server`.
  - All blocked probes throw `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## Intentional Gaps

- No Fast React React DOM package comparison is included. This prevents a dependency on worker 035 and keeps this oracle useful before the package scaffold lands.
- Custom `browser`, `worker`, `edge-light`, `workerd`, `bun`, and `deno` condition results are Node resolver evidence only. They are not execution in those runtimes.
- Rendering semantics are out of scope. The oracle does not claim behavior for DOM mutation, portals, client roots, resource dispatch, event setup, hydration, Fizz streaming, static prerendering, or resume behavior beyond export surface and descriptors.
- Type declaration coverage is out of scope and owned by worker 037.

## Commands Run

- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `git status --short`
- `rg --files tests/conformance | sort`
- `rg --files worker-progress | sort`
- `sed -n '1,260p' worker-progress/worker-033-react-dom-inventory.md`
- `sed -n '1,260p' tests/conformance/src/react-dom-export-targets.mjs`
- `sed -n '1,320p' tests/conformance/src/react-dom-export-probe-runner.mjs`
- `sed -n '1,320p' tests/conformance/src/react-dom-export-oracle-generator.mjs`
- `sed -n '321,760p' tests/conformance/src/react-dom-export-oracle-generator.mjs`
- `sed -n '761,1120p' tests/conformance/src/react-dom-export-oracle-generator.mjs`
- `sed -n '1,320p' tests/conformance/src/react-dom-export-oracle.mjs`
- `sed -n '1,220p' tests/conformance/package.json`
- `sed -n '1,260p' tests/conformance/test/runtime-inventory.test.mjs`
- `sed -n '261,520p' tests/conformance/test/runtime-inventory.test.mjs`
- `sed -n '1,220p' tests/conformance/scripts/generate-react-dom-export-oracle.mjs`
- `sed -n '1,260p' tests/conformance/inventory/react-19.2.6-runtime-package-inventory.json`
- `node scripts/generate-react-dom-export-oracle.mjs --write`
- `node --test test/react-dom-export-oracle.test.mjs`
- `tmp=$(mktemp); node scripts/generate-react-dom-export-oracle.mjs > "$tmp" && cmp -s oracles/react-19.2.6-react-dom-export-oracle.json "$tmp"; status=$?; rm -f "$tmp"; exit $status`
  - Failed because `status` is a read-only variable in the current shell.
- `tmp=$(mktemp); node scripts/generate-react-dom-export-oracle.mjs > "$tmp" && cmp -s oracles/react-19.2.6-react-dom-export-oracle.json "$tmp"; rc=$?; rm -f "$tmp"; exit $rc`
- `npm test --workspace @fast-react/conformance`
- `node scripts/print-react-dom-export-oracle.mjs --format=markdown > <temporary markdown file>`
- `rm -f <temporary markdown file>`
- local path-leak scan for concrete temp/workspace paths in the oracle and worker report
- `perl -ne 'print "$ARGV:$.:$_" if /[ \t]$/; close ARGV if eof' <scoped files>`
- `git add --intent-to-add <scoped files> && git diff --check -- <scoped files>; rc=$?; git reset -- <scoped files> >/dev/null; exit $rc`

## Verification

- `node scripts/generate-react-dom-export-oracle.mjs --write` passed and wrote the checked oracle.
- `node --test test/react-dom-export-oracle.test.mjs` passed.
  - 10 tests passed.
- Regeneration determinism passed:
  - Fresh stdout generation byte-compared equal to `oracles/react-19.2.6-react-dom-export-oracle.json`.
- `npm test --workspace @fast-react/conformance` passed.
  - 91 tests passed.
- `node scripts/print-react-dom-export-oracle.mjs --format=markdown` passed.
- Oracle/report path-leak scans passed with no matches for concrete local temp/workspace paths.
- Scoped trailing-whitespace and `git diff --check` checks passed.

## Risks And Follow-Ups

- The generator downloads exact tarballs from registry URLs recorded in the checked inventory. It verifies integrity and file lists, but offline environments will need cached tarball support if regeneration must work without network access.
- The descriptor artifact is intentionally large because it records nested runtime descriptor shapes. This is acceptable for conformance evidence, but future oracles should keep scenario-specific behavior artifacts smaller when possible.
- Fast React comparison should be added only after worker 035 lands a React DOM package surface; until then, keeping compatibility claims false avoids coupling this oracle to a scaffold race.

## Quality, Maintainability, Performance, And Security Review

- Quality: The generator cross-checks runtime and condition summaries against the existing worker-017 inventory before emitting richer descriptor evidence, so it does not silently drift from the pinned inventory baseline.
- Maintainability: Target lists, modes, artifact paths, generator logic, probe execution, and checked-artifact helpers are split along existing conformance patterns.
- Performance: Generation runs roughly one small Node process per probe and completes locally in under 20 seconds in the checked run. Tests do not regenerate or download tarballs.
- Security: The generator does not run lifecycle scripts or mutate root manifests/lockfiles. Package code is executed only from integrity-verified tarballs in an isolated temporary project.
