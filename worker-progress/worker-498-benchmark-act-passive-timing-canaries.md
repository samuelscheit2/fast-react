# Worker 498: Benchmark Act/Passive Timing Canaries

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and again before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: add benchmark manifest/test canaries
  for private act passive-drain and passive effect timing diagnostics while
  keeping all public timing claims blocked.

## Summary

Added a dedicated diagnostic-only benchmark manifest for three private timing
canaries:

- private renderer-backed act passive-drain diagnostics
- private passive effect mount/unmount callback execution diagnostics
- private passive effect error-routing diagnostics

All scenarios are `matched-but-compatibility-not-claimed` with
`diagnostic-only` timing. Public timing promotion remains blocked behind public
React.act, react-test-renderer act, passive effect execution, scheduler/root
flush, and error-surface compatibility gates.

No benchmark result artifacts, timing samples, comparable timing claims, speed
claims, public compatibility claims, or source implementation changes were
added.

## Changed Files

- `tests/benchmarks/manifests/private-act-passive-effect-timing-canaries.json`
- `tests/benchmarks/test/private-act-passive-effect-timing-canaries.test.mjs`
- `tests/benchmarks/test/benchmark-gate.test.mjs`
- `worker-progress/worker-498-benchmark-act-passive-timing-canaries.md`

## Evidence Gathered

- Read required context after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Read present required worker reports 407, 439, and 472. Required reports 473,
  474, and 475 were not present under `worker-progress/`.
- Inspected existing benchmark manifests, focused benchmark timing-canary
  tests, and `tests/benchmarks/src/benchmark-gate.mjs`.
- Inspected private act/passive evidence in:
  - `tests/conformance/test/react-act-oracle.test.mjs`
  - `tests/conformance/test/react-test-renderer-act-oracle.test.mjs`
  - `tests/conformance/test/react-test-renderer-error-surface-oracle.test.mjs`
  - `packages/react/private-act-dispatcher-gate.js`
  - `crates/fast-react-reconciler/src/passive_effects.rs`
  - `crates/fast-react-reconciler/src/root_scheduler.rs`
- Confirmed private gate evidence remains diagnostic-only: private act drains
  accepted internal records but does not run public React.act queues; passive
  effect callback executors are test-control-only; passive error routing records
  root-error metadata without invoking root callbacks or public act aggregation.
- No nested agents or subagents were used.

## Implementation Notes

- Added `private-act-passive-effect-timing-canaries.json` with three scenarios,
  four admitted private gates, and three blocked public promotion gates.
- Added focused tests proving the new rows stay diagnostic-only, reject
  claim-capable timing, reject public promotion before green gates, reject
  diagnostic admission through public gates, and reject comparable result
  artifacts.
- Updated aggregate benchmark expectations from 8 to 9 manifests, 92 to 95
  scenarios, 23 to 25 milestones, 27 to 30 diagnostic scenarios, 8 to 9
  diagnostic milestones, 24 to 28 accepted private gates, 14 to 17 accepted
  blocked gates, 16 to 20 admitted private gates, and kept result artifacts at
  0.

## Commands Run

```sh
node --check tests/benchmarks/test/private-act-passive-effect-timing-canaries.test.mjs
node --check tests/benchmarks/test/benchmark-gate.test.mjs
node tests/benchmarks/scripts/check-benchmark-manifests.mjs
node --test tests/benchmarks/test/private-act-passive-effect-timing-canaries.test.mjs
node --test tests/benchmarks/test/benchmark-gate.test.mjs
npm run check:benchmarks
npm run check:js
cargo test -p fast-react-reconciler passive_effects_ --all-features
git diff --check
```

## Verification

- Benchmark manifest gate passed:
  - 9 manifests
  - 95 scenarios
  - 25 milestones
  - 0 result artifacts
- Focused new benchmark test passed: 5 tests.
- Focused aggregate benchmark gate test passed: 16 tests.
- `npm run check:benchmarks` passed: 36 benchmark tests.
- `npm run check:js` passed, including package-surface, smoke, benchmark,
  package workspace checks, native loader checks, and 648 conformance tests.
- `cargo test -p fast-react-reconciler passive_effects_ --all-features`
  passed: 25 tests, 374 filtered out.
- `git diff --check` passed with new files included via intent-to-add.

NPM printed the existing `minimum-release-age` warning during npm commands; it
did not block verification.

## Risks Or Blockers

- This is benchmark metadata and gate coverage only. It does not add a timing
  runner or prove runtime performance.
- The act passive-drain canary consumes private renderer-backed diagnostics only;
  it does not execute public React.act work, public Scheduler tasks, public
  react-test-renderer roots, or passive callbacks.
- Passive effect mount/unmount execution is admitted only through private
  test-control executors; scheduler-driven passive execution, hook facade
  compatibility, and public act compatibility remain blocked.
- Passive effect error routing records private root-error scheduling metadata;
  root callbacks, console surfaces, public act error aggregation, and public
  error-surface compatibility remain blocked.
- Comparable public timing remains blocked until public compatibility gates are
  green-admitted and explicitly claim compatibility.

## Recommended Next Tasks

- Add result artifacts only after a timing collector exists, and keep these rows
  diagnostic-only unless public compatibility becomes green.
- Reopen public timing promotion only after public React.act, react-test-renderer
  act, passive effect execution, scheduler/root flushing, and error-surface
  gates are green-admitted.
