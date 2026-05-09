# worker-067-react-dom-test-utils-act-oracle

## Status

Complete.

## Summary

Added a deterministic React DOM 19.2.6 `react-dom/test-utils.act` behavior oracle generated from the checked runtime inventory and exact `react`, `react-dom`, and `scheduler` npm tarballs.

Coverage includes 9 scenarios across 4 probe modes:

- `default-node-development`
- `default-node-production`
- `react-server-development`
- `react-server-production`

The oracle records export shape, CommonJS and dynamic import descriptors, descriptor mutation behavior, deprecation warning deduplication, sync and async callback return handling, thrown and rejected callback errors, thenable classification, async no-await warnings, and the observable relationship to public `React.act`.

The generator initially exposed a stale checked artifact in the descriptor-mutability scenario: fresh tarball evidence showed the CommonJS module owns a writable/configurable `act` descriptor before mutation, while the checked JSON had a missing descriptor. I refreshed the checked oracle artifact from the generator instead of relaxing the test.

Intentional gaps:

- No Fast React React DOM comparison is claimed in this worker slice.
- No renderer flush semantics are covered; DOM roots, fake timers, Suspense rendering, and work queues remain separate renderer-backed oracle work.
- No React package `act` implementation claim is made; this oracle only observes `React.act` where React 19.2.6 exposes it.

## Changed Files

- `tests/conformance/src/react-dom-test-utils-act-targets.mjs`
- `tests/conformance/src/react-dom-test-utils-act-scenarios.mjs`
- `tests/conformance/src/react-dom-test-utils-act-probe-runner.mjs`
- `tests/conformance/src/react-dom-test-utils-act-oracle-generator.mjs`
- `tests/conformance/src/react-dom-test-utils-act-oracle.mjs`
- `tests/conformance/scripts/generate-react-dom-test-utils-act-oracle.mjs`
- `tests/conformance/scripts/print-react-dom-test-utils-act-oracle.mjs`
- `tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-dom-test-utils-act-oracle.json`
- `worker-progress/worker-067-react-dom-test-utils-act-oracle.md`

## Commands Run

- `node tests/conformance/scripts/generate-react-dom-test-utils-act-oracle.mjs --write`
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs`
- `npm test --workspace @fast-react/conformance`
- `node -e "<regenerate oracle and compare to checked artifact>"`
- `node -e "<scoped whitespace and conflict marker checks>"`
- `node -e "<scoped local/temp path leak checks>"`
- `git diff --check`

One initial targeted workspace run failed before the oracle refresh because the checked artifact was stale for `descriptor-mutability`. After refreshing the artifact from the generator, the targeted test and full conformance workspace passed.

## Evidence Gathered

- Checked oracle is byte-regenerable from exact React DOM 19.2.6 packages.
- `node --test tests/conformance/test/react-dom-test-utils-act-oracle.test.mjs` passed: 11 tests, 0 failures.
- `npm test --workspace @fast-react/conformance` passed: 132 tests, 0 failures.
- Scoped local/temp path leak checks passed over all changed files.
- Scoped whitespace and conflict marker checks passed over all changed files.
- `git diff --check` passed.
- Oracle matrix includes 9 observations for each of the 4 probe modes.
- Default development evidence records `react-dom/test-utils.act !== React.act`, imported named `act === require("react-dom/test-utils").act`, and `React.act` present as a function.
- Default production and `react-server` evidence records missing public `React.act`, with the wrapper warning and throwing `TypeError: React.act is not a function` before callback invocation.
- Default development evidence records both the ReactDOMTestUtils deprecation warning and React async no-await warning for an unawaited async `act`.
- A read-only nested explorer was launched to test the coverage hypothesis, but it did not return before the verification window and did not affect these conclusions.

## Risks/Blockers

- Fast React behavior is not compared here; conformance claims remain explicitly false.
- React's public `act` semantics are only observed through this wrapper where needed. A separate React `act` oracle/implementation task should own broader public `React.act` behavior.
- Renderer-backed flushing, component updates, fake timers, Suspense, and DOM root integration are intentionally out of scope.
- The generator downloads npm tarballs from inventory URLs, so regeneration requires network access.

## Recommended Next Tasks

- Add a separate React public `act` oracle if the React facade will implement `React.act` directly.
- Add renderer-backed React DOM `act` integration scenarios once DOM roots and update flushing exist.
- When Fast React has a `react-dom/test-utils` implementation beyond placeholders, add a dual-run comparison layer against this oracle.

## Quality/Security/Performance Review

- Quality: The files follow the existing conformance oracle pattern, keep the `react-dom-test-utils-act` prefix, validate source inventory targets, and assert behavior-specific observations instead of only schema shape.
- Maintainability: Scenario metadata is centralized, generation and print CLIs are small, and the checked JSON is reproducible from a single generator.
- Security: The generator does not execute lifecycle scripts, verifies tarball integrity against checked inventory metadata, mutates no root manifests or lockfiles, and normalizes local/temp paths.
- Performance: Probe work is bounded with timeouts and isolated to one Node child process per scenario/mode; normal test runs read the checked artifact instead of regenerating it.
