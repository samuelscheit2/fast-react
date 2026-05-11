# Worker 957: Benchmark Result False-Green Hardening

## Summary

Hardened benchmark result validation so future result JSON cannot act as
decorative false-green evidence. Result artifacts now have to cover every
manifest-required scenario, cannot duplicate a scenario/lane row, cannot carry
arbitrary timing-shaped fields, and cannot present diagnostic timing as public
performance proof.

## Changed Files

- `tests/benchmarks/src/benchmark-gate.mjs`
  - Rejects unsupported top-level result fields and `scenarioResult` fields.
  - Rejects duplicate scenario/lane rows.
  - Requires known result artifacts to include every manifest
    `requiredScenarioIds` entry.
  - Admits `diagnostic-only` result rows only for private diagnostic scenarios
    backed by accepted private conformance gates.
  - Keeps claim-capable result statuses gated behind green manifest timing and
    `green-admitted` accepted gate metadata.
  - Rejects accepted-gate command prose, including prose hidden behind
    `npm run`, `node --test`, or `cargo test` prefixes.
  - Validates accepted-gate command segments against known accepted npm command
    segments, accepted Node gate test targets, real Cargo crate names,
    `--all-features`, and accepted Cargo gate filters.
  - Rejects Cargo command segments with more than one positional TESTNAME and
    explicitly rejects known zero-test filters.
- `tests/benchmarks/manifests/private-503-533-diagnostic-canaries.json`
- `tests/benchmarks/manifests/private-534-564-diagnostic-canaries.json`
- `tests/benchmarks/manifests/private-565-594-diagnostic-canaries.json`
  - Split accepted Cargo commands into runnable single-filter segments.
  - Replaced zero-test `root_commit_finished_host_root` with
    `root_commit_finished_work`.
  - Replaced zero-test `deleted_subtree_passive` with
    `passive_effects_deleted_subtree`.
- `tests/benchmarks/schema/benchmark-result.schema.json`
  - Makes `scenarioResults` non-empty when a result artifact exists.
  - Sets `scenarioResult.additionalProperties` to `false`.
- `tests/benchmarks/test/benchmark-gate.test.mjs`
  - Adds positive coverage for complete blocked/private diagnostic rows.
  - Adds negatives for omitted required scenarios, duplicate scenario/lane
    rows, timing-shaped extra fields, unsupported timing statuses, public
    diagnostic proof, and non-runnable accepted-gate command metadata.
  - Adds repair coverage for `npm run Worker 957 says this benchmark passed`,
    `node --test this benchmark passed`, and `cargo test it passed`.
  - Adds repair coverage for the fake benchmark-gate source-module command and
    the nonexistent `this_benchmark_passed` Cargo filter.
  - Adds repair coverage for multi-filter Cargo command syntax and the
    zero-test `root_commit_finished_host_root` filter.

## Commands Run

- `node --test tests/benchmarks/test/benchmark-gate.test.mjs`
- `node tests/benchmarks/scripts/check-benchmark-manifests.mjs`
- `node --check tests/benchmarks/src/benchmark-gate.mjs`
- `node --check tests/benchmarks/test/benchmark-gate.test.mjs`
- `cargo test -p fast-react-reconciler --all-features -- --list`
- `cargo test -p fast-react-test-renderer --all-features -- --list`
- `cargo test -p fast-react-napi --all-features -- --list`
- Cargo manifest-filter proof script using `cargo test -p <pkg>
  --all-features -- --list`
- `git diff --check`
- `npm run check:benchmarks`

## Evidence Gathered

- The manifest gate still reports 13 manifests, 150 scenarios, 34 milestones,
  and 0 result artifacts.
- The focused benchmark gate test passes with 24/24 tests.
- The full benchmark check passes with 64/64 benchmark tests.
- No result artifacts were created.
- Accepted-gate command validation rejects prefix-only prose, source modules,
  and invented Cargo filters while verifying existing manifest commands against
  accepted npm segments, Node gate targets, and Cargo crate/filter sets.
- Cargo proof confirmed every manifest-referenced Cargo filter selects at
  least one test, including replacement filters `root_commit_finished_work` and
  `passive_effects_deleted_subtree`.
- Manifest Cargo commands have zero multi-filter command segments.

## Risks Or Blockers

- Future real benchmark metrics will need an intentional schema and validator
  update before metrics can be stored; arbitrary metric fields are now rejected
  by design.
- Result row uniqueness is intentionally scenario/lane based, matching the
  current benchmark vocabulary. A future multi-implementation result format
  would need an explicit schema change rather than relying on duplicate rows.
- Future benchmark manifests that add new conformance gate commands will need
  explicit command-target allowlist updates in the same change.

## Recommended Next Tasks

- When comparable benchmarks are eventually admitted, add a dedicated result
  schema revision for metric payloads and bind those metrics to runner command
  provenance instead of widening `scenarioResult` ad hoc.
