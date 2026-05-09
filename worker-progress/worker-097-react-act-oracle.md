# worker-097-react-act-oracle

## Objective

Add deterministic `react@19.2.6` public `React.act` behavior oracle files.

Write scope honored: only `react-act` conformance files, the checked oracle, the
React.act oracle test, and this report were changed.

Goal tooling: `create_goal` was available and created the active goal for this
exact objective before the worker read or verified files. `get_goal` was
available; the active goal objective is "Add deterministic React 19.2.6 public
act behavior oracle files." and the status was `active` during the completion
audit.

Required local evidence files were read after goal setup:

- `WORKER_BRIEF.md`
- `MASTER_PLAN.md`
- `MASTER_PROGRESS.md`
- `worker-progress/worker-017-runtime-inventory-generation.md`
- `worker-progress/worker-025-children-helpers.md`
- `worker-progress/worker-073-test-renderer-update-model-plan.md`

`worker-progress/worker-067-react-dom-test-utils-act-oracle.md` and
`worker-progress/worker-086-react-test-renderer-act-oracle.md` were not present
in this worktree, so they were recorded as unavailable local evidence. I did
not read `ORCHESTRATOR.md`.

## Summary

Added a checked deterministic oracle for public `React.act` behavior from the
exact `react@19.2.6` npm tarball. The generator resolves registry metadata,
downloads and verifies the published tarball integrity, extracts React into an
isolated temporary `node_modules` tree, copies local `@fast-react/react`, and
runs one bounded Node child process per target, scenario, and mode.

The oracle covers 6 scenarios across default Node development, default Node
production, react-server development, and react-server production:

- public `act` export presence, descriptor, function shape, and absence;
- sync callback call shape, returned act thenable shape, and unawaited sync
  behavior;
- async callback microtask order and awaited return forwarding;
- unawaited async act warning behavior;
- synchronous throws, subsequent calls after throws, async rejection, and custom
  thenable rejection;
- deterministic thenable handling for resolving custom thenables, non-callable
  `then`, and function values with callable `then` properties.

The oracle intentionally stays rootless: it does not create renderer roots,
does not inspect private `ReactSharedInternals.actQueue`, and does not claim
renderer-backed flushing behavior. React DOM test-utils and test-renderer act
wrappers must own renderer queue flushing evidence.

Current generated Fast React comparison status counts are 2 `known-mismatch`,
10 `unsupported-placeholder`, and 12 `matched-but-compatibility-not-claimed`.
Compatibility remains explicitly false.

## Changed Files

- `tests/conformance/src/react-act-targets.mjs`
- `tests/conformance/src/react-act-scenarios.mjs`
- `tests/conformance/src/react-act-probe-runner.mjs`
- `tests/conformance/src/react-act-oracle-generator.mjs`
- `tests/conformance/src/react-act-oracle.mjs`
- `tests/conformance/scripts/generate-react-act-oracle.mjs`
- `tests/conformance/scripts/print-react-act-oracle.mjs`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `tests/conformance/oracles/react-19.2.6-react-act-oracle.json`
- `worker-progress/worker-097-react-act-oracle.md`

## Commands Run

- `pwd && rg --files -g '!ORCHESTRATOR.md' | sed -n '1,160p'`
- `create_goal` for the exact worker objective
- `get_goal`
- `find . -path ./node_modules -prune -o -name AGENTS.md -print`
- `rg --files tests/conformance | sort`
- `sed -n '1,220p' tests/conformance/README.md`
- `sed -n '1,220p' tests/conformance/package.json`
- `sed -n '1,240p' tests/conformance/src/react-act-targets.mjs`
- `sed -n '1,260p' tests/conformance/src/react-act-scenarios.mjs`
- `sed -n '1,760p' tests/conformance/src/react-act-probe-runner.mjs`
- `sed -n '1,620p' tests/conformance/src/react-act-oracle-generator.mjs`
- `sed -n '1,80p' tests/conformance/scripts/generate-forward-ref-oracle.mjs`
- `sed -n '1,80p' tests/conformance/scripts/print-forward-ref-oracle.mjs`
- `node --input-type=module -e "<generate React.act oracle probe>"`
- `curl -fsSL https://registry.npmjs.org/react/-/react-19.2.6.tgz -o react.tgz`
- `node tests/conformance/scripts/generate-react-act-oracle.mjs --write`
- `node --test tests/conformance/test/react-act-oracle.test.mjs`
- `tmpfile=$(mktemp); node tests/conformance/scripts/generate-react-act-oracle.mjs > "$tmpfile"; cmp -s tests/conformance/oracles/react-19.2.6-react-act-oracle.json "$tmpfile"; rc=$?; rm -f "$tmpfile"; exit $rc`
- `npm test --workspace @fast-react/conformance`
- `git status --short -- tests/conformance/src/react-act-targets.mjs tests/conformance/src/react-act-scenarios.mjs tests/conformance/src/react-act-oracle.mjs tests/conformance/src/react-act-probe-runner.mjs tests/conformance/src/react-act-oracle-generator.mjs tests/conformance/scripts/generate-react-act-oracle.mjs tests/conformance/scripts/print-react-act-oracle.mjs tests/conformance/test/react-act-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-act-oracle.json worker-progress/worker-097-react-act-oracle.md`
- `node --check tests/conformance/src/react-act-probe-runner.mjs && node --check tests/conformance/src/react-act-oracle-generator.mjs && node --check tests/conformance/test/react-act-oracle.test.mjs`
- `rg -n '<local-temp-or-workspace-path-patterns>' tests/conformance/oracles/react-19.2.6-react-act-oracle.json tests/conformance/src/react-act-*.mjs tests/conformance/scripts/*react-act*.mjs tests/conformance/test/react-act-oracle.test.mjs worker-progress/worker-097-react-act-oracle.md`
- `rg -n '[[:blank:]]$' tests/conformance/oracles/react-19.2.6-react-act-oracle.json tests/conformance/src/react-act-*.mjs tests/conformance/scripts/*react-act*.mjs tests/conformance/test/react-act-oracle.test.mjs worker-progress/worker-097-react-act-oracle.md`
- `git diff --check -- tests/conformance/src/react-act-targets.mjs tests/conformance/src/react-act-scenarios.mjs tests/conformance/src/react-act-oracle.mjs tests/conformance/src/react-act-probe-runner.mjs tests/conformance/src/react-act-oracle-generator.mjs tests/conformance/scripts/generate-react-act-oracle.mjs tests/conformance/scripts/print-react-act-oracle.mjs tests/conformance/test/react-act-oracle.test.mjs tests/conformance/oracles/react-19.2.6-react-act-oracle.json worker-progress/worker-097-react-act-oracle.md`

## Evidence Gathered

- Public `React.act` is available only in default Node development for
  `react@19.2.6`; default production and both react-server modes expose no
  public `act` property.
- The development export is an enumerable, configurable, writable data property
  with an anonymous function value of length 1.
- Rootless sync and awaited async callbacks have deterministic direct behavior
  without renderer-backed queue flushing.
- Unawaited async act warnings are deterministic after bounded task/microtask
  flushing in the probe.
- Thrown and rejected errors propagate deterministically.
- A callable `then` on a function return value is a determinism hazard for
  `await` because JavaScript promise assimilation can invoke the returned
  function's `then`. The oracle records this via direct act-thenable settlement
  observation instead of awaiting a potentially non-settling value.
- The regenerated oracle byte-compared equal to the checked artifact.
- `node --test tests/conformance/test/react-act-oracle.test.mjs` passed with 10
  tests.
- `npm test --workspace @fast-react/conformance` passed with 251 tests.
- The checked test and scoped search guard against local workspace and temporary
  generation path leaks.
- The conformance package manifest was not edited because it is outside this
  worker's write scope and the prompt explicitly says not to edit shared package
  manifests unless the test cannot run otherwise. `npm test` discovers
  `test/react-act-oracle.test.mjs` without a new package script.

## Determinism Hazards And Scope Boundaries

- Renderer-backed flushing is intentionally out of scope because public
  `React.act` alone has no renderer root to flush. Renderer wrappers should own
  DOM/test-renderer queue evidence.
- Private act queue state is intentionally not inspected.
- Non-settling thenables can hang an awaited probe. The checked probe uses
  bounded direct `then` settlement observation for the function-with-then case.
- Async warning probes depend on bounded task/microtask turns; the oracle records
  only the observed public warning behavior, not scheduler internals.
- Error messages are normalized for path fragments, and the artifact has a path
  leak test for local temporary roots, user workspace roots, and the worker path.

## Delegated Checks

Nested read-only subagents were used to test the hypothesis, as allowed by the
worker brief:

- Audit subagent `019e0eea-1c50-7113-bd18-9de8cbfe1c4f` created its own goal,
  stayed read-only, did not read `ORCHESTRATOR.md`, and confirmed the react-act
  files satisfy the required scope. It found no blocking determinism or path
  leak issue. It noted that package-level `react-act:*` npm scripts are absent,
  which is acceptable because this worker's manifest edits are disallowed unless
  tests cannot run.
- Spot-probe subagent `019e0eea-307e-7853-8147-a393b70ef532` created its own
  goal, stayed read-only, did not read `ORCHESTRATOR.md`, and independently
  confirmed public `React.act` availability, descriptors, rootless sync/async
  callback behavior, unawaited warning deduplication, thrown/rejected error
  propagation, and the function-with-callable-then await hazard. It also
  confirmed no renderer-backed flushing evidence should be claimed by this
  public React root oracle.

## Completion Audit

Objective success criteria:

- Add source, script, test, and checked oracle files only in the scoped
  `react-act` conformance paths.
- Probe public React 19.2.6 `React.act` export descriptors, development and
  production availability, sync and async callback behavior, no-await warnings,
  thrown and rejected errors, and deterministic thenable behavior.
- Keep renderer-backed flushing explicitly out of scope.
- Compare local Fast React only as unsupported, known mismatch, or
  matched-without-claim evidence.
- Run targeted Node tests, scoped path-leak checks, trailing whitespace checks,
  and scoped `git diff --check`.

Audit result:

- Scoped files exist and are the only non-report changes.
- `tests/conformance/src/react-act-scenarios.mjs`,
  `tests/conformance/src/react-act-probe-runner.mjs`, and
  `tests/conformance/test/react-act-oracle.test.mjs` map directly to each
  required public `React.act` behavior area.
- The checked artifact records 24 React observations and 24 Fast React
  observations across 4 modes and 6 scenarios.
- Fast React comparison counts are 2 `known-mismatch`, 10
  `unsupported-placeholder`, and 12 `matched-but-compatibility-not-claimed`;
  all compatibility claims remain false.
- Renderer-backed flushing and private act queue inspection are both recorded
  as intentional gaps.
- Required scoped verification commands passed after regeneration.

## Recommended Next Tasks

- Keep renderer-backed act queue evidence in the React DOM test-utils and
  react-test-renderer wrapper tracks.
- Add package-level convenience scripts for `react-act:generate` and
  `react-act:print` only if a future manifest-scoped worker is assigned to align
  all oracle generator scripts.
