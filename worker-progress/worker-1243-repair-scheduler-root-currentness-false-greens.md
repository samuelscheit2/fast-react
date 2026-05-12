# Worker 1243 Repair: Scheduler Root Currentness False Greens

## Summary

Repaired the scheduler-root currentness gate so caller-provided local
observation rows must have the exact expected source identity and descriptor
shape before they can be accepted as current root observations.

The repair also makes `behaviorEvidence` exact-shape validated. Extra,
hidden, symbol, inherited, accessor-backed, missing, or mismatched evidence
fields now fail closed instead of allowing non-claim variant metadata to pass.

## Changed Files

- `tests/conformance/src/scheduler-root-currentness-gate.mjs`
- `tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `worker-progress/worker-1243-repair-scheduler-root-currentness-false-greens.md`

## Evidence Gathered

- Before the repair, an injected row with `entrypoint = "scheduler/native"`,
  `packageName = "scheduler/unstable_mock"`, `packageSourcePath =
  "packages/scheduler/src/forks/SchedulerPostTask.js"`, and extra
  `behaviorEvidence.actualEntrypoint` / `actualSourcePath` returned the passing
  gate status with no violations.
- After the repair, the same injected row returns
  `blocked-public-scheduler-compatibility-with-currentness-violations` with:
  - `scheduler-root-currentness-local-observation-row-identity-mismatch`
  - `scheduler-root-currentness-variant-or-deep-cjs-evidence-used`

## Commands Run

- `node --check tests/conformance/src/scheduler-root-currentness-gate.mjs`
  - Passed.
- `node --check tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
  - Passed.
- `node --test tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
  - Passed: 29 tests, 0 failures.
- `node --test tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-public-timing-blocker-currentness.test.mjs tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs`
  - Passed: 111 tests, 0 failures.
- `npm run check --workspace scheduler`
  - Passed. npm emitted the existing warning: `Unknown user config "minimum-release-age"`.
- `npm run check:package-surface`
  - Passed. npm emitted the existing warning: `Unknown user config "minimum-release-age"`.
- `node tests/smoke/import-entrypoints.mjs`
  - Passed.
- `git diff --check`
  - Passed.

## Audit, Review, Or Nested-Agent Findings

- No nested agents were used.
- The source audit false-green was reproduced before the fix and verified as
  closed after the fix.

## Risks Or Blockers

- No blockers.
- The new local row identity violation is intentionally additional to existing
  public-claim violations. Existing claim alias rejection remains active for
  camelCase, snake_case, dash-separated, non-enumerable, inherited, and
  `Object.prototype` claim paths.

## Recommended Next Tasks

- Source audit this branch against the original false-green injection and any
  additional scheduler-root row/evidence smuggling variants.
