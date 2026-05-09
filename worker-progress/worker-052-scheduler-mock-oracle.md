# worker-052-scheduler-mock-oracle

## Objective

Add deterministic `scheduler@0.27.0` `scheduler/unstable_mock` behavior oracle
files.

Write scope honored: only scheduler mock conformance files and this report were
changed.

## Summary

Added a checked deterministic oracle for `scheduler/unstable_mock` from
`scheduler@0.27.0`. The generator fetches the exact npm package metadata,
verifies the published tarball integrity and shasum recorded by worker 034,
extracts the package into a temporary isolated `node_modules` tree, and probes
one Node child process per target, scenario, and mode.

The oracle covers both development and production `NODE_ENV` modes and records
9 mock-scheduler scenarios:

- export keys, descriptors, package metadata, priority constants, and absence
  of `unstable_NoPriority`;
- virtual `unstable_now`, `unstable_advanceTime`, `log`,
  `unstable_clearLog`, and `unstable_setDisableYieldValue`;
- task object shape, priority timeout buckets, delayed `sortIndex`, and
  cancellation tombstones;
- priority context behavior for `unstable_runWithPriority`,
  `unstable_next`, `unstable_wrapCallback`, invalid priority coercion, and
  restoration after throws;
- priority flush order, equal-priority FIFO ordering, `didTimeout`, and
  `unstable_hasPendingWork`;
- `unstable_flushAll`, `unstable_flushAllWithoutAsserting`,
  `unstable_flushExpired`, `unstable_flushNumberOfYields`, and
  `unstable_flushUntilNextPaint`;
- delayed, expired, cancelled, continuation, paint-yielding, and reset
  behavior.

The oracle also copies the local `packages/scheduler` placeholder under an
isolated `fast-react-scheduler` alias and records current comparison boundaries
without claiming compatibility. Current status counts are 2 `known-mismatch`
comparisons for export shape and 16 `unsupported-placeholder` comparisons for
behavioral scenarios.

No scheduler mock package behavior was implemented.

## Changed Files

- `tests/conformance/src/scheduler-mock-targets.mjs`
- `tests/conformance/src/scheduler-mock-scenarios.mjs`
- `tests/conformance/src/scheduler-mock-probe-runner.mjs`
- `tests/conformance/src/scheduler-mock-oracle-generator.mjs`
- `tests/conformance/src/scheduler-mock-oracle.mjs`
- `tests/conformance/scripts/generate-scheduler-mock-oracle.mjs`
- `tests/conformance/scripts/print-scheduler-mock-oracle.mjs`
- `tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json`
- `worker-progress/worker-052-scheduler-mock-oracle.md`

## Commands Run

- `git status --short`
- `sed -n '1,220p' WORKER_BRIEF.md`
- `sed -n '1,260p' MASTER_PLAN.md`
- `sed -n '1,260p' MASTER_PROGRESS.md`
- `sed -n '1,260p' worker-progress/worker-034-scheduler-package-inventory.md`
- `sed -n '1,260p' worker-progress/worker-038-scheduler-root-oracle.md`
- `sed -n '1,280p' worker-progress/worker-039-scheduler-variant-oracles.md`
- `rg --files tests/conformance | sort`
- `sed -n '1,260p' tests/conformance/src/scheduler-mock-targets.mjs`
- `sed -n '1,360p' tests/conformance/src/scheduler-mock-oracle-generator.mjs`
- `sed -n '260,980p' tests/conformance/src/scheduler-mock-oracle-generator.mjs`
- `sed -n '1,1300p' tests/conformance/src/scheduler-mock-probe-runner.mjs`
- `sed -n '1,360p' tests/conformance/src/scheduler-mock-scenarios.mjs`
- `sed -n '1,320p' tests/conformance/src/scheduler-mock-oracle.mjs`
- `sed -n '1,620p' tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `sed -n '1,220p' tests/conformance/scripts/generate-scheduler-mock-oracle.mjs`
- `sed -n '1,260p' tests/conformance/scripts/print-scheduler-mock-oracle.mjs`
- `rg --files packages/scheduler | sort`
- `cat tests/conformance/package.json`
- `node tests/conformance/scripts/generate-scheduler-mock-oracle.mjs --write`
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs`
- `tmpfile=$(mktemp); node tests/conformance/scripts/generate-scheduler-mock-oracle.mjs > "$tmpfile"; cmp -s tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json "$tmpfile"; rc=$?; rm -f "$tmpfile"; exit $rc`
- `npm test --workspace @fast-react/conformance`
- `node -e "<scheduler mock oracle summary>"`
- `node tests/conformance/scripts/print-scheduler-mock-oracle.mjs --format=markdown | sed -n '1,80p'`
- `wc -c tests/conformance/oracles/scheduler-0.27.0-mock-oracle.json`

## Evidence Gathered

- The generator verifies `scheduler@0.27.0` `dist.integrity` and `dist.shasum`
  before extracting package contents.
- The checked oracle records the 15 shipped scheduler tarball files and exact
  package metadata needed by the mock scheduler subpath.
- Development and production mock entrypoints both expose the expected 27
  public mock exports and priority constants.
- The regenerated oracle byte-compared equal to the checked artifact.
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs` passed
  with 13 tests.
- `npm test --workspace @fast-react/conformance` passed with 134 tests.
- The checked test includes an artifact local/temp path leak guard.

## Delegated Checks

- Spawned a managed explorer to review the partial scheduler mock files against
  workers 034, 038, and 039 and to look for missing coverage, determinism
  risks, path leak risks, and scope concerns. Its findings were not needed to
  complete the implementation path because the local generation and test checks
  directly verified the oracle behavior.

## Risks Or Blockers

- The local scheduler package still exposes structured placeholders for mock
  behavior; compatibility remains false until `scheduler/unstable_mock` is
  implemented.
- Export-shape comparison records known mismatches before behavior invocation
  because local package metadata and placeholder function names differ.
- This oracle covers only the mock scheduler subpath. Root scheduler,
  post-task, native, React reconciler lanes, and renderer scheduling remain
  separate compatibility surfaces.
- Reset behavior includes a surprising observed boundary: after `reset()` with
  pending mock work, fresh equal-priority work can remain non-flushable because
  stale queue state is cleared by handles rather than by heap replacement. The
  future implementation should match or intentionally break from that behavior
  with a documented compatibility decision.

## Recommended Next Tasks

- Implement `scheduler/unstable_mock` against this oracle before enabling
  upstream React-style tests that alias `scheduler` to the mock.
- Keep compatibility claims false until the local scheduler mock can pass these
  scenarios without unsupported placeholders.
- Add implementation-focused tests when mock behavior is implemented so the
  placeholder comparison boundaries can become exact-match checks.

## Quality, Maintainability, Performance, And Security Review

Quality:

- The oracle is generated from exact package artifacts and keeps every
  compatibility claim explicit.
- Path-bearing error messages are normalized and the checked test guards
  against local or temp path leaks.

Maintainability:

- Targets, scenarios, probing, generation, printing, and artifact tests are
  separated in the same style as workers 038 and 039.
- Coverage booleans and implementation risks are stored in the oracle so future
  scheduler implementation workers can see the supported boundary.

Performance:

- Runtime tests read the checked JSON artifact. Only the generator performs
  package fetch/extract work and bounded child-process probes.

Security:

- No lifecycle scripts are run. The published scheduler package code and local
  placeholder comparison execute only in temporary isolated probe projects.
