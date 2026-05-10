# Worker 347: Benchmark Private Admissions After New Gates

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and returned status
  `active`.
- Active goal objective from `get_goal`: refresh benchmark private diagnostic
  admissions after any accepted new private gates in this queue, keeping all
  public timing and compatibility rows blocked unless matching conformance
  evidence is green.
- `get_goal` was checked again before this report and still returned status
  `active` for the same objective.

## Summary

Audited benchmark private diagnostic admissions after the current queue state.
No worker-progress reports for workers 323-346 are present in this branch, and
no accepted 323-346 private-gate evidence is available to justify new benchmark
admissions.

Left benchmark manifests unchanged: current private diagnostic admissions remain
the 9 rows accepted by worker 320, public timing and compatibility rows remain
blocked, comparable timing remains blocked, and no result artifacts or green
timing claims were added.

Added a focused benchmark regression test proving all public benchmark
manifests stay blocked unless new accepted gate evidence is actually present.

## Changed Files

- `tests/benchmarks/test/benchmark-gate.test.mjs`
- `worker-progress/worker-347-benchmark-private-admissions-after-new-gates.md`

## Evidence Gathered

- Required context read after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, and `MASTER_PROGRESS.md`.
- Worker 162 established the fail-closed benchmark manifest/result gate and the
  diagnostic-until-compatible timing policy.
- Worker 257 added accepted-gate metadata and gate checks tying admissions to
  conformance evidence.
- Worker 289 refreshed accepted-gate metadata after workers 233-262 while
  keeping public rows blocked.
- Worker 320 admitted only diagnostic/private rows and kept comparable timing
  blocked.
- Worker-progress reports for workers 323-346 were not present in this branch.
  Only task prompts under `docs/tasks/worker-323...worker-346...` were present,
  and prompts were not treated as accepted conformance evidence.
- Manifest audit found 5 manifests, 74 scenarios, 16 milestones, 0 result
  artifacts, 9 diagnostic-only private scenarios, 4 diagnostic-admitted private
  milestones, 0 green scenarios, 0 claim-capable timing statuses, and 0
  diagnostic rows in public benchmark manifests.
- No nested agents or subagents were used.

## Implementation Notes

- Added a benchmark test asserting public manifests do not contain admitted
  accepted-gate metadata, diagnostic timing, green compatibility, or admitted
  benchmark readiness under the current evidence set.
- Did not edit manifests because no new accepted private gates from workers
  323-346 are present.
- Did not edit `tests/benchmarks/src/benchmark-gate.mjs` because the current
  fail-closed validation already preserves the required policy.

## Commands Run

- `create_goal`
- `get_goal`
- `git status --short`
- `sed -n` reads for `WORKER_BRIEF.md`, `MASTER_PLAN.md`,
  `MASTER_PROGRESS.md`, selected benchmark source/test files, selected
  benchmark manifests, worker reports 162, 257, 289, and 320, and selected
  323-346 task prompts.
- `rg --files worker-progress | sort`
- `find worker-progress -maxdepth 1 ... worker-323...worker-346`
- `rg -n "worker 32[3-9]|worker 3[3-4][0-9]|worker-32[3-9]|worker-3[3-4][0-9]" MASTER_PROGRESS.md worker-progress tests/benchmarks`
- `find . ... -name '*323*' ... -name '*346*'`
- `node --input-type=module <benchmark manifest audit>`
- `node --check tests/benchmarks/src/benchmark-gate.mjs`
- `node --check tests/benchmarks/test/benchmark-gate.test.mjs`
- `npm run check:benchmarks` - first run failed while the new regression test
  assumed every public gate carried accepted-gate metadata; the test was
  corrected to respect existing plain conformance gates, and the rerun passed.
- `npm run check:js`
- `git diff --check`

## Verification

- `node --check tests/benchmarks/src/benchmark-gate.mjs` passed.
- `node --check tests/benchmarks/test/benchmark-gate.test.mjs` passed.
- `npm run check:benchmarks` passed:
  - 5 manifests.
  - 74 scenarios.
  - 16 milestones.
  - 0 result artifacts.
  - 15 benchmark gate tests passed.
- `npm run check:js` passed:
  - Included package-surface guard, smoke imports, benchmark checks, workspace
    package checks, native loader checks, and conformance tests.
  - Conformance output: 579 tests passed, 0 failed.
- `git diff --check` passed after adding this report.

Npm printed the existing `minimum-release-age` warning during npm commands; it
did not block verification.

## Risks Or Blockers

- This worker does not add new benchmark admissions because no accepted
  worker-progress reports for workers 323-346 are present in this branch.
- If workers 323-346 later land accepted private gates, benchmark manifests
  should be reopened and updated only for rows backed by that accepted evidence.
- Public React DOM, React Test Renderer, native bridge, and compatibility timing
  rows remain blocked by non-green conformance evidence.

## Recommended Next Tasks

- Re-run this refresh after accepted reports for workers 323-346 are merged.
- Keep public timing and compatibility rows blocked until their matching
  conformance artifacts are green and explicitly admitted.
- Add result artifacts only after a separate timing collector is accepted and
  the benchmark gate can keep private diagnostic rows non-comparable.
