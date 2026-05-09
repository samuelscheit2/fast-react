# worker-046-react-dom-client-root-oracle

## Goal Tool Record

- create_goal called before research, file reads, implementation, and verification.
- get_goal immediately after setup reported status: active.
- Objective: Add deterministic React DOM 19.2.6 client-root public behavior oracle files for `createRoot`, root object `render`/`unmount`, options, warnings/errors, container validation, and current Fast React placeholder comparison boundaries.

## Summary

Added a deterministic React DOM 19.2.6 client-root public behavior oracle. The generator reads the checked worker-017 runtime inventory, downloads the exact `react`, `react-dom`, and `scheduler` tarballs recorded there, verifies integrity and tarball file lists, asserts the target versions, extracts them into an isolated temporary `node_modules`, copies the local Fast React React DOM placeholder package, and probes both targets through one Node child process per mode and scenario.

The checked oracle covers `react-dom/client.createRoot`, root object `render` and `unmount` public behavior, option storage, development warnings, valid and invalid container validation, `react-server` throwing branches, the `react-dom/profiling` createRoot boundary, and current Fast React placeholder comparison boundaries. Compatibility claims remain false because Fast React React DOM still intentionally exposes loud placeholder behavior.

## Changed Files

- `tests/conformance/src/react-dom-client-root-targets.mjs`
  - Defines the React DOM, supporting runtime package, Fast React placeholder, probe mode, artifact path, and source-document metadata.
- `tests/conformance/src/react-dom-client-root-scenarios.mjs`
  - Defines 11 client-root scenarios across entrypoint shape, container validation, warnings, options, root object shape, render/unmount lifecycle, and profiling boundary behavior.
- `tests/conformance/src/react-dom-client-root-probe-runner.mjs`
  - Runs deterministic client-root probes under a controlled DOM shim and normalizes React marker/listener summaries instead of recording random marker suffixes.
  - Records ordinary one-argument `root.render(children)` success separately from second-argument warning cases.
- `tests/conformance/src/react-dom-client-root-oracle-generator.mjs`
  - Generates the oracle from exact npm tarballs plus the local Fast React placeholder package, normalizes paths, validates target versions, and records React DOM and Fast React observations plus comparison statuses.
- `tests/conformance/src/react-dom-client-root-oracle.mjs`
  - Adds checked-artifact read/stringify helpers, markdown formatting, and observation lookup helpers.
- `tests/conformance/scripts/generate-react-dom-client-root-oracle.mjs`
  - Adds a direct `node` generator CLI with optional `--write`.
- `tests/conformance/scripts/print-react-dom-client-root-oracle.mjs`
  - Adds a direct `node` print CLI for JSON and markdown output.
- `tests/conformance/test/react-dom-client-root-oracle.test.mjs`
  - Checks schema, targets, scenario coverage, root behavior, warnings, option storage, container markers/listeners, Fast React placeholder comparisons, path leaks, and print CLI behavior.
- `tests/conformance/oracles/react-19.2.6-react-dom-client-root-oracle.json`
  - Checked deterministic oracle artifact.
- `worker-progress/worker-046-react-dom-client-root-oracle.md`
  - This report.

## Oracle Coverage

- Probe modes:
  - default Node development
  - default Node production
  - `--conditions=react-server` development
  - `--conditions=react-server` production
- Public entrypoint boundaries:
  - `react-dom/client` export shape and `react-server` unsupported error
  - `react-dom/profiling` createRoot boundary and `react-server` unsupported error
- `createRoot` behavior:
  - accepts element, document, and document-fragment containers
  - rejects `null`, `undefined`, text, comment, and plain-object containers
  - records duplicate-root and legacy-root development warnings as non-fatal
  - records deprecated `hydrate` and JSX-as-options development warnings
  - records `identifierPrefix`, `unstable_strictMode`, and root error callback storage
  - records stable omission of transition tracing/default indicator option fields
  - records normalized root/listening marker presence and listener counts
- Root object behavior:
  - `_internalRoot` own slot shape
  - prototype `render` and `unmount` descriptors
  - one-argument `render(children)` success, undefined return, and no warning
  - `render` second-argument warnings and return value
  - `unmount` callback warning, first unmount behavior, second unmount no-op, root slot nulling, and container marker clearing
  - `render` after unmount error
- Fast React comparison:
  - 44 Fast React observations across the same modes and scenarios
  - 42 `unsupported-placeholder` comparisons and 2 `known-mismatch` comparisons
  - 0 compatibility claims

## Intentional Gaps

- No real browser execution. The probe uses a controlled DOM shim so generation stays self-contained and deterministic in the existing conformance workspace.
- No hydration root semantics. `hydrateRoot`, hydration scheduling, and hydration mismatch behavior are separate oracle/plan work.
- No rendered DOM output assertions. The scenarios exercise public root API boundaries, marker/listener installation, scheduling-facing object state, warnings, and unmount behavior, not DOM mutation fidelity.
- No event dispatch semantics. Listener installation counts are recorded, while delegated dispatch and event priority remain separate work.
- No transition tracing/default indicator behavior. Stable React DOM 19.2.6 does not store user `unstable_transitionCallbacks` or `onDefaultTransitionIndicator` fields for `createRoot`.
- No Fast React React DOM implementation. Current Fast React results are explicit placeholder boundaries only.

## Completion Audit

- First action used goal tooling:
  - Evidence: create_goal and get_goal returned the exact worker objective with status `active`.
- Required coordination docs were read without reading `ORCHESTRATOR.md`:
  - Evidence: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, worker 036 report, and worker 044 plan were read.
- Write scope honored:
  - Evidence: `git ls-files --others --exclude-standard` lists only the 10 scoped worker files.
  - Evidence: `git diff --name-only` is empty because all scoped files are new/untracked.
  - Evidence: no changes under `tests/conformance/package.json`, `tests/conformance/README.md`, `packages/**`, `tests/smoke/**`, or root package metadata.
- Deterministic oracle files exist for the named deliverables:
  - Evidence: source modules, generator CLI, print CLI, test, checked JSON artifact, and this report are present at the requested paths.
- `createRoot`, options, warnings/errors, container validation, root render/unmount, profiling, and `react-server` branches are covered:
  - Evidence: scenario IDs in `react-dom-client-root-scenarios.mjs` and assertions in `react-dom-client-root-oracle.test.mjs`.
- Ordinary `root.render(children)` is covered:
  - Evidence: checked artifact records `root.render one argument` as `ok`, returning `undefined`, with no console warnings in default development.
- Main target is pinned to React DOM 19.2.6:
  - Evidence: generator validates `react-dom` inventory version against `REACT_DOM_CLIENT_ROOT_TARGET.version`; test asserts checked package version equals target version.
- Direct node commands work:
  - Evidence: generator, focused node test, print CLI, and deterministic byte compare passed from `tests/conformance`.
- Existing conformance workspace test works:
  - Evidence: `npm test --workspace @fast-react/conformance` passed with 145 tests.
- Determinism is proven:
  - Evidence: fresh generator output byte-compared equal to `oracles/react-19.2.6-react-dom-client-root-oracle.json`.
- Local path leaks, trailing whitespace, and scoped diff checks passed:
  - Evidence: scoped `rg` leak scan had no matches, scoped trailing whitespace scan had no output, and scoped `git diff --check` passed.
- Nested-agent hypothesis testing was used:
  - Evidence: one verifier confirmed determinism/path/scope checks; one source auditor found missing one-argument render coverage and main target version validation. Both issues were fixed and reverified.

## Commands Run

- `sed -n '1,220p' worker-progress/worker-046-react-dom-client-root-oracle.md`
- `sed -n '1,260p' WORKER_BRIEF.md`
- `sed -n '1,320p' MASTER_PLAN.md`
- `sed -n '1,320p' MASTER_PROGRESS.md`
- `git status --short`
- `sed -n '1,280p' worker-progress/worker-036-react-dom-export-oracle.md`
- `sed -n '1,360p' worker-progress/worker-044-react-dom-client-roots-plan.md`
- `rg --files tests/conformance/src tests/conformance/scripts tests/conformance/test tests/conformance/oracles worker-progress | rg 'react-dom-(client-root|export)|worker-046|worker-044|worker-036'`
- `wc -l tests/conformance/src/react-dom-client-root-*.mjs tests/conformance/scripts/*react-dom-client-root*.mjs tests/conformance/test/react-dom-client-root-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-dom-client-root-oracle.json worker-progress/worker-046-react-dom-client-root-oracle.md`
- `sed -n '1,220p' tests/conformance/src/react-dom-client-root-targets.mjs`
- `sed -n '1,220p' tests/conformance/src/react-dom-client-root-scenarios.mjs`
- `sed -n '1,1120p' tests/conformance/src/react-dom-client-root-probe-runner.mjs`
- `sed -n '1,860p' tests/conformance/src/react-dom-client-root-oracle-generator.mjs`
- `sed -n '1,260p' tests/conformance/src/react-dom-client-root-oracle.mjs`
- `sed -n '1,430p' tests/conformance/test/react-dom-client-root-oracle.test.mjs`
- `sed -n '1,220p' tests/conformance/scripts/generate-react-dom-client-root-oracle.mjs`
- `sed -n '1,220p' tests/conformance/scripts/print-react-dom-client-root-oracle.mjs`
- `node -e "<oracle summary>"`
- `node --test test/react-dom-client-root-oracle.test.mjs`
- `node scripts/generate-react-dom-client-root-oracle.mjs --write`
- `tmp=$(mktemp); node scripts/generate-react-dom-client-root-oracle.mjs > "$tmp" && cmp -s oracles/react-19.2.6-react-dom-client-root-oracle.json "$tmp"; rc=$?; rm -f "$tmp"; exit $rc`
- `node --input-type=module -e "<generate and byte-compare checked client-root oracle>"`
- `npm test --workspace @fast-react/conformance`
- `node scripts/print-react-dom-client-root-oracle.mjs --format=markdown`
- `git ls-files --others --exclude-standard`
- `git diff --name-only`
- scoped local path-leak scan with `rg`
- scoped trailing-whitespace scan with `perl`
- scoped `git add --intent-to-add ... && git diff --check -- ... && git reset -- ...`

## Verification

- `node --test test/react-dom-client-root-oracle.test.mjs` passed.
  - 12 tests passed.
- `node scripts/generate-react-dom-client-root-oracle.mjs --write` passed and refreshed the checked oracle.
- Regeneration determinism passed.
  - Fresh direct CLI generation byte-compared equal to `oracles/react-19.2.6-react-dom-client-root-oracle.json`.
- `npm test --workspace @fast-react/conformance` passed.
  - 145 tests passed.
- `node scripts/print-react-dom-client-root-oracle.mjs --format=markdown` passed.
- Scoped local path-leak scan passed.
- Scoped trailing-whitespace scan passed.
- Scoped `git diff --check` passed.

## Evidence Gathered

- Worker 036 export oracle pattern was reused for exact tarball extraction, integrity verification, path normalization, direct generator/print CLIs, checked artifact tests, and false Fast React compatibility claims.
- Worker 044 client roots plan guided the scenario boundaries: public facade shape, container validation, duplicate-root warnings, option ingestion/storage, root object `render`/`unmount`, and separation from hydration, event dispatch, scheduler implementation, and DOM mutation fidelity.
- The generated artifact records React DOM observations separately from Fast React placeholder observations so future implementation workers can turn placeholder mismatches into behavior matches without changing the oracle target.

## Risks Or Blockers

- Oracle generation requires network access to the exact tarball URLs recorded in the checked runtime inventory. The generator verifies integrity, but offline regeneration would need a tarball cache.
- The DOM shim is intentionally minimal. It captures the root API boundaries needed here but is not a browser compatibility substitute.
- Listener counts are pinned to React DOM 19.2.6 behavior under the shim. A future React target update should regenerate rather than hand-edit counts.
- Fast React React DOM has no client-root behavior implementation yet, so all comparison statuses remain non-compatible by design.

## Recommended Next Tasks

- Implement React DOM client root behavior only after the reconciler root, HostRoot update queue, lane scheduling, DOM container marker, and event listener boundary designs are in place.
- Add separate oracles for hydration roots, event priority/delegation, portals, `flushSync` batching, and actual DOM mutation output instead of expanding this root public-behavior oracle beyond its current boundary.

## Quality, Maintainability, Performance, And Security Review

- Quality: The oracle checks exact React DOM behavior and keeps Fast React compatibility false until implementation exists.
- Maintainability: Target metadata, scenarios, probe runner, generator, checked artifact helpers, CLIs, and tests are split along existing conformance patterns.
- Performance: Generation uses one small Node child process per target, scenario, and mode; checked tests read the artifact and do not download tarballs.
- Security: Generation does not run lifecycle scripts or mutate root manifests/lockfiles. Published package code is executed only after integrity verification in an isolated temporary project.
