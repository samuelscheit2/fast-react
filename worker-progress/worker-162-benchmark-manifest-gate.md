# Worker 162: Benchmark Manifest Gate

Goal status: active
Goal objective: add the first benchmark manifest/result schema gate that fails closed for unsupported compatibility claims and keeps all timing data diagnostic until conformance gates are green

Started: 2026-05-10

## Summary

Implemented the first benchmark manifest/result schema gate under
`tests/benchmarks`. The gate defines explicit compatibility and timing status
vocabularies, validates checked benchmark manifests, rejects unsupported green
compatibility claims against non-green conformance artifacts, and rejects
claim-capable timing statuses unless compatibility is green.

Initial manifests are blocked for:

- `root-render-dual-run-gate-1`
- `react-test-renderer-root-lifecycle`
- `react-dom-host-dom`

All initial timing statuses remain `blocked-by-conformance` with the
`diagnostic-until-compatible` policy.

## Goal Setup Evidence

- `create_goal` was the first action for this worker.
- `get_goal` was called immediately after goal creation.
- Active goal status recorded from `get_goal`: `active`.
- Active goal objective recorded from `get_goal`: add the first benchmark
  manifest/result schema gate that fails closed for unsupported compatibility
  claims and keeps all timing data diagnostic until conformance gates are green.

## Changed Files

- `package.json`
- `tests/benchmarks/schema/benchmark-status-vocabulary.json`
- `tests/benchmarks/schema/benchmark-manifest.schema.json`
- `tests/benchmarks/schema/benchmark-result.schema.json`
- `tests/benchmarks/manifests/root-render-dual-run-gate-1.json`
- `tests/benchmarks/manifests/react-test-renderer-root-lifecycle.json`
- `tests/benchmarks/manifests/react-dom-host-dom.json`
- `tests/benchmarks/src/benchmark-gate.mjs`
- `tests/benchmarks/scripts/check-benchmark-manifests.mjs`
- `tests/benchmarks/test/benchmark-gate.test.mjs`
- `worker-progress/worker-162-benchmark-manifest-gate.md`

## Evidence Gathered

- `WORKER_BRIEF.md` confirms the React compatibility target and worker rules.
- Worker 137 identifies `root-render-dual-run-gate-1` as blocked until root
  render/update/unmount conformance is green.
- Worker 146 requires the first benchmark harness to be a fail-closed
  manifest/result schema gate and keeps timing diagnostic until conformance is
  green.
- `tests/conformance/README.md` confirms current checked conformance artifacts
  do not claim Fast React behavior compatibility.
- Current root `package.json` had no benchmark gate script before this change.
- Current checked conformance oracle JSON referenced by the manifests has
  `compatibilityClaimed: false`, `fastReactBehaviorCompatible: false`, and
  `fullDualRunOracleExists: false` where applicable.

## Verification

- `npm run check:benchmarks` passed.
  - Gate output: 3 manifests, 40 scenarios, 0 result artifacts.
  - Focused node:test coverage: 6 passed, 0 failed.
- `npm run check:js` passed.
  - Includes the new benchmark gate, smoke checks, package workspace checks,
    native loader checks, and 415 conformance tests.
- `git diff --check` passed.

## Risks Or Blockers

- No real benchmark runner or timing results exist yet; this change only gates
  admission and result schema/status semantics.
- All initial scenarios are intentionally blocked because required conformance
  claims are not green.
- npm emits the pre-existing `minimum-release-age` config warning during JS
  verification; it did not block the runs.

## Recommended Next Tasks

- Add diagnostic-only result artifacts once a lightweight timing collector
  exists.
- Extend the gate to validate threshold/noise metadata when comparable timing
  becomes allowed.
- Flip individual scenarios to `green` only after the referenced conformance
  artifacts claim full Fast React compatibility.
