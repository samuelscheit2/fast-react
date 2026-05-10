# Worker 407: Benchmark Private Root Output Timing Canaries

## Goal Evidence

- `create_goal` was called as the first action before research, file reads,
  implementation, or verification.
- `get_goal` was available immediately after setup and reported status
  `active`.
- Active goal objective recorded from `get_goal`: add benchmark manifest and
  gate coverage for private root host-output timing canaries that remain
  diagnostic-only until public compatibility gates are green.
- Final `get_goal` before writing this report still reported status `active`
  for the same objective.

## Summary

Added a dedicated benchmark manifest for private React DOM root host-output
timing canaries. The manifest admits eight granular private fake-DOM canary rows
as diagnostic-only timing candidates:

- createRoot marker/listener apply-revert
- initial host output
- update host output
- replacement host output
- render(null) clearing
- unmount cleanup
- double-unmount no-op cleanup
- render-after-unmount guard/no-extra-mutation

The same manifest carries a separate blocked public timing-promotion milestone
tied to the public root render E2E and public facade gates. Comparable timing
and public compatibility remain blocked until those public gates are green and
claim compatibility.

No benchmark result artifact, timing sample, performance claim, green
compatibility claim, or public root timing claim was added.

## Changed Files

- `tests/benchmarks/manifests/private-root-host-output-timing-canaries.json`
- `tests/benchmarks/manifests/private-diagnostic-gate-admissions.json`
- `tests/benchmarks/test/benchmark-gate.test.mjs`
- `tests/benchmarks/test/private-root-host-output-timing-canaries.test.mjs`
- `worker-progress/worker-407-benchmark-private-root-output-timing-canaries.md`

## Evidence Gathered

- Read required context after goal setup: `WORKER_BRIEF.md`,
  `MASTER_PLAN.md`, `MASTER_PROGRESS.md`, and present worker reports 162, 289,
  379, 380, and 381.
- Also read relevant benchmark admission history from workers 320, 347, and
  352.
- Worker 162 established the benchmark manifest gate and
  `diagnostic-until-compatible` policy.
- Worker 379 added private host-output benchmark admissions for the first
  accepted fake-DOM host-output rows.
- Worker 380 expanded the root-render E2E private host-output gate to 16
  admitted scenario-mode rows while keeping public rows blocked.
- Worker 381 tightened public root facade blockers after private host-output
  admissions.
- Current `root-render-e2e:conformance` confirms 0 public admitted rows, 20
  public blocked rows, 16 private host-output diagnostic rows admitted, 4
  private host-output rows blocked, 5 portal root-render rows blocked, and 0
  failures.
- Current `root-public-facade:conformance` confirms public root facade rows are
  still blocked and private host-output diagnostics remain fake-DOM-only
  evidence.
- No nested agents or subagents were used.

## Commands Run

```sh
node --check tests/benchmarks/test/benchmark-gate.test.mjs
node --check tests/benchmarks/test/private-root-host-output-timing-canaries.test.mjs
node tests/benchmarks/scripts/check-benchmark-manifests.mjs
node --test tests/benchmarks/test/*.test.mjs
npm run check:benchmarks
npm run root-render-e2e:conformance --workspace @fast-react/conformance
npm run root-public-facade:conformance --workspace @fast-react/conformance
npm run check:js
git diff --check
```

## Verification

- Benchmark manifest gate passed:
  - 6 manifests
  - 86 scenarios
  - 19 milestones
  - 0 result artifacts
- Focused benchmark tests passed: 21 tests.
- `npm run check:benchmarks` passed with the same manifest totals and 21 tests.
- `npm run root-render-e2e:conformance --workspace @fast-react/conformance`
  passed with public compatibility blocked and private host-output diagnostics
  admitted only as fake-DOM evidence.
- `npm run root-public-facade:conformance --workspace @fast-react/conformance`
  passed with public root facade rows still blocked.
- `npm run check:js` passed, including benchmark checks and 600 conformance
  tests.
- `git diff --check` passed after adding new files with intent-to-add.

NPM printed the existing `minimum-release-age` warning during npm commands; it
did not block verification.

## Risks Or Blockers

- This is benchmark metadata and gate coverage only. It does not add a timing
  runner or prove runtime performance.
- The new canary rows are private fake-DOM diagnostics only. They do not prove
  public `react-dom/client` root behavior, browser DOM behavior, scheduling,
  warnings, portals, hydration, events, refs, or compatibility.
- Cross-root flushSync and development warning private host-output rows remain
  blocked by the root-render conformance gate.
- Public comparable timing remains blocked until public root render E2E and
  public facade gates become green-admitted and claim compatibility.

## Recommended Next Tasks

- Add benchmark result artifacts only after a timing collector exists and keep
  these private canary results `diagnostic-only`.
- Reopen public timing promotion only after public root compatibility gates are
  green and explicitly admitted.
- Add separate private timing canary coverage for cross-root flushSync and
  warning-boundary rows only after their conformance evidence is admitted.
