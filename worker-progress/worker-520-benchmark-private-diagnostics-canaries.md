# Worker 520: Benchmark Private Diagnostics Canaries

## Goal Evidence

- Final pane closeout observed by orchestrator: complete (tmux reported `Goal achieved`).
- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available after setup and before this report.
- Active goal status from `get_goal`: `active`.
- Active goal objective from `get_goal`: Add benchmark canaries for accepted
  private diagnostics from the 480-492 batch across React DOM root bridge,
  resource/form/controlled gates, and react-test-renderer private surfaces
  without claiming public performance or compatibility.

## Summary

Added a deterministic, metadata-only benchmark manifest for the requested
480-492 private diagnostic surfaces. The new manifest admits diagnostic-only
benchmark canary rows for:

- React DOM root bridge facade host-output and event-listener error routing.
- Resource stylesheet precedence, form submit/reset action metadata, and
  controlled checkbox/radio restore metadata.
- React-test-renderer deletion cleanup order, act Scheduler flush routing,
  `unstable_flushSync` act routing, TestInstance `findBy*` metadata, and
  `toTree` multi-child metadata.

The benchmark rows do not collect timings, add thresholds, or claim Fast React
is faster. Public compatibility promotion remains blocked behind public root,
resource, form, controlled-input, react-test-renderer root/act/serialization,
and comparable-timing gates.

## Changed Files

- `tests/benchmarks/manifests/private-480-492-diagnostic-canaries.json`
- `tests/benchmarks/test/private-480-492-diagnostic-canaries.test.mjs`
- `tests/benchmarks/test/benchmark-gate.test.mjs`
- `worker-progress/worker-520-benchmark-private-diagnostics-canaries.md`

## Evidence Gathered

- Read required context: `WORKER_BRIEF.md`, `MASTER_PLAN.md`, and
  `MASTER_PROGRESS.md`.
- Inspected worker reports 480, 481, 482, 483, 484, 485, 486, 487, 488, 489,
  490, 491, and 492.
- Included workers 481, 482, 483, 484, 485, 486, 488, 490, 491, and 492 because
  they map to the requested React DOM root bridge, resource/form/controlled,
  and react-test-renderer private surfaces.
- Kept workers 480, 487, and 489 out of this manifest because their accepted
  diagnostics are Suspense/Offscreen, DOM preventDefault, and hydration replay
  surfaces outside this worker's requested benchmark surface set.
- Confirmed benchmark validation remains manifest-only with
  `diagnostic-only`, `matched-but-compatibility-not-claimed`, and
  `accepted-private-partial` gates.
- Spawned one read-only explorer for gate-id orientation, but it did not return
  a final result before implementation and was closed; no conclusion depends
  on delegated output.

## Commands Run

```sh
node --check tests/benchmarks/test/private-480-492-diagnostic-canaries.test.mjs
node tests/benchmarks/scripts/check-benchmark-manifests.mjs
node --test tests/benchmarks/test/private-480-492-diagnostic-canaries.test.mjs
npm run check:benchmarks
node tests/smoke/import-entrypoints.mjs
git diff --check
```

## Verification Results

- Benchmark manifest gate passed with 10 manifests, 105 scenarios, 27
  milestones, and 0 result artifacts.
- Focused private 480-492 benchmark canary test passed: 5/5 tests.
- `npm run check:benchmarks` passed: 41/41 benchmark tests.
- Import-entrypoint smoke passed.
- `git diff --check` passed.
- npm emitted the existing unknown `minimum-release-age` config warning during
  `npm run check:benchmarks`; it did not affect verification.

## Risks Or Blockers

- No blockers remain.
- These are benchmark admission canaries only. They do not execute live
  benchmark timing, add performance thresholds, or support public performance
  or compatibility claims.
- The new private gate ids are benchmark metadata that point at accepted
  private diagnostics and existing conformance artifacts. Future renames of
  those diagnostics should refresh this manifest and focused test together.

## Recommended Next Tasks

1. Add canaries for workers 503-526 only after their private diagnostics are
   accepted and still explicitly blocked from public compatibility claims.
2. Keep comparable benchmark timing blocked until the corresponding public
   conformance gates are green-admitted and claim compatibility.
