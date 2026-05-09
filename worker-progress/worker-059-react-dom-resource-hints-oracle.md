# worker-059-react-dom-resource-hints-oracle

## Summary

Added a deterministic React DOM 19.2.6 resource hint oracle for the root `react-dom` APIs `prefetchDNS`, `preconnect`, `preload`, `preloadModule`, `preinit`, and `preinitModule`.

The generator reads the checked worker-017 runtime inventory, downloads the exact `react-dom@19.2.6`, `react@19.2.6`, and `scheduler@0.27.0` tarballs named by that inventory, verifies integrity and tarball file lists, extracts them into an isolated temporary `node_modules`, and probes React DOM through one Node child process per scenario and mode.

The checked oracle records public export descriptors, function lengths, valid public call return values, warning-free default no-op dispatcher behavior, invalid argument diagnostics, production warning absence, private dispatcher argument normalization, and corrupted-private-dispatcher failure shapes. Private dispatcher observations are explicitly marked as implementation evidence only, not public compatibility claims.

No Fast React React DOM comparison was added. This is intentional: this worker owns a pinned React DOM oracle only, and Fast React React DOM behavior remains unclaimed until implementation workers add a dual-run comparison.

## Changed Files

- `tests/conformance/src/react-dom-resource-hints-targets.mjs`
  - Defines the React DOM resource hint target, supporting runtime packages, public API list, private dispatcher method list, probe modes, source documents, and oracle artifact paths.
- `tests/conformance/src/react-dom-resource-hints-scenarios.mjs`
  - Defines public and private-internals scenarios for export shape, default dispatcher calls, argument validation, dispatcher normalization, and dispatcher absence.
- `tests/conformance/src/react-dom-resource-hints-probe-runner.mjs`
  - Isolated child-process probe runner that loads pinned React DOM, captures console diagnostics, describes return and error values, and temporarily swaps the private dispatcher for internal-only normalization evidence.
- `tests/conformance/src/react-dom-resource-hints-oracle-generator.mjs`
  - Generates the oracle from the checked runtime inventory and exact npm tarballs, verifies integrity and file lists, normalizes paths, and separates public observations from private internal evidence.
- `tests/conformance/src/react-dom-resource-hints-oracle.mjs`
  - Adds checked-artifact read/stringify helpers, markdown formatting, and observation lookup helpers.
- `tests/conformance/scripts/generate-react-dom-resource-hints-oracle.mjs`
  - Direct generator CLI with optional `--write`.
- `tests/conformance/scripts/print-react-dom-resource-hints-oracle.mjs`
  - Direct print CLI for JSON and markdown output.
- `tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
  - Adds schema, target, scenario coverage, export descriptor, return value, development/production warning, private normalization, private dispatcher absence, path leak, and print-CLI tests.
- `tests/conformance/oracles/react-19.2.6-react-dom-resource-hints-oracle.json`
  - Checked deterministic oracle artifact.
- `worker-progress/worker-059-react-dom-resource-hints-oracle.md`
  - This report.

## Oracle Coverage

- APIs:
  - `prefetchDNS`
  - `preconnect`
  - `preload`
  - `preloadModule`
  - `preinit`
  - `preinitModule`
- Probe modes:
  - default Node development
  - default Node production
  - `--conditions=react-server` development
  - `--conditions=react-server` production
- Public behavior:
  - Root export descriptors and function lengths.
  - Valid call return values through the default no-op dispatcher.
  - Development warning messages for invalid and edge arguments.
  - Production warning absence for the same invalid and edge arguments.
- Private implementation evidence:
  - Dispatcher methods `D`, `C`, `L`, `m`, `S`, `X`, and `M`.
  - Normalized arguments passed to the dispatcher for selected resource hint calls.
  - Throw shapes when private dispatcher methods are missing or the dispatcher is set to `null`.

## Intentional Gaps

- No Fast React comparison is included; compatibility claims remain false.
- Private dispatcher method names and normalized arguments are recorded only to guide implementation. They are not a public API promise.
- The oracle does not create DOM nodes, render roots, run Fizz/static rendering, assert inserted `<link>` tags, or assert response headers.
- Network-free regeneration is not implemented. The generator verifies exact registry tarballs from the checked inventory, so offline environments would need a future cache layer.

## Commands Run

- `git status --short`
- `sed -n '1,240p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `find tests/conformance -maxdepth 3 -type f | sort | sed -n '/react-dom-resource-hints/p'`
- `sed -n '1,260p' tests/conformance/package.json`
- `sed -n '1,260p' tests/conformance/src/react-dom-resource-hints-scenarios.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-resource-hints-targets.mjs`
- `sed -n '1,560p' tests/conformance/src/react-dom-resource-hints-probe-runner.mjs`
- `sed -n '1,760p' tests/conformance/src/react-dom-resource-hints-oracle-generator.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-resource-hints-oracle.mjs`
- `sed -n '1,920p' tests/conformance/test/react-dom-resource-hints-oracle.test.mjs`
- `sed -n '1,220p' tests/conformance/scripts/generate-react-dom-resource-hints-oracle.mjs`
- `sed -n '1,260p' tests/conformance/scripts/print-react-dom-resource-hints-oracle.mjs`
- `sed -n '1,180p' tests/conformance/src/react-dom-export-oracle-generator.mjs`
- `sed -n '1,180p' tests/conformance/test/react-dom-export-oracle.test.mjs`
- `sed -n '1,220p' worker-progress/worker-036-react-dom-export-oracle.md`
- `node --test test/react-dom-resource-hints-oracle.test.mjs`
- `node scripts/generate-react-dom-resource-hints-oracle.mjs --write`
- `npm test --workspace @fast-react/conformance`
- `tmp=$(mktemp); node scripts/generate-react-dom-resource-hints-oracle.mjs > "$tmp"; cmp -s oracles/react-19.2.6-react-dom-resource-hints-oracle.json "$tmp"; rc=$?; rm -f "$tmp"; exit $rc`

## Verification

- Targeted test passed:
  - `node --test test/react-dom-resource-hints-oracle.test.mjs`
  - 10 tests passed.
- Targeted generator passed:
  - `node scripts/generate-react-dom-resource-hints-oracle.mjs --write`
- Regeneration determinism passed:
  - Fresh stdout generation byte-compared equal to `oracles/react-19.2.6-react-dom-resource-hints-oracle.json`.
- Workspace conformance test passed:
  - `npm test --workspace @fast-react/conformance`
  - 131 tests passed.

## Nested Agent Evidence

- Spawned two read-only explorer agents as requested by the worker instructions:
  - One reviewed the partial resource hint files against nearby conformance oracle patterns.
  - One independently checked the React DOM 19.2.6 resource hint behavior evidence and coverage.
- No code changes were delegated to nested agents. Any concrete findings are reflected in the final handoff.

## Quality, Maintainability, Performance, And Security Review

- Quality: The artifact records public behavior separately from private dispatcher implementation evidence and keeps all Fast React compatibility claims false.
- Maintainability: Target constants, scenarios, probe runner, generator, checked-artifact helpers, scripts, and tests are split using the same pattern as existing conformance oracles.
- Performance: Checked tests read the generated JSON and do not download tarballs. Generation uses a small fixed set of child processes and a 10 second timeout per probe.
- Security: The generator does not execute lifecycle scripts or mutate root manifests/lockfiles. React package code runs only from integrity-verified tarballs in an isolated temporary project.

## Risks And Follow-Ups

- Add Fast React dual-run comparison only after the React DOM resource hint implementation exists.
- Add DOM/Fizz/static rendering resource emission oracles separately; this oracle intentionally covers root API calls and dispatcher evidence only.
- Add a tarball cache strategy if regeneration must work in offline CI.
