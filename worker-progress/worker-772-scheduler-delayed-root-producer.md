# Worker 772: Scheduler Delayed Renderer Root Producer

## Summary

- Added a Scheduler-private delayed renderer-root metadata producer on the
  existing non-enumerable mock flush diagnostics object:
  `createDelayedRendererRootWorkMetadataForDiagnostics`.
- Added private promotion from accepted delayed renderer-root metadata to the
  existing delayed act/root metadata shape through
  `createDelayedActRootWorkMetadataFromAcceptedRendererRootMetadataForDiagnostics`.
- The new route keeps source proof in Scheduler-owned `WeakMap` state and
  rejects stale callback handles, cloned renderer-root source metadata, cloned
  produced delayed metadata, mutated act queue/root work evidence, public
  compatibility claims, and execution claims.
- Acceptance-audit follow-up tightened renderer-root source proof so it binds
  the scheduled callback identity plus each nested act queue/root work entry
  identity and signature before private handoff or delayed drain.
- The delayed drain report now summarizes the renderer-root producer evidence
  while preserving the nested expired act/root report that Worker 747's React
  private act gate already consumes.
- React was not changed to accept the top-level delayed report. The focused
  React test proves only the nested expired report is accepted, cloned nested
  evidence rejects, public Scheduler work remains pending, and public
  `React.act` stays blocked.
- No public Scheduler exports, public React exports, renderer execution,
  effect execution, or package entrypoints were changed.

## Changed Files

- `packages/scheduler/unstable_mock.js`
- `tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs`
- `tests/conformance/test/react-act-oracle.test.mjs`
- `worker-progress/worker-772-scheduler-delayed-root-producer.md`

## Commands Run

- `node --check packages/scheduler/unstable_mock.js` - passed.
- `node --check tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs` - passed.
- `node --check tests/conformance/test/react-act-oracle.test.mjs` - passed.
- `git diff --check` - passed.
- `node --test tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs` - passed, 5 tests.
- `node --test tests/conformance/test/scheduler-mock-delayed-act-root-work.test.mjs tests/conformance/test/react-act-oracle.test.mjs` - passed, 23 tests.
- `node --test tests/conformance/test/scheduler-mock-oracle.test.mjs` - passed, 23 tests.
- `node --test tests/conformance/test/scheduler-mock-expired-lane-flush.test.mjs` - passed, 3 tests.
- `node --test tests/conformance/test/private-admission-739-745-gate.test.mjs tests/conformance/test/private-admission-746-753-gate.test.mjs` - passed, 15 tests.
- `node --test tests/conformance/test/scheduler-native-entry-oracle.test.mjs` - failed on the known private source-validator symbol exposure from mock flush helpers, outside this worker's touched symbol path.
- `npm run check --workspace scheduler` - passed; npm printed the existing `minimum-release-age` warning.
- `npm run check --workspace @fast-react/react` - passed; npm printed the existing `minimum-release-age` warning.
- `npm run check:package-surface` - passed; npm printed the existing `minimum-release-age` warning.
- `node tests/smoke/import-entrypoints.mjs` - passed.
- `git diff -- packages/scheduler/unstable_mock.js | rg "privateSchedulerMockExpiredActRootWorkSourceValidator|mock-expired-act-root-work-source-validator" || true` - no output; the audit-noted native-entry symbol exposure was not introduced or changed by this branch.

## Evidence Gathered

- Read `WORKER_BRIEF.md`, the surrounding Scheduler mock delayed act/root
  route, Worker 765's delayed producer evidence path, Worker 747's React
  private expired report consumer, and focused Scheduler/React conformance
  tests.
- Confirmed Scheduler already had a delayed act/root route that drains through
  the expired act/root path, and extended it without opening public flush helper
  compatibility.
- Confirmed React's private act gate rejects the top-level delayed Scheduler
  report by brand and accepts only the nested expired act/root drain report
  using Scheduler-owned source-proof validation.
- Confirmed a delayed renderer-root producer can promote delayed callback
  metadata to delayed act/root metadata while preserving act queue/root work
  identity and timing evidence.
- Confirmed a stale delayed renderer-root callback handle rejects as
  `renderer-root-producer-stale-callback-handle`.
- Confirmed replacing the delayed callback handle's callback with a different
  branded callback rejects as
  `metadata-source-renderer-root-callback-identity-mismatch` before either
  callback runs.
- Confirmed a same-length act queue entry swap before renderer-root handoff
  rejects as
  `renderer-root-metadata-source-act-queue-record-0-identity-mismatch`.
- Confirmed a same-length root work record swap before renderer-root handoff
  rejects as
  `renderer-root-metadata-source-root-work-record-1-identity-mismatch`.
- Confirmed a cloned renderer-root metadata source rejects as
  `renderer-root-metadata-source-proof`.
- Confirmed a cloned renderer-produced delayed metadata object rejects as
  `metadata-not-produced-by-private-delayed-root-producer`.
- Confirmed post-production renderer-root work record mutation rejects as
  `metadata-source-renderer-root-work-record-count-mismatch` before any delayed
  callback or injected root work can run.
- Confirmed the top-level delayed report remains outside React's private
  expired report consumer, while the nested expired report is accepted and a
  cloned nested expired report rejects as
  `scheduler-expired-act-root-diagnostics-source-proof`.

## Risks Or Blockers

- No blocker remains for this worker scope.
- The route is private diagnostics-only. It does not claim public Scheduler
  timing compatibility, public React act compatibility, public root scheduler
  compatibility, public renderer compatibility, renderer work, renderer roots,
  queued work, or effects.
- The `scheduler-native-entry-oracle` still reports the pre-existing mock flush
  helper private validator symbol exposure. This branch did not introduce or
  modify that source-validator symbol path, so it remains a separate follow-up.
- Future renderer-owned root producers should pass Scheduler-owned metadata
  through this private route without cloning the renderer-root metadata,
  callback handle, act queue, or root work record arrays.

## Recommended Next Tasks

1. Wire a renderer-owned private delayed root producer to call this Scheduler
   handoff once the renderer can provide real root request metadata.
2. Keep public act/root compatibility blocked until public Scheduler timing,
   root execution, passive effects, and public React act semantics can be
   admitted together.
