# Worker 987 - Scheduler Public Timing Blocker Currentness

## Status

Complete after exact currentness-row audit repair.

## Summary

- Added a private conformance-only Scheduler public timing blocker/currentness
  gate for the current Worker 937 variant source boundaries and Worker 949
  mock/postTask boundary diagnostics.
- The gate validates all default, mock, postTask, native-context, package
  wrapper, and direct deep-CJS Scheduler source/package rows before consuming
  accepted variant currentness as private context.
- The gate now also evaluates Worker 949's boundary diagnostics currentness
  gate, requires its accepted status/empty violations, and compares each
  mock/postTask diagnostic row's source currentness against the exact Worker
  937 source/package rows before accepting the blocker.
- Audit repair now keeps Worker 937/949 source-currentness
  `evidenceScope` and `publicBlockerClaims` records in the comparable row
  data, so drift in those nested currentness fields produces package or
  boundary source-row mismatches.
- Source currentness rows now fail closed on unexpected or missing top-level
  fields before accepted variant evidence can be consumed.
- Public Scheduler timing semantics remain blocked for
  `unstable_scheduleCallback` callback execution, cancellation, yielded values,
  mock virtual time/yields, postTask/browser ordering, priority/current-event
  behavior, and host callback transport timing unless a separate oracle-backed
  public compatibility gate is accepted.
- The gate keeps React root, `act`, native runtime, postTask/mock public
  behavior, and package compatibility claims false.
- Audit repair expanded broad non-public Scheduler/root/act/native/package
  alias detection, including `schedulerCompatibilityClaimed`,
  `schedulerTimingCompatibilityClaimed`, `rootCompatibilityClaimed`,
  `actCompatibilityClaimed`, `nativeExecutionClaimed`, `packageReady`,
  `packageExecutionClaimed`, and `packageAliasAccepted`.
- Hidden-proxy probes now include the same non-public alias family, and symbol
  keys are matched by symbol description while diagnostic paths still preserve
  the symbol path form.
- Regression coverage rejects null/malformed `variantCurrentnessGate` input,
  malformed/proxy-throwing `rowsByVariant`, caller-shaped cloned gates, stale
  source rows, Worker 937 `evidenceScope`/`publicBlockerClaims` drift,
  stale/broken Worker 949 diagnostics input, Worker 949 selected source
  currentness `evidenceScope`/`publicBlockerClaims` drift, non-enumerable
  public timing claims, proxy-hidden public compatibility claims, broad
  non-public aliases in enumerable, non-enumerable, inherited, accessor,
  symbol, function-property, and proxy-hidden forms, and Scheduler
  root/act/native alias claims with structured blocked results instead of raw
  `TypeError`s.
- Worker 949's mock/postTask boundary diagnostics source and tests were not
  modified; its focused test suite still passes.

## Changed Files

- `tests/conformance/src/scheduler-public-timing-blocker-currentness.mjs`
- `tests/conformance/test/scheduler-public-timing-blocker-currentness.test.mjs`
- `worker-progress/worker-987-scheduler-public-timing-blocker-currentness.md`

## Evidence Path

- Gate source:
  `tests/conformance/src/scheduler-public-timing-blocker-currentness.mjs`
- Gate test:
  `tests/conformance/test/scheduler-public-timing-blocker-currentness.test.mjs`
- Accepted source-currentness input:
  `tests/conformance/src/scheduler-variant-oracle.mjs`
- Accepted private Scheduler variant ledger input:
  `tests/conformance/src/private-admission-886-scheduler-variant-boundary-ledger.mjs`
- Accepted Worker 949 diagnostics gate preserved:
  `tests/conformance/src/scheduler-variant-boundary-diagnostics-currentness.mjs`

## Commands Run

- `node --check tests/conformance/src/scheduler-public-timing-blocker-currentness.mjs`
- `node --check tests/conformance/test/scheduler-public-timing-blocker-currentness.test.mjs`
- `node --test tests/conformance/test/scheduler-public-timing-blocker-currentness.test.mjs`
- `node --test tests/conformance/test/scheduler-public-timing-blocker-currentness.test.mjs tests/conformance/test/scheduler-variant-boundary-diagnostics-currentness.test.mjs tests/conformance/test/scheduler-variant-oracle.test.mjs tests/conformance/test/private-admission-886-scheduler-variant-boundary-ledger.test.mjs tests/conformance/test/scheduler-root-currentness-gate.test.mjs`
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs tests/conformance/test/scheduler-post-task-oracle.test.mjs tests/conformance/test/scheduler-post-task-root-continuation.test.mjs tests/conformance/test/scheduler-root-oracle.test.mjs tests/conformance/test/scheduler-native-entry-oracle.test.mjs tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `npm run check --workspace scheduler`
- `npm run check:package-surface`
- `node tests/smoke/import-entrypoints.mjs`
- `git diff --check`
- `git diff --cached --check`

## Check Results

All commands above passed. The npm commands emitted the existing
`minimum-release-age` npm config warning only.

## Risks Or Blockers

- No implementation blocker remains.
- The new gate is intentionally private/conformance-only. It does not claim
  public Scheduler timing/callback execution compatibility, React root or
  `act` execution, native runtime execution, postTask/mock public behavior, or
  package compatibility.
- Future Scheduler source-boundary edits must refresh the accepted Worker 937
  currentness rows and Worker 949 boundary diagnostics before this blocker can
  consume the source context.

## Recommended Next Tasks

- Keep this gate paired with Worker 937 variant currentness and Worker 949
  boundary diagnostics in future Scheduler source-boundary refreshes.
- Add a separate public Scheduler timing oracle only when the project is ready
  to prove callback execution, cancellation, yielded values, postTask/mock
  timing, and priority/current-event behavior as public compatibility.
